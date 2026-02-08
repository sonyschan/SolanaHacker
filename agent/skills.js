/**
 * Skill System — On-demand tool loading for token efficiency
 *
 * Architecture:
 *   - Core tools: Always loaded (~15 tools for basic operations)
 *   - Skills: Loaded on-demand when agent calls load_skill
 *   - Each skill = { tools: [...], executors: {...} }
 *
 * Token Savings:
 *   - Skill metadata in system prompt: ~50 tokens each
 *   - Full tool definitions only loaded when needed
 *   - ~500-1000 tokens saved per API call
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
//  Skill Registry (Metadata Only)
// ============================================

/**
 * Skills available for on-demand loading.
 * These are shown in the system prompt as hints.
 */
export const SKILL_REGISTRY = [
  {
    name: 'gemini_image',
    description: 'Generate images with Gemini AI. UX/website assets use Flash model, NFT art uses Pro model.',
    trigger_hints: ['generate image', 'create visual', 'make art', 'NFT artwork', 'icon', 'logo', 'background image'],
  },
  {
    name: 'grok_research',
    description: 'Web search, research documentation, and devlog writing with Grok AI.',
    trigger_hints: ['search web', 'research topic', 'find information', 'look up', 'trending', 'write research'],
  },
  {
    name: 'xai_analysis',
    description: 'Analyze X/Twitter accounts and tokens with X.AI (Grok). Evaluate credibility, social presence, and trading potential.',
    trigger_hints: ['analyze X account', 'twitter account', 'token analysis', 'evaluate token', 'social presence', 'credibility check'],
  },
  {
    name: 'v0_ui',
    description: 'Generate UI components with v0.dev AI. Create React/Next.js components, manage v0 projects, deploy to Vercel.',
    trigger_hints: ['generate UI', 'create component', 'v0', 'build interface', 'design UI', 'react component', 'tailwind component'],
  },
];

// ============================================
//  Meta Tool: load_skill
// ============================================

/**
 * The load_skill tool is always available.
 * It dynamically adds skill tools to the current session.
 */
export const LOAD_SKILL_TOOL = {
  name: 'load_skill',
  description:
    'Load a skill to get access to specialized tools. Available skills:\n' +
    SKILL_REGISTRY.map(s => `• ${s.name}: ${s.description}`).join('\n') +
    '\n\nAfter loading, new tools will be available for use.',
  input_schema: {
    type: 'object',
    properties: {
      skill_name: {
        type: 'string',
        enum: SKILL_REGISTRY.map(s => s.name),
        description: 'Name of the skill to load',
      },
    },
    required: ['skill_name'],
  },
};

// ============================================
//  Skill: gemini_image
// ============================================

const GEMINI_IMAGE_TOOLS = [
  {
    name: 'generate_image',
    description:
      'Generate an image using Gemini AI. Use cases:\n' +
      '• UX/Visual assets for website: use model "gemini-2.5-flash-image"\n' +
      '• NFT artwork generation: use model "gemini-3-pro-image-preview"\n' +
      'Returns path to generated image.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the image to generate',
        },
        model: {
          type: 'string',
          enum: ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'],
          description: 'Model to use. Flash for UX assets (cheaper), Pro for NFT art (higher quality).',
        },
        filename: {
          type: 'string',
          description: 'Output filename (e.g., "hero-bg.png", "nft-001.png")',
        },
        reference_image_path: {
          type: 'string',
          description: 'Optional: path to reference image for style consistency',
        },
      },
      required: ['prompt', 'model', 'filename'],
    },
  },
];

function createGeminiImageExecutors(workDir) {
  return {
    async generate_image({ prompt, model, filename, reference_image_path }) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return 'Error: GEMINI_API_KEY not configured in .env';
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log(`[Gemini] Using model: ${model}`);

        const genModel = genAI.getGenerativeModel({
          model: model,
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        const contentParts = [prompt];

        if (reference_image_path) {
          const refPath = path.resolve(workDir, reference_image_path);
          if (fs.existsSync(refPath)) {
            const refImage = fs.readFileSync(refPath);
            const refBase64 = refImage.toString('base64');
            const ext = path.extname(refPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            contentParts.push({ inlineData: { mimeType, data: refBase64 } });
            console.log(`[Gemini] Added reference image: ${refPath}`);
          }
        }

        console.log(`[Gemini] Generating image...`);
        const result = await genModel.generateContent(contentParts);
        const response = result.response;
        const candidates = response.candidates;

        if (!candidates || candidates.length === 0) {
          return 'Error: No candidates in Gemini response';
        }

        const parts = candidates[0].content?.parts;
        if (!parts) {
          return 'Error: No parts in Gemini response';
        }

        const imagePart = parts.find((part) =>
          part.inlineData?.mimeType?.startsWith('image/')
        );

        if (!imagePart || !imagePart.inlineData?.data) {
          const textPart = parts.find((part) => part.text);
          if (textPart) {
            return `Error: Image generation failed - ${textPart.text.substring(0, 200)}`;
          }
          return 'Error: No image in Gemini response';
        }

        const outputDir = path.join(workDir, 'public', 'generated');
        fs.mkdirSync(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, filename);
        const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);

        console.log(`[Gemini] Image saved to: ${outputPath}`);
        return `Image generated successfully!\nPath: ${outputPath}\nRelative: /generated/${filename}\nSize: ${imageBuffer.length} bytes`;
      } catch (err) {
        console.error(`[Gemini] Error:`, err.message);
        return `Error generating image: ${err.message}`;
      }
    },
  };
}

