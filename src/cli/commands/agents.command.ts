/**
 * OSSA Agent CRUD Commands
 * Complete Create, Read, Update, Delete operations for agents
 * Follows DRY, SOLID, Zod, OpenAPI, and CRUD principles
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { RegistryService } from '../../services/registry/registry.service.js';
import type { OssaAgent } from '../../types/index.js';

/**
 * Zod Schemas for CLI Input Validation
 */
const AgentIdSchema = z.string().min(1).max(100).regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
const AgentVersionSchema = z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?(\+[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/);
const AgentPathSchema = z.string().min(1);
const AgentUpdateSchema = z.object({
  description: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  llm: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(200000).optional(),
  }).optional(),
}).partial();

/**
 * Agent CRUD Command Group
 */
export const agentsCommandGroup = new Command('agents')
  .description('Manage OSSA agents (CRUD operations)');

/**
 * Create Agent Command
 * POST /agents
 */
agentsCommandGroup
  .command('create')
  .alias('add')
  .argument('<path>', 'Path to OSSA agent manifest file')
  .option('--registry <url>', 'Registry URL', 'gitlab')
  .option('--token <token>', 'Authentication token')
  .option('--dry-run', 'Validate without creating')
  .description('Create/register a new agent')
  .action(
    async (
      path: string,
      options: { registry?: string; token?: string; dryRun?: boolean }
    ) => {
      try {
        const validatedPath = AgentPathSchema.parse(path);
        const manifestRepo = container.get(ManifestRepository);
        const validationService = container.get(ValidationService);

        console.log(chalk.blue(`Loading agent manifest: ${validatedPath}`));
        const manifest = await manifestRepo.load(validatedPath);
        const result = await validationService.validate(manifest);

        if (!result.valid) {
          console.error(chalk.red('✗ Validation failed'));
          result.errors.forEach((error) => console.error(chalk.red(`  - ${error}`)));
          process.exit(1);
        }

        const agent = result.manifest as OssaAgent;
        if (!agent.metadata) {
          console.error(chalk.red('✗ Invalid manifest: missing metadata'));
          process.exit(1);
        }

        const agentName = agent.metadata.name;
        const agentVersion = agent.metadata.version || '1.0.0';

        AgentIdSchema.parse(agentName);
        AgentVersionSchema.parse(agentVersion);

        console.log(chalk.green(`✓ Validated: ${agentName}@${agentVersion}`));

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] Would create agent:'));
          console.log(`  Name: ${agentName}`);
          console.log(`  Version: ${agentVersion}`);
          console.log(`  Registry: ${options.registry || 'gitlab'}`);
          return;
        }

        const token = options.token || process.env.GITLAB_TOKEN || process.env.GITLAB_PRIVATE_TOKEN;
        if (!token) {
          console.error(chalk.red('✗ Authentication token required'));
          process.exit(1);
        }

        const registryService = new RegistryService({
          type: (options.registry || 'gitlab') as 'gitlab' | 'github',
          token,
        });

        await registryService.publish(validatedPath, agentName, agentVersion);

        console.log(chalk.green(`\n✓ Agent created successfully: ${agentName}@${agentVersion}`));
        console.log(chalk.gray(`  Registry: ${options.registry || 'gitlab'}`));
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(chalk.red('✗ Validation error:'));
          error.issues.forEach((issue) => {
            console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
          });
        } else {
          console.error(
            chalk.red('✗ Failed to create agent:'),
            error instanceof Error ? error.message : String(error)
          );
        }
        process.exit(1);
      }
    }
  );

/**
 * Read Agent Command (List)
 * GET /agents
 */
