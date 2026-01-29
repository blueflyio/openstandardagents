#!/usr/bin/env node
/**
 * OSSA CLI - Main Entry Point
 *
 * Command-line interface for OSSA operations.
 */

import { Command } from 'commander';
import { createAuditCommand } from './commands/audit.js';

async function main() {
  const program = new Command();

  program
    .name('ossa')
    .description('OSSA - Open Standard for Software Agents CLI')
    .version('0.3.6');

  // Register commands
  program.addCommand(createAuditCommand());

  // Parse arguments
  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
