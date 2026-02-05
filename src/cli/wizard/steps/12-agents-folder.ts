/**
 * Step 12: Create .agents Folder Structure
 * Creates complete, standardized folder structure following OpenAPI-first principles
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { AgentsFolderService } from '../../../services/structure/agents-folder.service.js';
import type { WizardState, WizardOptions } from '../types.js';
import { console_ui } from '../ui/console.js';

export async function createAgentsFolderStep(
  state: WizardState,
  options: WizardOptions
): Promise<WizardState> {
  console_ui.step(13, state.totalSteps, 'Create .agents Folder Structure');

  const agentName = state.agent.metadata?.name;
  if (!agentName) {
    console_ui.error('Agent name is required');
    return state;
  }

  console_ui.info('Creating complete agent folder structure...');
  console_ui.info(
    'This includes: prompts, tools, config, api, src, tests, docs, docker, k8s'
  );

  const { createStructure } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'createStructure',
      message: 'Create complete folder structure?',
      default: true,
    },
  ]);

  if (!createStructure) {
    console_ui.warning('Skipping folder structure creation');
    return state;
  }

  // Support both .agents/ and packages/@ossa/ structures
  const { structureType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'structureType',
      message: 'Select folder structure type:',
      choices: [
        { name: 'Standard OSSA (.agents/)', value: 'standard' },
        { name: 'npm Workspace (packages/@ossa/)', value: 'workspace' },
      ],
      default: 'standard',
    },
  ]);

  const basePath =
    structureType === 'workspace'
      ? path.join(process.cwd(), 'packages', '@ossa')
      : options.directory || '.agents';

  const structureService = new AgentsFolderService();
  const structure = structureService.generateStructure(agentName, basePath);

  // Check if structure already exists
  const agentDir = path.join(basePath, agentName);
  const exists = fs.existsSync(agentDir);

  if (exists) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Folder structure already exists at ${agentDir}. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console_ui.warning('Skipping folder structure creation (already exists)');
      return state;
    }
  }

  // Create structure
  console_ui.info('Creating folder structure...');

  try {
    structureService.createStructure(structure, exists);

    // Validate structure
    const validation = structureService.validateStructure(agentDir);
    if (!validation.valid) {
      console_ui.error('Folder structure created but validation failed');
      validation.errors.forEach((error) => console_ui.error(`  - ${error}`));
      return state;
    }

    console_ui.success('Folder structure created successfully');

    // Show created structure
    console_ui.section('Created Structure');
    console.log(chalk.gray('Directories:'));
    structure.directories.forEach((dir) => {
      const relative = path.relative(process.cwd(), dir);
      console.log(chalk.gray(`  ✓ ${relative}/`));
    });

    console.log(chalk.gray('\nFiles:'));
    structure.files.forEach((file) => {
      const relative = path.relative(process.cwd(), file.path);
      console.log(chalk.gray(`  ✓ ${relative} - ${file.description}`));
    });

    console_ui.info(`\nStructure created at: ${agentDir}`);
    console_ui.info('Next: Generate OpenAPI spec from manifest');

    return state;
  } catch (error) {
    console_ui.error('Failed to create folder structure');
    console_ui.error(error instanceof Error ? error.message : String(error));
    return state;
  }
}
