/**
 * Catalog Commands
 *
 * Manage OSSA agents in GitLab Catalog.
 *
 * Commands:
 *   convert  - Convert OSSA manifests to GitLab Duo format
 *   validate - Validate OSSA manifests against schema
 *   push     - Push agents to GitLab Catalog
 *   pull     - Pull agents from GitLab Catalog
 *   sync     - Synchronize local and remote catalog
 *   diff     - Show differences between local and remote
 *   list     - List all agents with status
 */

import { Command } from 'commander';
import { createConvertCommand } from './convert.command';
import { createValidateCommand } from './validate.command';
import { createPushCommand } from './push.command';
import { createPullCommand } from './pull.command';
import { createSyncCommand } from './sync.command';
import { createDiffCommand } from './diff.command';
import { createListCommand } from './list.command';

export function createCatalogCommand(): Command {
  const catalog = new Command('catalog')
    .description('Manage OSSA agents in GitLab Catalog')
    .alias('cat');

  // Register all subcommands
  catalog.addCommand(createConvertCommand());
  catalog.addCommand(createValidateCommand());
  catalog.addCommand(createPushCommand());
  catalog.addCommand(createPullCommand());
  catalog.addCommand(createSyncCommand());
  catalog.addCommand(createDiffCommand());
  catalog.addCommand(createListCommand());

  return catalog;
}

// Re-export config and schemas for external use
export { CatalogConfig, catalogConfig } from './config';
export * from './schemas';
