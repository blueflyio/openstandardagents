/**
 * Step 10: Review & Save
 * Final review and save the agent manifest
 */

import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import ora from 'ora';
import { WizardState, WizardOptions } from '../types.js';
import { console_ui, formatAgentType } from '../ui/console.js';
import type { OssaAgent } from '../../../types/index.js';

export async function reviewAndSaveStep(
  state: WizardState,
  options: WizardOptions
): Promise<WizardState> {
  console_ui.step(11, state.totalSteps, 'Review & Save');

  // Show comprehensive summary
  console_ui.section('Agent Summary');

  const data: string[][] = [
    ['Name', state.agent.metadata?.name || 'N/A'],
    ['Version', state.agent.metadata?.version || 'N/A'],
    ['Type', formatAgentType(state.agentType || 'worker')],
    ['LLM Provider', state.agent.spec?.llm?.provider || 'N/A'],
    ['LLM Model', state.agent.spec?.llm?.model || 'N/A'],
    ['Tools', String(state.agent.spec?.tools?.length || 0)],
    ['Autonomy', state.agent.spec?.autonomy?.level || 'Not configured'],
    ['Observability', state.agent.spec?.observability ? 'Enabled' : 'Disabled'],
    [
      'Safety Controls',
      (state.agent.spec as any)?.safety ? 'Enabled' : 'Disabled',
    ],
    [
      'Extensions',
      state.agent.extensions
        ? String(Object.keys(state.agent.extensions).length)
        : '0',
    ],
  ];

  console_ui.table(['Property', 'Value'], data);

  // Show YAML preview
  const { showPreview } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'showPreview',
      message: 'Show YAML preview?',
      default: false,
    },
  ]);

  if (showPreview) {
    const yamlContent = yaml.stringify(state.agent as OssaAgent, {
      indent: 2,
      lineWidth: 0,
    });
    console.log('\n' + yamlContent);
  }

  // Determine output path
  let outputPath = options.output || 'agent.ossa.yaml';

  if (options.directory) {
    const agentDir = path.join(options.directory, state.agent.metadata!.name);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    outputPath = path.join(agentDir, 'manifest.ossa.yaml');
  }

  const { confirmSave } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmSave',
      message: `Save to ${outputPath}?`,
      default: true,
    },
  ]);

  if (!confirmSave) {
    console_ui.warning('Agent creation cancelled');
    return state;
  }

  // Save manifest
  if (!options.dryRun) {
    const spinner = ora('Saving agent manifest...').start();

    try {
      const yamlContent = yaml.stringify(state.agent as OssaAgent, {
        indent: 2,
        lineWidth: 0,
      });

      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, yamlContent, 'utf-8');
      spinner.succeed('Agent manifest saved!');
    } catch (error) {
      spinner.fail('Failed to save manifest');
      throw error;
    }
  } else {
    console_ui.info('Dry run mode - manifest not saved');
  }

  // Show next steps
  console_ui.section('Next Steps');
  console_ui.info(`1. Review: ${outputPath}`);
  console_ui.info(`2. Validate: ossa validate ${outputPath}`);
  console_ui.info(`3. Test: ossa run ${outputPath}`);
  console_ui.info(`4. Deploy: ossa deploy ${outputPath}`);

  if (state.agent.spec?.tools && state.agent.spec.tools.length > 0) {
    console_ui.info(
      `5. Configure tools: Set up required MCP servers and API credentials`
    );
  }

  console.log('');
  console_ui.box(
    `Agent "${state.agent.metadata?.name}" created successfully!\n\nHappy building!`,
    'Success'
  );

  return state;
}