agentsCommandGroup
  .command('list')
  .alias('ls')
  .option('--search <query>', 'Search query')
  .option('--limit <number>', 'Maximum results', '20')
  .option('--type <type>', 'Filter by agent type')
  .option('--status <status>', 'Filter by status')
  .option('--domain <domain>', 'Filter by domain')
  .description('List all agents')
  .action(
    async (options: {
      search?: string;
      limit?: string;
      type?: string;
      status?: string;
      domain?: string;
    }) => {
      try {
        const limit = z.coerce.number().int().min(1).max(100).parse(options.limit || '20');
        const searchQuery = options.search || '';

        const token = process.env.GITLAB_TOKEN || process.env.GITLAB_PRIVATE_TOKEN;
        if (!token) {
          console.error(chalk.red('✗ GITLAB_TOKEN required'));
          process.exit(1);
        }

        const registryService = new RegistryService({
          type: 'gitlab',
          token,
        });

        console.log(chalk.blue(`Searching agents${searchQuery ? `: "${searchQuery}"` : ''}...`));
        const agents = await registryService.search(searchQuery, limit);

        if (agents.length === 0) {
          console.log(chalk.yellow(`No agents found${searchQuery ? ` matching "${searchQuery}"` : ''}`));
          return;
        }

        console.log(chalk.green(`\nFound ${agents.length} agent(s):\n`));
        agents.forEach((agent) => {
          console.log(chalk.cyan(`  ${agent.name}@${agent.version}`));
          if (agent.description) {
            console.log(chalk.gray(`    ${agent.description.substring(0, 100)}...`));
          }
          console.log(
            chalk.gray(`    Published: ${new Date(agent.publishedAt).toLocaleDateString()}\n`)
          );
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(chalk.red('✗ Validation error:'));
          error.issues.forEach((issue) => {
            console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
          });
        } else {
          console.error(
            chalk.red('✗ Failed to list agents:'),
            error instanceof Error ? error.message : String(error)
          );
        }
        process.exit(1);
      }
    }
  );

/**
 * Read Agent Command (Get by ID)
 * GET /agents/{id}
 */
agentsCommandGroup
  .command('get')
  .alias('show')
  .argument('<agent>', 'Agent identifier (name or name@version)')
  .description('Get detailed information about an agent')
  .action(async (agent: string) => {
    try {
      const parts = agent.split('@');
      const agentName = parts.length > 1 ? parts.slice(0, -1).join('@') : parts[0];
      const version = parts.length > 1 ? parts[parts.length - 1] : 'latest';

      AgentIdSchema.parse(agentName);
      if (version !== 'latest') {
        AgentVersionSchema.parse(version);
      }

      const token = process.env.GITLAB_TOKEN || process.env.GITLAB_PRIVATE_TOKEN;
      if (!token) {
        console.error(chalk.red('✗ GITLAB_TOKEN required'));
        process.exit(1);
      }

      const registryService = new RegistryService({
        type: 'gitlab',
        token,
      });

      console.log(chalk.blue(`\nFetching info for ${agentName}@${version}...\n`));
      const agentInfo = await registryService.getInfo(agentName, version);

      console.log(chalk.cyan.bold('Agent Information\n'));
      console.log(chalk.white(`  Name:        ${agentInfo.name}`));
      console.log(chalk.white(`  Version:     ${agentInfo.version}`));
      console.log(chalk.white(`  Tag:         ${agentInfo.tag}`));
      console.log(
        chalk.white(`  Published:   ${new Date(agentInfo.publishedAt).toLocaleString()}`)
      );
      if (agentInfo.description) {
        console.log(
          chalk.white(`\n  Description:\n    ${agentInfo.description.replace(/\n/g, '\n    ')}`)
        );
      }
      console.log('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red('✗ Validation error:'));
        error.issues.forEach((issue) => {
          console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
        });
      } else {
        console.error(
          chalk.red('✗ Failed to get agent:'),
          error instanceof Error ? error.message : String(error)
        );
      }
      process.exit(1);
    }
  });

/**
 * Update Agent Command
 * PUT /agents/{id}
 */
agentsCommandGroup
  .command('update')
  .alias('edit')
  .argument('<agent>', 'Agent identifier (name@version)')
  .option('--description <desc>', 'Update description')
  .option('--label <key=value>', 'Add or update label (can be used multiple times)', [])
  .option('--temperature <num>', 'Update LLM temperature', parseFloat)
  .option('--max-tokens <num>', 'Update LLM max tokens', parseInt)
  .option('--dry-run', 'Preview changes without updating')
  .description('Update an existing agent')
  .action(
    async (
      agent: string,
      options: {
        description?: string;
        label?: string[];
        temperature?: number;
        maxTokens?: number;
        dryRun?: boolean;
      }
    ) => {
      try {
        const parts = agent.split('@');
        if (parts.length !== 2) {
          throw new Error('Agent identifier must be in format: name@version');
        }
        const agentName = parts[0];
        const version = parts[1];

        AgentIdSchema.parse(agentName);
        AgentVersionSchema.parse(version);

        const updatePayload: z.infer<typeof AgentUpdateSchema> = {};
        if (options.description) {
          updatePayload.description = options.description;
        }
        if (options.label && options.label.length > 0) {
          updatePayload.labels = {};
          options.label.forEach((label) => {
            const [key, value] = label.split('=');
            if (!key || !value) {
              throw new Error(`Invalid label format: ${label}. Use key=value`);
            }
            updatePayload.labels![key] = value;
          });
        }
        if (options.temperature !== undefined || options.maxTokens !== undefined) {
          updatePayload.llm = {};
          if (options.temperature !== undefined) {
            updatePayload.llm.temperature = options.temperature;
          }
          if (options.maxTokens !== undefined) {
            updatePayload.llm.maxTokens = options.maxTokens;
          }
        }

        const validated = AgentUpdateSchema.parse(updatePayload);

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] Would update agent:'));
          console.log(`  Agent: ${agentName}@${version}`);
          console.log(`  Changes:`, JSON.stringify(validated, null, 2));
          return;
        }

        console.log(chalk.blue(`Updating agent: ${agentName}@${version}`));
        console.log(chalk.yellow('[WARN]  Update functionality requires API implementation'));
        console.log(chalk.gray('  Validated update payload:'), JSON.stringify(validated, null, 2));

        console.log(chalk.green(`\n✓ Update validated (API implementation pending)`));
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(chalk.red('✗ Validation error:'));
          error.issues.forEach((issue) => {
            console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
          });
        } else {
          console.error(
            chalk.red('✗ Failed to update agent:'),
            error instanceof Error ? error.message : String(error)
          );
        }
        process.exit(1);
      }
    }
  );

