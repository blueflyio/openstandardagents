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
import { releaseCommandGroup } from './commands/release.command.js';
import { setupCommand } from './commands/setup.command.js';
import { syncCommand } from './commands/sync.command.js';

// Load package.json for version (lazy to avoid Jest module resolution issues)
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

function getVersion(): string {
  // Try multiple strategies to find package.json
  // Strategy 1: Relative to this file (for built dist)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const relativePath = path.resolve(__dirname, '../../package.json');

  if (fs.existsSync(relativePath)) {
    try {
      const content = fs.readFileSync(relativePath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.version || '0.2.3';
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 2: From current working directory
  const cwdPath = path.resolve(process.cwd(), 'package.json');
  if (fs.existsSync(cwdPath)) {
    try {
      const content = fs.readFileSync(cwdPath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.version || '0.2.3';
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 3: Search upward from cwd
  let current = process.cwd();
  for (let i = 0; i < 10; i++) {
    const candidate = path.resolve(current, 'package.json');
    if (fs.existsSync(candidate)) {
      try {
        const content = fs.readFileSync(candidate, 'utf-8');
        const pkg = JSON.parse(content);
        return pkg.version || '0.2.3';
      } catch {
        // Continue searching
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break; // Reached root
    current = parent;
  }

  // Fallback version
  return '0.2.3';
}

program
  .name('ossa')
  .description(
    'OSSA CLI - Open Standard for Scalable AI Agents (The OpenAPI for AI Agents)'
  )
  .version(getVersion());

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
program.addCommand(releaseCommandGroup);
program.addCommand(setupCommand);
program.addCommand(syncCommand);

// Parse arguments
program.parse();
