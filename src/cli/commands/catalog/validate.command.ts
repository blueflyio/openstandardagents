/**
 * Validate Command
 *
 * Validates OSSA manifests against schema.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { z } from 'zod';
import { ValidateOptionsSchema, type ValidateOptions } from './schemas.js';
import { CatalogConfig } from './config.js';

// OSSA v0.3.x manifest schema (simplified)
const OssaManifestSchema = z.object({
  apiVersion: z.string().regex(/^ossa\/v0\.3/),
  kind: z.enum(['Agent', 'Worker', 'Orchestrator']),
  metadata: z.object({
    name: z.string().min(1),
    version: z.string().optional(),
    namespace: z.string().optional(),
    description: z.string().optional(),
  }),
  spec: z
    .object({
      capabilities: z.array(z.string()).optional(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
      budget: z
        .object({
          regime: z.enum(['high', 'medium', 'low', 'critical']).optional(),
          remaining: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

// Duo manifest schema (simplified)
const DuoManifestSchema = z.object({
  apiVersion: z.string().regex(/^gitlab\.com/),
  kind: z.literal('DuoAgent'),
  metadata: z.object({
    name: z.string().min(1),
    namespace: z.string().optional(),
    labels: z.record(z.string(), z.string()).optional(),
  }),
  spec: z
    .object({
      description: z.string().optional(),
      version: z.string().optional(),
      capabilities: z.array(z.object({ name: z.string() })).optional(),
    })
    .optional(),
});

export function createValidateCommand(): Command {
  return new Command('validate')
    .description('Validate OSSA manifests against schema')
    .option('-a, --agent <id>', 'Validate specific agent')
    .option('--all', 'Validate all agents')
    .option(
      '-s, --schema <type>',
      'Schema to validate: ossa, duo, both',
      'both'
    )
    .action(async (opts) => {
      const options = ValidateOptionsSchema.parse(opts);
      const config = new CatalogConfig();

      const agentIds = config.resolveAgentIds(options.agent, options.all);

      if (agentIds.length === 0) {
        console.log(
          chalk.yellow('No agents specified. Use --agent <id> or --all')
        );
        console.log(
          chalk.gray(`Available: ${config.listAgentIds().join(', ') || 'none'}`)
        );
        return;
      }

      console.log(
        chalk.cyan(
          `\nValidating ${agentIds.length} agent(s) against ${options.schema} schema(s)...\n`
        )
      );

      let passed = 0;
      let failed = 0;

      for (const agentId of agentIds) {
        const errors: string[] = [];

        // Validate OSSA manifest
        if (options.schema === 'ossa' || options.schema === 'both') {
          const manifestPath = config.getManifestPath(agentId);
          if (!fs.existsSync(manifestPath)) {
            errors.push(`OSSA manifest not found: ${manifestPath}`);
          } else {
            try {
              const content = yaml.parse(
                fs.readFileSync(manifestPath, 'utf-8')
              );
              OssaManifestSchema.parse(content);
            } catch (err) {
              if (err instanceof z.ZodError) {
                errors.push(
                  `OSSA: ${err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
                );
              } else {
                errors.push(`OSSA: ${err}`);
              }
            }
          }
        }

        // Validate Duo manifest
        if (options.schema === 'duo' || options.schema === 'both') {
          const duoPath = config.getDuoOutputPath(agentId);
          if (!fs.existsSync(duoPath)) {
            if (options.schema === 'duo') {
              errors.push(`Duo manifest not found: ${duoPath}`);
            }
            // Don't fail if schema=both and Duo doesn't exist yet
          } else {
            try {
              const content = yaml.parse(fs.readFileSync(duoPath, 'utf-8'));
              DuoManifestSchema.parse(content);
            } catch (err) {
              if (err instanceof z.ZodError) {
                errors.push(
                  `Duo: ${err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
                );
              } else {
                errors.push(`Duo: ${err}`);
              }
            }
          }
        }

        if (errors.length > 0) {
          console.log(chalk.red(`✗ ${agentId}`));
          errors.forEach((e) => console.log(chalk.gray(`  ${e}`)));
          failed++;
        } else {
          console.log(chalk.green(`✓ ${agentId}`));
          passed++;
        }
      }

      console.log('');
      if (failed > 0) {
        console.log(
          chalk.red(`Validation: ${passed} passed, ${failed} failed`)
        );
        process.exit(1);
      } else {
        console.log(chalk.green(`All ${passed} agent(s) valid`));
      }
    });
}
