/**
 * Step 3: Domain & Capability Selection
 * Defines the agent's domain expertise and capabilities
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';
import { getDomainChoices, getConcernChoices } from '../data/taxonomy.js';
import { AGENT_TYPES } from '../data/agent-types.js';

export async function configureDomainCapabilityStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(3, state.totalSteps, 'Domain & Taxonomy');

  console_ui.info('Define the taxonomy classification for your agent.\n');

  // Load taxonomy domains
  const domainChoices = getDomainChoices();

  // Select domain
  const { domain } = await inquirer.prompt([
    {
      type: 'list',
      name: 'domain',
      message: 'Select primary domain:',
      choices: domainChoices.map((d) => ({
        name: d.name,
        value: d.value,
      })),
    },
  ]);

  const selectedDomain = domainChoices.find((d) => d.value === domain);
  let subdomain: string | undefined;
  let capability: string | undefined;
  let concerns: string[] = [];

  // Select subdomain if available
  if (selectedDomain?.subdomains && selectedDomain.subdomains.length > 0) {
    const { selectedSubdomain } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedSubdomain',
        message: 'Select subdomain (optional):',
        choices: [
          { name: 'Skip', value: '' },
          ...selectedDomain.subdomains.map((s) => ({
            name: s,
            value: s,
          })),
        ],
      },
    ]);
    if (selectedSubdomain) {
      subdomain = selectedSubdomain;
    }
  }

  // Enter capability
  const { enteredCapability } = await inquirer.prompt([
    {
      type: 'input',
      name: 'enteredCapability',
      message:
        'Enter primary capability (e.g., code_review, security_scanning):',
      default: '',
      filter: (input: string) =>
        input.trim().toLowerCase().replace(/\s+/g, '_'),
    },
  ]);
  if (enteredCapability) {
    capability = enteredCapability;
  }

  // Select concerns
  const concernChoices = getConcernChoices();
  if (concernChoices.length > 0) {
    const { selectedConcerns } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedConcerns',
        message: 'Select cross-cutting concerns (optional):',
        choices: concernChoices.map((c) => ({
          name: c.name,
          value: c.value,
        })),
      },
    ]);
    concerns = selectedConcerns || [];
  }

  // Set taxonomy in spec (not labels - taxonomy belongs in spec)
  if (!state.agent.spec) {
    state.agent.spec = {
      role: '', // Will be set in step 2 or later
    };
  }

  // Ensure role exists (required field)
  if (!state.agent.spec.role) {
    state.agent.spec.role = '';
  }

  const specRecord = state.agent.spec as Record<string, unknown>;
  specRecord.taxonomy = {
    domain,
    ...(subdomain && { subdomain }),
    ...(capability && { capability }),
    ...(concerns.length > 0 && { concerns }),
  };

  // Also set in labels for backward compatibility
  if (!state.agent.metadata) state.agent.metadata = { name: '' };
  if (!state.agent.metadata.labels) state.agent.metadata.labels = {};
  state.agent.metadata.labels['ossa.ai/domain'] = domain;

  console_ui.success(`Domain: ${domain}`);
  if (subdomain) console_ui.success(`Subdomain: ${subdomain}`);
  if (capability) console_ui.success(`Capability: ${capability}`);
  if (concerns.length > 0) {
    console_ui.success(`Concerns: ${concerns.join(', ')}`);
  }

  return state;
}
