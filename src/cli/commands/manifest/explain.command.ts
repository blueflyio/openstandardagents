/**
 * OSSA Manifest Explain Command
 * Explain what an OSSA manifest does in human-readable terms
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import { container } from '../../../di-container.js';
import { ManifestRepository } from '../../../repositories/manifest.repository.js';
import type { OssaAgent } from '../../../types/index.js';
import {
  addGlobalOptions,
  shouldUseColor,
  ExitCode,
} from '../../utils/standard-options.js';

interface ExplainOptions {
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  color?: boolean;
  schema?: boolean;
}

export const manifestExplainCommand = new Command('explain')
  .argument('<path>', 'Path to OSSA manifest file')
  .option('--verbose', 'Include detailed schema references', false)
  .option('--schema', 'Include schema version and validation details', false)
  .description('Explain what the OSSA manifest does')
  .action(async (path: string, options: ExplainOptions) => {
    const useColor = shouldUseColor(options);
    const log = (msg: string, color?: (s: string) => string) => {
      if (options.quiet) return;
      const output = useColor && color ? color(msg) : msg;
      console.log(output);
    };

    try {
      const manifestRepo = container.get(ManifestRepository);
      const manifest = (await manifestRepo.load(path)) as OssaAgent;

      if (options.json) {
        const explanation = generateExplanationObject(manifest, options);
        console.log(JSON.stringify(explanation, null, 2));
        process.exit(ExitCode.SUCCESS);
      }

      // Human-readable explanation
      log(chalk.bold.blue('\nOSSA Agent Explanation\n'));
      log(chalk.yellow('━'.repeat(50)));

      // Basic info
      log(chalk.bold('\n📋 Basic Information:'));
      log(
        `   Name: ${useColor ? chalk.cyan(manifest.metadata?.name || 'Unknown') : manifest.metadata?.name || 'Unknown'}`
      );
      log(
        `   Version: ${useColor ? chalk.cyan(manifest.metadata?.version || 'N/A') : manifest.metadata?.version || 'N/A'}`
      );
      log(
        `   Kind: ${useColor ? chalk.cyan(manifest.kind || 'Agent') : manifest.kind || 'Agent'}`
      );

      if (manifest.metadata?.description) {
        log(
          `   Description: ${useColor ? chalk.gray(manifest.metadata.description) : manifest.metadata.description}`
        );
      }

      // Schema version
      if (options.schema) {
        log(chalk.bold('\n📐 Schema Information:'));
        log(
          `   API Version: ${useColor ? chalk.cyan(manifest.apiVersion || 'N/A') : manifest.apiVersion || 'N/A'}`
        );
      }

      // Role/Purpose
      if (manifest.spec?.role) {
        log(chalk.bold('\n🎯 Agent Purpose:'));
        log(
          `   ${useColor ? chalk.gray(manifest.spec.role) : manifest.spec.role}`
        );
      }

      // LLM Configuration
      if (manifest.spec?.llm) {
        log(chalk.bold('\n🤖 Language Model:'));
        log(
          `   Provider: ${useColor ? chalk.cyan(manifest.spec.llm.provider) : manifest.spec.llm.provider}`
        );
        log(
          `   Model: ${useColor ? chalk.cyan(manifest.spec.llm.model) : manifest.spec.llm.model}`
        );

        if (manifest.spec.llm.temperature !== undefined) {
          log(`   Temperature: ${chalk.cyan(manifest.spec.llm.temperature)}`);
        }
        if (manifest.spec.llm.maxTokens) {
          log(`   Max Tokens: ${chalk.cyan(manifest.spec.llm.maxTokens)}`);
        }
      }

      // Tools
      if (manifest.spec?.tools && manifest.spec.tools.length > 0) {
        log(
          chalk.bold(
            `\n🔧 Tools (${manifest.spec.tools.length} configured):`
          )
        );
        manifest.spec.tools.forEach((tool: any, index: number) => {
          log(
            `   ${index + 1}. ${useColor ? chalk.cyan(tool.name || tool.type) : tool.name || tool.type} (${tool.type})`
          );
          if (options.verbose && tool.description) {
            log(`      ${chalk.gray(tool.description)}`);
          }
          if (options.verbose && tool.server) {
            log(`      Server: ${chalk.gray(tool.server)}`);
          }
          if (options.verbose && tool.endpoint) {
            log(`      Endpoint: ${chalk.gray(tool.endpoint)}`);
          }
        });
      }

      // Messaging (v0.3.0+)
      if (manifest.spec?.messaging) {
        log(chalk.bold('\n📨 Messaging:'));

        if (manifest.spec.messaging.publishes) {
          log(
            `   Publishes to ${manifest.spec.messaging.publishes.length} channel(s):`
          );
          manifest.spec.messaging.publishes.forEach((ch: any) => {
            log(`      - ${useColor ? chalk.cyan(ch.channel) : ch.channel}`);
          });
        }

        if (manifest.spec.messaging.subscribes) {
          log(
            `   Subscribes to ${manifest.spec.messaging.subscribes.length} channel(s):`
          );
          manifest.spec.messaging.subscribes.forEach((sub: any) => {
            log(`      - ${useColor ? chalk.cyan(sub.channel) : sub.channel}`);
          });
        }

        if (manifest.spec.messaging.commands) {
          log(`   Commands: ${manifest.spec.messaging.commands.length}`);
          if (options.verbose) {
            manifest.spec.messaging.commands.forEach((cmd: any) => {
              log(`      - ${useColor ? chalk.cyan(cmd.name) : cmd.name}`);
            });
          }
        }
      }

      // Extensions
      if (manifest.extensions && Object.keys(manifest.extensions).length > 0) {
        log(
          chalk.bold(
            `\n🔌 Platform Extensions (${Object.keys(manifest.extensions).length}):`
          )
        );
        Object.keys(manifest.extensions).forEach((ext) => {
          log(`   - ${useColor ? chalk.cyan(ext) : ext}`);
        });
      }

      // Summary
      log(chalk.yellow('\n━'.repeat(50)));
      log(chalk.bold.green('\n✓ Summary:'));

      const summary = generateSummary(manifest);
      log(`   ${useColor ? chalk.gray(summary) : summary}`);

      log(''); // final newline

      process.exit(ExitCode.SUCCESS);
    } catch (error) {
      if (!options.quiet) {
        const errMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
        console.error(useColor ? chalk.red(errMsg) : errMsg);
      }
      process.exit(ExitCode.GENERAL_ERROR);
    }
  });

function generateSummary(manifest: OssaAgent): string {
  const parts: string[] = [];

  parts.push(`This is a ${manifest.kind || 'Agent'}`);

  if (manifest.metadata?.name) {
    parts.push(`named "${manifest.metadata.name}"`);
  }

  if (manifest.spec?.llm) {
    parts.push(
      `using ${manifest.spec.llm.provider} ${manifest.spec.llm.model}`
    );
  }

  if (manifest.spec?.tools && manifest.spec.tools.length > 0) {
    parts.push(`with ${manifest.spec.tools.length} tool(s)`);
  }

  if (manifest.spec?.messaging) {
    const msgParts = [];
    if (manifest.spec.messaging.publishes) {
      msgParts.push(`publishes to ${manifest.spec.messaging.publishes.length} channel(s)`);
    }
    if (manifest.spec.messaging.subscribes) {
      msgParts.push(`subscribes to ${manifest.spec.messaging.subscribes.length} channel(s)`);
    }
    if (msgParts.length > 0) {
      parts.push(msgParts.join(' and '));
    }
  }

  if (manifest.extensions && Object.keys(manifest.extensions).length > 0) {
    parts.push(
      `targeting ${Object.keys(manifest.extensions).length} platform(s)`
    );
  }

  return parts.join(', ') + '.';
}

function generateExplanationObject(
  manifest: OssaAgent,
  options: ExplainOptions
): any {
  const explanation: any = {
    name: manifest.metadata?.name,
    version: manifest.metadata?.version,
    kind: manifest.kind,
    apiVersion: manifest.apiVersion,
    summary: generateSummary(manifest),
  };

  if (manifest.spec?.role) {
    explanation.purpose = manifest.spec.role;
  }

  if (manifest.spec?.llm) {
    explanation.llm = {
      provider: manifest.spec.llm.provider,
      model: manifest.spec.llm.model,
    };
  }

  if (manifest.spec?.tools) {
    explanation.tools = manifest.spec.tools.map((t: any) => ({
      name: t.name,
      type: t.type,
      description: t.description,
    }));
  }

  if (manifest.spec?.messaging) {
    explanation.messaging = {
      publishes: manifest.spec.messaging.publishes?.length || 0,
      subscribes: manifest.spec.messaging.subscribes?.length || 0,
      commands: manifest.spec.messaging.commands?.length || 0,
    };
  }

  if (manifest.extensions) {
    explanation.platforms = Object.keys(manifest.extensions);
  }

  return explanation;
}

addGlobalOptions(manifestExplainCommand);
