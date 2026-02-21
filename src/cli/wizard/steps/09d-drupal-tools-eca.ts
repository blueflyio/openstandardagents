/**
 * Step 9d: Drupal Tool plugins + ECA models
 * Option to generate Drupal package: Tool AI connector config + ECA model from OSSA manifest.
 * Config-only (tool_ai_connector, eca.eca_model). Optional: PHP Tool plugin stubs for custom logic.
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function configureDrupalToolsEcaStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(14, state.totalSteps, 'Drupal Tools + ECA');
  console_ui.info(
    'Generate a Drupal package: Tool AI connector config and ECA (Event-Condition-Action) model from this manifest.'
  );
  console_ui.info(
    'Requires: drupal/ai_agents, drupal/ai_agents_ossa, drupal/eca. Output is config-only (no custom PHP) unless you add PHP stubs.\n'
  );

  const { generateDrupalPackage } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateDrupalPackage',
      message: 'Generate Drupal package (Tool config + ECA model) on save?',
      default: false,
    },
  ]);

  if (!generateDrupalPackage) {
    return state;
  }

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'includePhpToolStubs',
      message:
        'Include PHP Tool plugin stubs (one class per spec.tool) for custom logic?',
      default: false,
    },
    {
      type: 'input',
      name: 'ecaEvents',
      message: 'ECA trigger events (comma-separated, default: entity:node:presave):',
      default: 'entity:node:presave',
    },
  ]);

  if (!state.agent.extensions) {
    state.agent.extensions = {};
  }
  state.agent.extensions.drupal = {
    enabled: true,
    generate_tools_eca: true,
    include_php_tool_stubs: answers.includePhpToolStubs === true,
    eca_events: (answers.ecaEvents as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };

  console_ui.success(
    'Drupal package (Tool config + ECA) will be generated on save.'
  );
  return state;
}
