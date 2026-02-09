/**
 * Skill Loader — Dynamic skill loading from folder structure
 *
 * Architecture:
 *   skills/
 *   ├── gemini_image/
 *   │   ├── skill.md      ← Metadata for indexing (loaded at startup)
 *   │   └── index.js      ← Implementation (loaded on-demand)
 *   ├── grok_research/
 *   │   ├── skill.md
 *   │   └── index.js
 *   └── ...
 *
 * Token Savings:
 *   - Only skill.md metadata in system prompt (~50 tokens each)
 *   - Full tool definitions loaded only when needed
 *   - ~500-1000 tokens saved per API call
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILLS_DIR = path.join(__dirname, 'skills');

// ============================================
//  Skill Registry (Built from skill.md files)
// ============================================

/**
 * Parse a skill.md file to extract metadata
 */
function parseSkillMd(content, skillName) {
  const lines = content.split('\n');

  // Extract description (first paragraph after title)
  let description = '';
  let inDescription = false;
  for (const line of lines) {
    if (line.startsWith('# Skill:')) {
      inDescription = true;
      continue;
    }
    if (inDescription && line.trim() === '') {
      continue;
    }
    if (inDescription && line.startsWith('#')) {
      break;
    }
    if (inDescription && line.trim()) {
      description = line.trim();
      break;
    }
  }

  // Extract trigger hints
  const triggerHints = [];
  let inTriggerHints = false;
  for (const line of lines) {
    if (line.includes('## Trigger Hints')) {
      inTriggerHints = true;
      continue;
    }
    if (inTriggerHints && line.startsWith('##')) {
      break;
    }
    if (inTriggerHints && line.startsWith('-')) {
      triggerHints.push(line.replace('-', '').trim());
    }
  }

  // Extract tools list
  const toolsList = [];
  let inTools = false;
  for (const line of lines) {
    if (line.includes('## Tools')) {
      inTools = true;
      continue;
    }
    if (inTools && line.startsWith('##')) {
      break;
    }
    if (inTools && line.startsWith('-')) {
      const match = line.match(/`(\w+)`/);
      if (match) {
        toolsList.push(match[1]);
      }
    }
  }

  return {
    name: skillName,
    description,
    trigger_hints: triggerHints,
    tools: toolsList,
  };
}

/**
 * Build skill registry by scanning skills directory
 */
function buildSkillRegistry() {
  const registry = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    console.log('[SkillLoader] No skills directory found');
    return registry;
  }

  const skillFolders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const skillName of skillFolders) {
    const skillMdPath = path.join(SKILLS_DIR, skillName, 'skill.md');
    const indexPath = path.join(SKILLS_DIR, skillName, 'index.js');

    if (!fs.existsSync(skillMdPath) || !fs.existsSync(indexPath)) {
      console.log(`[SkillLoader] Skipping ${skillName} - missing skill.md or index.js`);
      continue;
    }

    try {
      const skillMdContent = fs.readFileSync(skillMdPath, 'utf-8');
      const metadata = parseSkillMd(skillMdContent, skillName);
      registry.push(metadata);
      console.log(`[SkillLoader] Registered skill: ${skillName}`);
    } catch (err) {
      console.error(`[SkillLoader] Error loading ${skillName}:`, err.message);
    }
  }

  return registry;
}

// Build registry on module load
export const SKILL_REGISTRY = buildSkillRegistry();

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
//  Skill Loader
// ============================================

/**
 * Dynamically load a skill's tools and executors
 *
 * @param {string} skillName - Name of the skill to load
 * @param {object} deps - Dependencies (workDir, writer, etc.)
 * @returns {Promise<{ tools: Array, executors: Object } | null>}
 */
export async function loadSkill(skillName, deps) {
  const skillPath = path.join(SKILLS_DIR, skillName, 'index.js');

  if (!fs.existsSync(skillPath)) {
    console.error(`[SkillLoader] Skill not found: ${skillName}`);
    return null;
  }

  try {
    // Dynamic import of the skill module
    const skillModule = await import(skillPath);

    const tools = skillModule.tools || [];
    const executors = skillModule.createExecutors ? skillModule.createExecutors(deps) : {};

    console.log(`[SkillLoader] Loaded skill: ${skillName} (${tools.length} tools)`);
    return { tools, executors };
  } catch (err) {
    console.error(`[SkillLoader] Error loading ${skillName}:`, err.message);
    return null;
  }
}

// ============================================
//  Skill Hints Generator
// ============================================

/**
 * Generate skill hints for the system prompt.
 * This is a compact representation that saves tokens.
 */
export function getSkillHints() {
  if (SKILL_REGISTRY.length === 0) {
    return '## Skills\n\n(No skills available)';
  }

  const hints = SKILL_REGISTRY.map(skill => {
    const toolsStr = skill.tools.length > 0
      ? ` → ${skill.tools.join(', ')}`
      : '';
    return `• **${skill.name}**: ${skill.description}${toolsStr}`;
  }).join('\n');

  return `## Available Skills (load with load_skill tool)

${hints}

To use a skill, first call \`load_skill({ skill_name: "..." })\`, then the skill's tools become available.
`;
}
