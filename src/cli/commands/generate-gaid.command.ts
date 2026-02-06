/**
 * OSSA Generate GAID Command
 * Generate Global Agent Identifier (GAID) for OSSA agent manifest
 *
 * GAID Format: did:ossa:{org}:{uuid}
 * UUID: Deterministic v5 UUID generated from org + agent name
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only generates GAID and updates manifest
 */

import chalk from 'chalk';
import { Command } from 'commander';
import { v5 as uuidv5 } from 'uuid';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import {
  addGlobalOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';
import type { OssaAgent } from '../../types/index.js';

// OSSA namespace UUID for deterministic v5 UUID generation
// Generated from "ossa.org" string using standard UUID v5 DNS namespace
const OSSA_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export const generateGaidCommand = new Command('generate-gaid')
  .argument('<manifest-file>', 'Path to OSSA manifest file (YAML or JSON)')
  .option(
    '-o, --org <organization>',
    'Organization name (required for GAID generation)'
  )
  .option(
    '--dry-run',
    'Preview GAID without updating manifest file',
    false
  )
  .description(
    'Generate Global Agent Identifier (GAID) for OSSA agent manifest\n\n' +
    'GAID Format: did:ossa:{org}:{uuid}\n' +
    'UUID: Deterministic v5 UUID generated from org + agent name\n\n' +
    'Example:\n' +
    '  ossa generate-gaid agent.ossa.yaml --org bluefly\n' +
    '  ossa generate-gaid agent.ossa.yaml --org acme --dry-run'
  );

// Apply production-grade standard options
addGlobalOptions(generateGaidCommand);

generateGaidCommand.action(
  async (
    manifestPath: string,
    options: {
      org?: string;
      dryRun?: boolean;
      verbose?: boolean;
      quiet?: boolean;
      json?: boolean;
      color?: boolean;
    }
  ) => {
    const useColor = shouldUseColor(options);
    const log = (msg: string, color?: (s: string) => string) => {
      if (options.quiet) return;
      const output = useColor && color ? color(msg) : msg;
      console.log(output);
    };

    try {
      // Get services from DI container
      const manifestRepo = container.get(ManifestRepository);

      // Load manifest
      log(`Loading manifest: ${manifestPath}`, chalk.blue);
      const manifest = await manifestRepo.load(manifestPath);

      // Extract agent name from manifest
      const agentName = manifest.metadata?.name || manifest.agent?.name;
      if (!agentName) {
        const errMsg = 'Error: Manifest must have metadata.name or agent.name field';
        console.error(useColor ? chalk.red(errMsg) : errMsg);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      // Get organization from option or manifest
      const org = options.org ||
                  manifest.metadata?.annotations?.['ossa.org/organization'] ||
                  (manifest.agent as any)?.author?.organization;

      if (!org) {
        const errMsg = 'Error: Organization must be specified via --org option or manifest metadata';
        console.error(useColor ? chalk.red(errMsg) : errMsg);
        console.error('');
        console.error('Specify organization in one of these ways:');
        console.error('  1. Command option: --org bluefly');
        console.error('  2. Manifest annotation: metadata.annotations["ossa.org/organization"]');
        console.error('  3. Legacy format: agent.author.organization');
        process.exit(ExitCode.GENERAL_ERROR);
      }

      // Generate deterministic UUID v5 from org + agent name
      const seed = `${org}:${agentName}`;
      const uuid = uuidv5(seed, OSSA_NAMESPACE);

      // Create GAID in format: did:ossa:{org}:{uuid}
      const gaid = `did:ossa:${org.toLowerCase().replace(/[^a-z0-9]/g, '')}:${uuid.replace(/-/g, '')}`;

      // Display GAID
      if (options.json) {
        console.log(JSON.stringify({
          gaid,
          organization: org,
          agentName,
          seed,
          uuid,
          manifestPath,
          dryRun: options.dryRun,
        }, null, 2));
      } else {
        log('\n✓ Generated GAID', chalk.green);
        log(`  Organization: ${useColor ? chalk.cyan(org) : org}`);
        log(`  Agent Name:   ${useColor ? chalk.cyan(agentName) : agentName}`);
        log(`  UUID:         ${useColor ? chalk.cyan(uuid) : uuid}`);
        log(`  GAID:         ${useColor ? chalk.green.bold(gaid) : gaid}`);
        log('');
      }

      // Update manifest if not dry-run
      if (!options.dryRun) {
        // Ensure metadata exists
        if (!manifest.metadata) {
          manifest.metadata = {
            name: agentName,
          };
        }

        // Ensure annotations exists
        if (!manifest.metadata.annotations) {
          manifest.metadata.annotations = {};
        }

        // Add GAID to metadata annotations
        manifest.metadata.annotations['ossa.org/gaid'] = gaid;

        // Also store organization if it was provided via option
        if (options.org) {
          manifest.metadata.annotations['ossa.org/organization'] = org;
        }

        // Save updated manifest
        await manifestRepo.save(manifestPath, manifest);

        if (!options.json) {
          log(`✓ Updated manifest: ${manifestPath}`, chalk.green);
          log(`  Added: metadata.annotations["ossa.org/gaid"] = "${gaid}"`, chalk.gray);
          if (options.org) {
            log(`  Added: metadata.annotations["ossa.org/organization"] = "${org}"`, chalk.gray);
          }
        }
      } else {
        if (!options.json) {
          log('Dry run - manifest not updated', chalk.yellow);
        }
      }

      process.exit(ExitCode.SUCCESS);
    } catch (error) {
      if (!options.quiet) {
        const errMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(useColor ? chalk.red(errMsg) : errMsg);

        if (options.verbose && error instanceof Error) {
          const stack = error.stack || '';
          console.error(useColor ? chalk.gray(stack) : stack);
        }
      }

      process.exit(ExitCode.GENERAL_ERROR);
    }
  }
);
