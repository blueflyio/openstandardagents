/**
 * OSSA Import Command
 * Import platform-specific agent format to OSSA manifest
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { GenerationService } from '../../services/generation.service.js';
import { handleCommandError } from '../utils/index.js';
import {
  addGlobalOptions,
  addMutationOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';

export const importCommand = new Command('import')
  .argument('<path>', 'Path to platform-specific agent file')
  .option(
    '-f, --from <platform>',
    'Source platform (cursor,openai,crewai,langchain,etc)',
    'cursor'
  )
  .description('Import platform-specific agent format to OSSA manifest');

// Apply production-grade standard options
addGlobalOptions(importCommand);
addMutationOptions(importCommand);

importCommand.action(
    async (
      filePath: string,
      options?: {
        from?: string;
        output?: string;
        verbose?: boolean;
        quiet?: boolean;
        dryRun?: boolean;
        color?: boolean;
        json?: boolean;
      }
    ) => {
      try {
        const useColor = shouldUseColor(options || {});
        const log = (msg: string, color?: (s: string) => string) => {
          if (options?.quiet) return;
          const output = useColor && color ? color(msg) : msg;
          console.log(output);
        };

        const manifestRepo = container.get(ManifestRepository);
        const generationService = container.get(GenerationService);

        const platformData = await manifestRepo.load(filePath);
        const platform = options?.from || 'cursor';

        log(`Importing ${platform} agent to OSSA format...`, chalk.blue);

        if (options?.dryRun) {
          log('🔍 DRY RUN MODE - No files will be written', chalk.yellow);
        }

        const ossaManifest = await generationService.importFromPlatform(
          platformData as Record<string, unknown>,
          platform as
            | 'cursor'
            | 'openai'
            | 'anthropic'
            | 'langchain'
            | 'crewai'
            | 'autogen'
            | 'langflow'
            | 'langgraph'
            | 'llamaindex'
            | 'vercel-ai'
        );

        const outputPath = options?.output || 'agent.ossa.json';

        if (!options?.dryRun) {
          fs.writeFileSync(outputPath, JSON.stringify(ossaManifest, null, 2));
        }

        if (options?.dryRun) {
          log(`Would write to: ${outputPath}`, chalk.blue);
        } else {
          log(`✓ Imported to OSSA manifest: ${outputPath}`, chalk.green);
        }

        if (options?.verbose) {
          const name = ossaManifest.metadata?.name || ossaManifest.agent?.id;
          const version = ossaManifest.metadata?.version || ossaManifest.agent?.version;
          log(`  Name: ${name}`, chalk.gray);
          log(`  Version: ${version}`, chalk.gray);
        }

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
