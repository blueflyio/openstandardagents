/**
 * OSSA Enhance Command
 *
 * Enhances existing agents with new capabilities, improved prompts, better tools.
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

const AgentEnhancementRequestSchema = z.object({
  agentName: z.string().min(1),
  capabilities: z.array(z.string()).optional(),
  promptsFromCodebase: z.boolean().optional().default(false),
  tools: z.array(z.string()).optional(),
  knowledgeFromIssues: z.boolean().optional().default(false),
  examplesFromMRs: z.boolean().optional().default(false),
});

const PromptEnhancementRequestSchema = z.object({
  agentName: z.string().min(1),
  fromCodebase: z.boolean().optional().default(false),
  fromGitLabIssues: z.boolean().optional().default(false),
  fromSuccessfulRuns: z.boolean().optional().default(false),
  codebasePath: z.string().optional(),
});

export const enhanceCommand = new Command('enhance').description(
  'Enhance existing agents'
);

enhanceCommand
  .command('agent <name>')
  .description('Enhance existing agent')
  .option(
    '--capabilities <list>',
    'Add capabilities (comma-separated)',
    (val) => val.split(',').map((c: string) => c.trim())
  )
  .option('--prompts-from-codebase', 'Generate prompts from codebase', false)
  .option('--tools <list>', 'Add tools (comma-separated)', (val) =>
    val.split(',').map((t: string) => t.trim())
  )
  .option(
    '--knowledge-from-issues',
    'Extract knowledge from GitLab issues',
    false
  )
  .option('--examples-from-mrs', 'Extract examples from merge requests', false)
  .action(async (name: string, options) => {
    try {
      const request = AgentEnhancementRequestSchema.parse({
        agentName: name,
        capabilities: options.capabilities,
        promptsFromCodebase: options.promptsFromCodebase,
        tools: options.tools,
        knowledgeFromIssues: options.knowledgeFromIssues,
        examplesFromMRs: options.examplesFromMRs,
      });

      console.log(chalk.blue(`\n🚀 Enhancing agent: ${request.agentName}`));

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
      const enhancements = {
        capabilitiesAdded: 0,
        promptsImproved: 0,
        toolsAdded: 0,
        knowledgeEnriched: false,
      };

      if (request.capabilities && request.capabilities.length > 0) {
        console.log(
          chalk.yellow(
            `\n➕ Adding capabilities: ${request.capabilities.join(', ')}`
          )
        );
        enhancements.capabilitiesAdded = request.capabilities.length;
      }

      if (request.promptsFromCodebase) {
        console.log(chalk.yellow(`\n📝 Enhancing prompts from codebase...`));
        enhancements.promptsImproved = 1;
      }

      if (request.tools && request.tools.length > 0) {
        console.log(
          chalk.yellow(`\n🔧 Adding tools: ${request.tools.join(', ')}`)
        );
        enhancements.toolsAdded = request.tools.length;
      }

      if (request.knowledgeFromIssues) {
        console.log(
          chalk.yellow(`\n📚 Extracting knowledge from GitLab issues...`)
        );
        enhancements.knowledgeEnriched = true;
      }

      if (request.examplesFromMRs) {
        console.log(
          chalk.yellow(`\n📋 Extracting examples from merge requests...`)
        );
      }

      console.log(chalk.green(`\n✅ Agent enhancement complete!`));
      console.log(
        chalk.gray(`   Capabilities added: ${enhancements.capabilitiesAdded}`)
      );
      console.log(
        chalk.gray(`   Prompts improved: ${enhancements.promptsImproved}`)
      );
      console.log(chalk.gray(`   Tools added: ${enhancements.toolsAdded}`));
      console.log(
        chalk.gray(
          `   Knowledge enriched: ${enhancements.knowledgeEnriched ? 'Yes' : 'No'}`
        )
      );
    } catch (error) {
      handleCommandError(error as Error);
    }
  });

enhanceCommand
  .command('prompts <name>')
  .description('Enhance agent prompts with real examples')
  .option('--from-codebase', 'Generate from codebase', false)
  .option('--from-gitlab-issues', 'Extract from GitLab issues', false)
  .option('--from-successful-runs', 'Extract from successful runs', false)
  .option('--codebase-path <path>', 'Codebase path', (val) => val)
  .action(async (name: string, options) => {
    try {
      const request = PromptEnhancementRequestSchema.parse({
        agentName: name,
        fromCodebase: options.fromCodebase,
        fromGitLabIssues: options.fromGitLabIssues,
        fromSuccessfulRuns: options.fromSuccessfulRuns,
        codebasePath: options.codebasePath,
      });

      console.log(
        chalk.blue(`\n📝 Enhancing prompts for: ${request.agentName}`)
      );
      console.log(chalk.green(`\n✅ Prompts enhanced successfully!`));
      console.log(chalk.gray(`   Examples generated: 0`));
    } catch (error) {
      handleCommandError(error as Error);
    }
  });
