/**
 * OSSA Knowledge Query Command
 * Query agent knowledge base with semantic search
 *
 * SOLID Principles:
 * - Single Responsibility: Only queries knowledge bases
 * - Uses shared output utilities (DRY)
 */

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { KnowledgeService } from '../../services/knowledge.service.js';
import { isJSONOutput, outputJSON } from '../utils/index.js';
import * as path from 'path';

export const knowledgeQueryCommand = new Command('query')
  .argument('<query>', 'Search query')
  .option('-i, --index <path>', 'Path to knowledge.json index file')
  .option(
    '-k, --knowledge <path>',
    'Path to knowledge directory (will look for knowledge.json inside)'
  )
  .option('-l, --limit <number>', 'Maximum number of results', '10')
  .option('-t, --threshold <number>', 'Minimum similarity score (0-1)', '0.5')
  .option('--no-excerpts', 'Do not include text excerpts in results')
  .option('--output <format>', 'Output format (json|text)', 'text')
  .option('-v, --verbose', 'Verbose output with full document content')
  .description('Query agent knowledge base with semantic search')
  .action(
    async (
      query: string,
      options: {
        index?: string;
        knowledge?: string;
        limit?: string;
        threshold?: string;
        excerpts?: boolean;
        output?: string;
        verbose?: boolean;
      }
    ) => {
      const spinner = ora();

      try {
        let indexPath: string;

        if (options.index) {
          indexPath = path.resolve(options.index);
        } else if (options.knowledge) {
          indexPath = path.resolve(options.knowledge, 'knowledge.json');
        } else {
          throw new Error('Either --index or --knowledge must be specified');
        }

        if (!isJSONOutput(options)) {
          console.log(chalk.blue(`Querying knowledge base: ${indexPath}`));
          console.log(chalk.gray(`Query: "${query}"`));
          console.log();
        }

        const knowledgeService = new KnowledgeService();

        if (!isJSONOutput(options)) {
          spinner.start('Searching...');
        }

        const results = await knowledgeService.query(indexPath, query, {
          limit: parseInt(options.limit || '10', 10),
          threshold: parseFloat(options.threshold || '0.5'),
          includeExcerpts: options.excerpts !== false,
        });

        if (!isJSONOutput(options)) {
          spinner.succeed(`Found ${results.length} results`);
        }

        if (isJSONOutput(options)) {
          outputJSON({
            success: true,
            query,
            totalResults: results.length,
            results: results.map((result) => ({
              id: result.document.id,
              fileName: result.document.metadata.fileName,
              filePath: result.document.filePath,
              score: result.score,
              excerpt: result.excerpt,
              content: options.verbose ? result.document.content : undefined,
            })),
          });
        } else {
          if (results.length === 0) {
            console.log();
            console.log(chalk.yellow('No results found matching your query.'));
            console.log(
              chalk.gray(
                'Try lowering the threshold or using different search terms.'
              )
            );
          } else {
            console.log();
            console.log(chalk.bold(`Top ${results.length} Results:`));
            console.log();

            results.forEach((result, index) => {
              const score = (result.score * 100).toFixed(1);
              console.log(
                chalk.bold(
                  `${index + 1}. ${result.document.metadata.fileName}`
                ) + chalk.gray(` (score: ${score}%)`)
              );
              console.log(chalk.gray(`   Path: ${result.document.filePath}`));

              if (result.excerpt) {
                console.log(`   ${result.excerpt.trim()}`);
              }

              if (options.verbose) {
                console.log();
                console.log(chalk.dim('   --- Full Content ---'));
                console.log(
                  chalk.dim(result.document.content.substring(0, 500))
                );
                if (result.document.content.length > 500) {
                  console.log(chalk.dim('   ...'));
                }
              }

              console.log();
            });
          }
        }

        process.exit(0);
      } catch (error) {
        if (!isJSONOutput(options)) {
          spinner.fail('Query failed');
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