// ============================================
//  Skill: grok_research
// ============================================

const GROK_RESEARCH_TOOLS = [
  {
    name: 'web_search',
    description:
      'Search the web for latest information using Grok AI. Use for research during IDEA phase or debugging unfamiliar errors.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results (default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'write_research',
    description:
      'Write research findings to docs/research_summary.md. Use after web research to document options considered and decisions made.',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Research topic',
        },
        content: {
          type: 'string',
          description: 'Research summary in Markdown format',
        },
      },
      required: ['topic', 'content'],
    },
  },
  {
    name: 'write_devlog',
    description:
      'Use Grok AI to generate a casual, human-friendly devlog message in Chinese. Returns the generated text — does NOT send it.',
    input_schema: {
      type: 'object',
      properties: {
        phase: {
          type: 'string',
          description: 'Current development phase',
        },
        details: {
          type: 'string',
          description: 'Technical details to include',
        },
        confidence: {
          type: 'number',
          description: 'Current UX confidence percentage (0-100)',
        },
      },
      required: ['phase', 'details', 'confidence'],
    },
  },
];

function createGrokResearchExecutors(workDir, writer) {
  const docsDir = path.join(workDir, '..', 'docs');

  return {
    async web_search({ query, max_results = 5 }) {
      // Grok web search implementation
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
              {
                role: 'system',
                content:
                  'You are a research assistant. Search the web and provide factual, up-to-date information. ' +
                  'Format results as a numbered list with source URLs when available.',
              },
              {
                role: 'user',
                content: `Search for: ${query}\n\nProvide ${max_results} relevant results with brief descriptions.`,
              },
            ],
            max_tokens: 1000,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          throw new Error(`Grok API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No results found';
      } catch (err) {
        console.error('[Grok] Web search error:', err.message);
        return `Error searching: ${err.message}`;
      }
    },

    async write_research({ topic, content }) {
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      const researchPath = path.join(docsDir, 'research_summary.md');

      const date = new Date().toISOString().split('T')[0];
      const header = `\n---\n\n# ${topic}\n**Date**: ${date}\n\n`;
      const entry = header + content + '\n';

      if (fs.existsSync(researchPath)) {
        const existing = fs.readFileSync(researchPath, 'utf-8');
        fs.writeFileSync(researchPath, existing + entry);
      } else {
        fs.writeFileSync(
          researchPath,
          `# Research Summary\n\n> Documentation of research conducted during the hackathon.\n${entry}`
        );
      }
      return `Research added to docs/research_summary.md: ${topic}`;
    },

    async write_devlog({ phase, details, confidence }) {
      try {
        return await writer.writeDevlog(phase, details, confidence);
      } catch (err) {
        return `Grok error (fallback): ${phase} 進行中... 目前信心度 ${confidence}%`;
      }
    },
  };
}

// ============================================
//  Skill: xai_analysis
// ============================================

const XAI_ANALYSIS_TOOLS = [
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

function createXAIAnalysisExecutors() {
  const apiKey = process.env.XAI_API_KEY;

  async function grokAnalyze(systemPrompt, userPrompt) {
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

// ============================================
//  Skill: v0_ui
// ============================================

const V0_UI_TOOLS = [
  {
    name: 'v0_create_chat',
    description:
      'Create a new v0 chat session to generate UI components. Returns chat ID for subsequent messages.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the chat session (e.g., "NFT Gallery Component")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'v0_send_message',
    description:
      'Send a message to v0 to generate or modify UI. Be specific about framework (React), styling (Tailwind), and requirements.',
    input_schema: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID from v0_create_chat',
        },
        message: {
          type: 'string',
          description: 'Detailed prompt describing the UI to generate. Include: component type, styling, functionality, responsive requirements.',
        },
      },
      required: ['chat_id', 'message'],
    },
  },
  {
    name: 'v0_get_chat',
    description:
      'Get chat details including generated code. Use after sending message to retrieve the component code.',
    input_schema: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID to retrieve',
        },
      },
      required: ['chat_id'],
    },
  },
  {
    name: 'v0_list_chats',
    description:
      'List all v0 chats. Useful to find previous UI generations that can be reused or forked.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max number of chats to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'v0_fork_chat',
    description:
      'Fork an existing v0 chat to create variations. Good for A/B testing UI designs.',
    input_schema: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID to fork',
        },
        name: {
          type: 'string',
          description: 'Name for the forked chat',
        },
      },
      required: ['chat_id'],
    },
  },
];

