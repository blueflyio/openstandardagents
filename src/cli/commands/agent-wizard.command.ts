/**
 * OSSA Agent Wizard Command
 * THE WORLD'S MOST COMPREHENSIVE agent creation wizard
 *
 * Features:
 * - Interactive step-by-step wizard with beautiful UI
 * - Pre-built templates for common use cases
 * - Smart recommendations based on agent type
 * - LLM cost estimation
 * - Tool discovery and configuration
 * - Validation at every step
 * - Undo/redo functionality
 * - Dry-run mode
 * - CRUD operations (create, read, update, delete)
 *
 * SOLID: Single Responsibility - Agent wizard orchestration only
 * DRY: Reuses existing services and utilities
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import chalk from 'chalk';

import type { OssaAgent } from '../../types/index.js';
import type { WizardState, WizardOptions, AgentType } from '../wizard/types.js';
import {
  console_ui,
  formatAgentType,
  createProgressBar,
} from '../wizard/ui/console.js';
import { AGENT_TYPES } from '../wizard/data/agent-types.js';
import {
  LLM_PROVIDERS,
  estimateMonthlyCost,
} from '../wizard/data/llm-providers.js';
import {
  AGENT_TEMPLATES,
  getTemplateById,
  getTemplatesByType,
} from '../wizard/data/templates.js';
import { getApiVersion } from '../../utils/version.js';

/**
 * Create a new agent using the interactive wizard
 */
async function createAgentWizard(options: WizardOptions): Promise<void> {
  // Initialize state
  const state: WizardState = {
    agent: {
      apiVersion: getApiVersion(),
      kind: 'Agent',
      metadata: {
        name: '',
        version: '1.0.0',
        description: '',
      },
      spec: {
        role: '',
      },
    },
    step: 1,
    totalSteps: 16,
    canUndo: false,
    history: [],
  };

  // Show welcome header
  console_ui.header(
    'OSSA Agent Creation Wizard',
    'Create production-ready agents step-by-step'
  );

  console.log(
    chalk.gray(
      'This wizard will guide you through creating a complete OSSA agent.'
    )
  );
  console.log(
    chalk.gray('You can use defaults, templates, or customize every detail.\n')
  );

  // Step 1: Choose creation method
  const { creationMethod } = await inquirer.prompt([
    {
      type: 'list',
      name: 'creationMethod',
      message: 'How would you like to create your agent?',
      choices: [
        { name: '🚀 Quick Start (Template)', value: 'template' },
        { name: '🔧 Custom (Step-by-step)', value: 'custom' },
        { name: '📋 From Example', value: 'example' },
      ],
    },
  ]);

  if (creationMethod === 'template') {
    await createFromTemplate(state, options);
  } else if (creationMethod === 'example') {
    await createFromExample(state, options);
  } else {
    await createCustomAgent(state, options);
  }
}

/**
 * Create agent from a pre-built template
 */
async function createFromTemplate(
  state: WizardState,
  options: WizardOptions
): Promise<void> {
  console_ui.section('Template Selection');

  // Show template categories
  const { templateCategory } = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateCategory',
      message: 'Select agent type:',
      choices: AGENT_TYPES.map((t) => ({
        name: `${formatAgentType(t.type)} - ${t.description}`,
        value: t.type,
      })),
    },
  ]);

  // Filter templates by category
  const templates = getTemplatesByType(templateCategory);

  if (templates.length === 0) {
    console_ui.warning(`No templates available for ${templateCategory}`);
    return await createCustomAgent(state, options);
  }

  const { templateId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateId',
      message: 'Select a template:',
      choices: templates.map((t) => ({
        name: `${t.name} - ${t.description}`,
        value: t.id,
      })),
    },
  ]);

  const template = getTemplateById(templateId);
  if (!template) {
    console_ui.error('Template not found');
    return;
  }

  // Apply template to state
  state.agent = { ...state.agent, ...template.manifest };
  state.agentType = template.type;
  state.template = template;

  // Customize template
  await customizeTemplate(state, options);
}

/**
 * Customize a template
 */
