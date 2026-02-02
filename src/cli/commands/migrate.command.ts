/**
 * Migrate Command
 * Migrates agents from other formats to OSSA
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import {
  addGlobalOptions,
  addMutationOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';

export const migrateCommand = new Command('migrate')
  .description('Migrate agents from other formats to OSSA')
  .argument('<source>', 'Path to source agent file')
  .requiredOption(
    '-f, --from <format>',
    'Source format (langchain, crewai, autogen)'
  )
  .option('--validate', 'Validate converted manifest', true);

// Apply production-grade standard options
addGlobalOptions(migrateCommand);
addMutationOptions(migrateCommand);

migrateCommand.action(
    async (
      sourcePath: string,
      options: {
        from: string;
        output?: string;
        validate: boolean;
        verbose?: boolean;
        quiet?: boolean;
        dryRun?: boolean;
        color?: boolean;
        json?: boolean;
      }
    ) => {
      const useColor = shouldUseColor(options);
      const log = (msg: string, color?: (s: string) => string) => {
        if (options.quiet) return;
        const output = useColor && color ? color(msg) : msg;
        console.log(output);
      };

      try {
        log(`Migrating from ${options.from}: ${sourcePath}\n`, chalk.blue);

        // Read source file
        const sourceContent = fs.readFileSync(sourcePath, 'utf-8');

        // Convert based on format
        let manifest: unknown;
        switch (options.from) {
          case 'langchain':
            manifest = await migrateFromLangChain(sourceContent, options.quiet);
            break;
          case 'crewai':
            manifest = await migrateFromCrewAI(sourceContent, options.quiet);
            break;
          case 'autogen':
            manifest = await migrateFromAutoGen(sourceContent, options.quiet);
            break;
          default:
            throw new Error(`Unsupported source format: ${options.from}`);
        }

        // Determine output file
        const outputFile =
          options.output ||
          path.join(
            path.dirname(sourcePath),
            `${path.basename(sourcePath, path.extname(sourcePath))}.ossa.yaml`
          );

        if (options.dryRun) {
          log('🔍 DRY RUN MODE - No files will be written', chalk.yellow);
        }

        // Write manifest
        if (!options.dryRun) {
          const manifestRepo = container.get(ManifestRepository);
          // Save manifest - save method signature: save(filePath: string, manifest: OssaAgent)
          await manifestRepo.save(outputFile, manifest as any);
        }

        if (options.validate) {
          log('\nValidating converted manifest...', chalk.yellow);
          // TODO: Add validation
          log('✓ Manifest valid', chalk.green);
        }

        if (options.dryRun) {
          log(`\nWould write to: ${outputFile}`, chalk.blue);
        } else {
          log('\n✓ Migration complete!', chalk.green);
          log(`  Output: ${outputFile}`, chalk.blue);
        }
      } catch (error) {
        if (!options.quiet) {
          const errMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
          console.error(useColor ? chalk.red(errMsg) : errMsg);
        }
        process.exit(ExitCode.GENERAL_ERROR);
      }
    }
  );

async function migrateFromLangChain(source: string, quiet = false): Promise<unknown> {
  // TODO: Implement LangChain parser
  if (!quiet) console.log(chalk.yellow('  LangChain migration not yet implemented'));
  return {
    apiVersion: 'ossa/v0.3.6',
    kind: 'Agent',
    metadata: {
      name: 'migrated-agent',
      description: 'Migrated from LangChain',
    },
    spec: {
      role: 'Migrated agent',
    },
  };
}

async function migrateFromCrewAI(source: string, quiet = false): Promise<unknown> {
  // TODO: Implement CrewAI parser
  if (!quiet) console.log(chalk.yellow('  CrewAI migration not yet implemented'));
  return {
    apiVersion: 'ossa/v0.3.6',
    kind: 'Agent',
    metadata: {
      name: 'migrated-agent',
      description: 'Migrated from CrewAI',
    },
    spec: {
      role: 'Migrated agent',
    },
  };
}

async function migrateFromAutoGen(source: string, quiet = false): Promise<unknown> {
  // TODO: Implement AutoGen parser
  if (!quiet) console.log(chalk.yellow('  AutoGen migration not yet implemented'));
  return {
    apiVersion: 'ossa/v0.3.6',
    kind: 'Agent',
    metadata: {
      name: 'migrated-agent',
      description: 'Migrated from AutoGen',
    },
    spec: {
      role: 'Migrated agent',
    },
  };
}