function createV0UIExecutors() {
  const apiKey = process.env.V0_DEV_KEY;
  const baseUrl = 'https://api.v0.dev';

  async function v0Request(endpoint, method = 'GET', body = null) {
    if (!apiKey) {
      return { error: 'V0_DEV_KEY not configured. Add it to .env to use v0 UI generation.' };
    }

    try {
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${baseUrl}${endpoint}`, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`v0 API error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[v0] API error:', err.message);
      return { error: err.message };
    }
  }

  return {
    async v0_create_chat({ name }) {
      const result = await v0Request('/v1/chats', 'POST', { name });
      if (result.error) return `Error: ${result.error}`;
      return `Chat created!\nID: ${result.id}\nName: ${result.name}\n\nUse v0_send_message with this chat_id to generate UI.`;
    },

    async v0_send_message({ chat_id, message }) {
      const result = await v0Request(`/v1/chats/${chat_id}/messages`, 'POST', {
        content: message,
      });
      if (result.error) return `Error: ${result.error}`;

      // Wait a bit for generation
      await new Promise(r => setTimeout(r, 3000));

      return `Message sent to v0!\n\nv0 is generating the component. Use v0_get_chat({ chat_id: "${chat_id}" }) to retrieve the generated code.`;
    },

    async v0_get_chat({ chat_id }) {
      const result = await v0Request(`/v1/chats/${chat_id}`);
      if (result.error) return `Error: ${result.error}`;

      let output = `Chat: ${result.name || chat_id}\n`;
      output += `Status: ${result.status || 'unknown'}\n\n`;

      if (result.messages && result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage.code) {
          output += `Generated Code:\n\`\`\`jsx\n${lastMessage.code}\n\`\`\``;
        } else if (lastMessage.content) {
          output += `Last Message:\n${lastMessage.content}`;
        }
      }

      if (result.previewUrl) {
        output += `\n\nPreview: ${result.previewUrl}`;
      }

      return output;
    },

    async v0_list_chats({ limit = 10 }) {
      const result = await v0Request(`/v1/chats?limit=${limit}`);
      if (result.error) return `Error: ${result.error}`;

      if (!result.chats || result.chats.length === 0) {
        return 'No v0 chats found. Use v0_create_chat to start generating UI.';
      }

      let output = 'v0 Chats:\n\n';
      for (const chat of result.chats) {
        output += `• ${chat.name || 'Untitled'} (ID: ${chat.id})\n`;
        if (chat.updatedAt) {
          output += `  Updated: ${new Date(chat.updatedAt).toLocaleDateString()}\n`;
        }
      }
      return output;
    },

    async v0_fork_chat({ chat_id, name }) {
      const result = await v0Request(`/v1/chats/${chat_id}/fork`, 'POST', { name });
      if (result.error) return `Error: ${result.error}`;
      return `Chat forked!\nNew ID: ${result.id}\nName: ${result.name || name}\n\nYou can now modify this copy without affecting the original.`;
    },
  };
}

// ============================================
//  Skill Loader
// ============================================

/**
 * Get skill definitions and create executors for a given skill.
 *
 * @param {string} skillName - Name of the skill to load
 * @param {object} deps - Dependencies (workDir, writer, etc.)
 * @returns {{ tools: Array, executors: Object } | null}
 */
export function loadSkill(skillName, deps) {
  const { workDir, writer } = deps;

  switch (skillName) {
    case 'gemini_image':
      return {
        tools: GEMINI_IMAGE_TOOLS,
        executors: createGeminiImageExecutors(workDir),
      };

    case 'grok_research':
      return {
        tools: GROK_RESEARCH_TOOLS,
        executors: createGrokResearchExecutors(workDir, writer),
      };

    case 'xai_analysis':
      return {
        tools: XAI_ANALYSIS_TOOLS,
        executors: createXAIAnalysisExecutors(),
      };

    case 'v0_ui':
      return {
        tools: V0_UI_TOOLS,
        executors: createV0UIExecutors(),
      };

    default:
      return null;
  }
}

/**
 * Generate skill hints for the system prompt.
 * This is a compact representation that saves tokens.
 */
export function getSkillHints() {
  return `
## Available Skills (load with load_skill tool)

${SKILL_REGISTRY.map((s) => `• **${s.name}**: ${s.description}`).join('\n')}

To use a skill, first call \`load_skill({ skill_name: "..." })\`, then the skill's tools become available.
`;
}
