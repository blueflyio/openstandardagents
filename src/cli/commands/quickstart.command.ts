/**
 * OSSA CLI - Quickstart Command
 * Creates a sample agent and guides user through first run
 */

import { Command } from 'commander';
import * as fs from 'fs';
import chalk from 'chalk';

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
apiVersion: ossa/v0.3.0
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
  console.log();
  console.log(chalk.cyan.bold('[RUN] OSSA Quickstart'));
  console.log(chalk.cyan('══════════════════'));
  console.log();
  console.log(chalk.gray('Open Standard for Software Agents - The OpenAPI for agents'));
  console.log(chalk.gray('Get running in 60 seconds...'));
  console.log();
}

/**
 * Prints a step header
 */
function printStep(step: number, total: number, message: string): void {
  console.log();
  console.log(chalk.white.bold(`[${step}/${total}] ${message}`));
  console.log(chalk.gray('─'.repeat(70)));
}

/**
 * Prints success message
 */
function printSuccess(message: string): void {
  console.log(chalk.green('     ✓'), message);
}

/**
 * Prints info message
 */
function printInfo(message: string): void {
  console.log(chalk.blue('     ℹ'), message);
}

/**
 * Prints warning message
 */
function printWarning(message: string): void {
  console.log(chalk.yellow('     ⚠'), message);
}


/**
 * Prints a box around text
 */
function printBox(message: string): void {
  const width = 70;
  console.log(chalk.cyan('═'.repeat(width)));
  console.log(chalk.cyan(message));
  console.log(chalk.cyan('═'.repeat(width)));
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
  printInfo(`Or use Ollama for local models (free): ${chalk.cyan('https://ollama.ai')}`);

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

  fs.writeFileSync(outputPath, AGENT_TEMPLATE, 'utf-8');
  printSuccess(`Created: ${chalk.cyan(outputPath)}`);
}

/**
 * Show final success message with next steps
 */
function showSuccessMessage(agentFile: string, provider: string): void {
  console.log();
  printBox(`\n🎉 ${chalk.bold('SUCCESS! Your first OSSA agent is ready.')}`);
  console.log();

  console.log(chalk.bold('Next steps:\n'));

  console.log(chalk.bold('  1.'), 'Set your API key:');
  switch (provider) {
    case 'anthropic':
      console.log(`     ${chalk.cyan('export ANTHROPIC_API_KEY=sk-ant-...')}`);
      console.log(`     ${chalk.gray('Get key: https://console.anthropic.com')}`);
      break;
    case 'openai':
      console.log(`     ${chalk.cyan('export OPENAI_API_KEY=sk-...')}`);
      console.log(`     ${chalk.gray('Get key: https://platform.openai.com/api-keys')}`);
      break;
    default:
      console.log(`     ${chalk.cyan('export ANTHROPIC_API_KEY=sk-ant-...')}`);
      console.log(`     ${chalk.gray('Or use: OPENAI_API_KEY, GOOGLE_API_KEY')}`);
  }
  console.log();

  console.log(chalk.bold('  2.'), 'Run your agent:');
  console.log(`     ${chalk.cyan(`ossa run ${agentFile} --interactive`)}`);
  console.log();

  console.log(chalk.bold('  3.'), 'Explore examples:');
  console.log(`     ${chalk.cyan('ossa init my-agent --template advanced')}`);
  console.log(
    `     ${chalk.gray('See: https://github.com/blueflyio/openstandardagents/tree/main/examples')}`
  );
  console.log();

  console.log(chalk.bold('  4.'), 'Learn more:');
  console.log(
    `     ${chalk.gray('Docs:     ')}${chalk.cyan('https://openstandardagents.org/docs')}`
  );
  console.log(
    `     ${chalk.gray('Spec:     ')}${chalk.cyan('https://openstandardagents.org/spec')}`
  );
  console.log(
    `     ${chalk.gray('GitHub:   ')}${chalk.cyan('https://github.com/blueflyio/openstandardagents')}`
  );
  console.log(`     ${chalk.gray('Discord:  ')}${chalk.cyan('https://discord.gg/ossa')}`);
  console.log();

  printBox('');

  console.log(chalk.gray("\nTip: Try 'ossa --help' to see all commands\n"));
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
    printSuccess('Schema: ossa/v0.3.0');
    printSuccess('Kind: Agent');
    printSuccess('Provider: ' + (options.provider || detectedProvider));

    // Success message
    showSuccessMessage(agentFile, detectedProvider);

    process.exit(0);
  } catch (error) {
    console.error(chalk.red('\nError during quickstart:'));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Register the quickstart command
 */
export const quickstartCommand = new Command('quickstart')
  .description('Get started with OSSA in 60 seconds - creates a sample agent and guides you')
  .option('-o, --output <file>', 'Output file path', 'my-first-agent.ossa.yaml')
  .option('-p, --provider <provider>', 'LLM provider (anthropic, openai, google)', 'anthropic')
  .option('-m, --model <model>', 'LLM model name')
  .action(handleQuickstart);
