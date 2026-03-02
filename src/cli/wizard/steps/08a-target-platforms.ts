/**
 * Step 8a: Target export platforms
 * Multi-select platforms and show matrix rows (what they need, folder, SDK)
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { WizardState } from '../types.js';
import { console_ui } from '../ui/console.js';
import {
  getPlatformsForExport,
  getPlatformById,
} from '../../../data/platform-matrix.js';

export async function configureTargetPlatformsStep(
  state: WizardState
): Promise<WizardState> {
  console_ui.step(9, state.totalSteps, 'Target export platforms');
  console_ui.info(
    'Select platforms you plan to export this agent to. We will show what each needs (SDK, folder, requirements).\n'
  );

  const platforms = getPlatformsForExport();
  const choices = platforms.map((p) => ({
    name: `${p.id} [${p.status}] - ${p.description.slice(0, 50)}...`,
    value: p.id,
    short: p.id,
  }));

  const { targetPlatforms } = await inquirer.prompt<{
    targetPlatforms: string[];
  }>([
    {
      type: 'checkbox',
      name: 'targetPlatforms',
      message: 'Select target platforms (space to toggle, enter to confirm):',
      choices,
      default:
        (state as WizardState & { targetPlatforms?: string[] })
          .targetPlatforms ?? [],
    },
  ]);

  const nextState = { ...state } as WizardState & {
    targetPlatforms?: string[];
  };
  nextState.targetPlatforms = targetPlatforms ?? [];

  if (nextState.targetPlatforms.length > 0) {
    console.log(chalk.cyan('\n  Summary for selected platforms:\n'));
    for (const id of nextState.targetPlatforms) {
      const p = getPlatformById(id);
      if (!p) continue;
      console.log(chalk.bold(`  ${p.name} (${p.id})`));
      console.log(chalk.gray('    What you need:'));
      p.whatTheyNeed.forEach((n) => console.log(chalk.gray(`      - ${n}`)));
      console.log(chalk.gray('    SDK / package:'));
      p.sdkNpm.forEach((s) => console.log(chalk.gray(`      - ${s}`)));
      console.log(chalk.gray('    Export: ' + p.exportHow));
      console.log('');
    }
  } else {
    console_ui.info(
      'No platforms selected. You can export later with: ossa export <manifest> --platform <id>'
    );
  }

  return nextState;
}
