/**
 * Meme Strategy Service — v3 strategy layer for meme generation.
 * Selects a comedy strategy (angle) to guide caption generation.
 * Pure functions, no side effects.
 */

// Crypto-native punchline fragments — building blocks, not mandatory
const PUNCHLINE_LIBRARY = [
  'Exit liquidity', 'Added leverage', 'Shorts rekt', 'Getting liquidated',
  'Buying the top', 'Catching knives', 'Still holding', 'NGMI', 'WAGMI',
  'I deserve this', 'This dip personal', 'My bags', 'Send it',
  'Rug pulled', 'Diamond hands', 'Paper hands', 'Zoom out',
  'Still early', 'Few understand', 'Not selling', 'Adding more'
];

const STRATEGY_POOL = [
  {
    strategy_id: 'false_confidence',
    strategy_name: 'False Confidence',
    definition: 'Acting calm and confident while clearly losing everything. The joke is the gap between words and reality.',
    do: [
      'Use calm, unbothered language while context is catastrophic',
      'Maintain the facade — never break character',
      'Let the template visual reveal the truth the caption denies'
    ],
    dont: [
      'Show genuine distress or panic in the caption',
      'Explicitly state the irony',
      'Use exclamation marks or caps lock'
    ],
    punchline_patterns: ['Totally planned', 'Part of my strategy', 'Not even worried', 'Everything is fine'],
    category_affinity: ['B']
  },
  {
    strategy_id: 'self_roast',
    strategy_name: 'Self Roast',
    definition: 'Laughing at your own terrible trades. You are the punchline. Full self-awareness, zero excuses.',
    do: [
      'Make yourself the target — you are the joke',
      'Acknowledge the L with zero excuses',
      'Show the exact moment of regret'
    ],
    dont: [
      'Blame others or seek sympathy',
      'Use self-pity — use self-mockery',
      'Explain why the decision seemed rational'
    ],
    punchline_patterns: ['I deserve this', 'Me after', 'Who told me to', 'Buying the top again'],
    category_affinity: ['A', 'C']
  },
  {
    strategy_id: 'cope',
    strategy_name: 'Cope',
    definition: 'Desperately justifying an obviously bad position. Delusional silver linings in pure loss.',
    do: [
      'Reframe disaster as opportunity with zero logic',
      'Full commitment to copium — no doubt allowed',
      'Use "still early" energy unironically'
    ],
    dont: [
      'Make a logical argument',
      'Show any doubt or self-awareness',
      'Acknowledge others might be right'
    ],
    punchline_patterns: ['Still early', 'Unrealized losses', 'Zoom out', 'Buying opportunity', 'WAGMI'],
    category_affinity: ['A']
  },
  {
    strategy_id: 'superiority',
    strategy_name: 'Superiority',
    definition: 'Flexing a correct call while others suffer. Maximum smugness, zero empathy.',
    do: [
      'Reference your earlier call or warning',
      'Be maximum smug',
      'Contrast your win against their loss'
    ],
    dont: [
      'Show empathy or humility',
      'Acknowledge luck',
      'Share the credit'
    ],
    punchline_patterns: ['I told you', 'Few understand', 'Meanwhile I', 'Warned you', 'Not my problem'],
    category_affinity: ['B', 'C']
  },
  {
    strategy_id: 'betrayal',
    strategy_name: 'Betrayal',
    definition: 'The market, project, or founder did you dirty. Trust shattered, bags heavy.',
    do: [
      'Express shock at being rugpulled or dumped on',
      'Name the specific betrayal',
      'Show the moment trust broke'
    ],
    dont: [
      'Accept responsibility for your choices',
      'Show forgiveness',
      'Be vague about the betrayer'
    ],
    punchline_patterns: ['Exit liquidity', 'Rug pulled', 'Trusted the process', 'Left holding bags'],
    category_affinity: ['A', 'C']
  },
  {
    strategy_id: 'irony',
    strategy_name: 'Irony',
    definition: 'Saying the opposite of what you mean. Deadpan delivery — the situation IS the joke.',
    do: [
      'Use deadpan, understated language',
      'Let the absurd context speak for itself',
      'State the obviously false as if true'
    ],
    dont: [
      'Explain the irony',
      'Signal sarcasm',
      'Be loud or dramatic — be calm'
    ],
    punchline_patterns: ['Totally normal', 'Nothing to see here', 'Very organic', 'Just a correction'],
    category_affinity: ['B']
  },
  {
    strategy_id: 'panic_then_buy',
    strategy_name: 'Panic Then Buy',
    definition: 'Full panic flipping to impulsive buy. Terror to FOMO in one beat.',
    do: [
      'Show instant flip from panic to greed',
      'Make the buy clearly irrational',
      'Compress emotional arc into one beat'
    ],
    dont: [
      'Show rational analysis between panic and buy',
      'Make the buy seem wise',
      'Separate the emotions — they collide'
    ],
    punchline_patterns: ['Bought the dip', 'FOMO kicked in', 'Added more', 'Send it', 'Getting liquidated'],
    category_affinity: ['A']
  }
];

