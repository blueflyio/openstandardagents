/**
 * OSSA Taxonomy Commands
 * Query, validate, list, and recommend agent taxonomy
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { z } from 'zod';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import { discoverManifests } from '../utils/manifest-discovery.js';
import type { OssaAgent } from '../../types/index.js';

/**
 * Zod Schemas for CLI Input Validation
 */
const DomainSchema = z.enum([
  'security',
  'infrastructure',
  'documentation',
  'backend',
  'frontend',
  'data',
  'agents',
  'development',
  'content',
]);

const AgentTypeSchema = z.enum([
  'orchestrator',
  'worker',
  'planner',
  'reviewer',
  'critic',
  'judge',
  'monitor',
  'integrator',
  'voice',
  'trainer',
  'governor',
]);

const AgentPathSchema = z.string().min(1);

/**
 * Taxonomy Command Group
 */
export const taxonomyCommandGroup = new Command('taxonomy').description(
  'Query, validate, and recommend agent taxonomy'
);

/**
 * Query Taxonomy Command
 * Query agents by taxonomy criteria
 */
taxonomyCommandGroup
  .command('query')
  .option('--domain <domain>', 'Filter by domain', (val) => {
    DomainSchema.parse(val);
    return val;
  })
  .option('--subdomain <subdomain>', 'Filter by subdomain')
  .option('--type <type>', 'Filter by agent type', (val) => {
    AgentTypeSchema.parse(val);
    return val;
  })
  .option('--capability <capability>', 'Filter by capability')
  .option(
    '--concern <concern>',
    'Filter by concern (can be used multiple times)'
  )
  .option(
    '--maturity <maturity>',
    'Filter by maturity level (prototype, beta, stable, production)'
  )
  .option(
    '--deployment <pattern>',
    'Filter by deployment pattern (serverless, container, edge, hybrid)'
  )
  .option(
    '--integration <pattern>',
    'Filter by integration pattern (api-first, event-driven, batch, streaming)'
  )
  .option(
    '--cost <profile>',
    'Filter by cost profile (low, medium, high, enterprise)'
  )
  .option(
    '--performance <tier>',
    'Filter by performance tier (real-time, near-real-time, batch)'
  )
  .option('--workspace <path>', 'Workspace path to search', '.')
  .description(
    'Query agents by taxonomy criteria (supports multi-dimensional filtering)'
  )
  .action(
    async (options: {
      domain?: string;
      subdomain?: string;
      type?: string;
      capability?: string;
      concern?: string[];
      maturity?: string;
      deployment?: string;
      integration?: string;
      cost?: string;
      performance?: string;
      workspace?: string;
    }) => {
      try {
        console.log(chalk.blue('Querying agents by taxonomy...'));

        const discovered = await discoverManifests(options.workspace || '.');
        const manifestRepo = container.get(ManifestRepository);

        // Load all discovered manifests
        const manifests: OssaAgent[] = [];
        for (const item of discovered) {
          try {
            const manifest = await manifestRepo.load(item.path);
            manifests.push(manifest);
          } catch (error) {
            // Skip invalid manifests
            if (process.env.DEBUG) {
              console.warn(`Skipping invalid manifest: ${item.path}`);
            }
          }
        }

        const results = manifests.filter((manifest: OssaAgent) => {
          const taxonomy = (manifest.spec as Record<string, unknown>)
            ?.taxonomy as
            | {
                domain?: string;
                subdomain?: string;
                type?: string;
                capability?: string;
                concerns?: string[];
                maturity?: string;
                deployment_pattern?: string;
                integration_pattern?: string;
                cost_profile?: string;
                performance_tier?: string;
              }
            | undefined;

          if (!taxonomy) return false;

          if (options.domain && taxonomy.domain !== options.domain) {
            return false;
          }

          if (options.subdomain && taxonomy.subdomain !== options.subdomain) {
            return false;
          }

          if (options.type && taxonomy.type !== options.type) {
            return false;
          }

          if (
            options.capability &&
            taxonomy.capability !== options.capability
          ) {
            return false;
          }

          if (options.concern && options.concern.length > 0) {
            const concerns = taxonomy.concerns || [];
            const hasConcern = options.concern.some((c) =>
              concerns.includes(c)
            );
            if (!hasConcern) return false;
          }

          if (options.maturity && taxonomy.maturity !== options.maturity) {
            return false;
          }

          if (
            options.deployment &&
            taxonomy.deployment_pattern !== options.deployment
          ) {
            return false;
          }

          if (
            options.integration &&
            taxonomy.integration_pattern !== options.integration
          ) {
            return false;
          }

          if (options.cost && taxonomy.cost_profile !== options.cost) {
            return false;
          }

          if (
            options.performance &&
            taxonomy.performance_tier !== options.performance
          ) {
            return false;
          }

          return true;
        });

        if (results.length === 0) {
          console.log(chalk.yellow('No agents found matching criteria'));
          return;
        }

        console.log(chalk.green(`\nFound ${results.length} agent(s):\n`));

        results.forEach((manifest) => {
          const name = manifest.metadata?.name || 'unknown';
          const version = manifest.metadata?.version || '0.0.0';
          const taxonomy = (manifest.spec as Record<string, unknown>)
            ?.taxonomy as
            | {
                domain?: string;
                subdomain?: string;
                type?: string;
                capability?: string;
                concerns?: string[];
                maturity?: string;
                deployment_pattern?: string;
                integration_pattern?: string;
                cost_profile?: string;
                performance_tier?: string;
              }
            | undefined;

          console.log(chalk.bold(`${name}@${version}`));
          if (taxonomy) {
            console.log(`  Domain: ${taxonomy.domain || 'N/A'}`);
            if (taxonomy.subdomain) {
              console.log(`  Subdomain: ${taxonomy.subdomain}`);
            }
            if (taxonomy.type) {
              console.log(`  Type: ${taxonomy.type}`);
            }
            if (taxonomy.capability) {
              console.log(`  Capability: ${taxonomy.capability}`);
            }
            if (taxonomy.concerns && taxonomy.concerns.length > 0) {
              console.log(`  Concerns: ${taxonomy.concerns.join(', ')}`);
            }
            if (taxonomy.maturity) {
              console.log(`  Maturity: ${taxonomy.maturity}`);
            }
            if (taxonomy.deployment_pattern) {
              console.log(`  Deployment: ${taxonomy.deployment_pattern}`);
            }
            if (taxonomy.integration_pattern) {
              console.log(`  Integration: ${taxonomy.integration_pattern}`);
            }
            if (taxonomy.cost_profile) {
              console.log(`  Cost Profile: ${taxonomy.cost_profile}`);
            }
            if (taxonomy.performance_tier) {
              console.log(`  Performance: ${taxonomy.performance_tier}`);
            }
          }
          console.log('');
        });
      } catch (error) {
        console.error(chalk.red('✗ Query failed'));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

/**
 * Validate Taxonomy Command
 * Validate taxonomy in agent manifest
 */
taxonomyCommandGroup
  .command('validate')
  .argument('<path>', 'Path to OSSA agent manifest file')
  .description('Validate taxonomy in agent manifest')
  .action(async (path: string) => {
    try {
      const validatedPath = AgentPathSchema.parse(path);
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);

      console.log(chalk.blue(`Loading agent manifest: ${validatedPath}`));
      const manifest = await manifestRepo.load(validatedPath);
      const result = await validationService.validate(manifest);

      if (!result.valid) {
        console.error(chalk.red('✗ Validation failed'));
        result.errors.forEach((error) =>
          console.error(chalk.red(`  - ${error}`))
        );
        process.exit(1);
      }

      const agent = result.manifest as OssaAgent;
      const taxonomy = (agent.spec as Record<string, unknown>)?.taxonomy as
        | {
            domain?: string;
            subdomain?: string;
            type?: string;
            capability?: string;
            concerns?: string[];
          }
        | undefined;

      if (!taxonomy) {
        console.log(chalk.yellow('⚠ No taxonomy found in manifest'));
        console.log(chalk.yellow('  Taxonomy is optional but recommended'));
        return;
      }

      console.log(chalk.green('✓ Taxonomy validation passed\n'));

      console.log(chalk.bold('Taxonomy:'));
      console.log(`  Domain: ${taxonomy.domain || 'N/A'}`);
      if (taxonomy.subdomain) {
        console.log(`  Subdomain: ${taxonomy.subdomain}`);
      }
      if (taxonomy.type) {
        console.log(`  Type: ${taxonomy.type}`);
      }
      if (taxonomy.capability) {
        console.log(`  Capability: ${taxonomy.capability}`);
      }
      if (taxonomy.concerns && taxonomy.concerns.length > 0) {
        console.log(`  Concerns: ${taxonomy.concerns.join(', ')}`);
      }
    } catch (error) {
      console.error(chalk.red('✗ Validation failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

/**
 * List Taxonomy Command
 * List all available taxonomy values
 */
taxonomyCommandGroup
  .command('list')
  .option('--domains', 'List all domains')
  .option('--types', 'List all agent types')
  .option('--concerns', 'List all concerns')
  .description('List available taxonomy values')
  .action(
    async (options: {
      domains?: boolean;
      types?: boolean;
      concerns?: boolean;
    }) => {
      const domains = [
        'security',
        'infrastructure',
        'documentation',
        'backend',
        'frontend',
        'data',
        'agents',
        'development',
        'content',
      ];

      const types = [
        'orchestrator',
        'worker',
        'planner',
        'reviewer',
        'critic',
        'judge',
        'monitor',
        'integrator',
        'voice',
        'trainer',
        'governor',
      ];

      const concerns = [
        'quality',
        'observability',
        'governance',
        'performance',
        'architecture',
        'cost',
        'reliability',
      ];

      if (options.domains || (!options.types && !options.concerns)) {
        console.log(chalk.bold('\nDomains:'));
        domains.forEach((domain) => console.log(`  - ${domain}`));
      }

      if (options.types || (!options.domains && !options.concerns)) {
        console.log(chalk.bold('\nAgent Types:'));
        types.forEach((type) => console.log(`  - ${type}`));
      }

      if (options.concerns || (!options.domains && !options.types)) {
        console.log(chalk.bold('\nConcerns:'));
        concerns.forEach((concern) => console.log(`  - ${concern}`));
      }

      console.log('');
    }
  );

/**
 * Recommend Taxonomy Command
 * Recommend taxonomy based on use case description
 */
taxonomyCommandGroup
  .command('recommend')
  .argument('<use-case>', 'Use case description (e.g., "code review")')
  .option('--domain <domain>', 'Hint: preferred domain')
  .description('Recommend agent taxonomy based on use case')
  .action(async (useCase: string, options: { domain?: string }) => {
    try {
      console.log(chalk.blue(`Analyzing use case: "${useCase}"`));

      // Simple keyword-based recommendation (can be enhanced with LLM)
      const useCaseLower = useCase.toLowerCase();

      let recommendedDomain = options.domain;
      let recommendedType: string | undefined;
      let recommendedCapability: string | undefined;

      // Domain detection
      if (!recommendedDomain) {
        if (
          useCaseLower.includes('security') ||
          useCaseLower.includes('vulnerability') ||
          useCaseLower.includes('scan')
        ) {
          recommendedDomain = 'security';
        } else if (
          useCaseLower.includes('infrastructure') ||
          useCaseLower.includes('deploy') ||
          useCaseLower.includes('ci/cd')
        ) {
          recommendedDomain = 'infrastructure';
        } else if (
          useCaseLower.includes('documentation') ||
          useCaseLower.includes('docs') ||
          useCaseLower.includes('wiki')
        ) {
          recommendedDomain = 'documentation';
        } else if (
          useCaseLower.includes('code') ||
          useCaseLower.includes('review') ||
          useCaseLower.includes('development')
        ) {
          recommendedDomain = 'development';
        } else {
          recommendedDomain = 'development'; // Default
        }
      }

      // Type detection
      if (useCaseLower.includes('review') || useCaseLower.includes('analyze')) {
        recommendedType = 'reviewer';
      } else if (
        useCaseLower.includes('orchestrat') ||
        useCaseLower.includes('coordinate')
      ) {
        recommendedType = 'orchestrator';
      } else if (
        useCaseLower.includes('execute') ||
        useCaseLower.includes('run') ||
        useCaseLower.includes('worker')
      ) {
        recommendedType = 'worker';
      } else if (useCaseLower.includes('plan')) {
        recommendedType = 'planner';
      } else {
        recommendedType = 'worker'; // Default
      }

      // Capability detection
      if (useCaseLower.includes('code review')) {
        recommendedCapability = 'code_review';
      } else if (useCaseLower.includes('security scan')) {
        recommendedCapability = 'security_scanning';
      } else if (useCaseLower.includes('documentation')) {
        recommendedCapability = 'documentation_generation';
      }

      console.log(chalk.green('\n✓ Taxonomy Recommendation:\n'));

      console.log(chalk.bold('Recommended Taxonomy:'));
      console.log(`  Domain: ${recommendedDomain}`);
      if (recommendedType) {
        console.log(`  Type: ${recommendedType}`);
      }
      if (recommendedCapability) {
        console.log(`  Capability: ${recommendedCapability}`);
      }

      console.log(chalk.yellow('\nNote: This is a basic recommendation.'));
      console.log(
        chalk.yellow(
          'For more accurate recommendations, use the wizard: ossa agent-wizard'
        )
      );
    } catch (error) {
      console.error(chalk.red('✗ Recommendation failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
