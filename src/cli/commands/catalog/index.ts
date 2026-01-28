/**
 * Catalog Commands
 *
 * Manage OSSA agents in GitLab Catalog and Registry.
 *
 * Commands:
 *   convert  - Convert OSSA manifests to GitLab Duo format
 *   validate - Validate OSSA manifests against schema
 *   push     - Push agents to GitLab Catalog
 *   pull     - Pull agents from GitLab Catalog
 *   sync     - Synchronize local and remote catalog
 *   diff     - Show differences between local and remote
 *   list     - List all agents with status
 *   search   - Search agents in the registry
 *   info     - Show detailed agent information
 */

import { Command } from 'commander';
import { createConvertCommand } from './convert.command.js';
import { createValidateCommand } from './validate.command.js';
import { createPushCommand } from './push.command.js';
import { createPullCommand } from './pull.command.js';
import { createSyncCommand } from './sync.command.js';
import { createDiffCommand } from './diff.command.js';
import { createListCommand } from './list.command.js';
import { catalogSearchCommand } from './search.command.js';
import { catalogInfoCommand } from './info.command.js';

export function createCatalogCommand(): Command {
  const catalog = new Command('catalog')
    .description('Manage OSSA agents in GitLab Catalog and Registry')
    .alias('cat');

  // Register all subcommands
  catalog.addCommand(createConvertCommand());
  catalog.addCommand(createValidateCommand());
  catalog.addCommand(createPushCommand());
  catalog.addCommand(createPullCommand());
  catalog.addCommand(createSyncCommand());
  catalog.addCommand(createDiffCommand());
  catalog.addCommand(createListCommand());
  catalog.addCommand(catalogSearchCommand);
  catalog.addCommand(catalogInfoCommand);

  return catalog;
}

// Re-export config and schemas for external use
export { CatalogConfig, catalogConfig } from './config.js';
export * from './schemas.js';
