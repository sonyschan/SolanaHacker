# Meme Prompt Cookbook: Comedy Strategies & Narrative Patterns

> Version: V1 | Author: Memeya (AIMemeForge) | Updated: 2026-03-17

---

## How to Use This Cookbook

Each recipe combines a **Strategy** (humor angle) + **Narrative** (character voice) + **Template** (visual format). Mix and match to create distinct meme personalities.

---

## Part 1: Comedy Strategies (7 Recipes)

### 1. False Confidence

**Pattern**: State a disaster as if it was your plan all along.

**Prompt injection**:
```
Comedy angle: FALSE CONFIDENCE. The character is completely unfazed by
an objectively terrible outcome. They speak as if this was their strategy
all along. The humor comes from the gap between reality and their
unshakeable confidence.
```

**Punchline library**:
- "Totally part of my strategy"
- "I planned this"
- "Everything is going according to plan"
- "This is actually bullish if you think about it"

**Best paired with**: Wojak (calm face in chaos), Drake (reject worry / prefer delusion)

---

### 2. Self Roast

**Pattern**: Openly mock your own terrible decisions.

**Prompt injection**:
```
Comedy angle: SELF ROAST. The character is brutally honest about their
own bad decisions. No cope, no excuses — just raw acknowledgment of
how badly they messed up. The humor is in the specificity of the L.
```

**Punchline library**:
- "At least I'm consistent"
- "My portfolio is a work of art — abstract art"
- "I turned $10K into a valuable life lesson"

**Best paired with**: Expanding Brain (each tier worse than last), Distracted Boyfriend (tempted by next bad trade)

---

### 3. Cope

**Pattern**: Reframe an obvious loss as a philosophical victory.

**Prompt injection**:
```
Comedy angle: COPE. The character has clearly lost but refuses to
admit it. They reframe every loss as a long-term win, using
increasingly desperate logic. The humor is in the escalating delusion.

DO: Reframe obvious loss as philosophical victory
DON'T: Be genuinely sad — that kills the joke
```

**Punchline library**:
- "I'm not losing, I'm dollar-cost averaging"
- "It's not a loss until you sell"
- "I'm not stuck, I'm an investor now"
- "Diamond hands means never having to say you're sorry"

**Best paired with**: Wojak (cope face), Drake (reject "selling" / prefer "hodling to zero")

---

### 4. Superiority

**Pattern**: Mock others' decisions from a position of (often unjustified) smugness.

**Prompt injection**:
```
Comedy angle: SUPERIORITY. The character looks down on others for making
"obvious" mistakes — even though the character's own position may be
equally questionable. The humor is in the confidence-to-competence ratio.
```

**Punchline library**:
- "Imagine not buying the dip"
- "Some of you have never read a whitepaper and it shows"
- "I simply chose not to be poor"

**Best paired with**: Expanding Brain (ascending smugness), Galaxy Brain

---

### 5. Betrayal

**Pattern**: A trusted source or promise completely fails.

**Prompt injection**:
```
Comedy angle: BETRAYAL. Something the character trusted completely
(whitepaper, influencer, roadmap, "DYOR") has let them down spectacularly.
The humor is in the naive trust that preceded the betrayal.
```

**Punchline library**:
- "The whitepaper said..."
- "But the roadmap..."
- "The audit was supposed to..."
- "He said it wasn't a rug"

**Best paired with**: Distracted Boyfriend (new promise vs broken promise), Drake

---

### 6. Irony

**Pattern**: The outcome is the exact opposite of what was expected.

**Prompt injection**:
```
Comedy angle: IRONIC REVERSAL. The situation produces the exact opposite
of what everyone expected. The setup creates a clear expectation, then
the punchline shatters it. Keep the reversal sharp — one sentence.
```

**Punchline library**:
- "Decentralized... until the founder rugs"
- "The stablecoin was the most volatile asset in my portfolio"
- "Bought the dip. It kept dipping."

**Best paired with**: Drake (expect X / get opposite), Expanding Brain (each level more ironic)

---

### 7. Panic Then Buy

**Pattern**: Fear → sell → immediate FOMO → buy back higher.

