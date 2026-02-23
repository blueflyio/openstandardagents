/**
 * Bidirectional SKILL.md ↔ skill.ossa.yaml Converter
 *
 * Converts between the Agent Skills spec (SKILL.md with YAML frontmatter)
 * and OSSA Skill manifests (skill.ossa.yaml).
 *
 * Round-trip: SKILL.md → skill.ossa.yaml → SKILL.md preserves content.
 */

import { readFile, writeFile } from 'fs/promises';
import YAML from 'yaml';
import type { OssaSkill, SkillMetadata, SkillSpec } from '../types/skill.js';

/**
 * Parsed SKILL.md structure
 */
export interface SkillMd {
  frontmatter: SkillMdFrontmatter;
  body: string;
}

/**
 * SKILL.md YAML frontmatter fields (Agent Skills spec)
 */
export interface SkillMdFrontmatter {
  name: string;
  description?: string;
  'allowed-tools'?: string[];
  'disable-model-invocation'?: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Parse SKILL.md
// ---------------------------------------------------------------------------

/**
 * Parse a SKILL.md file into frontmatter + body
 */
export function parseSkillMd(content: string): SkillMd {
  const trimmed = content.trim();

  // Check for YAML frontmatter
  if (!trimmed.startsWith('---')) {
    // No frontmatter — treat entire content as instructions with no metadata
    return {
      frontmatter: { name: 'unnamed-skill' },
      body: trimmed,
    };
  }

  const secondDelim = trimmed.indexOf('---', 3);
  if (secondDelim === -1) {
    return {
      frontmatter: { name: 'unnamed-skill' },
      body: trimmed,
    };
  }

  const yamlStr = trimmed.slice(3, secondDelim).trim();
  const body = trimmed.slice(secondDelim + 3).trim();

  let frontmatter: SkillMdFrontmatter;
  try {
    frontmatter = YAML.parse(yamlStr) as SkillMdFrontmatter;
    if (!frontmatter || typeof frontmatter !== 'object') {
      frontmatter = { name: 'unnamed-skill' };
    }
    if (!frontmatter.name) {
      frontmatter.name = 'unnamed-skill';
    }
  } catch {
    frontmatter = { name: 'unnamed-skill' };
  }

  return { frontmatter, body };
}

// ---------------------------------------------------------------------------
// SKILL.md → skill.ossa.yaml
// ---------------------------------------------------------------------------

export interface ImportOptions {
  /** Override the skill name */
  name?: string;
  /** Add a DID */
  did?: string;
  /** Set the version */
  version?: string;
  /** Author info */
  author?: { name?: string; did?: string };
  /** License */
  license?: string;
  /** Platforms */
  platforms?: string[];
}

/**
 * Convert SKILL.md content to an OssaSkill manifest
 */
export function skillMdToOssa(content: string, options?: ImportOptions): OssaSkill {
  const parsed = parseSkillMd(content);
  const fm = parsed.frontmatter;

  const name = options?.name || toSlug(fm.name);
  const description = fm.description || extractFirstParagraph(parsed.body) || fm.name;

  const metadata: SkillMetadata = {
    name,
    description,
    ...(options?.version && { version: options.version }),
    ...(options?.did && { did: options.did }),
    ...(options?.author && { author: options.author }),
    ...(options?.license && { license: options.license }),
  };

  const spec: SkillSpec = {
    description,
    instructions: parsed.body || undefined,
    ...(fm['allowed-tools'] && { allowedTools: fm['allowed-tools'] }),
    ...(options?.platforms && { platforms: options.platforms }),
  };

  return {
    apiVersion: 'ossa/v1',
    kind: 'Skill',
    metadata,
    spec,
  };
}

/**
 * Read a SKILL.md file and convert to OssaSkill
 */
export async function importSkillMd(filePath: string, options?: ImportOptions): Promise<OssaSkill> {
  const content = await readFile(filePath, 'utf-8');
  return skillMdToOssa(content, options);
}

// ---------------------------------------------------------------------------
// skill.ossa.yaml → SKILL.md
// ---------------------------------------------------------------------------

/**
 * Convert an OssaSkill manifest to SKILL.md content
 */
export function ossaToSkillMd(skill: OssaSkill): string {
  const fm: Record<string, unknown> = {
    name: skill.metadata.name,
  };

  if (skill.spec.description) {
    fm.description = skill.spec.description;
  }

  if (skill.spec.allowedTools && skill.spec.allowedTools.length > 0) {
    fm['allowed-tools'] = skill.spec.allowedTools;
  }

  const frontmatter = YAML.stringify(fm).trim();
  const body = skill.spec.instructions || skill.spec.description || '';

  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

/**
 * Export an OssaSkill manifest to a SKILL.md file
 */
export async function exportSkillMd(skill: OssaSkill, outputPath: string): Promise<void> {
  const content = ossaToSkillMd(skill);
  await writeFile(outputPath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

/**
 * Read a skill.ossa.yaml file and parse it
 */
export async function readSkillOssa(filePath: string): Promise<OssaSkill> {
  const content = await readFile(filePath, 'utf-8');
  const parsed = YAML.parse(content) as OssaSkill;
  if (!parsed || parsed.kind !== 'Skill') {
    throw new Error(`Not a valid skill.ossa.yaml: kind must be "Skill", got "${parsed?.kind}"`);
  }
  return parsed;
}

/**
 * Write an OssaSkill manifest to a YAML file
 */
export async function writeSkillOssa(skill: OssaSkill, outputPath: string): Promise<void> {
  const content = YAML.stringify(skill, { lineWidth: 120 });
  await writeFile(outputPath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractFirstParagraph(body: string): string | undefined {
  if (!body) return undefined;
  // Skip headings, find first non-empty paragraph
  const lines = body.split('\n');
  const paragraphLines: string[] = [];
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!started) {
      if (trimmed && !trimmed.startsWith('#')) {
        started = true;
        paragraphLines.push(trimmed);
      }
    } else if (trimmed) {
      paragraphLines.push(trimmed);
    } else {
      break;
    }
  }

  const result = paragraphLines.join(' ').trim();
  return result || undefined;
}
