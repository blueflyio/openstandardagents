/**
 * OSSA Knowledge Index Command
 * Index agent knowledge base for semantic search
 *
 * SOLID Principles:
 * - Single Responsibility: Only indexes knowledge bases
 * - Uses shared output utilities (DRY)
 */

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { KnowledgeService } from '../../services/knowledge.service.js';
import { isJSONOutput, outputJSON } from '../utils/index.js';
import * as path from 'path';

export const knowledgeIndexCommand = new Command('index')
  .argument('<path>', 'Path to agent knowledge directory')
  .option('-a, --agent <name>', 'Agent name for the knowledge base')
  .option(
    '-o, --output <path>',
    'Output path for knowledge.json (default: <path>/knowledge.json)'
  )
  .option(
    '--incremental',
    'Incremental update (only reindex changed files)',
    false
  )
  .option('--output-format <format>', 'Output format (json|text)', 'text')
  .option('-v, --verbose', 'Verbose output with detailed information')
  .description('Index agent knowledge base for semantic search')
  .action(
    async (
      knowledgePath: string,
      options: {
        agent?: string;
        output?: string;
        incremental?: boolean;
        outputFormat?: string;
        verbose?: boolean;
      }
    ) => {
      const spinner = ora();

      try {
        const resolvedPath = path.resolve(knowledgePath);
        const agentName = options.agent || path.basename(resolvedPath);

        if (!isJSONOutput(options)) {
          console.log(chalk.blue(`Indexing knowledge base: ${resolvedPath}`));
          console.log(chalk.gray(`Agent: ${agentName}`));
          if (options.incremental) {
            console.log(chalk.gray('Mode: Incremental (only changed files)'));
          }
          console.log();
        }

        const knowledgeService = new KnowledgeService();

        if (!isJSONOutput(options)) {
          spinner.start('Scanning and indexing files...');
        }

        const index = await knowledgeService.indexKnowledge(
          resolvedPath,
          agentName,
          {
            incremental: options.incremental,
            outputPath: options.output,
          }
        );

        if (!isJSONOutput(options)) {
          spinner.succeed('Indexing complete');
        }

        if (isJSONOutput(options)) {
          outputJSON({
            success: true,
            index: {
              version: index.version,
              agentName: index.agentName,
              totalDocuments: index.metadata.totalDocuments,
              totalSize: index.metadata.totalSize,
              lastIndexed: index.metadata.lastIndexed,
              indexPath: index.metadata.indexPath,
            },
            documents: index.documents.map((doc) => ({
              id: doc.id,
              fileName: doc.metadata.fileName,
              fileType: doc.metadata.fileType,
              size: doc.metadata.size,
              hash: doc.metadata.hash,
            })),
          });
        } else {
          console.log();
          console.log(chalk.green('Knowledge base indexed successfully'));
          console.log();
          console.log(chalk.bold('Index Statistics:'));
          console.log(`  Documents:    ${index.metadata.totalDocuments}`);
          console.log(
            `  Total Size:   ${formatBytes(index.metadata.totalSize)}`
          );
          console.log(`  Index Path:   ${index.metadata.indexPath}`);
          console.log(
            `  Last Indexed: ${index.metadata.lastIndexed.toISOString()}`
          );

          if (options.verbose && index.documents.length > 0) {
            console.log();
            console.log(chalk.bold('Indexed Documents:'));
            for (const doc of index.documents) {
              console.log(
                `  - ${doc.metadata.fileName} (${formatBytes(doc.metadata.size)})`
              );
            }
          }
        }

        process.exit(0);
      } catch (error) {
        if (!isJSONOutput(options)) {
          spinner.fail('Indexing failed');
        }

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (isJSONOutput(options)) {
          outputJSON({
            success: false,
            error: errorMessage,
          });
        } else {
          console.error(chalk.red('\nError:'), errorMessage);
        }

        process.exit(1);
      }
    }
  );

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
