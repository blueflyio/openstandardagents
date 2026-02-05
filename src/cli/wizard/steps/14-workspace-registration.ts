/**
 * Step 14: Workspace Registration
 * Registers agent in workspace registry using OSSA workspace discover
 */

import * as path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import type { WizardState, WizardOptions } from '../types.js';
import { console_ui } from '../ui/console.js';
import { ConfigurationError, isOssaError } from '../../../errors/index.js';
import { logger } from '../../../utils/logger.js';

export async function registerWorkspaceStep(
  state: WizardState,
  options: WizardOptions
): Promise<WizardState> {
  console_ui.step(14, state.totalSteps, 'Workspace Registration');

  const agentName = state.agent.metadata?.name;
  if (!agentName) {
    console_ui.error('Agent name is required');
    return state;
  }

  console_ui.info('Registering agent in workspace registry...');
  console_ui.info('This will update .agents-workspace/registry/index.yaml');

  const { registerWorkspace } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'registerWorkspace',
      message: 'Register agent in workspace?',
      default: true,
    },
  ]);

  if (!registerWorkspace) {
    console_ui.warning('Skipping workspace registration');
    return state;
  }

  try {
    // Run OSSA workspace discover to update registry
    const cwd = process.cwd();

    // Check if workspace exists
    const workspacePath = path.join(cwd, '.agents-workspace');
    if (!require('fs').existsSync(workspacePath)) {
      console_ui.warning(
        'No workspace found. Run `ossa workspace init` first.'
      );
      const { initWorkspace } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'initWorkspace',
          message: 'Initialize workspace now?',
          default: true,
        },
      ]);

      if (initWorkspace) {
        execSync('ossa workspace init', { cwd, stdio: 'inherit' });
      } else {
        return state;
      }
    }

    // Run workspace discover to register agent
    execSync('ossa workspace discover', { cwd, stdio: 'inherit' });

    console_ui.success('Agent registered in workspace');
    console_ui.info('Run `ossa workspace list` to see all registered agents');

    return state;
  } catch (error) {
    const ossaError = isOssaError(error)
      ? error
      : new ConfigurationError('Failed to register agent in workspace', {
          originalError: error instanceof Error ? error.message : String(error),
        });
    logger.error({ err: ossaError }, 'Workspace registration failed');
    console_ui.error('Failed to register agent in workspace');
    console_ui.error(ossaError.message);
    return state;
  }
}
