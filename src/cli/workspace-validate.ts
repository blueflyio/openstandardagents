/**
 * Workspace validate – run ai.json control_primitives.run_order or built-in checks.
 * No DI, no ValidationService. Safe to import from CLI or from package consumers.
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import chalk from 'chalk';
import {
  getDefaultWorkspaceDir,
  getRequiredWorkspaceDirs,
  getWorkspacePolicyPath,
  getWorkspaceRegistryPath,
} from '../config/defaults.js';

const VALIDATE_TIMEOUT_MS = 30000;

export interface WorkspaceValidateResult {
  ok: boolean;
  results?: Array<{ script: string; status: number; duration_ms: number }>;
}

export interface WorkspaceValidateOptions {
  cwd?: string;
  json?: boolean;
  runner?: string;
}

/**
 * Run workspace validators from ai.json control_primitives.run_order, or built-in layout/registry checks.
 * Returns result; caller should process.exit(result.ok ? 0 : 1) if used as CLI.
 */
export function runWorkspaceValidate(options: WorkspaceValidateOptions = {}): WorkspaceValidateResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const cwdResolved = cwd;
  const workspaceDir = path.join(cwd, getDefaultWorkspaceDir());

  if (!fs.existsSync(workspaceDir)) {
    console.log(chalk.yellow('No .agents-workspace/ found'));
    console.log(chalk.gray('  Run `ossa workspace init` first'));
    return { ok: false };
  }

  const jsonArg = options.json ? ['--json'] : [];
  const runner = options.runner ?? process.env.OSSA_VALIDATE_RUNNER ?? 'node';
  let runOrder: string[] = [];

  const aiPath = path.join(cwd, 'ai.json');
  if (fs.existsSync(aiPath)) {
    try {
      const ai = JSON.parse(fs.readFileSync(aiPath, 'utf-8'));
      runOrder =
        ai.control_primitives?.run_order ??
        ai.control_primitives_run_order ??
        [];
    } catch {
      // ignore
    }
  }

  if (runOrder.length > 0) {
    const results: { script: string; status: number; duration_ms: number }[] = [];
    if (!options.json) {
      console.log(chalk.blue('Running workspace validators from ai.json run_order...'));
    }
    for (const script of runOrder) {
      const scriptPath = path.join(workspaceDir, script);
      const atRoot = path.join(cwd, script);
      const resolved = fs.existsSync(atRoot) ? atRoot : fs.existsSync(scriptPath) ? scriptPath : null;
      if (!resolved) {
        if (!options.json) console.log(chalk.gray(`  Skip ${script} (not found)`));
        continue;
      }
      const resolvedAbs = path.resolve(resolved);
      if (!resolvedAbs.startsWith(cwdResolved)) {
        console.error(chalk.red('Invalid script path (must be under cwd)'));
        return { ok: false, results };
      }
      const start = Date.now();
      const result = spawnSync(runner, [resolvedAbs, ...jsonArg], {
        cwd,
        stdio: 'inherit',
        encoding: 'utf-8',
        env: process.env,
        timeout: VALIDATE_TIMEOUT_MS,
      });
      const duration_ms = Date.now() - start;
      const status = result.status ?? (result.signal ? 1 : 0);
      results.push({ script, status, duration_ms });
      if (status !== 0) {
        if (options.json) console.log(JSON.stringify({ results, ok: false }));
        return { ok: false, results };
      }
    }
    if (options.json) console.log(JSON.stringify({ results, ok: true }));
    else console.log(chalk.green('Workspace validation passed'));
    return { ok: true, results };
  }

  if (!options.json) console.log(chalk.blue('Running built-in workspace checks...'));
  const dirs = getRequiredWorkspaceDirs();
  for (const d of dirs) {
    const p = path.join(workspaceDir, d);
    if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) {
      console.error(chalk.red(`Missing or not a directory: .agents-workspace/${d}`));
      return { ok: false };
    }
  }
  const registryPath = path.join(workspaceDir, getWorkspaceRegistryPath());
  const policyPath = path.join(workspaceDir, getWorkspacePolicyPath());
  if (fs.existsSync(registryPath)) {
    try {
      yaml.parse(fs.readFileSync(registryPath, 'utf-8'));
    } catch (e) {
      console.error(chalk.red('Invalid registry YAML:'), (e as Error).message);
      return { ok: false };
    }
  }
  if (fs.existsSync(policyPath)) {
    try {
      yaml.parse(fs.readFileSync(policyPath, 'utf-8'));
    } catch (e) {
      console.error(chalk.red('Invalid policy YAML:'), (e as Error).message);
      return { ok: false };
    }
  }
  if (!options.json) console.log(chalk.green('Workspace validation passed'));
  return { ok: true };
}