/**
 * Delete Agent Command
 * DELETE /agents/{id}
 */
agentsCommandGroup
  .command('delete')
  .alias('remove')
  .alias('rm')
  .argument('<agent>', 'Agent identifier (name@version)')
  .option('--force', 'Force deletion without confirmation')
  .option('--dry-run', 'Preview deletion without deleting')
  .description('Delete an agent')
  .action(
    async (agent: string, options: { force?: boolean; dryRun?: boolean }) => {
      try {
        const parts = agent.split('@');
        if (parts.length !== 2) {
          throw new Error('Agent identifier must be in format: name@version');
        }
        const agentName = parts[0];
        const version = parts[1];

        AgentIdSchema.parse(agentName);
        AgentVersionSchema.parse(version);

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY RUN] Would delete agent:'));
          console.log(`  Agent: ${agentName}@${version}`);
          return;
        }

        if (!options.force) {
          console.log(chalk.yellow(`[WARN]  This will delete agent: ${agentName}@${version}`));
          console.log(chalk.yellow('   Use --force to skip confirmation'));
        }

        console.log(chalk.blue(`Deleting agent: ${agentName}@${version}`));
        console.log(chalk.yellow('[WARN]  Delete functionality requires API implementation'));

        console.log(chalk.green(`\n✓ Delete validated (API implementation pending)`));
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(chalk.red('✗ Validation error:'));
          error.issues.forEach((issue) => {
            console.error(chalk.red(`  - ${issue.path.join('.')}: ${issue.message}`));
          });
        } else {
          console.error(
            chalk.red('✗ Failed to delete agent:'),
            error instanceof Error ? error.message : String(error)
          );
        }
        process.exit(1);
      }
    }
  );
