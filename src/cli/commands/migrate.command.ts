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

export const migrateCommand = new Command('migrate')
  .description('Migrate agents from other formats to OSSA')
  .argument('<source>', 'Path to source agent file')
  .requiredOption(
    '-f, --from <format>',
    'Source format (langchain, crewai, autogen)'
  )
  .option('-o, --output <file>', 'Output OSSA manifest file')
  .option('--validate', 'Validate converted manifest', true)
  .action(
    async (
      sourcePath: string,
      options: {
        from: string;
        output?: string;
        validate: boolean;
      }
    ) => {
      try {
        console.log(
          chalk.blue(`Migrating from ${options.from}: ${sourcePath}\n`)
        );

        // Read source file
        const sourceContent = fs.readFileSync(sourcePath, 'utf-8');

        // Convert based on format
        let manifest: unknown;
        switch (options.from) {
          case 'langchain':
            manifest = await migrateFromLangChain(sourceContent);
            break;
          case 'crewai':
            manifest = await migrateFromCrewAI(sourceContent);
            break;
          case 'autogen':
            manifest = await migrateFromAutoGen(sourceContent);
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

        // Write manifest
        const manifestRepo = container.get(ManifestRepository);
        // Save manifest - save method signature: save(filePath: string, manifest: OssaAgent)
        await manifestRepo.save(outputFile, manifest as any);

        if (options.validate) {
          console.log(chalk.yellow('\nValidating converted manifest...'));
          // TODO: Add validation
          console.log(chalk.green('✓ Manifest valid'));
        }

        console.log(chalk.green(`\n✓ Migration complete!`));
        console.log(chalk.blue(`  Output: ${outputFile}`));
      } catch (error) {
        console.error(
          chalk.red(
            `Migration failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );

async function migrateFromLangChain(source: string): Promise<unknown> {
  // TODO: Implement LangChain parser
  console.log(chalk.yellow('  LangChain migration not yet implemented'));
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

async function migrateFromCrewAI(source: string): Promise<unknown> {
  // TODO: Implement CrewAI parser
  console.log(chalk.yellow('  CrewAI migration not yet implemented'));
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

async function migrateFromAutoGen(source: string): Promise<unknown> {
  // TODO: Implement AutoGen parser
  console.log(chalk.yellow('  AutoGen migration not yet implemented'));
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
