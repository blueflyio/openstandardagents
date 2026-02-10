/**
 * Catalog Commands
 *
 * Manage OSSA agents in GitLab Catalog and Registry.
 *
 * Commands:
 *   convert  - Convert OSSA manifests to GitLab Duo format
 *   validate - Validate OSSA manifests against schema
 *   list     - List all agents with status
 *   search   - Search agents in the registry
 *   info     - Show detailed agent information
 */

import { Command } from 'commander';
import { createConvertCommand } from './convert.command.js';
import { createValidateCommand } from './validate.command.js';
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
  catalog.addCommand(createListCommand());
  catalog.addCommand(catalogSearchCommand);
  catalog.addCommand(catalogInfoCommand);

  return catalog;
}

// Re-export config and schemas for external use
export { CatalogConfig, catalogConfig } from './config.js';
export * from './schemas.js';
