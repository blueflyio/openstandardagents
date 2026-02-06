#!/usr/bin/env node

/**
 * OSSA CLI - Open Standard for Software Agents (The OpenAPI for agents)
 * Main CLI entry point
 *
 * This CLI contains ONLY platform-agnostic OSSA commands.
 * Platform-specific commands (GitLab, GitHub) are available via extensions.
 *
 * To enable extensions:
 *   export OSSA_EXTENSIONS=true
 *   export OSSA_EXTENSIONS_LIST=gitlab
 *
 * Or create .ossa-extensions.json:
 *   { "enabled": true, "extensions": ["gitlab"] }
 */

import { program } from 'commander';
import 'reflect-metadata';
import { initializeAdapters } from '../adapters/index.js';

// Core OSSA commands (platform-agnostic)
import { agentCardCommand } from './commands/agent-card.command.js';
import { agentsMdCommand } from './commands/agents-md.command.js';
import { agentsCommandGroup } from './commands/agents.command.js';
import { complianceCommand } from './commands/compliance.command.js';
import { conformanceCommand } from './commands/conformance.command.js';
import { governanceCommand } from './commands/governance.command.js';
import { contractCommand } from './commands/contract.command.js';
import { dependenciesCommand } from './commands/dependencies.command.js';
import {
  deployCommand,
  rollbackCommand,
  statusCommand,
  stopCommand,
} from './commands/deploy.js';
import { diffCommand } from './commands/diff.command.js';
import { exportCommand } from './commands/export.command.js';
import { extensionTeamCommand } from './commands/extension-team.command.js';
import { generateCommand } from './commands/generate.command.js';
import { importCommand } from './commands/import.command.js';
import { infoCommand } from './commands/info.command.js';
import { initCommand } from './commands/init.command.js';
import { scaffoldCommand } from './commands/scaffold.command.js';
import { wizardCommand } from './commands/wizard.command.js';
import { wizardAPIFirstCommand } from './commands/wizard-api-first.command.js';
import { installCommand } from './commands/install.command.js';
import { lintCommand } from './commands/lint.command.js';
import { standardizeCommand } from './commands/standardize.command.js';
import { llmsTxtCommand } from './commands/llms-txt.command.js';
import { migrateCommand } from './commands/migrate.command.js';
import { buildCommand } from './commands/build.command.js';
import { migrateBatchCommand } from './commands/migrate-batch.command.js';
import { publishCommand } from './commands/publish.command.js';
import { quickstartCommand } from './commands/quickstart.command.js';
import { registryCommand } from './commands/registry.command.js';
import { runCommand } from './commands/run.command.js';
import { schemaCommand } from './commands/schema.command.js';
import { searchCommand } from './commands/search.command.js';
import { updateCommand } from './commands/update.command.js';
import { setupCommand } from './commands/setup.command.js';
import { testCommand } from './commands/test.command.js';
import { validateCommand } from './commands/validate.command.js';

// Registry commands (GAID/DID)
import { generateGaidCommand } from './commands/generate-gaid.command.js';
import { registerCommand } from './commands/register.js';
import { discoverCommand } from './commands/discover.js';
import { verifyCommand } from './commands/verify.js';
import { workspaceCommand } from './commands/workspace.command.js';
import { taxonomyCommandGroup } from './commands/taxonomy.command.js';
import { skillsCommandGroup } from './commands/skills.command.js';
import { templateCommandGroup } from './commands/template.command.js';

// Framework integration commands
import { langflowCommand } from './commands/langflow.command.js';
import { langchainCommand } from './commands/langchain.command.js';
import { frameworkCommand } from './commands/framework.command.js';

// Additional commands (previously unregistered)
import { agentCreateCommand } from './commands/agent-create.command.js';
import { agentWizardCommand } from './commands/agent-wizard.command.js';
import { docsCommand } from './commands/docs.command.js';
import { enhanceCommand } from './commands/enhance.command.js';
import { examplesCommand } from './commands/examples.command.js';
import { knowledgeCommandGroup } from './commands/knowledge.command.js';
// Note: knowledge-index and knowledge-query are subcommands within knowledgeCommandGroup
import { migrateLangchainCommand } from './commands/migrate-langchain.command.js';
import { releaseCommand } from './commands/release.command.js';
import { serveCommand } from './commands/serve.command.js';
import { devCommand } from './commands/dev.command.js';
import { syncCommand } from './commands/sync.command.js';
import { createAuditCommand } from './commands/audit.js';
import { estimateCommand } from './commands/estimate.command.js';
import { upgradeCommand } from './commands/upgrade.command.js';

