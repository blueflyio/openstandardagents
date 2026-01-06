/**
 * OSSA Diff Command
 * Compare OSSA agent manifests between files or git references
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { GitService } from '../../services/git.service.js';
import type { OssaAgent } from '../../types/index.js';

interface DiffResult {
  breaking: boolean;
  changes: Array<{
    type: 'added' | 'removed' | 'modified';
    path: string;
    oldValue?: any;
    newValue?: any;
    message: string;
  }>;
}

function deepDiff(obj1: any, obj2: any, prefix = ''): DiffResult['changes'] {
  const changes: DiffResult['changes'] = [];
  const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    if (!(key in obj1)) {
      changes.push({
        type: 'added',
        path,
        newValue: val2,
        message: `Added: ${path}`,
      });
    } else if (!(key in obj2)) {
      changes.push({
        type: 'removed',
        path,
        oldValue: val1,
        message: `Removed: ${path}`,
      });
    } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null && !Array.isArray(val1) && !Array.isArray(val2)) {
      changes.push(...deepDiff(val1, val2, path));
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      changes.push({
        type: 'modified',
        path,
        oldValue: val1,
        newValue: val2,
        message: `Modified: ${path}`,
      });
    }
  }

  return changes;
}

function isBreakingChange(change: DiffResult['changes'][0]): boolean {
  // Breaking changes: removed fields, modified required fields, type changes
  if (change.type === 'removed') return true;
  if (change.path.includes('metadata.name') || change.path.includes('metadata.version')) return true;
  if (change.path.includes('spec.role')) return true;
  if (change.path.includes('apiVersion')) return true;
  return false;
}


export const diffCommand = new Command('diff')
  .argument('<path1>', 'First manifest path or git ref (e.g., main:path/to/file.yaml)')
  .argument('[path2]', 'Second manifest path or git ref (default: current file)')
  .option('--breaking-only', 'Show only breaking changes')
  .option('--format <format>', 'Output format (default, json)', 'default')
  .option('-o, --output <file>', 'Output file (for json format)')
  .description('Compare OSSA agent manifests between versions')
  .action(
    async (
      path1: string,
      path2: string | undefined,
      options: {
        breakingOnly?: boolean;
        format?: string;
        output?: string;
      }
    ) => {
      try {
        const manifestRepo = container.get(ManifestRepository);
        const gitService = container.get(GitService);

        // Parse git refs (format: ref:path)
        let manifest1: OssaAgent;
        let manifest2: OssaAgent | undefined;
        let filePath1: string;
        let filePath2: string | undefined;

        // Load first manifest
        const gitRef1 = gitService.parseRefString(path1);
        if (gitRef1) {
          try {
            manifest1 = gitService.loadManifestFromRef(gitRef1.ref, gitRef1.filePath);
            filePath1 = `${gitRef1.ref}:${gitRef1.filePath}`;
          } catch (error) {
            console.error(
              chalk.red(`Failed to load ${path1} from git: ${error instanceof Error ? error.message : String(error)}`)
            );
            process.exit(1);
          }
        } else {
          manifest1 = await manifestRepo.load(path1);
          filePath1 = path1;
        }

        // Load second manifest
        if (path2) {
          const gitRef2 = gitService.parseRefString(path2);
          if (gitRef2) {
            try {
              manifest2 = gitService.loadManifestFromRef(gitRef2.ref, gitRef2.filePath);
              filePath2 = `${gitRef2.ref}:${gitRef2.filePath}`;
            } catch (error) {
              console.error(
                chalk.red(`Failed to load ${path2} from git: ${error instanceof Error ? error.message : String(error)}`)
              );
              process.exit(1);
            }
          } else {
            manifest2 = await manifestRepo.load(path2);
            filePath2 = path2;
          }
        } else {
          // Compare with current file
          manifest2 = await manifestRepo.load(filePath1);
          filePath2 = filePath1;
        }

        // Compute diff
        const changes = deepDiff(manifest1, manifest2);
        const breakingChanges = changes.filter(isBreakingChange);
        const result: DiffResult = {
          breaking: breakingChanges.length > 0,
          changes: options.breakingOnly ? breakingChanges : changes,
        };

        // Output results
        if (options.format === 'json') {
          const output = JSON.stringify(result, null, 2);
          if (options.output) {
            fs.writeFileSync(options.output, output);
            console.log(chalk.green(`Results written to ${options.output}`));
          } else {
            console.log(output);
          }
        } else {
          console.log(chalk.blue(`\nComparing manifests:`));
          console.log(`  ${chalk.cyan(filePath1)}`);
          console.log(`  ${chalk.cyan(filePath2 || filePath1)}\n`);

          if (result.changes.length === 0) {
            console.log(chalk.green('No differences found'));
          } else {
            if (result.breaking) {
              console.log(chalk.red(`[WARN]  ${breakingChanges.length} breaking change(s) detected\n`));
            }

            console.log(chalk.blue(`Found ${result.changes.length} change(s):\n`));

            for (const change of result.changes) {
              const color =
                change.type === 'added'
                  ? chalk.green
                  : change.type === 'removed'
                    ? chalk.red
                    : chalk.yellow;
              const icon = change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~';
              const breaking = isBreakingChange(change) ? chalk.red(' [BREAKING]') : '';

              console.log(color(`${icon} ${change.message}${breaking}`));
              if (change.oldValue !== undefined && change.newValue !== undefined) {
                console.log(chalk.gray(`    Old: ${JSON.stringify(change.oldValue)}`));
                console.log(chalk.gray(`    New: ${JSON.stringify(change.newValue)}`));
              } else if (change.oldValue !== undefined) {
                console.log(chalk.gray(`    Value: ${JSON.stringify(change.oldValue)}`));
              } else if (change.newValue !== undefined) {
                console.log(chalk.gray(`    Value: ${JSON.stringify(change.newValue)}`));
              }
            }

            if (result.breaking) {
              console.log(chalk.red(`\n[WARN]  Breaking changes detected - migration may be required`));
            }
          }
        }

        process.exit(result.breaking ? 1 : 0);
      } catch (error: any) {
        console.error(chalk.red('[ERROR]'), error.message);
        if (error.stack) {
          console.error(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    }
  );
