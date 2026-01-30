#!/usr/bin/env node
/**
 * OSSA CLI - Main Entry Point
 *
 * Command-line interface for OSSA operations.
 */

import { Command } from 'commander';
import { createAuditCommand } from './commands/audit.js';
import { validateCommand } from './commands/validate.command.js';
import { generateCommand } from './commands/generate.command.js';
import { agentsMdCommand } from './commands/agents-md.command.js';
import { knowledgeCommandGroup } from './commands/knowledge.command.js';
import { conformanceCommand } from './commands/conformance.command.js';
import { runCommand } from './commands/run.command.js';

async function main() {
  const program = new Command();

  program
    .name('ossa')
    .description('OSSA - Open Standard for Software Agents CLI')
    .version('0.3.6');

  // Register commands
  program.addCommand(createAuditCommand());
  program.addCommand(validateCommand);
  program.addCommand(generateCommand);
  program.addCommand(agentsMdCommand);
  program.addCommand(knowledgeCommandGroup);
  program.addCommand(conformanceCommand);
  program.addCommand(runCommand);

  // Parse arguments
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