**Prompt injection**:
```
Comedy angle: PANIC THEN BUY. The character panics and sells, then
immediately regrets it when the price bounces. The speed of the
emotional reversal is what makes it funny — ideally within the same
sentence or panel.
```

**Punchline library**:
- "Selling everything— wait, it's pumping?"
- "I'm out. I'm done. ...Is that a green candle?"
- "Never again. Until tomorrow."

**Best paired with**: Expanding Brain (stages of panic), Two Buttons (sell vs FOMO)

---

## Part 2: Narrative Archetypes (10 Voices)

Each narrative gives the meme a character. Use these as `voice` instructions in your prompt.

### Exit Liquidity
> Psychology: Self-aware acceptance of being the bag holder
> Voice: Cheerfully serving as exit liquidity for smarter traders
> Phrases: "Happy to serve", "Somebody had to provide liquidity"

### Last Buyer
> Psychology: Resigned fate acceptance
> Voice: The person who always buys the absolute top
> Phrases: "Somebody had to buy the top", "You're welcome for my sacrifice"

### This Time Different
> Psychology: Willful blindness to patterns
> Voice: Ignoring 47 previous crashes because "this time the fundamentals are different"
> Phrases: "Previous crashes were different situations", "We have ETFs now"

### Smart Money Roleplay
> Psychology: Dunning-Kruger confidence
> Voice: Claims to be a sophisticated analyst while using crayon TA
> Phrases: "According to my technical analysis...", "The indicators are clear"

### Forced Long Term
> Psychology: Cope evolution — short-term trade becomes "investment"
> Voice: Rebranding a failed day-trade as a conviction hold
> Phrases: "I always believed in the project", "I'm not stuck, I'm early"

### Galaxy Brain
> Psychology: Conspiracy-level pattern recognition
> Voice: Connecting dots that don't exist
> Phrases: "If you connect the charts...", "The whales are clearly..."

### Rugpull Survivor
> Psychology: PTSD-flavored humor
> Voice: War veteran energy about DeFi losses
> Phrases: "I've seen things you wouldn't believe", "First time?"

### Degen Philosopher
> Psychology: Profound wisdom from terrible decisions
> Voice: Treats losing money as spiritual growth
> Phrases: "Money is temporary, lessons are forever", "The real gains were the friends we made"

### Paper Hands Confessional
> Psychology: Guilt and regret
> Voice: Sold too early and now haunted by the chart
> Phrases: "I had 100 SOL at $1", "We don't talk about what I sold"

### Maxi
> Psychology: Religious devotion to one asset
> Voice: Everything else is a scam, only [ASSET] is real
> Phrases: "Have fun staying poor", "There is no second best"

---

## Part 3: Prompt Assembly Template

Combine strategy + narrative + template into a single generation prompt:

```
You are a crypto meme creator.

NEWS EVENT: {headline}
COMEDY STRATEGY: {strategy_name} — {strategy_rules}
CHARACTER VOICE: {narrative_name} — {narrative_psychology}
VISUAL TEMPLATE: {template_name} — {template_layout_rules}

Create a meme concept:
{
  "caption": "MAX 5 words. AI image generators garble long text.",
  "visual_description": "3-4 sentences describing the scene, characters,
    composition. The VISUAL should tell the story, not the text.",
  "emotion": "primary emotion",
  "twist": "what makes this clever or unexpected"
}

RULES:
- Caption MUST be 5 words or fewer
- MUST reference crypto culture (ape, degen, hodl, rekt, wagmi, etc.)
- NEVER fabricate specific numbers, dollar amounts, or statistics
- The punchline should work even without the caption
```

---

## Part 4: Anti-Repetition Cheat Sheet

| Mechanism | Cooldown | Purpose |
|---|---|---|
| Template archetype | 14 days hard block | No Drake meme twice in 2 weeks |
| Art style | 7 days hard block | Visual variety |
| Comedy strategy | 3-day 95% penalty, 7-day 80% | Rotate humor angles |
| Narrative | 3-day 95% penalty, 7-day 80% | Rotate character voices |
| Topic similarity | Check last 42 memes | No duplicate news coverage |

---

*Built by Memeya. 7 strategies, 10 narratives, infinite combinations. aimemeforge.io*
