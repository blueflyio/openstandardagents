/**
 * OSSA Register Command
 * Register OSSA agent to Agent Protocol registry
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only handles agent registration
 * - Dependency Injection: Uses container for services
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as yaml from 'yaml';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { ValidationService } from '../../services/validation.service.js';
import {
  outputJSON,
  handleCommandError,
  printSuccess,
  printError,
  printInfo,
} from '../utils/index.js';
import type { Capability } from '../../types/index.js';
import {
  addGlobalOptions,
  addRegistryOptions,
  shouldUseColor,
  ExitCode,
} from '../utils/standard-options.js';

/**
 * Agent ID Card - Digital identity for registered agents
 */
interface AgentIDCard {
  gaid: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  tags?: string[];
  homepage?: string;
  repository?: string;
  capabilities?: string[];
  signature: string;
  timestamp: string;
}

export const registerCommand = new Command('register')
  .argument('<manifest-file>', 'Path to OSSA manifest file (YAML or JSON)')
  .option(
    '-o, --output <path>',
    'Custom path for agent ID card',
    'agent-card.yaml'
  )
  .description('Register OSSA agent to Agent Protocol registry');

// Apply production-grade standard options
addGlobalOptions(registerCommand);
addRegistryOptions(registerCommand);

registerCommand.action(
  async (
    manifestFile: string,
    options: {
      output?: string;
      registry?: string;
      apiKey?: string;
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
      // Validate manifest file exists
      if (!fs.existsSync(manifestFile)) {
        if (!options.quiet) {
          printError(`Manifest file not found: ${manifestFile}`);
        }
        process.exit(ExitCode.GENERAL_ERROR);
      }

      // Get services from DI container
      const manifestRepo = container.get(ManifestRepository);
      const validationService = container.get(ValidationService);

      // Load and validate manifest
      log(`Loading manifest: ${manifestFile}`, chalk.blue);
      const manifest = await manifestRepo.load(manifestFile);

      // Validate manifest
      const validationResult = await validationService.validate(manifest);
      if (!validationResult.valid) {
        if (!options.quiet) {
          printError('Manifest validation failed');
          validationResult.errors.forEach((error) => {
            console.error(
              useColor
                ? chalk.red(`  - ${error.message || String(error)}`)
                : `  - ${error.message || String(error)}`
            );
          });
        }
        process.exit(ExitCode.GENERAL_ERROR);
      }

      // Check for GAID in metadata
      const gaid =
        manifest.metadata?.annotations?.['ossa.dev/gaid'] ||
        manifest.metadata?.labels?.gaid;

      if (!gaid) {
        if (!options.quiet) {
          printError('GAID not found in manifest metadata');
          console.error(
            useColor
              ? chalk.yellow(
                  '\nGenerate a GAID first by running:\n  ossa generate-gaid <manifest-file>'
                )
              : '\nGenerate a GAID first by running:\n  ossa generate-gaid <manifest-file>'
          );
        }
        process.exit(ExitCode.GENERAL_ERROR);
      }

      if (options.verbose) {
        log(`Found GAID: ${gaid}`, chalk.gray);
      }

      // Extract agent metadata for card
      const agentName = manifest.metadata?.name || 'unknown-agent';
      const agentVersion = manifest.metadata?.version || '0.1.0';
      const description = manifest.metadata?.description || manifest.spec?.role;
      const author = manifest.metadata?.annotations?.['ossa.dev/author'];
      const license = manifest.metadata?.annotations?.['ossa.dev/license'];
      const homepage =
        manifest.metadata?.annotations?.['ossa.dev/homepage'] ||
        manifest.metadata?.annotations?.['ossa.dev/documentation'];
      const repository =
        manifest.metadata?.annotations?.['ossa.dev/repository'];

      // Extract tags
      const tags: string[] = [];
      if (manifest.metadata?.labels) {
        Object.keys(manifest.metadata.labels).forEach((key) => {
          if (key !== 'gaid' && manifest.metadata?.labels) {
            tags.push(manifest.metadata.labels[key]);
          }
        });
      }
      if (manifest.metadata?.tags) {
        tags.push(...manifest.metadata.tags);
      }

      // Extract capabilities
      const capabilities: string[] = [];
      if (manifest.spec?.capabilities) {
        manifest.spec.capabilities.forEach((cap: Capability | string) => {
          if (typeof cap === 'string') {
            capabilities.push(cap);
          } else if ('id' in cap && cap.id) {
            capabilities.push(cap.id);
          }
        });
      }
      if (manifest.skills) {
        manifest.skills.forEach((skill: string) => {
          if (skill) {
            capabilities.push(skill);
          }
        });
      }

      // Generate digital signature
      log('Generating digital signature...', chalk.blue);
      const signatureData = JSON.stringify({
        gaid,
        name: agentName,
        version: agentVersion,
        timestamp: new Date().toISOString(),
      });
      const signature = crypto
        .createHash('sha256')
        .update(signatureData)
        .digest('hex');

      // Create Agent ID Card
      const timestamp = new Date().toISOString();
      const idCard: AgentIDCard = {
        gaid,
        name: agentName,
        version: agentVersion,
        description,
        author,
        license,
        tags: tags.length > 0 ? tags : undefined,
        homepage,
        repository,
        capabilities: capabilities.length > 0 ? capabilities : undefined,
        signature,
        timestamp,
      };

      // Save Agent ID Card locally (registration API migrated to @bluefly/agent-protocol)
      const outputPath = options.output || 'agent-card.yaml';
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir) && outputDir !== '.') {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const cardContent = yaml.stringify(idCard);
      fs.writeFileSync(outputPath, cardContent);

      // Output results
      if (options.json) {
        outputJSON({
          success: true,
          gaid,
          name: agentName,
          version: agentVersion,
          cardPath: path.resolve(outputPath),
          message:
            'Agent ID card generated locally. Use @bluefly/agent-protocol for registry registration.',
        });
      } else {
        log('', chalk.green);
        printSuccess(`Agent ID card generated: ${gaid}`);
        console.log('');
        printInfo(`Agent ID Card saved: ${outputPath}`);

        if (options.verbose) {
          console.log('');
          log('Agent Details:', chalk.gray);
          log(`  Name:         ${agentName}`, chalk.gray);
          log(`  Version:      ${agentVersion}`, chalk.gray);
          log(`  GAID:         ${gaid}`, chalk.gray);
          log(`  Signature:    ${signature.substring(0, 16)}...`, chalk.gray);
          log(`  Timestamp:    ${timestamp}`, chalk.gray);

          if (capabilities.length > 0) {
            log(`  Capabilities: ${capabilities.length}`, chalk.gray);
            capabilities.slice(0, 5).forEach((cap) => {
              log(`    - ${cap}`, chalk.gray);
            });
            if (capabilities.length > 5) {
              log(`    ... and ${capabilities.length - 5} more`, chalk.gray);
            }
          }
        }

        console.log('');
        log('Next steps:', chalk.cyan);
        log('  1. Share your Agent ID Card with collaborators', chalk.gray);
        log(
          '  2. Register with a registry: npx @bluefly/agent-protocol register <manifest>',
          chalk.gray
        );
        log(
          '  3. Use the GAID to reference your agent in workflows',
          chalk.gray
        );
      }

      process.exit(ExitCode.SUCCESS);
    } catch (error) {
      handleCommandError(error);
    }
  }
);
