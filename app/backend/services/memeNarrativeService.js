/**
 * Meme Narrative Service — psychological interpretation layer for meme generation.
 * Selects a trader psychology narrative to guide caption emotional tone.
 * Pure functions, no side effects, no LLM calls.
 */

const NARRATIVE_POOL = [
  {
    narrative_id: 'bagholder',
    narrative_name: 'Bagholder',
    emotion: 'resignation',
    trader_role: 'underwater holder',
    category_affinity: ['A'],
    phrase_library: ['Still holding bags', 'Cost basis irrelevant', 'Down but not out']
  },
  {
    narrative_id: 'exit_liquidity',
    narrative_name: 'Exit Liquidity',
    emotion: 'self-aware defeat',
    trader_role: 'late buyer',
    category_affinity: ['A'],
    phrase_library: ['Providing exit liquidity', 'Someone had to buy the top', 'Happy to help']
  },
  {
    narrative_id: 'fomo_chaser',
    narrative_name: 'FOMO Chaser',
    emotion: 'regret',
    trader_role: 'late buyer',
    category_affinity: ['A'],
    phrase_library: ['Bought the top again', "Couldn't resist", "FOMO'd in late"]
  },
  {
    narrative_id: 'cynical_veteran',
    narrative_name: 'Cynical Veteran',
    emotion: 'jadedness',
    trader_role: 'experienced trader',
    category_affinity: ['B', 'C'],
    phrase_library: ['Seen this movie before', 'Nothing new', 'Same script different coin']
  },
  {
    narrative_id: 'naive_believer',
    narrative_name: 'Naive Believer',
    emotion: 'blind hope',
    trader_role: 'true believer',
    category_affinity: ['A'],
    phrase_library: ['This time different', 'Still early', 'Generational wealth loading']
  },
  {
    narrative_id: 'degen_pride',
    narrative_name: 'Degen Pride',
    emotion: 'reckless pride',
    trader_role: 'degen',
    category_affinity: ['A'],
    phrase_library: ['Ape first ask later', 'Send it', 'Leverage is a lifestyle']
  },
  {
    narrative_id: 'institutional_paranoia',
    narrative_name: 'Institutional Paranoia',
    emotion: 'distrust',
    trader_role: 'retail vs whales',
    category_affinity: ['B', 'C'],
    phrase_library: ['They dump on retail', 'Insiders knew', 'Rigged from the start']
  },
  {
    narrative_id: 'paper_hands_regret',
    narrative_name: 'Paper Hands Regret',
    emotion: 'regret',
    trader_role: 'early seller',
    category_affinity: ['A'],
    phrase_library: ['Sold too early', 'Would have been rich', 'Watched it pump without me']
  },
  {
    narrative_id: 'diamond_stubbornness',
    narrative_name: 'Diamond Stubbornness',
    emotion: 'stubborn pride',
    trader_role: 'convicted holder',
    category_affinity: ['A'],
    phrase_library: ['Not selling ever', 'Diamond hands activated', "They can't shake me"]
  },
  {
    narrative_id: 'clown_moment',
    narrative_name: 'Clown Moment',
    emotion: 'dark humor',
    trader_role: 'self-aware loser',
    category_affinity: ['A', 'C'],
    phrase_library: ['I did this to myself', 'My own worst enemy', 'I deserve this L']
  }
];

// Category label mapping: A=Token/Market, B=Macro/World, C=People/Culture
const CATEGORY_NARRATIVE_BONUS = {
  A: ['bagholder', 'exit_liquidity', 'fomo_chaser', 'naive_believer', 'degen_pride', 'paper_hands_regret', 'diamond_stubbornness', 'clown_moment'],
  B: ['cynical_veteran', 'institutional_paranoia'],
  C: ['cynical_veteran', 'institutional_paranoia', 'clown_moment']
};

/**
 * Compute cooldown weight for a narrative based on recent usage.
 * @param {string} narrativeId
 * @param {string[]} recentNarrativeIds - most recent first
 * @returns {number} 0.2 (hot), 0.6 (warm), or 1.0 (cold)
 */
function getNarrativeCooldownWeight(narrativeId, recentNarrativeIds) {
  for (let i = 0; i < recentNarrativeIds.length; i++) {
    if (recentNarrativeIds[i] === narrativeId) {
      if (i < 3) return 0.2;   // last ~24h
      if (i < 9) return 0.6;   // last ~72h
      return 1.0;
    }
  }
  return 1.0;
}

/**
 * Select a narrative based on news category and anti-repetition.
 * @param {{ newsEvent: object, template: object, recentMemes: object[], category: string }} params
 * @returns {object} Narrative object with selectedPhrase attached
 */
function selectNarrative({ newsEvent, template, recentMemes = [], category }) {
  const recentNarrativeIds = recentMemes
    .map(m => m.narrativeId)
    .filter(Boolean);

  const scored = NARRATIVE_POOL.map(n => {
    let score = 1.0;

    // Category affinity bonus
    if (category && CATEGORY_NARRATIVE_BONUS[category]) {
      if (CATEGORY_NARRATIVE_BONUS[category].includes(n.narrative_id)) {
        score += 2;
      }
    }

    // Cooldown penalty
    score *= getNarrativeCooldownWeight(n.narrative_id, recentNarrativeIds);

    // Random tiebreaker
    score += Math.random() * 0.5;

    return { narrative: n, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored[0].narrative;

  // Pick a random phrase from the library
  const selectedPhrase = selected.phrase_library[
    Math.floor(Math.random() * selected.phrase_library.length)
  ];

  return { ...selected, selectedPhrase };
}

/**
 * Format narrative as prompt injection text for LLM prompts.
 */
function formatNarrativePrompt(narrative) {
  if (!narrative) return '';
  return `NARRATIVE: ${narrative.narrative_name}
TRADER ROLE: You are the ${narrative.trader_role}.
EMOTION: ${narrative.emotion}
NARRATIVE PHRASE (use as inspiration — do NOT copy verbatim): "${narrative.selectedPhrase}"

NARRATIVE RULES:
  - Channel the ${narrative.emotion} of a ${narrative.trader_role}
  - The caption should FEEL like this narrative, not STATE it
  - Do NOT use the narrative phrase word-for-word in the caption`;
}

module.exports = {
  selectNarrative,
  formatNarrativePrompt,
  NARRATIVE_POOL,
  CATEGORY_NARRATIVE_BONUS
};
