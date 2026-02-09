/**
 * Skill: grok_research
 * Web search, research documentation, and devlog writing with Grok AI
 */

import fs from 'fs';
import path from 'path';

export const tools = [
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

export function createExecutors(deps) {
  const { workDir, writer } = deps;
  const docsDir = path.join(workDir, '..', 'docs');

  return {
    async web_search({ query, max_results = 5 }) {
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
        if (writer && writer.writeDevlog) {
          return await writer.writeDevlog(phase, details, confidence);
        }
        return `Grok fallback: ${phase} 進行中... 目前信心度 ${confidence}%`;
      } catch (err) {
        return `Grok error (fallback): ${phase} 進行中... 目前信心度 ${confidence}%`;
      }
    },
  };
}
