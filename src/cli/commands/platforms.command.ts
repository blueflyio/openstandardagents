/**
 * Platforms Command - Show what creators need per platform
 * Single source of truth: src/data/platform-matrix.ts
 */

import chalk from 'chalk';
import { Command } from 'commander';
import {
  PLATFORM_MATRIX,
  QUESTIONS_WE_MIGHT_BE_MISSING,
  DEFAULT_FOLDER_STRUCTURE,
  getPlatformById,
} from '../../data/platform-matrix.js';
import { shouldUseColor } from '../utils/standard-options.js';

export const platformsCommand = new Command('platforms')
  .description(
    'Show platform matrix: what creators need, folder structure, SDKs, export/import, and how to use OSSA spec'
  )
  .option('--json', 'Output as JSON')
  .option(
    '-p, --platform <id>',
    'Show single platform by id (e.g. langchain, drupal, kagent)'
  )
  .option(
    '--questions',
    'List questions we might be missing when onboarding agents'
  )
  .option('--folder-structure', 'Show default OSSA folder structure');

platformsCommand.action(
  async (options?: {
    json?: boolean;
    platform?: string;
    questions?: boolean;
    folderStructure?: boolean;
  }) => {
    const useColor = shouldUseColor({});

    if (options?.questions) {
      if (options.json) {
        console.log(
          JSON.stringify({ questions: QUESTIONS_WE_MIGHT_BE_MISSING }, null, 2)
        );
      } else {
        console.log(
          useColor
            ? chalk.cyan('\nQuestions we might be missing\n')
            : '\nQuestions we might be missing\n'
        );
        QUESTIONS_WE_MIGHT_BE_MISSING.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q}`);
        });
        console.log('');
      }
      return;
    }

    if (options?.folderStructure) {
      if (options.json) {
        console.log(
          JSON.stringify(
            { defaultFolderStructure: DEFAULT_FOLDER_STRUCTURE },
            null,
            2
          )
        );
      } else {
        console.log(
          useColor
            ? chalk.cyan('\nDefault OSSA folder structure\n')
            : '\nDefault OSSA folder structure\n'
        );
        DEFAULT_FOLDER_STRUCTURE.forEach((line) => console.log(`  ${line}`));
        console.log('');
      }
      return;
    }

    const platformId = options?.platform;
    const list = platformId
      ? [getPlatformById(platformId)].filter(Boolean)
      : PLATFORM_MATRIX;

    if (list.length === 0) {
      console.error(
        useColor
          ? chalk.red(`Platform not found: ${platformId}`)
          : `Platform not found: ${platformId}`
      );
      process.exit(1);
    }

    if (options?.json) {
      console.log(
        JSON.stringify(
          platformId
            ? list[0]
            : {
                platforms: list,
                defaultFolderStructure: DEFAULT_FOLDER_STRUCTURE,
                questions: QUESTIONS_WE_MIGHT_BE_MISSING,
              },
          null,
          2
        )
      );
      return;
    }

    for (const p of list) {
      const entry = p!;
      console.log('');
      console.log(
        useColor
          ? chalk.bold.blue(`${entry.name} (${entry.id})`)
          : `${entry.name} (${entry.id})`
      );
      console.log(useColor ? chalk.gray(entry.description) : entry.description);
      console.log(
        useColor
          ? chalk.gray(`  Status: ${entry.status}`)
          : `  Status: ${entry.status}`
      );
      console.log(
        useColor ? chalk.cyan('  What they need:') : '  What they need:'
      );
      entry.whatTheyNeed.forEach((n) => console.log(`    - ${n}`));
      console.log(
        useColor ? chalk.cyan('  Folder structure:') : '  Folder structure:'
      );
      entry.folderStructure.forEach((f) => console.log(`    ${f}`));
      console.log(useColor ? chalk.cyan('  SDK / npm:') : '  SDK / npm:');
      entry.sdkNpm.forEach((s) => console.log(`    - ${s}`));
      console.log(useColor ? chalk.cyan('  Export:') : '  Export:');
      console.log(`    ${entry.exportHow}`);
      console.log(useColor ? chalk.cyan('  Import:') : '  Import:');
      console.log(`    ${entry.importHow}`);
      console.log(
        useColor ? chalk.cyan('  Use OSSA spec:') : '  Use OSSA spec:'
      );
      entry.specUsage.forEach((u) => console.log(`    - ${u}`));
    }
    console.log('');
  }
);
