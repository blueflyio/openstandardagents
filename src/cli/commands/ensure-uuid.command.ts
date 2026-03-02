/**
 * ossa ensure-uuid - Add metadata.uuid and metadata.machine_name to OSSA manifests
 * so every agent gets a stable UUID and Drupal-friendly machine name (card + registry).
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import type { OssaAgent } from '../../types/index.js';

const MANIFEST_NAMES = [
  'manifest.ossa.yaml',
  'manifest.ossa.yml',
  'agent.ossa.yaml',
  'agent.ossa.yml',
];

function toMachineName(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return s.slice(0, 128) || 'agent';
}

function collectManifests(inputPath: string): string[] {
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    return [];
  }
  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    return [resolved];
  }
  const out: string[] = [];
  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules' && e.name !== '.git') walk(full);
      } else if (
        e.isFile() &&
        (MANIFEST_NAMES.includes(e.name) ||
          e.name.endsWith('.ossa.yaml') ||
          e.name.endsWith('.ossa.yml'))
      ) {
        out.push(full);
      }
    }
  }
  walk(resolved);
  return out;
}

export const ensureUuidCommand = new Command('ensure-uuid')
  .description(
    'Add metadata.uuid (v4) and metadata.machine_name to OSSA manifests that lack them. Use for registry/card and Drupal integration.'
  )
  .argument('<path>', 'Path to manifest file or directory to scan')
  .option('--dry-run', 'Only print what would be changed')
  .option('--card', 'Run ossa agent-card generate for each updated manifest')
  .option('--stdout', 'Print updated YAML to stdout (single file only)')
  .addHelpText(
    'after',
    'machine_name is derived from metadata.name (lowercase, [a-z0-9_] only, max 128 chars). Card generation uses .well-known/agent-card.json in the manifest directory.'
  )
  .action(
    async (
      inputPath: string,
      opts: { dryRun?: boolean; card?: boolean; stdout?: boolean }
    ) => {
      const files = collectManifests(inputPath);
      if (files.length === 0) {
        console.error(chalk.red('No manifest file(s) found at: ' + inputPath));
        process.exit(1);
      }
      if (opts.stdout && files.length > 1) {
        console.error(
          chalk.red('--stdout is only valid for a single manifest file')
        );
        process.exit(1);
      }

      let updated = 0;
      for (const filePath of files) {
        let content: string;
        try {
          content = fs.readFileSync(filePath, 'utf-8');
        } catch (e) {
          console.error(chalk.red(`Read failed: ${filePath}`), e);
          continue;
        }

        let manifest: OssaAgent;
        try {
          manifest = yaml.load(content) as OssaAgent;
        } catch (e) {
          console.error(chalk.red(`Invalid YAML: ${filePath}`), e);
          continue;
        }

        if (!manifest || manifest.kind !== 'Agent') {
          continue;
        }

        const meta = (manifest.metadata ?? {}) as Record<string, unknown>;
        if (!meta.name || typeof meta.name !== 'string') {
          console.log(
            chalk.gray(
              `Skip (no metadata.name): ${path.relative(process.cwd(), filePath)}`
            )
          );
          continue;
        }
        const name = meta.name;
        let changed = false;
        if (!meta.uuid) {
          meta.uuid = uuidv4();
          changed = true;
        }
        if (!meta.machine_name) {
          meta.machine_name = toMachineName(name);
          changed = true;
        }
        manifest.metadata = meta as OssaAgent['metadata'];

        if (!changed) {
          console.log(
            chalk.gray(
              `Skip (has uuid + machine_name): ${path.relative(process.cwd(), filePath)}`
            )
          );
          continue;
        }

        updated++;
        const newYaml = yaml.dump(manifest, { lineWidth: -1, noRefs: true });

        if (opts.stdout) {
          process.stdout.write(newYaml);
          return;
        }

        if (opts.dryRun) {
          console.log(
            chalk.yellow(
              `Would update: ${path.relative(process.cwd(), filePath)}`
            )
          );
          console.log(chalk.gray(`  uuid: ${meta.uuid}`));
          console.log(chalk.gray(`  machine_name: ${meta.machine_name}`));
          continue;
        }

        try {
          fs.writeFileSync(filePath, newYaml, 'utf-8');
          console.log(
            chalk.green(`Updated: ${path.relative(process.cwd(), filePath)}`)
          );
          console.log(chalk.gray(`  uuid: ${String(meta.uuid)}`));
          console.log(
            chalk.gray(`  machine_name: ${String(meta.machine_name)}`)
          );
        } catch (e) {
          console.error(chalk.red(`Write failed: ${filePath}`), e);
          process.exit(1);
        }

        if (opts.card) {
          const dir = path.dirname(filePath);
          const cardPath = path.join(dir, '.well-known', 'agent-card.json');
          try {
            const { execSync } = await import('child_process');
            execSync(
              `ossa agent-card generate "${filePath}" -o "${cardPath}"`,
              {
                stdio: 'inherit',
                cwd: path.dirname(filePath),
              }
            );
          } catch (e) {
            console.error(
              chalk.yellow(`Card generate failed for ${filePath}:`),
              e
            );
          }
        }
      }

      if (updated === 0 && !opts.dryRun && !opts.stdout) {
        console.log(chalk.gray('No manifests needed updates.'));
      }
    }
  );
