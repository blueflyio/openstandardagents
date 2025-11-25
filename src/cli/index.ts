#!/usr/bin/env node

/**
 * OSSA CLI - Open Standard for Scalable AI Agents
 * Main CLI entry point
 */

import 'reflect-metadata';
import { program } from 'commander';
import { validateCommand } from './commands/validate.command.js';
import { generateCommand } from './commands/generate.command.js';
import { migrateCommand } from './commands/migrate.command.js';
import { initCommand } from './commands/init.command.js';
import { exportCommand } from './commands/export.command.js';
import { importCommand } from './commands/import.command.js';
import { schemaCommand } from './commands/schema.command.js';
import { runCommand } from './commands/run.command.js';
import { gitlabAgentCommand } from './commands/gitlab-agent.command.js';

// Load package.json for version
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

function findPackageJson(): string | null {
  // Try multiple strategies to find package.json
  // Strategy 1: Relative to this file (for built dist)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const relativePath = path.resolve(__dirname, '../../package.json');
  if (fs.existsSync(relativePath)) {
    return relativePath;
  }
  
  // Strategy 2: From current working directory
  const cwdPath = path.resolve(process.cwd(), 'package.json');
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }
  
  // Strategy 3: Search upward from cwd
  let current = process.cwd();
  for (let i = 0; i < 10; i++) {
    const candidate = path.resolve(current, 'package.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break; // Reached root
    current = parent;
  }
  
  // Not found
  return null;
}

let packageJson: { version: string };
try {
  const packageJsonPath = findPackageJson();
  if (packageJsonPath && fs.existsSync(packageJsonPath)) {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  } else {
    // Fallback if package.json can't be found
    packageJson = { version: '0.2.3' };
  }
} catch (error) {
  // Fallback if package.json can't be read
  packageJson = { version: '0.2.3' };
}

program
  .name('ossa')
  .description(
    'OSSA CLI - Open Standard for Scalable AI Agents (The OpenAPI for AI Agents)'
  )
  .version(packageJson.version);

// Register commands
program.addCommand(validateCommand);
program.addCommand(generateCommand);
program.addCommand(migrateCommand);
program.addCommand(initCommand);
program.addCommand(exportCommand);
program.addCommand(importCommand);
program.addCommand(schemaCommand);
program.addCommand(runCommand);
program.addCommand(gitlabAgentCommand);

// Parse arguments
program.parse();
