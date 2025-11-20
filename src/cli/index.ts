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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '../../package.json');
let packageJson: { version: string };
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
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
