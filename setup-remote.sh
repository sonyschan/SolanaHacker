#!/bin/bash
# SolanaHacker Agent - Remote Setup Script
# Runs on DigitalOcean Droplet

set -e

echo "🔧 Setting up SolanaHacker environment..."

# ===========================================
# 1. System Updates & Dependencies
# ===========================================
echo "📦 Installing system packages..."
apt-get update
apt-get install -y curl git build-essential pkg-config libssl-dev \
    chromium-browser fonts-liberation libnss3 libatk-bridge2.0-0 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 \
    libgbm1 libasound2t64 screen tmux jq unzip

# ===========================================
# 2. Node.js 20 LTS
# ===========================================
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js version: $(node --version)"

# ===========================================
# 3. Solana CLI
# ===========================================
if ! command -v solana &> /dev/null; then
    echo "☀️ Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
fi
solana --version || echo "Solana CLI will be available after re-login"

# ===========================================
# 4. Install Agent Dependencies
# ===========================================
cd /home/projects/solanahacker/agent
echo "📦 Installing npm dependencies..."
npm install

# ===========================================
# 5. Install Playwright Browsers
# ===========================================
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium
npx playwright install-deps chromium

# ===========================================
# 6. Create systemd service (optional)
# ===========================================
cat > /etc/systemd/system/solanahacker.service << 'EOF'
[Unit]
Description=SolanaHacker Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/projects/solanahacker/agent
ExecStart=/usr/bin/node main.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/home/projects/solanahacker/logs/agent.log
StandardError=append:/home/projects/solanahacker/logs/agent.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo "✅ Setup complete!"
echo ""
echo "To start manually: cd /home/projects/solanahacker/agent && node main.js"
echo "To start as service: systemctl start solanahacker"
echo "To enable on boot: systemctl enable solanahacker"