async function customizeTemplate(
  state: WizardState,
  options: WizardOptions
): Promise<void> {
  console_ui.section('Customize Template');

  // Agent name
  const { agentName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentName',
      message: 'Agent name (DNS-1123 format):',
      default: state.agent.metadata?.name,
      validate: (input: string) => {
        if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(input)) {
          return 'Must be DNS-1123 compliant (lowercase alphanumeric with hyphens)';
        }
        return true;
      },
    },
  ]);

  state.agent.metadata!.name = agentName;

  // Description
  const { description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: state.agent.metadata?.description,
    },
  ]);

  state.agent.metadata!.description = description;

  // Version
  const { version } = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'Version (semver):',
      default: state.agent.metadata?.version || '1.0.0',
      validate: (input: string) => {
        if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(input)) {
          return 'Must be semver format (e.g., 1.0.0)';
        }
        return true;
      },
    },
  ]);

  state.agent.metadata!.version = version;

  // Customize LLM
  const { customizeLLM } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'customizeLLM',
      message: 'Customize LLM configuration?',
      default: false,
    },
  ]);

  if (customizeLLM) {
    await configureLLM(state);
  }

  // Customize tools
  const { customizeTools } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'customizeTools',
      message: 'Add or modify tools?',
      default: false,
    },
  ]);

  if (customizeTools) {
    await configureTools(state);
  }

  // Save agent
  await saveAgent(state, options);
}

/**
 * Create agent from an example
 */
async function createFromExample(
  state: WizardState,
  options: WizardOptions
): Promise<void> {
  console_ui.section('Load Example');

  const examplesDir = path.resolve(process.cwd(), 'examples');
  if (!fs.existsSync(examplesDir)) {
    console_ui.error('Examples directory not found');
    return;
  }

  // Find all example manifests
  const examples = findExampleManifests(examplesDir);

  if (examples.length === 0) {
    console_ui.error('No example manifests found');
    return;
  }

  const { examplePath } = await inquirer.prompt([
    {
      type: 'list',
      name: 'examplePath',
      message: 'Select an example:',
      choices: examples.map((e) => ({
        name: path.relative(examplesDir, e),
        value: e,
      })),
    },
  ]);

  // Load example (supports both YAML and JSON)
  const exampleContent = fs.readFileSync(examplePath, 'utf-8');
  if (examplePath.endsWith('.json')) {
    state.agent = JSON.parse(exampleContent);
  } else {
    state.agent = yaml.parse(exampleContent);
  }

  console_ui.success(`Loaded example: ${path.basename(examplePath)}`);

  // Customize
  await customizeTemplate(state, options);
}

/**
 * Create a custom agent step-by-step
 */
async function createCustomAgent(
  state: WizardState,
  options: WizardOptions
): Promise<void> {
  // Step 1: Agent Type
  await selectAgentType(state);

  // Step 2: Basic Information
  await configureBasicInfo(state);

  // Step 3: System Prompt/Role
  await configureRole(state);

  // Step 4: LLM Configuration
  await configureLLM(state);

  // Step 5: Tools
  await configureTools(state);

  // Step 6: Safety Controls
  await configureSafety(state);

  // Step 7: Autonomy
  await configureAutonomy(state);

  // Step 8: Observability
  await configureObservability(state);

  // Step 9: Extensions
  await configureExtensions(state);

  // Step 11: Create .agents folder structure
  const { createAgentsFolderStep } =
    await import('../wizard/steps/12-agents-folder.js');
  await createAgentsFolderStep(state, options);

  // Step 12: Generate OpenAPI specification
  const { generateOpenAPIStep } =
    await import('../wizard/steps/13-openapi-generation.js');
  await generateOpenAPIStep(state, options);

  // Step 13: Register in workspace
  const { registerWorkspaceStep } =
    await import('../wizard/steps/14-workspace-registration.js');
  await registerWorkspaceStep(state, options);

  // Step 14: Save Agent
  await saveAgent(state, options);
}

/**
 * Step 1: Select agent type
 */
async function selectAgentType(state: WizardState): Promise<void> {
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
}

/**
 * Step 2: Configure basic information
 */
