/**
 * Step 9e: Memory Management (v0.4)
 * Configures agent memory file management: CLAUDE.md hierarchy, rules extraction,
 * conditional loading with path-scoped frontmatter, and auto-memory.
 * Writes to token_efficiency.memory_management in the manifest.
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function configureMemoryManagementStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(11, state.totalSteps, 'Memory Management (v0.4)');
  console_ui.info(
    'Memory management optimizes CLAUDE.md and context files loaded per session.'
  );
  console_ui.info(
    'Large memory files (>40k chars) degrade performance. Extract sections to .claude/rules/ with path-scoped conditional loading.'
  );

  const { enable } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enable',
      message: 'Enable memory management for this agent?',
      default: true,
    },
  ]);

  if (!enable) {
    return state;
  }

  const answers = await inquirer.prompt<{
    max_chars: number;
    warn_chars: number;
    rules_directory: string;
    path_scoping: boolean;
    domains: string[];
    auto_memory: boolean;
    auto_memory_max_lines: number;
    auto_extract: boolean;
  }>([
    {
      type: 'number',
      name: 'max_chars',
      message: 'Maximum memory chars before optimization (threshold):',
      default: 40000,
      validate: (v: number) => v >= 1000 || 'Must be at least 1000',
    },
    {
      type: 'number',
      name: 'warn_chars',
      message: 'Warning threshold (chars):',
      default: 30000,
      validate: (v: number) => v >= 1000 || 'Must be at least 1000',
    },
    {
      type: 'input',
      name: 'rules_directory',
      message: 'Rules extraction directory:',
      default: '.claude/rules',
    },
    {
      type: 'confirm',
      name: 'path_scoping',
      message:
        'Enable path-scoped conditional loading (YAML frontmatter with paths)?',
      default: true,
    },
    {
      type: 'checkbox',
      name: 'domains',
      message: 'Select domain classifications for rule extraction:',
      choices: [
        {
          name: 'Drupal (*.module, *.theme, drupal/**)',
          value: 'drupal',
          checked: false,
        },
        {
          name: 'OSSA (.agents/**, *.ossa.yaml)',
          value: 'ossa',
          checked: false,
        },
        {
          name: 'Infrastructure (k8s/**, docker/**, deployments/**)',
          value: 'infrastructure',
          checked: false,
        },
        {
          name: 'Security (cedar/**, policies/**)',
          value: 'security',
          checked: false,
        },
        {
          name: 'GitLab (.gitlab/**, .gitlab-ci.yml)',
          value: 'gitlab',
          checked: false,
        },
        { name: 'MCP (mcp/**, *.mcp.json)', value: 'mcp', checked: false },
      ],
    },
    {
      type: 'confirm',
      name: 'auto_memory',
      message: 'Enable auto-memory (persistent across sessions)?',
      default: true,
    },
    {
      type: 'number',
      name: 'auto_memory_max_lines',
      message: 'Max auto-memory lines loaded per session:',
      default: 200,
      when: (a: { auto_memory: boolean }) => a.auto_memory,
    },
    {
      type: 'confirm',
      name: 'auto_extract',
      message: 'Auto-extract sections when threshold exceeded?',
      default: false,
    },
  ]);

  const domainClassifications = buildDomainClassifications(answers.domains);

  const memory_management: Record<string, unknown> = {
    enabled: true,
    threshold: {
      max_chars: answers.max_chars,
      warn_chars: answers.warn_chars,
    },
    rules: {
      directory: answers.rules_directory,
      path_scoping: answers.path_scoping,
      ...(domainClassifications.length > 0 && {
        classifications: domainClassifications,
      }),
    },
    auto_memory: {
      enabled: answers.auto_memory,
      ...(answers.auto_memory &&
        answers.auto_memory_max_lines && {
          max_lines: answers.auto_memory_max_lines,
        }),
    },
    optimization: {
      auto_extract: answers.auto_extract,
      max_suggestions: 10,
      min_section_chars: 500,
    },
  };

  // Ensure token_efficiency exists
  const agent = state.agent as Record<string, unknown>;
  if (!agent.token_efficiency) {
    agent.token_efficiency = {};
  }
  (agent.token_efficiency as Record<string, unknown>).memory_management =
    memory_management;

  console_ui.success('Memory management configured (v0.4)');
  return state;
}

interface DomainClassification {
  domain: string;
  paths: string[];
  keywords: string[];
}

function buildDomainClassifications(domains: string[]): DomainClassification[] {
  const domainMap: Record<string, DomainClassification> = {
    drupal: {
      domain: 'drupal',
      paths: [
        'drupal/**',
        '*.module',
        '*.theme',
        '*.install',
        'web/modules/**',
      ],
      keywords: ['drupal', 'phpcs', 'drush', 'recipe', 'twig'],
    },
    ossa: {
      domain: 'ossa',
      paths: ['.agents/**', '*.ossa.yaml', 'manifest.ossa.yaml'],
      keywords: ['ossa', 'agent', 'manifest', 'openstandardagents'],
    },
    infrastructure: {
      domain: 'infrastructure',
      paths: [
        'k8s/**',
        'docker/**',
        'deployments/**',
        'helm/**',
        'terraform/**',
      ],
      keywords: ['kubernetes', 'docker', 'helm', 'terraform', 'oracle', 'nas'],
    },
    security: {
      domain: 'security',
      paths: ['cedar/**', 'policies/**', 'security/**'],
      keywords: ['cedar', 'policy', 'security', 'compliance', 'audit'],
    },
    gitlab: {
      domain: 'gitlab',
      paths: ['.gitlab/**', '.gitlab-ci.yml', 'gitlab_components/**'],
      keywords: ['gitlab', 'ci', 'pipeline', 'runner', 'duo'],
    },
    mcp: {
      domain: 'mcp',
      paths: ['mcp/**', '*.mcp.json', '.mcp.json'],
      keywords: ['mcp', 'model-context-protocol', 'server'],
    },
  };

  return domains.filter((d) => domainMap[d]).map((d) => domainMap[d]);
}
