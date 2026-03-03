#!/usr/bin/env npx tsx
/**
 * OpenAPI validate-all: API-first validation pipeline
 * 1. Spectral lint (OpenAPI 3.x structure) via config/linting/.spectral.yaml
 * 2. OSSA extensions validation via validate-openapi-extensions
 *
 * Reads openapi/registry.yaml as single source of truth; falls back to glob.
 * Exit 1 if any spec fails. No stubs; production validation.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { parse as parseYaml } from 'yaml';
import chalk from 'chalk';

const CWD = process.cwd();
const REGISTRY_PATH = resolve(CWD, 'openapi/registry.yaml');
const RULESET_PATH = resolve(CWD, 'config/linting/.spectral.yaml');
const OSSA_VALIDATOR = resolve(
  CWD,
  'src/tools/validation/validate-openapi-extensions.ts'
);

interface RegistrySpec {
  path: string;
}

interface Registry {
  specs?: RegistrySpec[];
}

function getSpecPaths(): string[] {
  if (existsSync(REGISTRY_PATH)) {
    const content = readFileSync(REGISTRY_PATH, 'utf-8');
    const doc = parseYaml(content) as Registry;
    if (Array.isArray(doc?.specs)) {
      const paths = doc.specs
        .map((s) => (typeof s.path === 'string' ? s.path : ''))
        .filter(Boolean)
        .map((p) => resolve(CWD, p));
      const existing = paths.filter((p) => existsSync(p));
      if (existing.length === 0) {
        console.error(chalk.red('Registry has no existing spec paths'));
        process.exit(2);
      }
      return existing;
    }
  }
  const out: string[] = [];
  function walk(dir: string): void {
    let entries: { name: string; isFile: () => boolean }[];
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as {
        name: string;
        isFile: () => boolean;
      }[];
    } catch {
      return;
    }
    for (const e of entries) {
      const full = resolve(dir, e.name);
      if (e.name === 'node_modules') continue;
      if (e.isFile() && /\.(yaml|yml)$/i.test(e.name)) {
        out.push(full);
      } else if (!e.isFile()) {
        walk(full);
      }
    }
  }
  walk(resolve(CWD, 'openapi'));
  return out.sort();
}

function runSpectral(specPaths: string[]): boolean {
  if (!existsSync(RULESET_PATH)) {
    console.warn(
      chalk.yellow(
        'Ruleset not found: config/linting/.spectral.yaml, skipping Spectral'
      )
    );
    return true;
  }
  console.log(chalk.cyan('Spectral lint (OpenAPI 3.x structure)...'));
  try {
    execSync(
      `npx @stoplight/spectral-cli lint --ruleset "${RULESET_PATH}" ${specPaths.map((p) => `"${p}"`).join(' ')}`,
      { stdio: 'inherit', cwd: CWD, shell: true }
    );
    return true;
  } catch {
    return false;
  }
}

function runOssaExtensions(specPaths: string[]): boolean {
  if (!existsSync(OSSA_VALIDATOR)) {
    console.warn(
      chalk.yellow('OSSA validator not found, skipping OSSA extensions')
    );
    return true;
  }
  console.log(chalk.cyan('OSSA OpenAPI extensions validation...'));
  try {
    const relPaths = specPaths.map((p) =>
      p.replace(CWD + '/', '').replace(CWD + '\\', '')
    );
    execSync(
      `npx tsx "${OSSA_VALIDATOR}" ${relPaths.map((p) => `"${p}"`).join(' ')}`,
      { stdio: 'inherit', cwd: CWD, shell: true }
    );
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  console.log(chalk.bold('OpenAPI validate-all (API-first, all specs)\n'));
  const specPaths = getSpecPaths();
  console.log(chalk.gray(`Specs: ${specPaths.length}\n`));

  const spectralOk = runSpectral(specPaths);
  console.log('');
  const ossaOk = runOssaExtensions(specPaths);

  if (!spectralOk) {
    console.warn(
      chalk.yellow(
        '\nSpectral lint had issues (e.g. unresolved $ref). OSSA extension validation is the gate.'
      )
    );
  }
  if (!ossaOk) {
    console.error(chalk.red('\nOpenAPI validation failed (OSSA extensions)'));
    process.exit(1);
  }
  console.log(chalk.green('\nAll OpenAPI specs valid'));
}

main();
