# MemeForge Website Structure Design

> Website organization based on 6-step value cycle from product.md

## Main Navigation (3 Tabs)

### 🔥 Forge Tab - Core Voting Experience
**Purpose**: Steps 1-3 of value cycle (AI generation → User voting → Decide winner/rarity)

```
├── Value Cycle Overview
│   └── 6-step visual flow with real-time data
├── Current Memes Display 
│   ├── 3 AI-generated memes from recent news
│   ├── Generation status indicator
│   └── Meme metadata (source, timestamp)
├── Two-Phase Voting System
│   ├── Phase 1: Choose Winner
│   │   ├── Vote between 3 memes
│   │   ├── Real-time vote counts
│   │   └── Voting deadline countdown
│   └── Phase 2: Set Rarity
│       ├── Vote on winning meme's rarity
│       ├── 5 levels: Common → Legendary
│       └── Rarity impact explanation
├── Voting Rewards Animation
│   ├── Instant ticket drop (8-15 random)
│   ├── Streak bonus visualization
│   ├── Dopamine-driven effects
│   └── Achievement celebrations
└── Daily Progress Tracker
    ├── Personal voting streak
    ├── Community participation stats
    └── Next round countdown
```

### 🎟️ My Tickets Tab - User Rewards & Stats
**Purpose**: Step 6 of value cycle (Reward distribution)

```
├── Ticket Balance & Streak Counter
│   ├── Current ticket count
│   ├── Consecutive voting days
│   ├── Streak multiplier display
│   └── Next streak milestone
├── Weekly Draw System
│   ├── Countdown to Sunday 8PM UTC
│   ├── Current prize pool size
│   ├── Expected payout calculation
│   └── Draw history
├── Win Probability Calculator
│   ├── Personal win chances
│   ├── Ticket vs total pool ratio
│   ├── Expected value estimation
│   └── Contribution impact
├── Reward History & Claims
│   ├── Past winnings log
│   ├── Claim status tracking
│   ├── SOL distribution records
│   └── Tax/reporting data
└── Personal Impact Dashboard
    ├── Total SOL contributed to pool
    ├── Voting participation rate
    ├── Community ranking
    └── Achievement badges
```

### 🛒 Market Tab - NFT Auctions
**Purpose**: Steps 4-5 of value cycle (NFT minting → Auction system)

```
├── Live Auctions (Max 3 Concurrent)
│   ├── Active auction cards
│   ├── Current bid displays
│   ├── Time remaining counters
│   └── Quick bid interface
├── NFT Details Expansion
│   ├── Full-size meme display
│   ├── Rarity level & multipliers
│   ├── Vote statistics from creation
│   ├── AI-generated traits list
│   ├── Creation date & minting tx
│   └── Community comments
├── Bid Management System
│   ├── Current user bids tracking
│   ├── Outbid notifications
│   ├── Auto-refund status
│   ├── Bid history per NFT
│   └── Gas fee calculations
├── Past Sales Analytics
│   ├── Completed auction results
│   ├── Price trends by rarity
│   ├── Top selling memes
│   ├── Market volume stats
│   └── ROI calculations
└── Prize Pool Flow Tracker
    ├── 80% auction → user pool
    ├── 20% project operations
    ├── Real-time pool contribution
    └── Transparency dashboard
```

## User Experience Flow

### New User Journey
1. **Landing on Forge** → See value cycle overview
2. **Connect Wallet** → Phantom/Solflare integration
3. **First Vote** → Tutorial walkthrough
4. **Receive Tickets** → Reward animation
5. **Check My Tickets** → Understand rewards
6. **Browse Market** → See NFT outcomes
7. **Complete Loop** → Return to Forge for next round

### Returning User Flow
1. **Daily Check-in** → Forge tab for new memes
2. **Vote & Earn** → Maintain streak
3. **Monitor Tickets** → Track reward potential
4. **Market Participation** → Bid on desired NFTs
5. **Weekly Claims** → Collect winnings

## Technical Implementation Structure

### Component Hierarchy
```
App.jsx
├── Navigation.jsx (3-tab switcher)
├── WalletConnection.jsx
└── TabContent/
    ├── ForgeTab/
    │   ├── ValueCycleOverview.jsx
    │   ├── MemeDisplay.jsx
    │   ├── VotingInterface.jsx
    │   └── RewardAnimation.jsx
    ├── TicketsTab/
    │   ├── TicketBalance.jsx
    │   ├── DrawCountdown.jsx
    │   ├── ProbabilityCalculator.jsx
    │   └── RewardHistory.jsx
    └── MarketTab/
        ├── AuctionGrid.jsx
        ├── NFTDetails.jsx
        ├── BidInterface.jsx
        └── SalesAnalytics.jsx
```

### State Management
```javascript
// Global App State
{
  user: {
    wallet: 'connected' | 'disconnected',
    tickets: number,
    votingStreak: number,
    activeBids: Bid[]
  },
  forge: {
    currentMemes: Meme[],
    votingPhase: 1 | 2,
    timeRemaining: number
  },
  market: {
    activeAuctions: Auction[],
    prizePool: number,
    nextDraw: Date
  }
}
```

## Mobile Optimization

### Responsive Design Points
- **Mobile**: Stack tabs vertically, swipe navigation
- **Tablet**: Side navigation, dual-pane views
- **Desktop**: Full horizontal tabs, multi-column layout

### Touch Interactions
- **Voting**: Large touch targets for meme selection
- **Bidding**: Swipe gestures for quick bid increments
- **Navigation**: Smooth tab transitions with haptic feedback

## Performance Considerations

### Loading Strategy
1. **Critical Path**: Wallet connection → Current voting data
2. **Lazy Loading**: Market history, detailed analytics
3. **Caching**: Meme images, user ticket history
4. **Real-time**: Vote counts, auction bids, countdowns

### Data Updates
- **High Frequency**: Vote counts, auction bids (websocket)
- **Medium Frequency**: Ticket balances, streak counters (polling)
- **Low Frequency**: Historical data, analytics (on-demand)

## Security & Trust Elements

### Transparency Features
- **Open Source**: Smart contract verification links
- **Audit Reports**: Security audit summaries
- **Transaction History**: All on-chain actions trackable
- **Fair Randomness**: Verifiable random ticket distribution

### User Protection
- **Bid Escrow**: Funds held securely during auctions
- **Auto-refunds**: Immediate return of outbid amounts
- **Slippage Protection**: Clear fee disclosure
- **Wallet Security**: Best practice guidelines

---

## Implementation Priority

### Phase 1 (MVP)
- [x] Basic 3-tab navigation
- [x] Forge tab with voting interface
- [x] Wallet connection
- [ ] Ticket balance display
- [ ] Simple auction view

### Phase 2 (Beta)
- [ ] Complete reward animations
- [ ] Real-time auction bidding
- [ ] Weekly draw system
- [ ] Mobile optimization

### Phase 3 (Launch)
- [ ] Advanced analytics
- [ ] Social features
- [ ] Performance optimization
- [ ] Accessibility compliance

---

*This structure directly maps our 6-step MemeForge value cycle into an intuitive user interface that encourages engagement and facilitates the complete user journey from voting to rewards.*