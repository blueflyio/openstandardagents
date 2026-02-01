/**
 * Agents Show Command
 * Display detailed information about a specific agent
 *
 * SOLID: Single Responsibility - Agent detail display
 * DRY: Reusable display logic
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'yaml';
import type { OssaAgent } from '../../../types/index.js';

export const agentsShowCommand = new Command('show')
  .description('Show detailed information about an agent')
  .argument('<name-or-path>', 'Agent name or path to manifest file')
  .option('--json', 'Output as JSON')
  .option('--yaml', 'Output as YAML')
  .action(async (nameOrPath: string, options) => {
    try {
      const { manifest, filePath } = await loadAgent(nameOrPath);

      if (options.json) {
        console.log(JSON.stringify(manifest, null, 2));
      } else if (options.yaml) {
        console.log(yaml.stringify(manifest));
      } else {
        displayAgent(manifest, filePath);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to show agent: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

/**
 * Load agent by name or file path
 */
async function loadAgent(
  nameOrPath: string
): Promise<{ manifest: OssaAgent; filePath: string }> {
  let filePath: string;

  // Check if it's a file path
  if (fs.existsSync(nameOrPath)) {
    filePath = nameOrPath;
  } else {
    // Search for agent by name
    const glob = await import('glob');
    const patterns = [
      `**/${nameOrPath}.ossa.yaml`,
      `**/${nameOrPath}.ossa.yml`,
      `**/${nameOrPath}/agent.yaml`,
      `**/${nameOrPath}/agent.yml`,
    ];

    let found = false;
    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/vendor/**', '**/.git/**'],
        absolute: true,
      });

      if (files.length > 0) {
        filePath = files[0];
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Agent not found: ${nameOrPath}`);
    }
  }

  if (!filePath) {
    throw new Error(`File path not found for: ${nameOrPath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const manifest = yaml.parse(content) as OssaAgent;

  if (!manifest.apiVersion?.startsWith('ossa/')) {
    throw new Error(`Not a valid OSSA manifest: ${filePath}`);
  }

  return { manifest, filePath };
}

/**
 * Display agent in formatted output
 */
function displayAgent(manifest: OssaAgent, filePath: string): void {
  const metadata = manifest.metadata;
  const spec = manifest.spec;

  // Header
  console.log(chalk.blue.bold(`\n${metadata?.name || 'Unnamed Agent'}`));
  console.log(chalk.gray('─'.repeat(50)));

  // Basic Info
  console.log(chalk.bold('\nBasic Information:'));
  console.log(`  ${chalk.cyan('Version:')} ${metadata?.version || 'N/A'}`);
  console.log(`  ${chalk.cyan('API Version:')} ${manifest.apiVersion}`);
  console.log(`  ${chalk.cyan('Kind:')} ${manifest.kind}`);

  if (metadata?.description) {
    console.log(`  ${chalk.cyan('Description:')} ${metadata.description}`);
  }

  if (metadata?.annotations?.author) {
    console.log(`  ${chalk.cyan('Author:')} ${metadata.annotations.author}`);
  }

  if (metadata?.annotations?.license) {
    console.log(`  ${chalk.cyan('License:')} ${metadata.annotations.license}`);
  }

  if (metadata?.tags && metadata.tags.length > 0) {
    console.log(
      `  ${chalk.cyan('Tags:')} ${(metadata.tags as string[]).join(', ')}`
    );
  }

  // File Info
  console.log(chalk.bold('\nFile Information:'));
  console.log(
    `  ${chalk.cyan('Path:')} ${path.relative(process.cwd(), filePath)}`
  );
  const stats = fs.statSync(filePath);
  console.log(`  ${chalk.cyan('Size:')} ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(
    `  ${chalk.cyan('Created:')} ${stats.birthtime.toLocaleString()}`
  );
  console.log(`  ${chalk.cyan('Modified:')} ${stats.mtime.toLocaleString()}`);

  // Spec Info
  if (spec) {
    console.log(chalk.bold('\nSpecification:'));

    // Role
    if (spec.role) {
      console.log(`  ${chalk.cyan('Role:')}`);
      const roleLines = (spec.role as string).split('\n').slice(0, 5);
      roleLines.forEach((line) => {
        console.log(`    ${chalk.gray(line)}`);
      });
      if ((spec.role as string).split('\n').length > 5) {
        console.log(`    ${chalk.gray('...')}`);
      }
    }

    // LLM Config
    if (spec.llm) {
      const llm = spec.llm as any;
      console.log(`  ${chalk.cyan('LLM:')}`);
      console.log(`    Provider: ${llm.provider || 'N/A'}`);
      console.log(`    Model: ${llm.model || 'N/A'}`);
      if (llm.temperature !== undefined) {
        console.log(`    Temperature: ${llm.temperature}`);
      }
      if (llm.maxTokens !== undefined) {
        console.log(`    Max Tokens: ${llm.maxTokens}`);
      }
    }

    // Capabilities
    if (
      spec.capabilities &&
      Array.isArray(spec.capabilities) &&
      spec.capabilities.length > 0
    ) {
      console.log(
        `  ${chalk.cyan('Capabilities:')} (${spec.capabilities.length})`
      );
      spec.capabilities.forEach((cap: any) => {
        console.log(`    • ${chalk.green(cap)}`);
      });
    }

    // Tools
    if (spec.tools && Array.isArray(spec.tools) && spec.tools.length > 0) {
      console.log(`  ${chalk.cyan('Tools:')} (${spec.tools.length})`);
      spec.tools.forEach((tool: any) => {
        console.log(
          `    • ${chalk.green(tool.name || 'unnamed')} - ${chalk.gray(tool.description || 'No description')}`
        );
      });
    }

    // Workflow
    if (spec.workflow) {
      const workflow = spec.workflow as any;
      if (workflow.steps && Array.isArray(workflow.steps)) {
        console.log(
          `  ${chalk.cyan('Workflow:')} (${workflow.steps.length} steps)`
        );
        workflow.steps.forEach((step: any, index: number) => {
          console.log(
            `    ${index + 1}. ${chalk.green(step.task || 'unnamed')} ${step.agent ? chalk.gray(`(${step.agent})`) : ''}`
          );
          if (step.description) {
            console.log(`       ${chalk.gray(step.description)}`);
          }
        });
      }
    }

    // Autonomy
    if (spec.autonomy) {
      const autonomy = spec.autonomy as any;
      console.log(`  ${chalk.cyan('Autonomy:')}`);
      console.log(`    Level: ${autonomy.level || 'N/A'}`);
      if (autonomy.requiresApproval !== undefined) {
        console.log(
          `    Requires Approval: ${autonomy.requiresApproval ? 'Yes' : 'No'}`
        );
      }
    }
  }

  console.log(); // Blank line at end
}
