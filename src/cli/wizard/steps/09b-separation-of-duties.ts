/**
 * Step 9b: Separation of Duties (SoD)
 * Collects spec.access (tier) and spec.separation (role, conflicts_with) for compliance.
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

const TIERS = [
  { name: 'Tier 1 - Read (analyzer, scanner)', value: 'tier_1_read' },
  {
    name: 'Tier 2 - Write limited (reviewer, worker)',
    value: 'tier_2_write_limited',
  },
  {
    name: 'Tier 3 - Write elevated (operator, executor)',
    value: 'tier_3_write_elevated',
  },
  { name: 'Tier 4 - Policy (governor, approver)', value: 'tier_4_policy' },
];

const ROLES = [
  'analyzer',
  'auditor',
  'scanner',
  'reviewer',
  'monitor',
  'generator',
  'scaffolder',
  'documenter',
  'test_writer',
  'deployer',
  'operator',
  'executor',
  'maintainer',
  'governor',
  'policy_definer',
  'compliance_officer',
  'approver',
  'critic',
  'remediator',
  'enforcer',
];

export async function configureSeparationOfDutiesStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(10, state.totalSteps, 'Separation of Duties');
  console_ui.info(
    'Access tier and role separation prevent conflicts (e.g. reviewer cannot approve own work).'
  );

  const { configureSod } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureSod',
      message: 'Configure access tier and separation of duties?',
      default: true,
    },
  ]);

  if (!configureSod) return state;

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'tier',
      message: 'Access tier:',
      choices: TIERS,
      default: 'tier_2_write_limited',
    },
    {
      type: 'list',
      name: 'role',
      message: 'Primary role of this agent:',
      choices: ROLES.map((r) => ({ name: r, value: r })),
      default: 'reviewer',
    },
    {
      type: 'checkbox',
      name: 'conflicts_with',
      message: 'Roles this agent must NOT also perform (conflicts):',
      choices: ROLES.map((r) => ({ name: r, value: r })),
      validate: (selected: string[], a: { role: string }) => {
        if (selected.includes(a.role)) {
          return 'Role cannot conflict with itself';
        }
        return true;
      },
    },
  ]);

  if (!state.agent.spec) state.agent.spec = { role: '' };
  const spec = state.agent.spec as Record<string, unknown>;
  spec.access = { tier: answers.tier };
  spec.separation = {
    role: answers.role,
    conflicts_with: answers.conflicts_with || [],
  };

  console_ui.success('Separation of duties configured');
  return state;
}
