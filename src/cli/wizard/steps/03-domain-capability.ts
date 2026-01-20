/**
 * Step 3: Domain & Capability Selection
 * Defines the agent's domain expertise and capabilities
 */

import inquirer from 'inquirer';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';
import { getDomainChoices, getConcernChoices } from '../data/taxonomy.js';
import { AGENT_TYPES } from '../data/agent-types.js';
import { container } from '../../../di-container.js';
import { TaxonomyService } from '../../../services/taxonomy.service.js';

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

  // Prompt for additional taxonomy fields
  const taxonomyService = container.get(TaxonomyService);
  const taxonomySpec = await taxonomyService.loadTaxonomy();

  // Maturity level
  const maturityChoices = Object.keys(taxonomySpec.maturity_levels || {});
  if (maturityChoices.length > 0) {
    const maturity = await inquirer.prompt<{ maturity: string }>({
      type: 'list',
      name: 'maturity',
      message: 'Select maturity level:',
      choices: maturityChoices.map((m) => ({
        name: `${m} - ${taxonomySpec.maturity_levels?.[m]?.description || ''}`,
        value: m,
      })),
      default: 'beta',
    });
    (specRecord.taxonomy as Record<string, unknown>).maturity =
      maturity.maturity;
  }

  // Deployment pattern
  const deploymentChoices = Object.keys(taxonomySpec.deployment_patterns || {});
  if (deploymentChoices.length > 0) {
    const deployment = await inquirer.prompt<{ deployment: string }>({
      type: 'list',
      name: 'deployment',
      message: 'Select deployment pattern:',
      choices: deploymentChoices.map((d) => ({
        name: `${d} - ${taxonomySpec.deployment_patterns?.[d]?.description || ''}`,
        value: d,
      })),
      default: 'container',
    });
    (specRecord.taxonomy as Record<string, unknown>).deployment_pattern =
      deployment.deployment;
  }

  // Integration pattern
  const integrationChoices = Object.keys(
    taxonomySpec.integration_patterns || {}
  );
  if (integrationChoices.length > 0) {
    const integration = await inquirer.prompt<{ integration: string }>({
      type: 'list',
      name: 'integration',
      message: 'Select integration pattern:',
      choices: integrationChoices.map((i) => ({
        name: `${i} - ${taxonomySpec.integration_patterns?.[i]?.description || ''}`,
        value: i,
      })),
      default: 'api-first',
    });
    (specRecord.taxonomy as Record<string, unknown>).integration_pattern =
      integration.integration;
  }

  // Cost profile
  const costChoices = Object.keys(taxonomySpec.cost_profiles || {});
  if (costChoices.length > 0) {
    const cost = await inquirer.prompt<{ cost: string }>({
      type: 'list',
      name: 'cost',
      message: 'Select cost profile:',
      choices: costChoices.map((c) => ({
        name: `${c} - ${taxonomySpec.cost_profiles?.[c]?.description || ''}`,
        value: c,
      })),
      default: 'medium',
    });
    (specRecord.taxonomy as Record<string, unknown>).cost_profile = cost.cost;
  }

  // Performance tier
  const performanceChoices = Object.keys(taxonomySpec.performance_tiers || {});
  if (performanceChoices.length > 0) {
    const performance = await inquirer.prompt<{ performance: string }>({
      type: 'list',
      name: 'performance',
      message: 'Select performance tier:',
      choices: performanceChoices.map((p) => ({
        name: `${p} - ${taxonomySpec.performance_tiers?.[p]?.description || ''}`,
        value: p,
      })),
      default: 'near-real-time',
    });
    (specRecord.taxonomy as Record<string, unknown>).performance_tier =
      performance.performance;
  }

  return state;
}
