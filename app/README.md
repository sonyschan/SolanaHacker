# MemeForge 🎭

**AI-Powered Meme NFT Voting Platform on Solana**

MemeForge is a revolutionary Web3 platform that combines AI-generated memes, democratic voting, and NFT creation to build a transparent value cycle ecosystem where users, creators, and investors all benefit.

## 🌟 Core Features

### 🤖 AI-Generated Memes
- Daily generation of 3 unique memes based on trending crypto news
- Sources: Twitter trends, CoinDesk, blockchain media, Reddit r/CryptoCurrency
- Covers: Price movements, DeFi protocols, NFT trends, regulatory news, celebrity statements

### 🗳️ Democratic Voting System
- **Two-Phase Voting**: Choose winner → Determine rarity
- **Random Ticket Rewards**: 8-15 tickets per vote (prevents manipulation)
- **Streak Bonuses**: Increased rewards for consecutive daily voting
- **Instant Gratification**: Dopamine-driven animations and visual feedback

### 🏆 Rarity & NFT Creation
- 5 Rarity Levels: Common, Uncommon, Rare, Epic, Legendary
- 100% community-determined rarity (no algorithms)
- **Daily Limit**: Only 1 NFT minted per day (scarcity-driven)
- Solana SPL Token / Metaplex standard

### 🛒 Auction System
- 3-day competitive bidding
- Starting price: 0.01 SOL
- Minimum 5% bid increases
- Automatic refunds for outbid users

### 🎁 Weekly Prize Distribution
- **80% of auction revenue** goes to user prize pool
- **20%** for project operations
- Sunday 8PM UTC lottery
- Ticket-based probability system

## 🔄 6-Step Value Cycle

```
1. AI Generate Memes 🤖
   ↓
2. Users Vote ❤️
   ↓
3. Determine Winner & Rarity 🏆
   ↓
4. Mint NFT 🎨
   ↓
5. Auction Bidding 🛒
   ↓
6. Distribute Rewards 🎁
   ↓
   (Cycle Repeats)
```

## 🚀 Getting Started

### For Users
1. Visit: `http://165.22.136.40:5173`
2. Connect your Solana wallet (Phantom/Solflare)
3. Start voting on daily memes
4. Earn tickets and participate in weekly draws

### For Developers

#### Prerequisites
- Node.js 18+
- npm or yarn

#### Installation
```bash
git clone https://github.com/[your-username]/MemeForge.git
cd MemeForge/app
npm install
```

#### Development
```bash
npm run dev
# App runs on http://localhost:5173
```

#### Build
```bash
npm run build
npm run preview
```

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** + **Vite** for fast development
- **Solana Wallet Adapter** for Web3 integration
- **Jupiter Swap** for token exchanges
- **Metaplex** for NFT standards

### Smart Contracts (Solana Programs)
- **Voting Program**: Vote logic, ticket distribution, rarity calculation
- **NFT Program**: Minting, metadata management  
- **Auction Program**: Bidding logic, fund settlement

### File Structure
```
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # Main control panel
│   │   ├── ValueCycleDashboard.jsx # Value cycle visualization
│   │   └── ui/EnhancedWalletButton.jsx # Wallet connection
│   ├── hooks/
│   │   ├── useSolanaWallet.js     # Wallet management
│   │   ├── useVoting.js           # Voting logic
│   │   └── useNFTMarket.js        # NFT marketplace
│   └── utils/
│       ├── solana.js              # Solana RPC communication
│       └── constants.js           # Contract addresses, configs
```

## 📊 Key Metrics & Goals

### User Engagement Targets
- **Daily Active Users**: 500+
- **Voting Participation**: 60%+
- **User Retention**: 7-day 40%+, 30-day 20%+

### Platform Activity Targets  
- **Daily Votes**: 2,000+
- **NFT Sale Rate**: 80%+
- **Average Auction Price**: 0.5+ SOL

### Business Targets
- **Prize Pool Growth**: 20%+ weekly
- **Platform Revenue**: 2+ SOL monthly
- **User Satisfaction**: 4.5+/5.0

## 🛡️ Security & Fair Play

- **Random Ticket System**: Prevents strategic voting manipulation
- **Transparent Value Cycle**: All fund flows are publicly trackable
- **Smart Contract Audits**: Third-party security reviews
- **Multi-sig Wallet**: Prize pool managed by multi-signature wallet

## 🚧 Roadmap

### ✅ MVP (Current)
- [x] Basic voting interface
- [x] Wallet connection
- [x] Value cycle visualization
- [x] Rarity system

### 🔄 Beta (4-6 weeks)
- [ ] Real AI meme generation
- [ ] Complete auction flow
- [ ] Weekly lottery system
- [ ] Mobile optimization
- [ ] User analytics dashboard

### 🎯 Launch (8-10 weeks)
- [ ] Multi-wallet support
- [ ] Community governance
- [ ] Advanced analytics tools
- [ ] Partnership integrations
- [ ] Cross-chain bridging (future)

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Links

- **Live Demo**: http://165.22.136.40:5173
- **Product Spec**: [knowledge/product.md](knowledge/product.md)
- **Colosseum Hackathon**: [Entry Page](#)

## 📞 Support

- **Issues**: Create a GitHub issue
- **Discord**: [Join our community](#)
- **Twitter**: [@MemeForge](#)

---

**Built with ❤️ for the Solana ecosystem and the Colosseum Agent Hackathon**

> *"Where AI creativity meets human wisdom, and everyone wins."*