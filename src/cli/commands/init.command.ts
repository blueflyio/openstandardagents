/**
 * OSSA Init Command
 * Create a new OSSA agent manifest interactively
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import readline from 'readline';
import type { OssaAgent } from '../../types/index.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

export const initCommand = new Command('init')
  .argument('[name]', 'Agent name/identifier')
  .option('-o, --output <path>', 'Output file path', 'agent.ossa.json')
  .option('-y, --yes', 'Use defaults without prompting')
  .description('Create a new OSSA agent manifest interactively')
  .action(
    async (name?: string, options?: { output?: string; yes?: boolean }) => {
      try {
        const outputPath = options?.output || 'agent.ossa.json';
        const useDefaults = options?.yes || false;

        let agentName = name;
        let agentDisplayName: string;
        let description: string;
        let version = '1.0.0';
        let role: string;
        let llmProvider = 'openai';
        let llmModel = 'gpt-4';
        let platforms: string[] = [];

        if (!useDefaults) {
          if (!agentName) {
            agentName = await question(
              chalk.blue('Agent ID (DNS-1123 format): ')
            );
          }
          agentDisplayName =
            (await question(chalk.blue('Agent Display Name: '))) || agentName;
          description = (await question(chalk.blue('Description: '))) || '';
          version =
            (await question(chalk.blue('Version (default: 1.0.0): '))) ||
            '1.0.0';
          role =
            (await question(chalk.blue('Agent Role/System Prompt: '))) || '';
          llmProvider =
            (await question(
              chalk.blue(
                'LLM Provider (openai/anthropic/google, default: openai): '
              )
            )) || 'openai';
          llmModel =
            (await question(
              chalk.blue(
                `LLM Model (default: ${llmProvider === 'openai' ? 'gpt-4' : llmProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-pro'}): `
              )
            )) ||
            (llmProvider === 'openai'
              ? 'gpt-4'
              : llmProvider === 'anthropic'
                ? 'claude-3-5-sonnet-20241022'
                : 'gemini-pro');

          const platformsInput =
            (await question(
              chalk.blue(
                'Target Platforms (comma-separated: cursor,openai,crewai,langchain,etc): '
              )
            )) || '';
          platforms = platformsInput
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
        } else {
          agentName = agentName || 'my-agent';
          agentDisplayName = agentName;
          description = 'OSSA-compliant agent';
          role = 'You are a helpful AI agent.';
          platforms = ['cursor', 'openai'];
        }

        const manifest: OssaAgent = {
          apiVersion: 'ossa/v0.2.4',
          kind: 'Agent',
          metadata: {
            name: agentName,
            version: version,
            description:
              description || `${agentDisplayName} - OSSA-compliant agent`,
          },
          spec: {
            role: role || `You are ${agentDisplayName}. ${description}`,
            llm: {
              provider: llmProvider,
              model: llmModel,
            },
            tools: [],
          },
        };

        if (platforms.length > 0) {
          manifest.extensions = {};
          if (platforms.includes('cursor')) {
            manifest.extensions.cursor = {
              enabled: true,
              agent_type: 'composer',
            };
          }
          if (platforms.includes('openai')) {
            manifest.extensions.openai_agents = { enabled: true };
          }
          if (platforms.includes('crewai')) {
            manifest.extensions.crewai = {
              enabled: true,
              agent_type: 'worker',
            };
          }
          if (platforms.includes('langchain')) {
            manifest.extensions.langchain = { enabled: true };
          }
          if (platforms.includes('langflow')) {
            manifest.extensions.langflow = { enabled: true };
          }
          if (platforms.includes('anthropic')) {
            manifest.extensions.anthropic = { enabled: true };
          }
          if (platforms.includes('vercel')) {
            manifest.extensions.vercel_ai = { enabled: true };
          }
          if (platforms.includes('llamaindex')) {
            manifest.extensions.llamaindex = { enabled: true };
          }
          if (platforms.includes('langgraph')) {
            manifest.extensions.langgraph = { enabled: true };
          }
          if (platforms.includes('autogen')) {
            manifest.extensions.autogen = {
              enabled: true,
              agent_type: 'assistant',
            };
          }
        }

        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
        console.log(
          chalk.green(`✓ Created OSSA agent manifest: ${outputPath}`)
        );
        console.log(chalk.gray(`  Name: ${agentName}`));
        console.log(chalk.gray(`  Version: ${version}`));
        if (platforms.length > 0) {
          console.log(chalk.gray(`  Platforms: ${platforms.join(', ')}`));
        }

        rl.close();
        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : String(error)
        );
        rl.close();
        process.exit(1);
      }
    }
  );
