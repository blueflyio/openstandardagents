/**
 * OSSA Agent Card Command - A2A Protocol Discovery
 *
 * Subcommands:
 *   ossa agent-card generate   - Generate agent-card.json from manifest
 *   ossa agent-card validate   - Validate agent-card.json
 *   ossa agent-card serve      - Serve agent card at /.well-known/agent-card.json
 *
 * SOLID Principles:
 * - Uses shared output utilities (DRY)
 * - Single Responsibility: Only handles agent card operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { glob } from 'glob';
import { getVersion } from '../../utils/version.js';
import { outputJSON, handleCommandError } from '../utils/index.js';

interface A2AAgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  provider?: {
    organization: string;
    url: string;
  };
  version: string;
  documentationUrl?: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory?: boolean;
  };
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
    inputModes?: string[];
    outputModes?: string[];
  }>;
  securitySchemes?: Record<
    string,
    {
      type: string;
      scheme?: string;
      in?: string;
      name?: string;
    }
  >;
  security?: Array<Record<string, string[]>>;
  supportedInterfaces?: Array<{
    url: string;
    binding: string;
  }>;
}

export const agentCardCommand = new Command('agent-card').description(
  'Manage A2A Protocol agent cards for discovery'
);

// ============================================================================
// Subcommand: agent-card generate
// ============================================================================
agentCardCommand
  .command('generate [manifest]')
  .description('Generate agent-card.json from OSSA manifest')
  .option('-o, --output <file>', 'Output file path', '.agents/agent-card.json')
  .option('--url <url>', 'Agent URL for A2A protocol')
  .option('--provider <org>', 'Provider organization name')
  .option('--provider-url <url>', 'Provider URL')
  .action(async (manifestArg?: string, options?: Record<string, string>) => {
    try {
      // Find manifest
      let manifestPath = manifestArg;
      if (!manifestPath) {
        const patterns = [
          '.agents/manifest.ossa.yaml',
          '.agents/*.ossa.yaml',
          'agent.ossa.yaml',
          '*.ossa.yaml',
        ];

        for (const pattern of patterns) {
          const matches = await glob(pattern, { cwd: process.cwd() });
          if (matches.length > 0) {
            manifestPath = matches[0];
            break;
          }
        }
      }

      if (!manifestPath || !fs.existsSync(manifestPath)) {
        console.log(chalk.red('✗ No OSSA manifest found'));
        console.log(
          chalk.gray(
            '  Provide manifest path or run in directory with .agents/'
          )
        );
        process.exit(1);
      }

      console.log(chalk.blue(`Generating agent card from: ${manifestPath}`));

      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = yaml.parse(content);

      if (!manifest?.metadata?.name) {
        console.log(chalk.red('✗ Invalid manifest: missing metadata.name'));
        process.exit(1);
      }

      // Build A2A AgentCard
      const agentCard: A2AAgentCard = {
        protocolVersion: '1.0',
        name: manifest.metadata.name,
        description:
          manifest.metadata.description ||
          `${manifest.metadata.name} - OSSA Agent`,
        url:
          options?.url ||
          `https://agents.example.com/${manifest.metadata.name}`,
        version: manifest.metadata.version || getVersion(),
        capabilities: {
          streaming: manifest.spec?.capabilities?.streaming ?? true,
          pushNotifications:
            manifest.spec?.capabilities?.pushNotifications ?? false,
          stateTransitionHistory:
            manifest.spec?.capabilities?.stateTransitionHistory ?? true,
        },
        skills: [],
        securitySchemes: {
          bearer: {
            type: 'http',
            scheme: 'bearer',
          },
        },
        security: [{ bearer: [] }],
      };

      // Add provider
      if (options?.provider || manifest.spec?.identity?.provider) {
        agentCard.provider = {
          organization:
            options?.provider ||
            manifest.spec?.identity?.provider?.organization ||
            'Unknown',
          url:
            options?.providerUrl ||
            manifest.spec?.identity?.provider?.url ||
            'https://example.com',
        };
      }

      // Add documentation URL
      if (
        manifest.metadata?.annotations?.['ossa.dev/documentation'] ||
        manifest.spec?.identity?.documentationUrl
      ) {
        agentCard.documentationUrl =
          manifest.metadata?.annotations?.['ossa.dev/documentation'] ||
          manifest.spec?.identity?.documentationUrl;
      }

      // Convert capabilities to skills
      if (manifest.spec?.capabilities) {
        for (const cap of manifest.spec.capabilities) {
          const skill =
            typeof cap === 'string'
              ? {
                  id: cap.replace(/\./g, '-'),
                  name: cap.split('.').pop() || cap,
                  description: `${cap} capability`,
                  tags: cap.split('.'),
                  examples: [],
                }
              : {
                  id: cap.name?.replace(/\./g, '-') || 'unknown',
                  name: cap.name || 'Unknown',
                  description: cap.description || '',
                  tags: cap.tags || [],
                  examples: cap.examples || [],
                  inputModes: cap.inputModes,
                  outputModes: cap.outputModes,
                };

          agentCard.skills.push(skill);
        }
      }

      // Convert manifest skills
      if (manifest.spec?.skills) {
        for (const skill of manifest.spec.skills) {
          agentCard.skills.push({
            id: skill.id || skill.name?.toLowerCase().replace(/\s+/g, '-'),
            name: skill.name,
            description: skill.description || '',
            tags: skill.tags || [],
            examples: skill.examples || [],
            inputModes: skill.inputModes,
            outputModes: skill.outputModes,
          });
        }
      }

      // Add supported interfaces
      if (manifest.spec?.interfaces) {
        agentCard.supportedInterfaces = manifest.spec.interfaces.map(
          (iface: { url: string; binding: string }) => ({
            url: iface.url,
            binding: iface.binding,
          })
        );
      } else {
        agentCard.supportedInterfaces = [
          {
            url: agentCard.url,
            binding: 'jsonrpc',
          },
        ];
      }

      // Ensure output directory exists
      const outputPath = options?.output || '.agents/agent-card.json';
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write agent card
      fs.writeFileSync(outputPath, JSON.stringify(agentCard, null, 2));

      console.log(chalk.green(`✓ Agent card generated: ${outputPath}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`  Name: ${agentCard.name}`));
      console.log(chalk.gray(`  Version: ${agentCard.version}`));
      console.log(chalk.gray(`  Skills: ${agentCard.skills.length}`));
      console.log('');
      console.log(chalk.blue('A2A Discovery:'));
      console.log(chalk.gray(`  Serve at: GET /.well-known/agent-card.json`));

      process.exit(0);
    } catch (error) {
      handleCommandError(error);
    }
  });

// ============================================================================
// Subcommand: agent-card validate
// ============================================================================
agentCardCommand
  .command('validate [file]')
  .description('Validate agent-card.json')
  .action(async (file?: string) => {
    try {
      const cardPath = file || '.agents/agent-card.json';

      if (!fs.existsSync(cardPath)) {
        console.log(chalk.red(`✗ Agent card not found: ${cardPath}`));
        console.log(chalk.gray('  Run `ossa agent-card generate` first'));
        process.exit(1);
      }

      console.log(chalk.blue(`Validating: ${cardPath}`));

      const content = fs.readFileSync(cardPath, 'utf-8');
      const card = JSON.parse(content) as A2AAgentCard;

      const errors: string[] = [];
      const warnings: string[] = [];

      // Required fields
      if (!card.protocolVersion) errors.push('Missing: protocolVersion');
      if (!card.name) errors.push('Missing: name');
      if (!card.description) errors.push('Missing: description');
      if (!card.url) errors.push('Missing: url');
      if (!card.version) errors.push('Missing: version');
      if (!card.capabilities) errors.push('Missing: capabilities');

      // Validate capabilities
      if (card.capabilities) {
        if (typeof card.capabilities.streaming !== 'boolean') {
          warnings.push('capabilities.streaming should be boolean');
        }
        if (typeof card.capabilities.pushNotifications !== 'boolean') {
          warnings.push('capabilities.pushNotifications should be boolean');
        }
      }

      // Validate skills
      if (!card.skills || !Array.isArray(card.skills)) {
        errors.push('Missing or invalid: skills (must be array)');
      } else if (card.skills.length === 0) {
        warnings.push('No skills defined');
      } else {
        for (const skill of card.skills) {
          if (!skill.id) errors.push(`Skill missing id`);
          if (!skill.name) errors.push(`Skill missing name`);
          if (!skill.description)
            warnings.push(`Skill "${skill.id}" missing description`);
        }
      }

      // Validate security
      if (!card.securitySchemes) {
        warnings.push('No security schemes defined');
      }

      // Output results
      console.log(chalk.gray('─'.repeat(50)));

      if (errors.length === 0 && warnings.length === 0) {
        console.log(chalk.green('✓ Agent card is valid'));
        console.log('');
        console.log(`  Name: ${chalk.cyan(card.name)}`);
        console.log(`  Version: ${card.version}`);
        console.log(`  Skills: ${card.skills?.length || 0}`);
        console.log(`  URL: ${card.url}`);
        process.exit(0);
      }

      if (errors.length > 0) {
        console.log(chalk.red(`\n✗ Errors (${errors.length}):`));
        errors.forEach((e) => console.log(`  ${chalk.red('•')} ${e}`));
      }

      if (warnings.length > 0) {
        console.log(chalk.yellow(`\n⚠ Warnings (${warnings.length}):`));
        warnings.forEach((w) => console.log(`  ${chalk.yellow('•')} ${w}`));
      }

      process.exit(errors.length > 0 ? 1 : 0);
    } catch (error) {
      handleCommandError(error);
    }
  });

// ============================================================================
// Subcommand: agent-card show
// ============================================================================
agentCardCommand
  .command('show [file]')
  .description('Display agent card contents')
  .option('--yaml', 'Output as YAML')
  .action(async (file?: string, options?: { yaml?: boolean }) => {
    try {
      const cardPath = file || '.agents/agent-card.json';

      if (!fs.existsSync(cardPath)) {
        console.log(chalk.red(`✗ Agent card not found: ${cardPath}`));
        process.exit(1);
      }

      const content = fs.readFileSync(cardPath, 'utf-8');
      const card = JSON.parse(content);

      if (options?.yaml) {
        console.log(yaml.stringify(card));
      } else {
        outputJSON(card);
      }

      process.exit(0);
    } catch (error) {
      handleCommandError(error);
    }
  });
