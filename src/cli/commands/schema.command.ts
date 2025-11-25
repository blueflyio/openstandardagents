/**
 * OSSA Schema Command
 * View and explore the OSSA schema
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import { container } from '../../di-container.js';
import { SchemaRepository } from '../../repositories/schema.repository.js';

// __dirname not used in this file

export const schemaCommand = new Command('schema')
  .option(
    '-v, --version <version>',
    'Schema version (0.2.2, 0.2.3, 1.0)',
    '0.2.3'
  )
  .option(
    '-p, --path <path>',
    'Show schema for specific path (e.g., definitions.Metadata)'
  )
  .option('-j, --json', 'Output raw JSON schema')
  .option('-o, --output <file>', 'Save schema to file')
  .description('View and explore the OSSA schema')
  .action(
    async (options?: {
      version?: string;
      path?: string;
      json?: boolean;
      output?: string;
    }) => {
      try {
        const schemaRepo = container.get(SchemaRepository);
        const version = options?.version || schemaRepo.getCurrentVersion();

        const schema = await schemaRepo.getSchema(version);

        if (options?.output) {
          fs.writeFileSync(options.output, JSON.stringify(schema, null, 2));
          console.log(chalk.green(`✓ Schema saved to: ${options.output}`));
          process.exit(0);
        }

        if (options?.json) {
          console.log(JSON.stringify(schema, null, 2));
          process.exit(0);
        }

        if (options?.path) {
          const parts = options.path.split('.');
          let current: unknown = schema;
          for (const part of parts) {
            current = current[part];
            if (!current) {
              console.error(chalk.red(`Path not found: ${options.path}`));
              process.exit(1);
            }
          }
          console.log(JSON.stringify(current, null, 2));
          process.exit(0);
        }

        console.log(chalk.blue(`OSSA Schema v${version}`));
        console.log(chalk.gray(`Title: ${schema.title || 'N/A'}`));
        console.log(chalk.gray(`Description: ${schema.description || 'N/A'}`));
        console.log(
          chalk.gray(
            `\nDefinitions: ${Object.keys(schema.definitions || {}).length}`
          )
        );

        if (schema.definitions) {
          console.log(chalk.cyan('\nAvailable definitions:'));
          Object.keys(schema.definitions).forEach((def) => {
            console.log(chalk.gray(`  - ${def}`));
          });
        }

        const schemaProps = schema.properties as Record<string, unknown>;
        const extensions = schemaProps?.extensions?.properties;
        if (extensions) {
          console.log(chalk.cyan('\nSupported platform extensions:'));
          Object.keys(extensions).forEach((ext) => {
            console.log(chalk.gray(`  - ${ext}`));
          });
        }

        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    }
  );
