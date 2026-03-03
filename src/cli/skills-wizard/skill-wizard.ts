/**
 * Interactive wizard for creating Agent Skills (SKILL.md) and optional OSSA skill manifest.
 * Aligns with Agent Skills (agentskills.io) and Claude Code skills:
 * https://code.claude.com/docs/en/skills
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

const SKILL_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const SKILL_NAME_MAX = 64;

function validateSkillName(input: string): boolean {
  if (!input || input.length > SKILL_NAME_MAX) return false;
  return SKILL_NAME_PATTERN.test(input);
}

export interface SkillWizardState {
  name: string;
  description: string;
  instructions: string;
  argumentHint: string;
  disableModelInvocation: boolean;
  userInvocable: boolean;
  allowedTools: string;
  context: 'inline' | 'fork';
  agent: string;
  platforms: string[];
  outputPath: string;
  emitOssaManifest: boolean;
}

const DEFAULT_OUTPUT =
  process.env.SKILLS_PATH ||
  (process.env.HOME
    ? path.join(process.env.HOME, '.claude', 'skills')
    : '.claude/skills');

export async function runSkillWizard(): Promise<SkillWizardState> {
  console.log(chalk.blue.bold('\nOSSA Skill Wizard'));
  console.log(
    chalk.gray(
      'Create an Agent Skills (SKILL.md) compatible skill. See: https://code.claude.com/docs/en/skills\n'
    )
  );

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Skill name (lowercase, hyphens; becomes /slash-command):',
      validate: (input: string) => {
        if (!input) return 'Name is required';
        if (!validateSkillName(input)) {
          return `Use lowercase letters, numbers, hyphens only (max ${SKILL_NAME_MAX} chars), e.g. explain-code`;
        }
        return true;
      },
      filter: (input: string) =>
        input
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (when should Claude use this skill?):',
      validate: (input: string) =>
        input?.trim() ? true : 'Description is required',
    },
    {
      type: 'editor',
      name: 'instructions',
      message: 'Instructions (markdown body for the skill):',
      default:
        'Add step-by-step instructions here. Use $ARGUMENTS for user input.\n',
    },
    {
      type: 'input',
      name: 'argumentHint',
      message: 'Argument hint for /menu (e.g. [filename] or [issue-number]):',
      default: '',
    },
    {
      type: 'confirm',
      name: 'disableModelInvocation',
      message: 'Only you can invoke (disable Claude auto-invocation)?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'userInvocable',
      message: 'Show in / menu (user-invocable)?',
      default: true,
    },
    {
      type: 'input',
      name: 'allowedTools',
      message: 'Allowed tools (comma-separated, e.g. Read,Grep,Bash):',
      default: '',
      filter: (input: string) =>
        input
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(', '),
    },
    {
      type: 'list',
      name: 'context',
      message: 'Run in subagent (fork) or inline?',
      choices: [
        { name: 'Inline (same conversation)', value: 'inline' },
        { name: 'Fork (isolated subagent)', value: 'fork' },
      ],
      default: 'inline',
    },
    {
      type: 'input',
      name: 'agent',
      message: 'Subagent type when fork (Explore, Plan, general-purpose):',
      default: 'general-purpose',
      when: (answers: Partial<SkillWizardState>) => answers.context === 'fork',
    },
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Target platforms:',
      choices: [
        { name: 'Claude Code', value: 'claude-code' },
        { name: 'Cursor', value: 'cursor' },
        { name: 'Goose', value: 'goose' },
        { name: 'Windsurf', value: 'windsurf' },
        { name: 'Codex CLI', value: 'codex-cli' },
        { name: 'Gemini CLI', value: 'gemini-cli' },
      ],
      default: ['claude-code'],
    },
    {
      type: 'input',
      name: 'outputPath',
      message: 'Output directory for skill folder:',
      default: DEFAULT_OUTPUT,
    },
    {
      type: 'confirm',
      name: 'emitOssaManifest',
      message: 'Also create OSSA skill manifest (skill.ossa.yaml)?',
      default: false,
    },
  ]);

  return answers as SkillWizardState;
}

function buildFrontmatter(state: SkillWizardState): string {
  const lines: string[] = [
    '---',
    `name: ${state.name}`,
    `description: ${state.description}`,
  ];
  if (state.argumentHint) lines.push(`argument-hint: ${state.argumentHint}`);
  if (state.disableModelInvocation)
    lines.push('disable-model-invocation: true');
  if (!state.userInvocable) lines.push('user-invocable: false');
  if (state.allowedTools) lines.push(`allowed-tools: ${state.allowedTools}`);
  if (state.context === 'fork') {
    lines.push('context: fork');
    if (state.agent) lines.push(`agent: ${state.agent}`);
  }
  lines.push('---');
  return lines.join('\n') + '\n';
}

function buildSkillMd(state: SkillWizardState): string {
  const front = buildFrontmatter(state);
  const body = (
    state.instructions ||
    `You are the ${state.name} skill. Add instructions here.`
  ).trim();
  return front + '\n' + body + '\n';
}

function buildOssaSkillManifest(state: SkillWizardState): object {
  return {
    apiVersion: 'ossa/v0.4',
    kind: 'Skill',
    metadata: {
      name: state.name,
      description: state.description,
      version: '1.0.0',
    },
    spec: {
      description: state.description,
      instructions: state.instructions?.trim() || '',
      platforms: state.platforms?.length ? state.platforms : ['claude-code'],
      ...(state.allowedTools && {
        allowedTools: state.allowedTools
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    },
  };
}

export async function writeSkillArtifacts(
  state: SkillWizardState
): Promise<{ skillMdPath: string; ossaPath?: string }> {
  const outDir = path.resolve(state.outputPath, state.name);
  await fs.mkdir(outDir, { recursive: true });

  const skillMdPath = path.join(outDir, 'SKILL.md');
  const content = buildSkillMd(state);
  await fs.writeFile(skillMdPath, content, 'utf-8');

  let ossaPath: string | undefined;
  if (state.emitOssaManifest) {
    ossaPath = path.join(outDir, 'skill.ossa.yaml');
    const ossa = buildOssaSkillManifest(state);
    await fs.writeFile(ossaPath, yaml.stringify(ossa), 'utf-8');
  }

  return { skillMdPath, ossaPath };
}
