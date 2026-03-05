/**
 * Simple in-memory TTL cache for Cloud Run (min:0, max:1).
 * Cache resets on cold start — that's fine, it only helps during warm periods.
 */
const store = new Map();

/**
 * Get cached value or fetch from source.
 * @param {string} key - Cache key
 * @param {number} ttlMs - Time-to-live in milliseconds
 * @param {Function} fetchFn - Async function to fetch data on cache miss
 * @returns {Promise<any>}
 */
async function getOrFetch(key, ttlMs, fetchFn) {
  const cached = store.get(key);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }
  const data = await fetchFn();
  store.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

/**
 * Express middleware: cache the JSON response for a given TTL.
 * @param {string|Function} keyOrFn - Static key string, or (req) => string for dynamic keys
 * @param {number} ttlMs - TTL in ms
 */
function cacheResponse(keyOrFn, ttlMs) {
  return (req, res, next) => {
    const key = typeof keyOrFn === 'function' ? keyOrFn(req) : keyOrFn;
    const cached = store.get(key);
    if (cached && Date.now() < cached.expires) {
      return res.json(cached.data);
    }
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode < 400) {
        store.set(key, { data, expires: Date.now() + ttlMs });
      }
      return originalJson(data);
    };
    next();
  };
}

/** Invalidate a specific cache key */
function invalidate(key) {
  store.delete(key);
}

/** Invalidate all keys matching a prefix */
function invalidatePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** TTL constants */
const TTL = {
  SHORT: 2 * 60 * 1000,      // 2 min
  MEDIUM: 5 * 60 * 1000,     // 5 min
  LONG: 10 * 60 * 1000,      // 10 min
  HALF_HOUR: 30 * 60 * 1000, // 30 min
  HOUR: 60 * 60 * 1000,      // 1 hour
  DAY: 24 * 60 * 60 * 1000,  // 24 hours
};

module.exports = { getOrFetch, cacheResponse, invalidate, invalidatePrefix, TTL };