// Category label mapping: A=Token/Market, B=Macro/World, C=People/Culture
const CATEGORY_STRATEGY_BONUS = {
  A: ['panic_then_buy', 'self_roast', 'cope', 'betrayal'],
  B: ['irony', 'false_confidence', 'superiority'],
  C: ['superiority', 'self_roast', 'betrayal', 'irony']
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute cooldown weight for a strategy based on real timestamps.
 * Matches the archetype cooldown pattern in memeIdeaService.
 * @param {string} strategyId
 * @param {object[]} recentMemes - objects with { strategyId, generatedAt }
 * @returns {number} 0.05 (near-block), 0.2 (heavy), or 1.0 (cold)
 */
function getStrategyCooldownWeight(strategyId, recentMemes) {
  const now = Date.now();
  let minDaysAgo = Infinity;

  for (const m of recentMemes) {
    if (m.strategyId !== strategyId) continue;
    if (!m.generatedAt) continue;
    const daysAgo = (now - Date.parse(m.generatedAt)) / MS_PER_DAY;
    if (daysAgo < minDaysAgo) minDaysAgo = daysAgo;
  }

  if (minDaysAgo < 3) return 0.05;  // near-block: 95% reduction
  if (minDaysAgo < 7) return 0.2;   // heavy: 80% reduction
  return 1.0;
}

/**
 * Select a strategy based on news category and anti-repetition.
 * @param {{ newsEvent: object, template: object, recentMemes: object[], category: string }} params
 * @returns {object} Strategy object
 */
function selectStrategy({ newsEvent, template, recentMemes = [], category, overrideStrategyId = null }) {
  if (overrideStrategyId) {
    const found = STRATEGY_POOL.find(s => s.strategy_id === overrideStrategyId);
    if (found) return found;
  }
  const scored = STRATEGY_POOL.map(s => {
    let score = 1.0;

    // Category affinity bonus
    if (category && CATEGORY_STRATEGY_BONUS[category]) {
      if (CATEGORY_STRATEGY_BONUS[category].includes(s.strategy_id)) {
        score += 2;
      }
    }

    // Cooldown penalty (timestamp-based)
    score *= getStrategyCooldownWeight(s.strategy_id, recentMemes);

    // Random tiebreaker
    score += Math.random() * 0.5;

    return { strategy: s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].strategy;
}

/**
 * Format strategy as prompt injection text for LLM prompts.
 */
function formatStrategyPrompt(strategy) {
  if (!strategy) return '';
  const doList = strategy.do.map(d => `  - DO: ${d}`).join('\n');
  const dontList = strategy.dont.map(d => `  - DON'T: ${d}`).join('\n');
  const patterns = strategy.punchline_patterns.join(' / ');

  return `STRATEGY: ${strategy.strategy_name}
${strategy.definition}

STRATEGY RULES:
${doList}
${dontList}

STRATEGY PUNCHLINE PATTERNS (use as building blocks, not mandatory):
${patterns}`;
}

/**
 * Format punchline library as prompt text.
 */
function formatPunchlineLibrary() {
  return `PUNCHLINE LIBRARY (crypto-native fragments — use as building blocks, not mandatory):
${PUNCHLINE_LIBRARY.join(' / ')}`;
}

module.exports = {
  selectStrategy,
  formatStrategyPrompt,
  formatPunchlineLibrary,
  STRATEGY_POOL,
  PUNCHLINE_LIBRARY
};
