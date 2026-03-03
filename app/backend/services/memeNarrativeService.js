/**
 * Meme Narrative Service v1.1 — Narrative Archetype Dictionary.
 *
 * Psychological frameworks for meme caption generation.
 * These are trader psychology models, NOT phrases to copy.
 * Each narrative must reflect archetype psychology with new original phrasing.
 *
 * Narrative phrase rules:
 *   - 2–6 words, crypto-native, emotionally authentic
 *   - Psychological, not descriptive, not factual
 *
 * Narrative guides meme creation but does NOT replace strategy or template.
 * Narrative is stored as metadata.
 */

const NARRATIVE_POOL = [
  {
    narrative_id: 'exit_liquidity',
    narrative_name: 'Exit Liquidity',
    psychology: 'Accepting you exist so others can profit from your loss',
    emotion: 'self-aware defeat',
    trader_role: 'the exit liquidity',
    category_affinity: ['A'],
    phrase_library: ['happy to serve', 'somebody had to', 'thank me later', 'glad I could help']
  },
  {
    narrative_id: 'last_buyer',
    narrative_name: 'Last Buyer',
    psychology: 'Compulsive need to chase green candles knowing the top is in',
    emotion: 'helpless compulsion',
    trader_role: 'the last buyer',
    category_affinity: ['A'],
    phrase_library: ['one more entry', 'just a small bag', 'this time feels right', 'market looks ready']
  },
  {
    narrative_id: 'this_time_different',
    narrative_name: 'This Time Different',
    psychology: 'Delusional conviction that the same pattern will yield new results',
    emotion: 'irrational hope',
    trader_role: 'the true believer',
    category_affinity: ['A'],
    phrase_library: ['fundamentals changed', 'new paradigm incoming', 'still early actually', 'macro shifted']
  },
  {
    narrative_id: 'smart_money_roleplay',
    narrative_name: 'Smart Money Roleplay',
    psychology: 'Retail trader cosplaying as institutional, using big words for small positions',
    emotion: 'performative confidence',
    trader_role: 'the fake whale',
    category_affinity: ['A', 'B'],
    phrase_library: ['accumulation phase', 'my thesis intact', 'risk managed position', 'strategic rebalance']
  },
  {
    narrative_id: 'forced_long_term',
    narrative_name: 'Forced Long Term',
    psychology: 'Rebranding a losing trade as a long-term investment to avoid admitting defeat',
    emotion: 'disguised denial',
    trader_role: 'the accidental hodler',
    category_affinity: ['A'],
    phrase_library: ['always was long-term', 'not checking price', 'conviction play now', 'zoom out actually']
  },
  {
    narrative_id: 'superiority',
    narrative_name: 'Superiority',
    psychology: 'Using others\' losses to validate own intelligence, even while also losing',
    emotion: 'smug satisfaction',
    trader_role: 'the galaxy brain',
    category_affinity: ['A', 'C'],
    phrase_library: ['called it weeks ago', 'told you so', 'reading was obvious', 'literally predicted this']
  },
  {
    narrative_id: 'market_always_same',
    narrative_name: 'Market Always Same',
    psychology: 'Jaded pattern recognition that removes all surprise from market events',
    emotion: 'exhausted jadedness',
    trader_role: 'the cycle veteran',
    category_affinity: ['B', 'C'],
    phrase_library: ['same script again', 'seen this exact movie', 'nothing ever new', 'cycle repeats perfectly']
  },
  {
    narrative_id: 'invisible_manipulator',
    narrative_name: 'Invisible Manipulator',
    psychology: 'Attributing all market movement to shadowy forces rather than accepting randomness',
    emotion: 'paranoid certainty',
    trader_role: 'the conspiracy spotter',
    category_affinity: ['B', 'C'],
    phrase_library: ['they know already', 'perfectly timed dump', 'coordinated suppression', 'insiders moved first']
  },
  {
    narrative_id: 'temporary_genius',
    narrative_name: 'Temporary Genius',
    psychology: 'Brief window where random success feels like skill, destined to be humbled',
    emotion: 'fleeting euphoria',
    trader_role: 'the temporary genius',
    category_affinity: ['A'],
    phrase_library: ['trading is easy', 'born for this', 'might quit my job', 'everything I touch']
  },
  {
    narrative_id: 'future_regret',
    narrative_name: 'Future Regret',
    psychology: 'Pre-living the pain of a decision you know you\'ll regret but make anyway',
    emotion: 'anticipatory dread',
    trader_role: 'the pre-regretter',
    category_affinity: ['A'],
    phrase_library: ['gonna hate myself', 'future me problems', 'already regretting this', 'know better do worse']
  },
  {
    narrative_id: 'fake_bottom',
    narrative_name: 'Fake Bottom',
    psychology: 'Desperately believing the worst is over because you can\'t handle more pain',
    emotion: 'fragile relief',
    trader_role: 'the bottom caller',
    category_affinity: ['A', 'B'],
    phrase_library: ['bottom confirmed surely', 'can\'t go lower', 'worst is behind', 'recovery starting now']
  },
  {
    narrative_id: 'narrative_breakdown',
    narrative_name: 'Narrative Breakdown',
    psychology: 'The moment a thesis collapses and the holder confronts reality',
    emotion: 'cognitive dissonance',
    trader_role: 'the thesis holder',
    category_affinity: ['A', 'B', 'C'],
    phrase_library: ['thesis still valid?', 'fundamentals unchanged right?', 'just noise probably', 'need to rethink everything']
  }
];

// Category label mapping: A=Token/Market, B=Macro/World, C=People/Culture
const CATEGORY_NARRATIVE_BONUS = {
  A: ['exit_liquidity', 'last_buyer', 'this_time_different', 'forced_long_term', 'superiority', 'temporary_genius', 'future_regret', 'fake_bottom', 'narrative_breakdown'],
  B: ['smart_money_roleplay', 'market_always_same', 'invisible_manipulator', 'fake_bottom', 'narrative_breakdown'],
  C: ['superiority', 'market_always_same', 'invisible_manipulator', 'narrative_breakdown']
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
 * Format narrative as prompt text for LLM meme generation.
 * Phrases are psychological models — LLM must generate original phrasing.
 */
function formatNarrativePrompt(narrative) {
  if (!narrative) return '';
  return `NARRATIVE ARCHETYPE: ${narrative.narrative_name}
PSYCHOLOGY: ${narrative.psychology}
TRADER ROLE: You are ${narrative.trader_role}.
EMOTION: ${narrative.emotion}
EXAMPLE PATTERN (for understanding only — do NOT copy): "${narrative.selectedPhrase}"

NARRATIVE RULES:
  - Channel the ${narrative.emotion} of ${narrative.trader_role}
  - The caption must REFLECT this archetype's psychology with NEW original phrasing
  - Do NOT copy or paraphrase the example pattern — create something fresh
  - Narrative phrase in caption should be 2–6 words, crypto-native, emotionally authentic
  - The caption should FEEL like this narrative, not STATE it`;
}

module.exports = {
  selectNarrative,
  formatNarrativePrompt,
  NARRATIVE_POOL,
  CATEGORY_NARRATIVE_BONUS
};
