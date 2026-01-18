/**
 * Step 1: Agent Type Selection
 * Helps users choose the right agent type for their use case
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui, formatAgentType } from '../ui/console.js';
import { AGENT_TYPES } from '../data/agent-types.js';

export async function selectAgentTypeStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(1, state.totalSteps, 'Agent Type Selection');

  console_ui.info('Choose the type of agent you want to create.');
  console_ui.info(
    'Each type has specific use cases and recommended configurations.\n'
  );

  const { agentType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'agentType',
      message: 'Select agent type:',
      choices: AGENT_TYPES.map((t) => ({
        name: `${formatAgentType(t.type)} ${t.label} - ${t.description}`,
        value: t.type,
        short: t.label,
      })),
      pageSize: 12,
    },
  ]);

  state.agentType = agentType;

  const typeInfo = AGENT_TYPES.find((t) => t.type === agentType);
  if (typeInfo) {
    console_ui.success(`Selected: ${typeInfo.label}`);
    console_ui.info(`Estimated setup time: ${typeInfo.estimatedTime}`);
    console_ui.info('Use cases:');
    console_ui.list(typeInfo.useCases);
  }

  return state;
}
