/**
 * Step 9c: AGENTS.md (agents.md standard)
 * Configure generation of AGENTS.md for AI coding agents (https://agents.md).
 * OSSA owns this; BuildKit consumes via CLI/API.
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

const SECTION_CHOICES = [
  { name: 'Dev environment tips', value: 'dev_environment', checked: true },
  { name: 'Testing instructions', value: 'testing', checked: true },
  { name: 'PR instructions', value: 'pr_instructions', checked: true },
  { name: 'Security considerations', value: 'security', checked: true },
  { name: 'Code style guidelines', value: 'code_style', checked: true },
];

export async function configureAgentsMdStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(13, state.totalSteps, 'AGENTS.md (agents.md)');
  console_ui.info(
    'AGENTS.md gives AI coding agents (Cursor, Aider, etc.) project-specific instructions.'
  );
  console_ui.info('See https://agents.md for the standard.\n');

  const { generateAgentsMd } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateAgentsMd',
      message: 'Generate AGENTS.md for this agent?',
      default: true,
    },
  ]);

  if (!generateAgentsMd) {
    return state;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'outputPath',
      message: 'Output path for AGENTS.md (relative to agent directory):',
      default: 'AGENTS.md',
    },
    {
      type: 'checkbox',
      name: 'sections',
      message: 'Sections to include (agents.md standard):',
      choices: SECTION_CHOICES,
    },
  ]);

  if (!state.agent.extensions) {
    state.agent.extensions = {};
  }
  const sections: Record<string, { enabled: boolean }> = {};
  const selected = (answers.sections as string[]) || [];
  for (const key of SECTION_CHOICES.map((c) => c.value)) {
    sections[key] = { enabled: selected.includes(key) };
  }

  state.agent.extensions.agents_md = {
    enabled: true,
    generate: true,
    output_path: (answers.outputPath as string) || 'AGENTS.md',
    sections,
  };

  console_ui.success('AGENTS.md will be generated on save (agents.md standard)');
  return state;
}
