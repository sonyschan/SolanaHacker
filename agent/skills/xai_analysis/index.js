/**
 * Skill: xai_analysis
 * Analyze X/Twitter accounts and tokens with X.AI (Grok)
 */

export const tools = [
  {
    name: 'analyze_x_account',
    description:
      'Analyze an X/Twitter account for credibility and influence. Evaluates follower quality, engagement patterns, and account history.',
    input_schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'X/Twitter username (without @)',
        },
        context: {
          type: 'string',
          description: 'Optional context about why analyzing (e.g., "token founder", "influencer recommendation")',
        },
      },
      required: ['username'],
    },
  },
  {
    name: 'analyze_token',
    description:
      'Deep analysis of a Solana token using X.AI. Evaluates social presence, trading activity, team credibility, and risk factors.',
    input_schema: {
      type: 'object',
      properties: {
        token_address: {
          type: 'string',
          description: 'Solana token mint address',
        },
        token_symbol: {
          type: 'string',
          description: 'Token symbol (e.g., "SOL", "BONK")',
        },
        additional_context: {
          type: 'string',
          description: 'Any additional context about the token',
        },
      },
      required: ['token_address', 'token_symbol'],
    },
  },
  {
    name: 'evaluate_social_presence',
    description:
      'Evaluate social media presence for a project or token. Checks X, Discord, Telegram activity.',
    input_schema: {
      type: 'object',
      properties: {
        project_name: {
          type: 'string',
          description: 'Name of the project',
        },
        twitter_handle: {
          type: 'string',
          description: 'X/Twitter handle (optional)',
        },
        discord_url: {
          type: 'string',
          description: 'Discord invite URL (optional)',
        },
        telegram_handle: {
          type: 'string',
          description: 'Telegram channel/group (optional)',
        },
      },
      required: ['project_name'],
    },
  },
];

async function grokAnalyze(systemPrompt, userPrompt) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return 'Error: XAI_API_KEY not configured';
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Analysis failed';
  } catch (err) {
    console.error('[X.AI] Analysis error:', err.message);
    return `Error: ${err.message}`;
  }
}

export function createExecutors(deps) {
  return {
    async analyze_x_account({ username, context = '' }) {
      const systemPrompt = `You are a social media analyst specializing in crypto/Web3 accounts on X (Twitter).
Analyze the given account and evaluate:
1. Account age and history
2. Follower count vs following ratio
3. Engagement quality (likes, retweets, replies)
4. Content quality and consistency
5. Red flags (bought followers, engagement farming, suspicious activity)
6. Overall credibility score (0-100)

Format as a structured report with clear sections.`;

      const userPrompt = `Analyze X account: @${username}
${context ? `Context: ${context}` : ''}

Provide a detailed credibility analysis.`;

      return grokAnalyze(systemPrompt, userPrompt);
    },

    async analyze_token({ token_address, token_symbol, additional_context = '' }) {
      const systemPrompt = `You are a crypto token analyst specializing in Solana tokens.
Analyze the given token and evaluate:
1. Social presence (X, Discord, Telegram activity)
2. Team credibility (doxxed? track record?)
3. Trading patterns (suspicious volume? wash trading?)
4. Holder distribution (whale concentration?)
5. Smart contract risks (honeypot? taxes?)
6. Community engagement quality
7. Overall risk assessment (LOW/MEDIUM/HIGH)
8. Recommendation (BUY/HOLD/AVOID with reasoning)

Format as a structured report.`;

      const userPrompt = `Analyze Solana token:
Address: ${token_address}
Symbol: ${token_symbol}
${additional_context ? `Additional context: ${additional_context}` : ''}

Provide a comprehensive analysis for trading/investment decision.`;

      return grokAnalyze(systemPrompt, userPrompt);
    },

    async evaluate_social_presence({ project_name, twitter_handle, discord_url, telegram_handle }) {
      const systemPrompt = `You are a social media presence evaluator for crypto/Web3 projects.
Evaluate the project's social presence across platforms and assess:
1. Overall activity level (daily posts, engagement)
2. Community size and growth
3. Engagement authenticity (real vs bot activity)
4. Response time to community questions
5. Content quality and professionalism
6. Red flags (inactive, fake engagement, etc.)
7. Social presence score (0-100)

Format as a structured evaluation.`;

      const handles = [];
      if (twitter_handle) handles.push(`X/Twitter: @${twitter_handle}`);
      if (discord_url) handles.push(`Discord: ${discord_url}`);
      if (telegram_handle) handles.push(`Telegram: ${telegram_handle}`);

      const userPrompt = `Evaluate social presence for: ${project_name}
${handles.length ? handles.join('\n') : '(No specific handles provided - do general search)'}

Provide a comprehensive social presence evaluation.`;

      return grokAnalyze(systemPrompt, userPrompt);
    },
  };
}
