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
import { agentsMdCommand } from './commands/agents-md.command.js';
import { llmsTxtCommand } from './commands/llms-txt.command.js';
import { quickstartCommand } from './commands/quickstart.command.js';
import { dependenciesCommand } from './commands/dependencies.command.js';
import { contractCommand } from './commands/contract.command.js';
import { publishCommand } from './commands/publish.command.js';
import { searchCommand } from './commands/search.command.js';
import { installCommand } from './commands/install.command.js';
import { infoCommand } from './commands/info.command.js';
import { deployGroup } from './commands/deploy.command.js';
import { testCommand } from './commands/test.command.js';
import {
  deployCommand,
  statusCommand,
  rollbackCommand,
  stopCommand,
} from './commands/deploy.js';
import { lintCommand } from './commands/lint.command.js';
import { diffCommand } from './commands/diff.command.js';
import { agentsCommandGroup } from './commands/agents.command.js';
import { workspaceCommand } from './commands/workspace.command.js';
import { registryCommand } from './commands/registry.command.js';
import { agentCardCommand } from './commands/agent-card.command.js';
import { extensionTeamCommand } from './commands/extension-team.command.js';

// Load package.json for version (lazy to avoid Jest module resolution issues)
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get version dynamically from package.json
 * Uses multiple strategies to find package.json reliably
 */
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
      if (pkg.version) return pkg.version;
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
      if (pkg.version) return pkg.version;
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
        if (pkg.version) return pkg.version;
      } catch {
        // Continue searching
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break; // Reached root
    current = parent;
  }

  // Strategy 4: Environment variable
  if (process.env.OSSA_VERSION) {
    return process.env.OSSA_VERSION;
  }

  // Ultimate fallback - read from spec directory names
  try {
    const specDir = path.resolve(__dirname, '../../spec');
    if (fs.existsSync(specDir)) {
      const dirs = fs
        .readdirSync(specDir)
        .filter((d: string) => d.startsWith('v'))
        .sort((a: string, b: string) => b.localeCompare(a, undefined, { numeric: true }));
      if (dirs.length > 0) {
        return dirs[0].slice(1); // Remove 'v' prefix
      }
    }
  } catch {
    // Ignore
  }

  // Should never reach here if package.json exists
  throw new Error('Unable to determine OSSA version. Ensure package.json exists.');
}

program
  .name('ossa')
  .description('OSSA CLI - Open Standard for Scalable AI Agents (The OpenAPI for AI Agents)')
  .version(getVersion());

// Register commands
program.addCommand(quickstartCommand); // First for discoverability
program.addCommand(validateCommand);
program.addCommand(dependenciesCommand);
program.addCommand(contractCommand);
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
program.addCommand(agentsMdCommand);
program.addCommand(llmsTxtCommand);

// Registry commands
program.addCommand(publishCommand);
program.addCommand(searchCommand);
program.addCommand(installCommand);
program.addCommand(infoCommand);

// Register new enhanced deploy commands
program.addCommand(deployCommand);
program.addCommand(statusCommand);
program.addCommand(rollbackCommand);
program.addCommand(stopCommand);

// Register legacy deploy group for backward compatibility
program.addCommand(deployGroup);

program.addCommand(testCommand);
program.addCommand(lintCommand);
program.addCommand(diffCommand);
program.addCommand(agentsCommandGroup);

// Two-tier architecture commands
program.addCommand(workspaceCommand);
program.addCommand(registryCommand);
program.addCommand(agentCardCommand);

// Extension development commands
program.addCommand(extensionTeamCommand);

// Parse arguments - MUST be after all commands are registered
program.parse();
