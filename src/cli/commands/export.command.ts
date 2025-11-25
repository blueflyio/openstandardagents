/**
 * OSSA Export Command
 * Export OSSA agent manifest to platform-specific formats
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { GenerationService } from '../../services/generation.service.js';
import type { OssaAgent } from '../../types/index.js';

export const exportCommand = new Command('export')
  .argument('<path>', 'Path to OSSA manifest')
  .option(
    '-t, --to <platform>',
    'Target platform (cursor,openai,crewai,langchain,langflow,anthropic,vercel,llamaindex,langgraph,autogen)',
    'cursor'
  )
  .option('-o, --output <path>', 'Output file path')
  .option('--all', 'Export to all supported platforms')
  .description('Export OSSA agent manifest to platform-specific format')
  .action(
    async (
      manifestPath: string,
      options?: { to?: string; output?: string; all?: boolean }
    ) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const generationService = container.get(GenerationService);

        const manifest = await manifestRepo.load(manifestPath);
        const platforms = options?.all
          ? [
              'cursor',
              'openai',
              'crewai',
              'langchain',
              'langflow',
              'anthropic',
              'vercel',
              'llamaindex',
              'langgraph',
              'autogen',
            ]
          : [options?.to || 'cursor'];

        console.log(chalk.blue(`Exporting agent to: ${platforms.join(', ')}`));

        for (const platform of platforms) {
          try {
            const exported = await generationService.exportToPlatform(
              manifest as OssaAgent,
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
            const outputPath = options?.output || `${platform}-agent.json`;
            const finalPath =
              platforms.length > 1 ? `${platform}-${outputPath}` : outputPath;

            fs.writeFileSync(finalPath, JSON.stringify(exported, null, 2));
            console.log(chalk.green(`✓ Exported to ${platform}: ${finalPath}`));
          } catch (error) {
            console.error(
              chalk.red(`✗ Failed to export to ${platform}:`),
              error instanceof Error ? error.message : String(error)
            );
          }
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
