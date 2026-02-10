# UI Requirements: MemeForge Dashboard Redesign

## Purpose
Complete redesign of MemeForge frontend to achieve 90%+ UX score. Transform the current confusing crypto meme voting platform into a clear, engaging, and trustworthy dashboard-centric application.

## Current Issues (UX Score: 64%)
- **Value proposition confusion**: Users don't understand how meme voting generates SOL earnings
- **Trust issues**: Claims like "$8,500 prize pool" and "1,247 active voters" lack credibility
- **Wallet friction**: Prominent "CONNECT WALLET FIRST" creates barriers before users understand value
- **Mobile experience poor**: Only 55% score on mobile devices
- **Missing transparency**: How SOL earning mechanics actually work is unclear

## Target Users
- **Primary**: Crypto-curious individuals interested in earning SOL through simple activities
- **Secondary**: Meme enthusiasts who want to participate in community-driven content curation
- **Tertiary**: Web3 natives looking for new earning opportunities

## Core Concept
"AI Dreams. Humans Decide" - An entertaining platform where AI generates daily memes, humans vote on the best ones, and participants earn real SOL cryptocurrency through a transparent lottery system.

## Key Features to Highlight
1. **Daily AI Meme Generation** - Fresh content every 24 hours
2. **Community Voting System** - Democratic selection of winners  
3. **SOL Cryptocurrency Rewards** - Real earnings through weekly drawings
4. **Transparent Lottery System** - Clear mechanics, fair distribution
5. **Streak Rewards** - Bonus tickets for consistent participation

## Design Requirements

### Framework & Tech Stack
- **Framework**: React + Tailwind CSS
- **Style**: Modern Dashboard-Centric Design
- **Theme**: Dark mode with purple/blue gradient accents
- **Responsive**: Full mobile optimization (improve from 55% to 90%+)
- **Accessibility**: WCAG 2.1 AA compliance

### Visual Hierarchy Priority
1. **Clear Value Proposition** (top priority)
2. **How It Works Explanation** 
3. **Daily Meme Voting Interface**
4. **Reward System Transparency**
5. **Wallet Connection** (lower friction)

### Dashboard-Centric Layout
- **Navigation**: Sticky header with clear sections
- **Main Dashboard**: Central hub showing today's activity
- **Stats Panels**: User stats, community stats, prize pool
- **Activity Feed**: Live voting activity and results
- **Reward Tracking**: Personal earnings and streak progress

### Key Interactions
- **Smooth Onboarding**: Progressive disclosure of features
- **One-Click Voting**: Simple, engaging voting interface
- **Wallet Integration**: Seamless connection when ready to participate
- **Real-time Updates**: Live stats and community activity
- **Responsive Touch**: Mobile-first interactive elements

### Trust & Transparency Elements
- **Earning Mechanics Explanation**: Step-by-step how SOL rewards work
- **Real vs Demo Data**: Clear distinction between live and simulated data
- **Community Proof**: Authentic user activity indicators
- **Security Badges**: Trust signals for Web3 safety

### Mobile Optimization
- **Touch-Friendly**: Large tap targets, swipe gestures
- **Readable Typography**: Improved font sizes and contrast
- **Simplified Navigation**: Mobile-first menu structure
- **Fast Loading**: Optimized images and code splitting

### Color Palette
- **Primary**: Dark gray/black backgrounds (#1a1a1a, #2d2d2d)
- **Accent**: Purple to blue gradients (#8b5cf6 to #3b82f6)
- **Success**: Green for earnings/positive actions (#10b981)
- **Warning**: Yellow for pending/attention items (#f59e0b)
- **Text**: High contrast whites and light grays

### Typography
- **Headers**: Bold, clear hierarchy
- **Body**: Readable, accessible font sizes (16px+ on mobile)
- **CTAs**: Prominent, action-oriented language
- **Numbers**: Highlighted currency and stats display

## Success Metrics
- **UX Score**: Target 90%+ (currently 64%)
- **Mobile Score**: Target 90%+ (currently 55%)
- **Value Clarity**: Users understand earning mechanism immediately
- **Conversion**: Higher wallet connection rates
- **Engagement**: Increased voting participation

## Non-Goals
- Complex trading interfaces
- Advanced DeFi features
- Multi-token support (focus on SOL only)
- Social media integration
- NFT marketplace features

## Technical Constraints
- Must work with existing Solana wallet adapter
- Maintain current component structure where possible
- No backend changes required
- Deploy on current Vite setup
- Support Phantom and Solflare wallets

## Inspiration References
- **Coinbase**: Clean, trustworthy crypto onboarding
- **Discord**: Engaging community-focused UI
- **Duolingo**: Gamified daily activity system
- **Modern Dashboards**: Clean data visualization and stats

---

*Requirements Summary for v0 UI Generation*
*Target: Modern Dashboard-Centric Design with 90%+ UX Score*