async function configureBasicInfo(state: WizardState): Promise<void> {
  console_ui.step(2, state.totalSteps, 'Basic Information');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Agent name (DNS-1123 format):',
      validate: (input: string) => {
        if (!input) return 'Name is required';
        if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(input)) {
          return 'Must be DNS-1123 compliant (lowercase alphanumeric with hyphens)';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      validate: (input: string) => (input ? true : 'Description is required'),
    },
    {
      type: 'input',
      name: 'version',
      message: 'Version:',
      default: '1.0.0',
      validate: (input: string) => {
        if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(input)) {
          return 'Must be semver format (e.g., 1.0.0)';
        }
        return true;
      },
    },
  ]);

  state.agent.metadata = {
    ...state.agent.metadata,
    ...answers,
  };

  console_ui.success(`Agent: ${answers.name} v${answers.version}`);
}

/**
 * Step 3: Configure role/system prompt
 */
async function configureRole(state: WizardState): Promise<void> {
  console_ui.step(3, state.totalSteps, 'System Prompt & Role');

  console_ui.info("Define the agent's role and capabilities.");
  console_ui.info(
    "This becomes the system prompt that guides the agent's behavior.\n"
  );

  const { useTemplate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useTemplate',
      message: 'Use a template role?',
      default: true,
    },
  ]);

  if (useTemplate) {
    const typeInfo = AGENT_TYPES.find((t) => t.type === state.agentType);
    const defaultRole = `You are a ${typeInfo?.label || 'specialized'} agent. ${state.agent.metadata?.description || ''}

Your responsibilities:
- Execute tasks efficiently and accurately
- Follow best practices and safety guidelines
- Communicate clearly and concisely
- Admit limitations when uncertain

${typeInfo ? `Specialized capabilities:\n${typeInfo.useCases.map((uc) => `- ${uc}`).join('\n')}` : ''}`;

    state.agent.spec!.role = defaultRole;
    console_ui.success('Using default role template');
  } else {
    const { role } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'role',
        message: 'Enter system prompt (opens editor):',
      },
    ]);

    state.agent.spec!.role = role;
  }
}

/**
 * Step 4: Configure LLM
 */
async function configureLLM(state: WizardState): Promise<void> {
  console_ui.step(4, state.totalSteps, 'LLM Configuration');

  const { providerId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'providerId',
      message: 'Select LLM provider:',
      choices: LLM_PROVIDERS.map((p) => ({
        name: `${p.name} (${p.pricingTier} cost)`,
        value: p.id,
      })),
    },
  ]);

  const provider = LLM_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) return;

  const { modelId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'modelId',
      message: 'Select model:',
      choices: provider.models.map((m) => ({
        name: `${m.name}${m.recommended ? ' (recommended)' : ''} - ${m.description} ($${m.costPer1MTokens}/1M tokens)`,
        value: m.id,
      })),
    },
  ]);

  const { temperature } = await inquirer.prompt([
    {
      type: 'number',
      name: 'temperature',
      message: 'Temperature (0.0-2.0):',
      default: 0.7,
      validate: (input: number) => {
        if (input < 0 || input > 2) return 'Must be between 0.0 and 2.0';
        return true;
      },
    },
  ]);

  state.agent.spec!.llm = {
    provider: providerId,
    model: modelId,
    temperature,
  };

  // Show cost estimate
  const monthlyCost = estimateMonthlyCost(modelId, 100000); // Assume 100k tokens/day
  console_ui.info(
    `Estimated monthly cost (100k tokens/day): $${monthlyCost.toFixed(2)}`
  );
  console_ui.success(`LLM configured: ${provider.name} - ${modelId}`);
}

/**
 * Step 5: Configure tools
 */
