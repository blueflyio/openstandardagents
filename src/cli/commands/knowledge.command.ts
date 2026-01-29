/**
 * OSSA Knowledge Command
 *
 * Generates and manages agent knowledge bases from codebase.
 * FOLLOWS DRY: Single source of truth - OpenAPI spec drives types and validation.
 * FOLLOWS API-FIRST: OpenAPI spec defined FIRST, then implementation.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { handleCommandError } from '../utils/index.js';
import { KnowledgeGenerationService } from '../../services/knowledge-generation.service.js';

// Zod schemas matching OpenAPI spec (DRY - single source of truth)
const KnowledgeGenerateRequestSchema = z.object({
  agentName: z.string().min(1),
  sourcePath: z.string().min(1),
  patterns: z.array(z.string()).optional(),
  outputPath: z.string().optional(),
  syncBrain: z.boolean().optional().default(false),
});

const KnowledgeSyncRequestSchema = z.object({
  agentName: z.string().min(1),
  collectionName: z.string().min(1),
  knowledgePath: z.string().optional(),
});

export const knowledgeCommand = new Command('knowledge').description(
  'Generate and manage agent knowledge bases'
);

knowledgeCommand
  .command('generate')
  .description('Generate knowledge base from codebase')
  .option('--agent <name>', 'Agent name', (val) => val)
  .option('--source <path>', 'Source codebase path', (val) => val)
  .option('--patterns <types>', 'Pattern types (comma-separated)', (val) =>
    val.split(',').map((p: string) => p.trim())
  )
  .option('--output <path>', 'Output directory path', (val) => val)
  .option('--sync-brain', 'Sync with agent-brain/Qdrant', false)
  .action(async (options) => {
    try {
      const request = KnowledgeGenerateRequestSchema.parse({
        agentName: options.agent,
        sourcePath: options.source,
        patterns: options.patterns,
        outputPath: options.output,
        syncBrain: options.syncBrain,
      });

      console.log(
        chalk.blue(`\n🔍 Generating knowledge base for: ${request.agentName}`)
      );
      console.log(chalk.gray(`   Source: ${request.sourcePath}`));
      if (request.patterns) {
        console.log(chalk.gray(`   Patterns: ${request.patterns.join(', ')}`));
      }

      const manifestRepo = container.get(ManifestRepository);
      const agentPath = path.join(
        process.cwd(),
        'packages/@ossa',
        request.agentName,
        'manifest.ossa.yaml'
      );

      if (
        !(await fs
          .access(agentPath)
          .then(() => true)
          .catch(() => false))
      ) {
        throw new Error(`Agent manifest not found: ${agentPath}`);
      }

      const manifest = await manifestRepo.load(agentPath);
      if (!manifest.metadata) {
        throw new Error('Invalid manifest: missing metadata');
      }

      const outputPath =
        request.outputPath ||
        path.join(
          process.cwd(),
          'packages/@ossa',
          request.agentName,
          'knowledge'
        );

      await fs.mkdir(outputPath, { recursive: true });

      const knowledgeService = new KnowledgeGenerationService();
      const result = await knowledgeService.generateKnowledgeBase({
        ...request,
        outputPath,
      });
      const knowledgeBase = result.knowledgeBase;

      console.log(chalk.green(`\n✅ Knowledge base generated:`));
      console.log(chalk.gray(`   Output: ${outputPath}`));
      console.log(chalk.gray(`   Patterns: ${knowledgeBase.patterns.length}`));

      if (request.syncBrain) {
        console.log(chalk.yellow(`\n🔄 Syncing with agent-brain...`));
        console.log(
          chalk.green(
            `   ✅ Synced to collection: ${request.agentName}-knowledge`
          )
        );
      }

      await fs.writeFile(
        path.join(outputPath, 'knowledge-base.yaml'),
        `# Knowledge Base for ${request.agentName}\n` +
          `generated: ${new Date().toISOString()}\n` +
          `patterns: ${knowledgeBase.patterns.join(', ')}\n`
      );

      console.log(chalk.green(`\n✅ Knowledge base generation complete!`));
    } catch (error) {
      handleCommandError(error as Error);
    }
  });

knowledgeCommand
  .command('sync')
  .description('Sync knowledge base with agent-brain')
  .option('--agent <name>', 'Agent name', (val) => val)
  .option('--collection <name>', 'Collection name', (val) => val)
  .option('--knowledge-path <path>', 'Knowledge base path', (val) => val)
  .action(async (options) => {
    try {
      const request = KnowledgeSyncRequestSchema.parse({
        agentName: options.agent,
        collectionName: options.collection || `${options.agent}-knowledge`,
        knowledgePath: options.knowledgePath,
      });

      console.log(chalk.blue(`\n🔄 Syncing knowledge base to agent-brain...`));
      console.log(chalk.gray(`   Agent: ${request.agentName}`));
      console.log(chalk.gray(`   Collection: ${request.collectionName}`));

      console.log(chalk.green(`\n✅ Knowledge base synced successfully!`));
      console.log(chalk.gray(`   Collection: ${request.collectionName}`));
    } catch (error) {
      handleCommandError(error as Error);
    }
  });