// Extension system (SOLID: Open/Closed via registry pattern)
import {
  shouldLoadExtensions,
  getEnabledExtensions,
  createExtensionsCommand,
  loadExtension,
  getRegisteredExtensions,
  type OSSAExtension,
} from './extensions/index.js';

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
        .sort((a: string, b: string) =>
          b.localeCompare(a, undefined, { numeric: true })
        );
      if (dirs.length > 0) {
        return dirs[0].slice(1); // Remove 'v' prefix
      }
    }
  } catch {
    // Ignore
  }

  // Should never reach here if package.json exists
  throw new Error(
    'Unable to determine OSSA version. Ensure package.json exists.'
  );
}

program
  .name('ossa')
  .description(
    'OSSA CLI - Open Standard for Software Agents (The OpenAPI for agents)'
  )
  .version(getVersion());

// ============================================================================
// Initialize Export Adapters
// ============================================================================
initializeAdapters();

// ============================================================================
// Register Core OSSA Commands (Platform-Agnostic)
// ============================================================================

program.addCommand(quickstartCommand); // First for discoverability
program.addCommand(validateCommand);

// Agent Registry commands (GAID/DID - Issue #391)
program.addCommand(generateGaidCommand);
program.addCommand(registerCommand);
program.addCommand(discoverCommand);
program.addCommand(verifyCommand);

program.addCommand(conformanceCommand);
program.addCommand(complianceCommand);
program.addCommand(governanceCommand);
program.addCommand(dependenciesCommand);
program.addCommand(contractCommand);
program.addCommand(generateCommand);
program.addCommand(migrateCommand);
program.addCommand(migrateBatchCommand);
program.addCommand(upgradeCommand);
program.addCommand(initCommand);
program.addCommand(scaffoldCommand);
program.addCommand(wizardCommand);
program.addCommand(wizardAPIFirstCommand);
program.addCommand(exportCommand);
program.addCommand(importCommand);
program.addCommand(schemaCommand);
program.addCommand(runCommand);
program.addCommand(setupCommand);
program.addCommand(agentsMdCommand);
program.addCommand(llmsTxtCommand);

// Registry commands
program.addCommand(publishCommand);
program.addCommand(searchCommand);
program.addCommand(installCommand);
program.addCommand(updateCommand);
program.addCommand(infoCommand);

// Deploy commands
program.addCommand(deployCommand);
program.addCommand(statusCommand);
program.addCommand(rollbackCommand);
program.addCommand(stopCommand);
// deployGroup removed - using deployCommand from deploy.js instead

// Quality commands
program.addCommand(testCommand);
program.addCommand(lintCommand);
program.addCommand(standardizeCommand);
program.addCommand(diffCommand);

// Cost estimation
program.addCommand(estimateCommand);

// Agent management
program.addCommand(agentsCommandGroup);

// Taxonomy commands
program.addCommand(taxonomyCommandGroup);

// Claude Skills commands
program.addCommand(skillsCommandGroup);
program.addCommand(templateCommandGroup);

// Two-tier architecture commands
program.addCommand(workspaceCommand);
program.addCommand(registryCommand);
program.addCommand(agentCardCommand);

// Extension development commands
program.addCommand(extensionTeamCommand);

// Framework integration commands
program.addCommand(langflowCommand);
program.addCommand(langchainCommand);
program.addCommand(frameworkCommand);

// Previously unregistered commands - now registered
program.addCommand(buildCommand); // Was imported but never registered!
program.addCommand(agentCreateCommand);
program.addCommand(agentWizardCommand);
program.addCommand(docsCommand);
program.addCommand(enhanceCommand);
program.addCommand(examplesCommand);
program.addCommand(knowledgeCommandGroup); // Includes index and query subcommands
program.addCommand(migrateLangchainCommand);
program.addCommand(releaseCommand);
program.addCommand(serveCommand);
program.addCommand(devCommand); // Development server with hot reload
program.addCommand(syncCommand);
program.addCommand(createAuditCommand());

// ============================================================================
// Extension Loading
// ============================================================================

/**
 * Load and register platform-specific extensions
 * Uses the extension registry pattern (Open/Closed Principle)
 */
async function loadExtensions(): Promise<OSSAExtension[]> {
  const extensions: OSSAExtension[] = [];

  if (!shouldLoadExtensions()) {
    return extensions;
  }

  const enabled = getEnabledExtensions();
  const registered = getRegisteredExtensions();

  for (const extName of enabled) {
    // Only load extensions that are registered
    if (!registered.includes(extName)) {
      if (process.env.DEBUG) {
        console.warn(`Extension '${extName}' is not registered`);
      }
      continue;
    }

    const ext = await loadExtension(extName);
    if (ext) {
      extensions.push(ext);

      // Register extension commands
      for (const cmd of ext.commands) {
        program.addCommand(cmd);
      }
    }
  }

  return extensions;
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  // Load extensions if enabled
  const extensions = await loadExtensions();

  // Add extensions command (always available to show extension status)
  program.addCommand(createExtensionsCommand(extensions));

  // Parse arguments - MUST be after all commands are registered
  program.parse();
}

// Run CLI
main().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});