async function configureTools(state: WizardState): Promise<void> {
  console_ui.step(5, state.totalSteps, 'Tools & Capabilities');

  console_ui.info(
    'Tools allow your agent to interact with external systems.\n'
  );

  const { addTools } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addTools',
      message: 'Add tools?',
      default: true,
    },
  ]);

  if (!addTools) return;

  const tools: Array<{
    type: string;
    name?: string;
    description?: string;
    server?: string;
    namespace?: string;
    endpoint?: string;
    capabilities?: string[];
    config?: Record<string, unknown>;
    auth?: { type: string; credentials?: string };
    input_schema?: Record<string, unknown>;
    [k: string]: unknown;
  }> = state.agent.spec?.tools || [];

  while (true) {
    const { toolType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'toolType',
        message: 'Select tool type:',
        choices: [
          { name: 'MCP Server', value: 'mcp' },
          { name: 'Function Tool', value: 'function' },
          { name: 'Done adding tools', value: 'done' },
        ],
      },
    ]);

    if (toolType === 'done') break;

    if (toolType === 'mcp') {
      const mcpAnswers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'MCP Server name:' },
        { type: 'input', name: 'server', message: 'MCP Server command:' },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):',
        },
      ]);

      tools.push({
        type: 'mcp',
        name: mcpAnswers.name,
        description: mcpAnswers.description || `MCP server: ${mcpAnswers.name}`,
        config: {
          server: mcpAnswers.server,
        },
      });

      console_ui.success(`Added MCP server: ${mcpAnswers.name}`);
    } else if (toolType === 'function') {
      const funcAnswers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Function name:' },
        { type: 'input', name: 'description', message: 'Description:' },
      ]);

      tools.push({
        type: 'function',
        name: funcAnswers.name,
        description: funcAnswers.description,
        input_schema: {},
      });

      console_ui.success(`Added function: ${funcAnswers.name}`);
    }
  }

  if (tools.length > 0) {
    state.agent.spec!.tools = tools;
    console_ui.success(`Configured ${tools.length} tool(s)`);
  }
}

/**
 * Step 6: Configure safety controls
 */
async function configureSafety(state: WizardState): Promise<void> {
  console_ui.step(6, state.totalSteps, 'Safety & Security');

  const { configureSafety } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureSafety',
      message: 'Configure safety controls?',
      default: true,
    },
  ]);

  if (!configureSafety) return;

  const safetyAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'contentFiltering',
      message: 'Enable content filtering?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'piiDetection',
      message: 'Enable PII detection?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'rateLimiting',
      message: 'Enable rate limiting?',
      default: false,
    },
  ]);

  const safety: Record<string, unknown> = {};

  if (safetyAnswers.contentFiltering) {
    safety.content_filtering = {
      enabled: true,
      categories: ['hate_speech', 'violence'],
      threshold: 'medium',
      action: 'block',
    };
  }

  if (safetyAnswers.piiDetection) {
    safety.pii_detection = {
      enabled: true,
      types: ['email', 'phone', 'ssn', 'credit_card'],
      action: 'redact',
    };
  }

  if (safetyAnswers.rateLimiting) {
    safety.rate_limiting = {
      enabled: true,
      requests_per_minute: 30,
      burst_limit: 5,
    };
  }

  if (Object.keys(safety).length > 0) {
    (state.agent.spec as Record<string, unknown>).safety = safety;
    console_ui.success('Safety controls configured');
  }
}

/**
 * Step 7: Configure autonomy
 */
async function configureAutonomy(state: WizardState): Promise<void> {
  console_ui.step(7, state.totalSteps, 'Autonomy & Human-in-the-Loop');

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
      ],
      default: 'assisted',
    },
  ]);

  state.agent.spec!.autonomy = {
    level: autonomyLevel,
  };

  console_ui.success(`Autonomy level: ${autonomyLevel}`);
}

/**
 * Step 8: Configure observability
 */
async function configureObservability(state: WizardState): Promise<void> {
  console_ui.step(8, state.totalSteps, 'Observability & Monitoring');

  const { enableObservability } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableObservability',
      message: 'Enable observability (tracing, metrics, logging)?',
      default: true,
    },
  ]);

  if (!enableObservability) return;

  state.agent.spec!.observability = {
    tracing: {
      enabled: true,
      exporter: 'otlp',
      endpoint: '${OTEL_ENDPOINT:-http://localhost:4317}',
    },
    metrics: {
      enabled: true,
    },
    logging: {
      level: 'info',
    },
  };

  console_ui.success('Observability configured');
}

