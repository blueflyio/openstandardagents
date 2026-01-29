/**
 * OSSA Knowledge Command Group
 * Manage agent knowledge bases
 *
 * SOLID Principles:
 * - Single Responsibility: Command orchestration only
 * - Open/Closed: Extensible via subcommands
 */

import { Command } from 'commander';
import { knowledgeIndexCommand } from './knowledge-index.command.js';
import { knowledgeQueryCommand } from './knowledge-query.command.js';

export const knowledgeCommandGroup = new Command('knowledge')
  .description('Manage agent knowledge bases (index and query)')
  .addCommand(knowledgeIndexCommand)
  .addCommand(knowledgeQueryCommand);
