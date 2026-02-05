/**
 * OSSA CLI - Quickstart Command
 * Creates a sample agent and guides user through first run
 */

import { Command } from 'commander';
import * as fs from 'fs';
import chalk from 'chalk';
import { getApiVersion } from '../../utils/version.js';
import { logger } from '../../utils/logger.js';

const AGENT_TEMPLATE = `# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                                                                               ║
# ║   ██████╗ ███████╗███████╗ █████╗     ██╗   ██╗ ██████╗    ██████╗  ██████╗   ║
# ║  ██╔═══██╗██╔════╝██╔════╝██╔══██╗    ██║   ██║██╔═████╗   ╚════██╗██╔═████╗  ║
# ║  ██║   ██║███████╗███████╗███████║    ██║   ██║██║██╔██║    █████╔╝██║██╔██║  ║
# ║  ██║   ██║╚════██║╚════██║██╔══██║    ╚██╗ ██╔╝████╔╝██║    ╚═══██╗████╔╝██║  ║
# ║  ╚██████╔╝███████║███████║██║  ██║     ╚████╔╝ ╚██████╔╝██╗██████╔╝╚██████╔╝  ║
# ║   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝      ╚═══╝   ╚═════╝ ╚═╝╚═════╝  ╚═════╝   ║
# ║                                                                               ║
# ║                        YOUR FIRST OSSA AGENT                                  ║
# ║                                                                               ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝
#
# This is your first OSSA agent manifest. Think of it like:
#   • package.json for npm
#   • Dockerfile for containers
#   • OpenAPI spec for REST APIs
#
# It's a declarative configuration that any OSSA-compliant runtime can execute.

# ──────────────────────────────────────────────────────────────────────────────────
# API VERSION & KIND (Required)
# ──────────────────────────────────────────────────────────────────────────────────
apiVersion: ossa/v{{VERSION}}
kind: Agent

# ──────────────────────────────────────────────────────────────────────────────────
# METADATA (Required)
# ──────────────────────────────────────────────────────────────────────────────────
metadata:
  name: my-first-agent
  version: 1.0.0
  description: |
    A friendly AI assistant created with OSSA Quickstart.
    This agent demonstrates the minimal required configuration.
  labels:
    created-by: ossa-quickstart
    difficulty: beginner

# ──────────────────────────────────────────────────────────────────────────────────
# AGENT CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────────
spec:
  # The agent's persona (system prompt)
  role: |
    You are a friendly and helpful AI assistant created with OSSA
    (Open Standard for Software Agents - The OpenAPI for agents).

    Your purpose:
    • Answer questions clearly and accurately
    • Help users understand AI agent concepts
    • Provide examples when they clarify ideas
    • Admit when you don't know something

    Communication style:
    • Be concise but thorough
    • Use markdown for clarity
    • Be encouraging to learners
    • Break down complex topics

  # LLM configuration (vendor-neutral)
  llm:
    provider: \${LLM_PROVIDER:-anthropic}
    model: \${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.7

# ═══════════════════════════════════════════════════════════════════════════════
# NEXT STEPS
# ═══════════════════════════════════════════════════════════════════════════════
#
# 1. Set your API key:
#    export ANTHROPIC_API_KEY=sk-ant-...
#
# 2. Run interactively:
#    ossa run my-first-agent.ossa.yaml --interactive
#
# 3. Learn more:
#    • Docs: https://openstandardagents.org/docs
#    • Examples: https://github.com/blueflyio/openstandardagents/tree/main/examples
#    • Spec: https://openstandardagents.org/spec
#
# 4. Explore advanced features:
#    ossa init my-advanced-agent --template full
#
# ═══════════════════════════════════════════════════════════════════════════════
`;

interface QuickstartOptions {
  output?: string;
  provider?: string;
  model?: string;
}

/**
 * Prints a beautiful header
 */
function printHeader(): void {
  logger.info('[RUN] OSSA Quickstart');
  logger.info('Open Standard for Software Agents - The OpenAPI for agents');
  logger.info('Get running in 60 seconds...');
}

/**
 * Prints a step header
 */
function printStep(step: number, total: number, message: string): void {
  logger.info(`[${step}/${total}] ${message}`);
}

/**
 * Prints success message
 */
function printSuccess(message: string): void {
  logger.info(`✓ ${message}`);
}

/**
 * Prints info message
 */
function printInfo(message: string): void {
  logger.info(`ℹ ${message}`);
}

/**
 * Prints warning message
 */