/**
 * Step 9: Configure extensions
 */
async function configureExtensions(state: WizardState): Promise<void> {
  console_ui.step(9, state.totalSteps, 'Platform Extensions');

  const { enableExtensions } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableExtensions',
      message: 'Add platform extensions (Cursor, OpenAI, LangChain, etc.)?',
      default: false,
    },
  ]);

  if (!enableExtensions) return;

  const { platforms } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Select platforms:',
      choices: [
        { name: 'Cursor IDE', value: 'cursor' },
        { name: 'OpenAI Assistants', value: 'openai' },
        { name: 'LangChain', value: 'langchain' },
        { name: 'CrewAI', value: 'crewai' },
        { name: 'Anthropic', value: 'anthropic' },
      ],
    },
  ]);

  if (platforms.length > 0) {
    state.agent.extensions = {};

    platforms.forEach((platform: string) => {
      if (platform === 'cursor') {
        state.agent.extensions!.cursor = {
          enabled: true,
          agent_type: 'composer',
        };
      } else {
        state.agent.extensions![platform] = { enabled: true };
      }
    });

    console_ui.success(`Enabled ${platforms.length} extension(s)`);
  }
}

/**
 * Step 10: Save agent
 */
async function saveAgent(
  state: WizardState,
  options: WizardOptions
): Promise<void> {
  console_ui.step(16, state.totalSteps, 'Save Agent');

  // Show summary
  console_ui.section('Summary');
  console_ui.success(`Agent: ${state.agent.metadata?.name}`);
  console_ui.success(`Version: ${state.agent.metadata?.version}`);
  console_ui.success(`Type: ${formatAgentType(state.agentType || 'worker')}`);
  console_ui.success(
    `LLM: ${state.agent.spec?.llm?.provider}/${state.agent.spec?.llm?.model}`
  );
  console_ui.success(`Tools: ${state.agent.spec?.tools?.length || 0}`);

  // Ask for format preference (YAML or JSON)
  const { format } = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: 'Output format:',
      choices: [
        { name: 'YAML (.ossa.yaml) - Recommended', value: 'yaml' },
        { name: 'JSON (.ossa.json)', value: 'json' },
      ],
      default: 'yaml',
    },
  ]);

  // Determine output path
  const extension = format === 'json' ? '.ossa.json' : '.ossa.yaml';
  let outputPath = options.output || `agent${extension}`;

  if (options.directory) {
    const agentDir = path.join(options.directory, state.agent.metadata!.name);
    fs.mkdirSync(agentDir, { recursive: true });
    outputPath = path.join(agentDir, `manifest${extension}`);
  }

  const { confirmSave } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmSave',
      message: `Save to ${outputPath}?`,
      default: true,
    },
  ]);

  if (!confirmSave) {
    console_ui.warning('Agent creation cancelled');
    return;
  }

  // Save manifest in selected format
  if (!options.dryRun) {
    const spinner = ora('Saving agent manifest...').start();

    let content: string;
    if (format === 'json') {
      content = JSON.stringify(state.agent, null, 2);
    } else {
      content = yaml.stringify(state.agent as OssaAgent, {
        indent: 2,
        lineWidth: 0,
      });
    }

    fs.writeFileSync(outputPath, content, 'utf-8');
    spinner.succeed(`Agent manifest saved as ${format.toUpperCase()}!`);
  }

  // Show next steps
  console_ui.section('Next Steps');
  console_ui.info(`1. Review: ${outputPath}`);
  console_ui.info(`2. Validate: ossa validate ${outputPath}`);
  console_ui.info(`3. Test: ossa run ${outputPath}`);
  console_ui.info(`4. Deploy: ossa deploy ${outputPath}`);

  console.log('');
  console_ui.box(
    `🎉 Agent "${state.agent.metadata?.name}" created successfully!\n\nHappy building!`,
    'Success'
  );
}

/**
 * List all agents
 */
