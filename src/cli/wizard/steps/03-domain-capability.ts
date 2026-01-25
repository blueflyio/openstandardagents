/**
 * Step 3: Domain & Capability Selection
 * Defines the agent's domain expertise and capabilities
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';

const DOMAINS = [
  {
    value: 'software-development',
    name: 'Software Development',
    capabilities: ['coding', 'testing', 'debugging', 'code-review'],
  },
  {
    value: 'data-processing',
    name: 'Data Processing',
    capabilities: ['etl', 'transformation', 'validation', 'analytics'],
  },
  {
    value: 'devops',
    name: 'DevOps & Infrastructure',
    capabilities: ['ci-cd', 'monitoring', 'deployment', 'provisioning'],
  },
  {
    value: 'customer-support',
    name: 'Customer Support',
    capabilities: ['ticketing', 'knowledge-base', 'escalation'],
  },
  {
    value: 'business-intelligence',
    name: 'Business Intelligence',
    capabilities: ['reporting', 'dashboards', 'metrics'],
  },
  {
    value: 'security',
    name: 'Security & Compliance',
    capabilities: ['vulnerability-scanning', 'audit', 'compliance-check'],
  },
  { value: 'custom', name: 'Custom Domain' },
];

export async function configureDomainCapabilityStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(3, state.totalSteps, 'Domain & Capabilities');

  console_ui.info('Define the domain and capabilities of your agent.\n');

  const { domain } = await inquirer.prompt([
    {
      type: 'list',
      name: 'domain',
      message: 'Select primary domain:',
      choices: DOMAINS.map((d) => ({
        name: d.name,
        value: d.value,
      })),
    },
  ]);

  const selectedDomain = DOMAINS.find((d) => d.value === domain);
  let capabilities: string[] = [];

  if (domain === 'custom') {
    const { customCapabilities } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customCapabilities',
        message: 'Enter capabilities (comma-separated):',
        filter: (input: string) =>
          input
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
      },
    ]);
    capabilities = customCapabilities;
  } else if (selectedDomain?.capabilities) {
    const { selectedCapabilities } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedCapabilities',
        message: 'Select capabilities:',
        choices: selectedDomain.capabilities.map((c) => ({
          name: c,
          value: c,
          checked: true,
        })),
      },
    ]);
    capabilities = selectedCapabilities;
  }

  if (!state.agent.metadata) state.agent.metadata = { name: '' };
  if (!state.agent.metadata.labels) state.agent.metadata.labels = {};

  state.agent.metadata.labels['ossa.ai/domain'] = domain;

  if (capabilities.length > 0) {
    state.agent.metadata.labels['ossa.ai/capabilities'] =
      capabilities.join(',');
  }

  console_ui.success(`Domain: ${selectedDomain?.name || domain}`);
  console_ui.success(`Capabilities: ${capabilities.join(', ') || 'none'}`);

  return state;
}
