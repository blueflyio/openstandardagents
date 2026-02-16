/**
 * Step 6: Autonomy & Human-in-the-Loop
 * Configure autonomy levels and approval workflows
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function configureAutonomyStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(7, state.totalSteps, 'Autonomy & Human-in-the-Loop');

  console_ui.info('Configure how autonomous the agent should be.\n');

  const { autonomyLevel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'autonomyLevel',
      message: 'Autonomy level:',
      choices: [
        { name: 'Full Autonomy - No human approval required', value: 'full' },
        {
          name: 'Assisted - Human approval for sensitive actions',
          value: 'assisted',
        },
        {
          name: 'Supervised - Human approval for most actions',
          value: 'supervised',
        },
        { name: 'Manual - Human must approve all actions', value: 'manual' },
      ],
      default: 'assisted',
    },
  ]);

  const autonomy: any = {
    level: autonomyLevel,
  };

  if (autonomyLevel !== 'full') {
    const { approvalActions } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'approvalActions',
        message: 'Actions requiring approval:',
        choices: [
          { name: 'Delete Data', value: 'delete_data', checked: true },
          {
            name: 'Modify Permissions',
            value: 'modify_permissions',
            checked: true,
          },
          { name: 'External API Calls', value: 'external_api_calls' },
          { name: 'Deploy Code', value: 'deploy_code', checked: true },
          {
            name: 'Modify Production',
            value: 'modify_production',
            checked: true,
          },
          {
            name: 'Financial Transactions',
            value: 'financial_transactions',
            checked: true,
          },
          { name: 'Send Communications', value: 'send_communications' },
        ],
      },
    ]);

    if (approvalActions.length > 0) {
      autonomy.approval_required = approvalActions;
    }

    const { approvalTimeout } = await inquirer.prompt([
      {
        type: 'number',
        name: 'approvalTimeout',
        message: 'Approval timeout (seconds):',
        default: 300,
      },
    ]);

    autonomy.approval_timeout = approvalTimeout;
  }

  if (!state.agent.spec) state.agent.spec = { role: '' };
  state.agent.spec = {
    ...state.agent.spec,
    autonomy,
  };

  console_ui.success(`Autonomy level: ${autonomyLevel}`);
  if (autonomy.approval_required) {
    console_ui.info(
      `Approval required for: ${autonomy.approval_required.join(', ')}`
    );
  }

  return state;
}