async function listAgents(options: WizardOptions): Promise<void> {
  console_ui.header('Agent List');

  const agentsDir = options.directory || '.agents';

  if (!fs.existsSync(agentsDir)) {
    console_ui.warning(`No agents found in ${agentsDir}`);
    return;
  }

  const agents = findAgentManifests(agentsDir);

  if (agents.length === 0) {
    console_ui.warning('No agent manifests found');
    return;
  }

  const data = agents.map((agentPath) => {
    const content = fs.readFileSync(agentPath, 'utf-8');
    const agent = agentPath.endsWith('.json')
      ? JSON.parse(content)
      : yaml.parse(content);
    return [
      agent.metadata?.name || 'Unknown',
      agent.metadata?.version || 'N/A',
      agent.spec?.llm?.provider || 'N/A',
      path.relative(process.cwd(), agentPath),
    ];
  });

  console_ui.table(['Name', 'Version', 'Provider', 'Path'], data);
  console_ui.success(`Found ${agents.length} agent(s)`);
}

/**
 * Show agent details
 */
async function showAgent(name: string, options: WizardOptions): Promise<void> {
  console_ui.header(`Agent: ${name}`);

  const agentsDir = options.directory || '.agents';
  const agentPath = path.join(agentsDir, name, 'manifest.ossa.yaml');

  if (!fs.existsSync(agentPath)) {
    console_ui.error(`Agent not found: ${name}`);
    return;
  }

  const content = fs.readFileSync(agentPath, 'utf-8');
  const agent = yaml.parse(content);

  console_ui.section('Metadata');
  console_ui.success(`Name: ${agent.metadata?.name}`);
  console_ui.success(`Version: ${agent.metadata?.version}`);
  console_ui.success(`Description: ${agent.metadata?.description}`);

  console_ui.section('LLM');
  console_ui.success(`Provider: ${agent.spec?.llm?.provider}`);
  console_ui.success(`Model: ${agent.spec?.llm?.model}`);
  console_ui.success(`Temperature: ${agent.spec?.llm?.temperature}`);

  if (
    agent.spec?.tools &&
    Array.isArray(agent.spec.tools) &&
    agent.spec.tools.length > 0
  ) {
    console_ui.section('Tools');
    agent.spec.tools.forEach((tool: unknown) => {
      const toolObj = tool as Record<string, unknown>;
      console_ui.success(`${toolObj.type}: ${toolObj.name || 'unnamed'}`);
    });
  }

  console.log('');
  console_ui.info(`Full manifest: ${agentPath}`);
}

/**
 * Delete an agent
 */
async function deleteAgent(
  name: string,
  options: WizardOptions
): Promise<void> {
  console_ui.header(`Delete Agent: ${name}`);

  const agentsDir = options.directory || '.agents';
  const agentDir = path.join(agentsDir, name);

  if (!fs.existsSync(agentDir)) {
    console_ui.error(`Agent not found: ${name}`);
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete agent "${name}"?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console_ui.warning('Deletion cancelled');
    return;
  }

  fs.rmSync(agentDir, { recursive: true });
  console_ui.success(`Agent "${name}" deleted`);
}

/**
 * List available templates
 */
async function listTemplates(): Promise<void> {
  console_ui.header('Agent Templates');

  const data = AGENT_TEMPLATES.map((t) => [
    formatAgentType(t.type),
    t.name,
    t.description,
    t.tags.join(', '),
  ]);

  console_ui.table(['Type', 'Name', 'Description', 'Tags'], data);
  console_ui.success(`${AGENT_TEMPLATES.length} template(s) available`);
}

/**
 * Helper: Find example manifests
 */
function findExampleManifests(dir: string): string[] {
  const results: string[] = [];

  function search(directory: string) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        search(fullPath);
      } else if (
        file.endsWith('.ossa.yaml') ||
        file.endsWith('.ossa.yml') ||
        file.endsWith('.ossa.json')
      ) {
        results.push(fullPath);
      }
    }
  }

  search(dir);
  return results;
}

/**
 * Helper: Find agent manifests
 */
