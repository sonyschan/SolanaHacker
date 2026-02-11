// Solana wallet authentication middleware
const nacl = require('tweetnacl');
const bs58 = require('bs58');

/**
 * Middleware to verify Solana wallet signature
 * Expects Authorization header: Bearer <signature>:<message>:<publicKey>
 */
const authenticateWallet = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authorization header required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const [signature, message, publicKey] = token.split(':');

    if (!signature || !message || !publicKey) {
      return res.status(401).json({
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Token must be signature:message:publicKey'
      });
    }

    // Verify the signature
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return res.status(401).json({
        error: 'INVALID_SIGNATURE',
        message: 'Signature verification failed'
      });
    }

    // Check message timestamp to prevent replay attacks (5 minute window)
    const timestamp = parseInt(message.split('timestamp:')[1]);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (!timestamp || Math.abs(now - timestamp) > fiveMinutes) {
      return res.status(401).json({
        error: 'MESSAGE_EXPIRED',
        message: 'Message timestamp expired or invalid'
      });
    }

    // Add user info to request
    req.user = {
      publicKey,
      walletAddress: publicKey
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'AUTHENTICATION_FAILED',
      message: 'Authentication verification failed'
    });
  }
};

/**
 * Optional authentication - allows both authenticated and anonymous access
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Try to authenticate, but don't fail if it doesn't work
      return authenticateWallet(req, res, next);
    }

    // No auth provided, continue as anonymous
    req.user = null;
    next();
  } catch (error) {
    // Authentication failed, but allow anonymous access
    req.user = null;
    next();
  }
};

/**
 * Rate limiting by wallet address
 */
const rateLimitByWallet = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user?.publicKey || req.ip;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000 / 60} minutes`
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
};

// Aliases for backward compatibility
const authenticateUser = authenticateWallet;
const rateLimiter = rateLimitByWallet();

module.exports = {
  authenticateWallet,
  authenticateUser,
  optionalAuth,
  rateLimitByWallet,
  rateLimiter
};