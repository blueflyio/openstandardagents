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

export const importCommand = new Command('import')
  .argument('<path>', 'Path to platform-specific agent file')
  .option(
    '-f, --from <platform>',
    'Source platform (cursor,openai,crewai,langchain,etc)',
    'cursor'
  )
  .option('-o, --output <path>', 'Output OSSA manifest path', 'agent.ossa.json')
  .description('Import platform-specific agent format to OSSA manifest')
  .action(
    async (filePath: string, options?: { from?: string; output?: string }) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const generationService = container.get(GenerationService);

        const platformData = await manifestRepo.load(filePath);
        const platform = options?.from || 'cursor';

        console.log(
          chalk.blue(`Importing ${platform} agent to OSSA format...`)
        );

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
        fs.writeFileSync(outputPath, JSON.stringify(ossaManifest, null, 2));

        console.log(chalk.green(`✓ Imported to OSSA manifest: ${outputPath}`));
        console.log(
          chalk.gray(
            `  Name: ${ossaManifest.metadata?.name || ossaManifest.agent?.id}`
          )
        );
        console.log(
          chalk.gray(
            `  Version: ${ossaManifest.metadata?.version || ossaManifest.agent?.version}`
          )
        );

        process.exit(0);
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