function printWarning(message: string): void {
  logger.warn(`⚠ ${message}`);
}

/**
 * Prints a box around text
 */
function printBox(message: string): void {
  logger.info(message);
}

/**
 * Check environment for API keys
 */
function checkApiKeys(): { hasKey: boolean; provider: string } {
  if (process.env.ANTHROPIC_API_KEY) {
    printSuccess('ANTHROPIC_API_KEY found');
    return { hasKey: true, provider: 'anthropic' };
  }
  if (process.env.OPENAI_API_KEY) {
    printSuccess('OPENAI_API_KEY found');
    return { hasKey: true, provider: 'openai' };
  }
  if (process.env.GOOGLE_API_KEY) {
    printSuccess('GOOGLE_API_KEY found');
    return { hasKey: true, provider: 'google' };
  }

  printWarning('No LLM API key detected');
  printInfo('Set one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY');
  printInfo(
    `Or use Ollama for local models (free): https://ollama.ai`
  );

  return { hasKey: false, provider: 'anthropic' };
}

/**
 * Creates the sample agent manifest
 */
function createAgent(outputPath: string): void {
  if (fs.existsSync(outputPath)) {
    printWarning(`File already exists: ${outputPath}`);
    printInfo('Skipping creation (file preserved)');
    return;
  }

  // Replace {{VERSION}} placeholder with actual version
  const version = getApiVersion().replace('ossa/v', '');
  const content = AGENT_TEMPLATE.replace(/\{\{VERSION\}\}/g, version);

  fs.writeFileSync(outputPath, content, 'utf-8');
  printSuccess(`Created: ${outputPath}`);
}

/**
 * Show final success message with next steps
 */
function showSuccessMessage(agentFile: string, provider: string): void {
  printBox('SUCCESS! Your first OSSA agent is ready.');
  logger.info('Next steps:\n');

  logger.info('1. Set your API key:');
  switch (provider) {
    case 'anthropic':
      logger.info('export ANTHROPIC_API_KEY=sk-ant-...');
      logger.info('Get key: https://console.anthropic.com');
      break;
    case 'openai':
      logger.info('export OPENAI_API_KEY=sk-...');
      logger.info('Get key: https://platform.openai.com/api-keys');
      break;
    default:
      logger.info('export ANTHROPIC_API_KEY=sk-ant-...');
      logger.info('Or use: OPENAI_API_KEY, GOOGLE_API_KEY');
  }

  logger.info('2. Run your agent:');
  logger.info(`ossa run ${agentFile} --interactive`);

  logger.info('3. Explore examples:');
  logger.info('ossa init my-agent --template advanced');
  logger.info('See: https://github.com/blueflyio/openstandardagents/tree/main/examples');

  logger.info('4. Learn more:');
  logger.info('Docs:     https://openstandardagents.org/docs');
  logger.info('Spec:     https://openstandardagents.org/spec');
  logger.info('GitHub:   https://github.com/blueflyio/openstandardagents');
  logger.info('Discord:  https://discord.gg/ossa');

  logger.info("Tip: Try 'ossa --help' to see all commands");
}

/**
 * Main quickstart handler
 */
async function handleQuickstart(options: QuickstartOptions): Promise<void> {
  try {
    printHeader();

    const agentFile = options.output || 'my-first-agent.ossa.yaml';

    // Step 1: Check environment
    printStep(1, 3, 'Checking environment...');
    const { provider } = checkApiKeys();
    const detectedProvider = options.provider || provider;

    // Step 2: Create agent
    printStep(2, 3, 'Creating your first agent...');
    createAgent(agentFile);

    // Step 3: Show next steps
    printStep(3, 3, 'Ready to run!');
    printSuccess(`Schema: ${getApiVersion()}`);
    printSuccess('Kind: Agent');
    printSuccess('Provider: ' + (options.provider || detectedProvider));

    // Success message
    showSuccessMessage(agentFile, detectedProvider);

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during quickstart');
    process.exit(1);
  }
}

/**
 * Register the quickstart command
 */
export const quickstartCommand = new Command('quickstart')
  .description(
    'Get started with OSSA in 60 seconds - creates a sample agent and guides you'
  )
  .option('-o, --output <file>', 'Output file path', 'my-first-agent.ossa.yaml')
  .option(
    '-p, --provider <provider>',
    'LLM provider (anthropic, openai, google)',
    'anthropic'
  )
  .option('-m, --model <model>', 'LLM model name')
  .action(handleQuickstart);
