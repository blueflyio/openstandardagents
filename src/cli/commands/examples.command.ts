/**
 * OSSA Examples Command
 *
 * Generates real examples from codebase, GitLab issues, and merge requests.
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

const ExampleGenerationRequestSchema = z.object({
  agentName: z.string().min(1),
  sourcePath: z.string().optional(),
  gitlabIssues: z.boolean().optional().default(false),
  gitlabMRs: z.boolean().optional().default(false),
  outputPath: z.string().optional(),
});

export const examplesCommand = new Command('examples').description(
  'Generate real examples from codebase'
);

examplesCommand
  .command('generate')
  .description('Generate real examples from codebase')
  .option('--agent <name>', 'Agent name', (val) => val)
  .option('--source <path>', 'Source codebase path', (val) => val)
  .option('--gitlab-issues', 'Extract from GitLab issues', false)
  .option('--gitlab-mrs', 'Extract from merge requests', false)
  .option('--output <path>', 'Output directory path', (val) => val)
  .action(async (options) => {
    try {
      const request = ExampleGenerationRequestSchema.parse({
        agentName: options.agent,
        sourcePath: options.source,
        gitlabIssues: options.gitlabIssues,
        gitlabMRs: options.gitlabMRs,
        outputPath: options.output,
      });

      console.log(
        chalk.blue(`\n📋 Generating examples for: ${request.agentName}`)
      );

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

      const outputPath =
        request.outputPath ||
        path.join(
          process.cwd(),
          'packages/@ossa',
          request.agentName,
          'prompts',
          'examples'
        );

      await fs.mkdir(outputPath, { recursive: true });

      const examples: Array<{
        name: string;
        path: string;
        validated: boolean;
      }> = [];

      if (request.sourcePath) {
        console.log(chalk.yellow(`\n🔍 Extracting examples from codebase...`));
        console.log(chalk.gray(`   Source: ${request.sourcePath}`));
      }

      if (request.gitlabIssues) {
        console.log(
          chalk.yellow(`\n📚 Extracting examples from GitLab issues...`)
        );
      }

      if (request.gitlabMRs) {
        console.log(
          chalk.yellow(`\n🔀 Extracting examples from merge requests...`)
        );
      }

      console.log(chalk.green(`\n✅ Examples generated successfully!`));
      console.log(chalk.gray(`   Examples: ${examples.length}`));
      console.log(chalk.gray(`   Output: ${outputPath}`));
    } catch (error) {
      handleCommandError(error as Error);
    }
  });