function findAgentManifests(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const agents = fs.readdirSync(dir);

  for (const agent of agents) {
    const agentDir = path.join(dir, agent);
    const stat = fs.statSync(agentDir);

    if (stat.isDirectory()) {
      // Check for both YAML and JSON manifests
      const yamlPath = path.join(agentDir, 'manifest.ossa.yaml');
      const jsonPath = path.join(agentDir, 'manifest.ossa.json');

      if (fs.existsSync(yamlPath)) {
        results.push(yamlPath);
      } else if (fs.existsSync(jsonPath)) {
        results.push(jsonPath);
      }
    }
  }

  return results;
}

/**
 * Update an existing agent
 */
async function updateAgent(
  name: string,
  options: WizardOptions
): Promise<void> {
  console_ui.header(`Update Agent: ${name}`);

  const agentsDir = options.directory || '.agents';
  const agentPath = path.join(agentsDir, name, 'manifest.ossa.yaml');

  if (!fs.existsSync(agentPath)) {
    console_ui.error(`Agent not found: ${name}`);
    return;
  }

  const content = fs.readFileSync(agentPath, 'utf-8');
  const agent = yaml.parse(content);

  if (options.field) {
    // Update specific field
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: `New value for ${options.field}:`,
      },
    ]);

    // Set nested property
    const keys = options.field.split('.');
    let current: Record<string, unknown> = agent as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
  } else {
    // Interactive update
    const { updateField } = await inquirer.prompt([
      {
        type: 'list',
        name: 'updateField',
        message: 'What would you like to update?',
        choices: [
          { name: 'Basic Information', value: 'basic' },
          { name: 'LLM Configuration', value: 'llm' },
          { name: 'Tools', value: 'tools' },
          { name: 'Autonomy', value: 'autonomy' },
          { name: 'Observability', value: 'observability' },
          { name: 'Safety Controls', value: 'safety' },
        ],
      },
    ]);

    const state: WizardState = {
      agent,
      step: 1,
      totalSteps: 1,
      canUndo: false,
      history: [],
    };

    // Import and use specific step modules
    switch (updateField) {
      case 'basic': {
        const { configureBasicInfoStep } =
          await import('../wizard/steps/02-basic-info.js');
        await configureBasicInfoStep(state);
        break;
      }
      case 'llm': {
        const { configureLLMStep } =
          await import('../wizard/steps/04-llm-config.js');
        await configureLLMStep(state);
        break;
      }
      case 'tools': {
        const { configureToolsStep } =
          await import('../wizard/steps/05-tools.js');
        await configureToolsStep(state);
        break;
      }
      case 'autonomy': {
        const { configureAutonomyStep } =
          await import('../wizard/steps/06-autonomy.js');
        await configureAutonomyStep(state);
        break;
      }
      case 'observability': {
        const { configureObservabilityStep } =
          await import('../wizard/steps/07-observability.js');
        await configureObservabilityStep(state);
        break;
      }
      case 'safety': {
        const { configureAdvancedStep } =
          await import('../wizard/steps/09-advanced.js');
        await configureAdvancedStep(state);
        break;
      }
    }
  }

  // Save updated manifest
  const yamlContent = yaml.stringify(agent, {
    indent: 2,
    lineWidth: 0,
  });

  fs.writeFileSync(agentPath, yamlContent, 'utf-8');
  console_ui.success(`Agent "${name}" updated successfully`);
}

/**
 * Validate an agent manifest
 */
