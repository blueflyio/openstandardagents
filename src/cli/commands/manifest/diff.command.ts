/**
 * OSSA Manifest Diff Command
 * Show differences between manifests or against schema defaults
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

interface DiffOptions {
  schema?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  color?: boolean;
}

export const manifestDiffCommand = new Command('diff')
  .argument('<path1>', 'Path to first OSSA manifest (or only manifest if --schema)')
  .argument('[path2]', 'Path to second OSSA manifest (optional with --schema)')
  .option('--schema', 'Compare against schema defaults', false)
  .description('Show differences between manifests or against schema defaults')
  .action(
    async (path1: string, path2: string | undefined, options: DiffOptions) => {
      const useColor = shouldUseColor(options);
      const log = (msg: string, color?: (s: string) => string) => {
        if (options.quiet) return;
        const output = useColor && color ? color(msg) : msg;
        console.log(output);
      };

      try {
        const manifestRepo = container.get(ManifestRepository);
        const manifest1 = (await manifestRepo.load(path1)) as OssaAgent;

        let manifest2: OssaAgent | undefined;

        if (options.schema) {
          // Compare against schema defaults
          manifest2 = getSchemaDefaults(manifest1.apiVersion);
        } else {
          if (!path2) {
            throw new Error(
              'Second manifest path required (or use --schema to compare against defaults)'
            );
          }
          manifest2 = (await manifestRepo.load(path2)) as OssaAgent;
        }

        const differences = findDifferences(manifest1, manifest2);

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                path1,
                path2: path2 || 'schema-defaults',
                differences,
                count: differences.length,
              },
              null,
              2
            )
          );
          process.exit(ExitCode.SUCCESS);
        }

        // Human-readable output
        log(chalk.bold.blue('\nManifest Comparison\n'));
        log(chalk.yellow('━'.repeat(60)));

        log(chalk.bold('\n📄 Files:'));
        log(`   Left:  ${useColor ? chalk.cyan(path1) : path1}`);
        log(
          `   Right: ${useColor ? chalk.cyan(path2 || 'Schema defaults') : path2 || 'Schema defaults'}`
        );

        if (differences.length === 0) {
          log(chalk.green('\n✓ No differences found - manifests are identical'));
          process.exit(ExitCode.SUCCESS);
        }

        log(
          chalk.bold(`\n🔍 Found ${differences.length} difference(s):\n`)
        );

        differences.forEach((diff, index) => {
          const symbol = diff.type === 'added' ? '+' : diff.type === 'removed' ? '-' : '~';
          const color =
            diff.type === 'added'
              ? chalk.green
              : diff.type === 'removed'
                ? chalk.red
                : chalk.yellow;

          log(color(`${index + 1}. [${symbol}] ${diff.path}`));

          if (diff.type === 'changed') {
            log(color(`   Old: ${formatValue(diff.oldValue)}`));
            log(color(`   New: ${formatValue(diff.newValue)}`));
          } else if (diff.type === 'added') {
            log(color(`   Value: ${formatValue(diff.newValue)}`));
          } else if (diff.type === 'removed') {
            log(color(`   Value: ${formatValue(diff.oldValue)}`));
          }
          log('');
        });

        log(chalk.yellow('━'.repeat(60)));
        log('');

        process.exit(ExitCode.SUCCESS);
      } catch (error) {
        if (!options.quiet) {
          const errMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
          console.error(useColor ? chalk.red(errMsg) : errMsg);
        }
        process.exit(ExitCode.GENERAL_ERROR);
      }
    }
  );

interface Difference {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: any;
  newValue?: any;
}

function findDifferences(
  obj1: any,
  obj2: any,
  path: string = ''
): Difference[] {
  const diffs: Difference[] = [];

  // Get all keys from both objects
  const keys1 = new Set(Object.keys(obj1 || {}));
  const keys2 = new Set(Object.keys(obj2 || {}));
  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    // Key exists in obj1 but not obj2
    if (keys1.has(key) && !keys2.has(key)) {
      diffs.push({
        path: currentPath,
        type: 'added',
        newValue: val1,
      });
      continue;
    }

    // Key exists in obj2 but not obj1
    if (keys2.has(key) && !keys1.has(key)) {
      diffs.push({
        path: currentPath,
        type: 'removed',
        oldValue: val2,
      });
      continue;
    }

    // Both have the key - check if values differ
    if (isPrimitive(val1) || isPrimitive(val2)) {
      if (val1 !== val2) {
        diffs.push({
          path: currentPath,
          type: 'changed',
          oldValue: val2,
          newValue: val1,
        });
      }
    } else if (Array.isArray(val1) && Array.isArray(val2)) {
      // Array comparison
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diffs.push({
          path: currentPath,
          type: 'changed',
          oldValue: val2,
          newValue: val1,
        });
      }
    } else if (typeof val1 === 'object' && typeof val2 === 'object') {
      // Recursive comparison for objects
      diffs.push(...findDifferences(val1, val2, currentPath));
    }
  }

  return diffs;
}

function isPrimitive(value: any): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function formatValue(value: any): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return `{${Object.keys(value).length} keys}`;
  return String(value);
}

function getSchemaDefaults(apiVersion?: string): OssaAgent {
  // Minimal schema defaults for comparison
  return {
    apiVersion: apiVersion || 'ossa/v0.4.4',
    kind: 'Agent',
    metadata: {
      name: '',
      version: '1.0.0',
    },
    spec: {
      role: '',
      llm: {
        provider: 'openai',
        model: 'gpt-4',
      },
      tools: [],
    },
  };
}

addGlobalOptions(manifestDiffCommand);
