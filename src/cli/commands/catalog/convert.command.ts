/**
 * Convert Command
 *
 * Converts OSSA manifests to GitLab Duo format.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { ConvertOptionsSchema, type ConvertOptions } from './schemas.js';
import { CatalogConfig } from './config.js';

export function createConvertCommand(): Command {
  return new Command('convert')
    .description('Convert OSSA manifests to GitLab Duo format')
    .option('-a, --agent <id>', 'Convert specific agent')
    .option('--all', 'Convert all agents')
    .option('-n, --dry-run', 'Show what would be converted')
    .option('-o, --output <path>', 'Output directory')
    .action(async (opts) => {
      const options = ConvertOptionsSchema.parse(opts) as ConvertOptions;
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

      console.log(chalk.cyan(`\nConverting ${agentIds.length} agent(s)...\n`));

      let converted = 0;
      let failed = 0;

      for (const agentId of agentIds) {
        const manifestPath = config.getManifestPath(agentId);
        const outputPath = options.output
          ? `${options.output}/${agentId}.yaml`
          : config.getDuoOutputPath(agentId);

        if (!fs.existsSync(manifestPath)) {
          console.log(
            chalk.red(`✗ ${agentId} - manifest not found: ${manifestPath}`)
          );
          failed++;
          continue;
        }

        try {
          if (options.dryRun) {
            console.log(chalk.yellow(`[DRY-RUN] Would convert: ${agentId}`));
            console.log(chalk.gray(`  Source: ${manifestPath}`));
            console.log(chalk.gray(`  Output: ${outputPath}`));
            converted++;
            continue;
          }

          // Read OSSA manifest
          const ossaManifest = yaml.parse(
            fs.readFileSync(manifestPath, 'utf-8')
          );

          // Convert to Duo format
          const duoManifest = convertOssaToDuo(agentId, ossaManifest);

          // Ensure output directory exists
          config.ensureOutputDir();

          // Write Duo manifest
          fs.writeFileSync(
            outputPath,
            yaml.stringify(duoManifest, { indent: 2 })
          );

          console.log(chalk.green(`✓ ${agentId}`));
          converted++;
        } catch (error) {
          console.log(chalk.red(`✗ ${agentId} - ${error}`));
          failed++;
        }
      }

      console.log('');
      if (failed > 0) {
        console.log(chalk.yellow(`Converted ${converted}, failed ${failed}`));
        process.exit(1);
      } else {
        console.log(
          chalk.green(`Successfully converted ${converted} agent(s)`)
        );
      }
    });
}

/**
 * Convert OSSA manifest to GitLab Duo format
 */
function convertOssaToDuo(
  agentId: string,
  ossa: Record<string, unknown>
): Record<string, unknown> {
  // Extract relevant fields from OSSA manifest
  const metadata = (ossa.metadata || {}) as Record<string, unknown>;
  const spec = (ossa.spec || {}) as Record<string, unknown>;
  const capabilities = (spec.capabilities || []) as string[];

  return {
    apiVersion: 'gitlab.com/v1alpha1',
    kind: 'DuoAgent',
    metadata: {
      name: agentId,
      namespace: metadata.namespace || 'bluefly',
      labels: {
        'ossa.version': String(ossa.apiVersion || 'v0.3.0').replace(
          'ossa/',
          ''
        ),
        'converted-from': 'ossa',
        'conversion-date': new Date().toISOString().split('T')[0],
      },
    },
    spec: {
      description: metadata.description || '',
      version: metadata.version || '0.1.0',
      capabilities: capabilities.map((cap) => ({ name: cap })),
      // Map OSSA fields to Duo equivalents
      ...(spec.model ? { model: spec.model } : {}),
      ...(spec.temperature ? { temperature: spec.temperature } : {}),
      ...(spec.maxTokens ? { maxTokens: spec.maxTokens } : {}),
    },
  };
}