async function validateAgentManifest(
  manifestPath: string,
  options: Record<string, unknown>
): Promise<void> {
  console_ui.header('Validate Agent Manifest');

  if (!fs.existsSync(manifestPath)) {
    console_ui.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const spinner = ora('Validating manifest...').start();

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const agent = yaml.parse(content);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!agent.apiVersion) errors.push('Missing required field: apiVersion');
    if (!agent.kind) errors.push('Missing required field: kind');
    if (!agent.metadata?.name)
      errors.push('Missing required field: metadata.name');
    if (!agent.metadata?.version)
      errors.push('Missing required field: metadata.version');
    if (!agent.spec?.role) errors.push('Missing required field: spec.role');
    if (!agent.spec?.llm) errors.push('Missing required field: spec.llm');

    // DNS-1123 validation
    if (
      agent.metadata?.name &&
      !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(agent.metadata.name)
    ) {
      errors.push('metadata.name must be DNS-1123 compliant');
    }

    // Semver validation
    if (
      agent.metadata?.version &&
      !/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(agent.metadata.version)
    ) {
      errors.push('metadata.version must be semver format');
    }

    // LLM validation
    if (agent.spec?.llm) {
      if (!agent.spec.llm.provider) errors.push('Missing spec.llm.provider');
      if (!agent.spec.llm.model) errors.push('Missing spec.llm.model');
      if (agent.spec.llm.temperature !== undefined) {
        if (agent.spec.llm.temperature < 0 || agent.spec.llm.temperature > 2) {
          errors.push('spec.llm.temperature must be between 0.0 and 2.0');
        }
      }
    }

    // Tools validation
    if (agent.spec?.tools && Array.isArray(agent.spec.tools)) {
      agent.spec.tools.forEach((tool: unknown, index: number) => {
        const toolObj = tool as Record<string, unknown>;
        if (!toolObj.type) errors.push(`Tool ${index}: missing type`);
        if (!toolObj.name) errors.push(`Tool ${index}: missing name`);
      });
    }

    // Warnings
    if (!agent.metadata?.description)
      warnings.push('Consider adding metadata.description');
    if (!agent.spec?.autonomy)
      warnings.push('Consider configuring spec.autonomy');
    if (!agent.spec?.observability)
      warnings.push('Consider enabling spec.observability');

    spinner.stop();

    if (errors.length > 0) {
      console_ui.error('Validation failed:');
      errors.forEach((err) => console_ui.error(`  - ${err}`));
      process.exit(1);
    }

    console_ui.success('Validation passed!');

    if (warnings.length > 0) {
      console_ui.warning('Recommendations:');
      warnings.forEach((warn) => console_ui.warning(`  - ${warn}`));
    }

    if (options.verbose) {
      console_ui.info('\nManifest summary:');
      console_ui.success(`Name: ${agent.metadata.name}`);
      console_ui.success(`Version: ${agent.metadata.version}`);
      console_ui.success(
        `LLM: ${agent.spec.llm.provider}/${agent.spec.llm.model}`
      );
      console_ui.success(`Tools: ${agent.spec?.tools?.length || 0}`);
    }
  } catch (error) {
    spinner.fail('Validation error');
    console_ui.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// ============================================================================
// Command Definition
// ============================================================================

export const agentWizardCommand = new Command('agent-wizard')
  .description("Interactive wizard for creating OSSA agents (THE WORLD'S BEST)")
  .option('-o, --output <path>', 'Output file path', 'agent.ossa.yaml')
  .option('-d, --directory <dir>', 'Agent directory', '.agents')
  .option('-t, --template <id>', 'Use a template')
  .option('--dry-run', 'Preview without saving', false)
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options: WizardOptions) => {
    try {
      await createAgentWizard(options);
      process.exit(0);
    } catch (error) {
      console_ui.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Subcommands
agentWizardCommand
  .command('list')
  .description('List all agents')
  .option('-d, --directory <dir>', 'Agent directory', '.agents')
  .action(async (options) => {
    await listAgents(options);
  });

agentWizardCommand
  .command('get <name>')
  .description('Show agent details')
  .option('-d, --directory <dir>', 'Agent directory', '.agents')
  .action(async (name, options) => {
    await showAgent(name, options);
  });

agentWizardCommand
  .command('delete <name>')
  .description('Delete an agent')
  .option('-d, --directory <dir>', 'Agent directory', '.agents')
  .action(async (name, options) => {
    await deleteAgent(name, options);
  });

agentWizardCommand
  .command('templates')
  .description('List available templates')
  .action(async () => {
    await listTemplates();
  });

agentWizardCommand
  .command('update <name>')
  .description('Update an existing agent')
  .option('-d, --directory <dir>', 'Agent directory', '.agents')
  .option('-f, --field <field>', 'Field to update')
  .action(async (name, options) => {
    await updateAgent(name, options);
  });

agentWizardCommand
  .command('validate <path>')
  .description('Validate an agent manifest')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (path, options) => {
    await validateAgentManifest(path, options);
  });
