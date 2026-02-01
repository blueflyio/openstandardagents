#!/usr/bin/env node
/**
 * OSSA CLI - Main Entry Point
 *
 * Command-line interface for OSSA operations.
 */

// CRITICAL: Import reflect-metadata FIRST (required for InversifyJS decorators)
import 'reflect-metadata';

import { Command } from 'commander';
import { createAuditCommand } from './commands/audit.js';
import { validateCommand } from './commands/validate.command.js';
import { generateCommand } from './commands/generate.command.js';
import { agentsMdCommand } from './commands/agents-md.command.js';
import { knowledgeCommandGroup } from './commands/knowledge.command.js';
import { conformanceCommand } from './commands/conformance.command.js';
import { runCommand } from './commands/run.command.js';
import { wizardCommand } from './commands/wizard.command.js';
import { exportV2Command } from './commands/export-v2.command.js';
import { agentsCommand } from './commands/agents.command.js';
import { initializeAdapters } from '../adapters/index.js';

async function main() {
  // Initialize export adapters
  initializeAdapters();

  const program = new Command();

  program
    .name('ossa')
    .description('OSSA - Open Standard for Software Agents CLI')
    .version('0.4.0');

  // Register commands
  program.addCommand(createAuditCommand());
  program.addCommand(validateCommand);
  program.addCommand(generateCommand);
  program.addCommand(agentsMdCommand);
  program.addCommand(knowledgeCommandGroup);
  program.addCommand(conformanceCommand);
  program.addCommand(runCommand);
  program.addCommand(wizardCommand);
  program.addCommand(exportV2Command);
  program.addCommand(agentsCommand);

  // Parse arguments
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
