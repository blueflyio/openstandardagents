/**
 * OSSA CLI Extension System
 *
 * Allows optional loading of platform-specific commands (GitLab, GitHub, etc.)
 * without polluting the core OSSA CLI namespace.
 *
 * Extensions are loaded when:
 * - OSSA_EXTENSIONS environment variable is set
 * - A .ossa-extensions.json file exists in the project
 * - The --with-extensions flag is passed
 *
 * This keeps the public OSSA CLI clean and platform-agnostic while
 * allowing internal/enterprise users to extend functionality.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles extension management
 * - Open/Closed: New extensions can be added without modifying this file
 * - Interface Segregation: OSSAExtension defines minimal contract
 * - Dependency Inversion: Extensions depend on abstract interface, not concrete implementations
 */

import { Command } from 'commander';
import chalk from 'chalk';

// ============================================================================
// Extension Interface (Interface Segregation Principle)
// ============================================================================

/**
 * Extension metadata and commands
 */
export interface OSSAExtension {
  name: string;
  description: string;
  version: string;
  commands: Command[];
}

/**
 * Extension loader function type
 */
export type ExtensionLoader = () => Promise<OSSAExtension>;

// ============================================================================
// Extension Registry (Open/Closed Principle)
// ============================================================================

/**
 * Registry of available extensions
 * New extensions can be registered without modifying existing code
 */
const extensionRegistry: Map<string, ExtensionLoader> = new Map();

/**
 * Register an extension loader
 */
export function registerExtension(name: string, loader: ExtensionLoader): void {
  extensionRegistry.set(name, loader);
}

/**
 * Get all registered extension names
 */
export function getRegisteredExtensions(): string[] {
  return Array.from(extensionRegistry.keys());
}

/**
 * Load a specific extension by name
 */
export async function loadExtension(name: string): Promise<OSSAExtension | undefined> {
  const loader = extensionRegistry.get(name);
  if (!loader) return undefined;

  try {
    return await loader();
  } catch (error) {
    if (process.env.DEBUG) {
      console.error(`Failed to load extension '${name}':`, error);
    }
    return undefined;
  }
}

// ============================================================================
// Built-in Extension Registration
// ============================================================================

// Register GitLab extension (lazy loading)
registerExtension('gitlab', async () => {
  const { loadGitLabExtension } = await import('./gitlab.extension.js');
  return loadGitLabExtension();
});

// Future extensions can be registered here:
// registerExtension('github', async () => { ... });
// registerExtension('aws', async () => { ... });

/**
 * Check if extensions should be loaded
 */
export function shouldLoadExtensions(): boolean {
  // Check environment variable
  if (process.env.OSSA_EXTENSIONS === 'true' || process.env.OSSA_EXTENSIONS === '1') {
    return true;
  }

  // Check for .ossa-extensions.json
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), '.ossa-extensions.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.enabled === true;
    }
  } catch {
    // No config file or invalid config
  }

  return false;
}

/**
 * Get list of enabled extensions
 */
export function getEnabledExtensions(): string[] {
  // Check environment variable
  const envExtensions = process.env.OSSA_EXTENSIONS_LIST;
  if (envExtensions) {
    return envExtensions.split(',').map((e) => e.trim());
  }

  // Check config file
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), '.ossa-extensions.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.extensions || [];
    }
  } catch {
    // No config file
  }

  // Default: all extensions if enabled
  return ['gitlab'];
}

/**
 * Print extension status
 */
export function printExtensionStatus(extensions: OSSAExtension[]): void {
  if (extensions.length === 0) {
    return;
  }

  console.log(chalk.gray('\nLoaded extensions:'));
  extensions.forEach((ext) => {
    console.log(chalk.gray(`  • ${ext.name} v${ext.version} - ${ext.description}`));
  });
}

/**
 * Create extension info command
 */
export function createExtensionsCommand(extensions: OSSAExtension[]): Command {
  const cmd = new Command('extensions')
    .description('Manage OSSA CLI extensions')
    .alias('ext');

  cmd
    .command('list')
    .description('List loaded extensions')
    .action(() => {
      console.log(chalk.blue('\n[LIST] OSSA CLI Extensions\n'));

      if (extensions.length === 0) {
        console.log(chalk.yellow('  No extensions loaded.'));
        console.log(chalk.gray('\n  To enable extensions:'));
        console.log(chalk.gray('    export OSSA_EXTENSIONS=true'));
        console.log(chalk.gray('    # or create .ossa-extensions.json'));
        return;
      }

      extensions.forEach((ext) => {
        console.log(chalk.cyan(`  ${ext.name} v${ext.version}`));
        console.log(chalk.gray(`    ${ext.description}`));
        console.log(chalk.gray(`    Commands: ${ext.commands.length}`));
        ext.commands.forEach((c) => {
          console.log(chalk.gray(`      • ${c.name()} - ${c.description()}`));
        });
        console.log();
      });
    });

  cmd
    .command('status')
    .description('Show extension loading status')
    .action(() => {
      const enabled = shouldLoadExtensions();
      const available = getEnabledExtensions();

      console.log(chalk.blue('\n[LIST] Extension Status\n'));
      console.log(chalk.cyan(`  Enabled: ${enabled ? 'Yes' : 'No'}`));
      console.log(chalk.cyan(`  Available: ${available.join(', ') || 'none'}`));
      console.log(chalk.cyan(`  Loaded: ${extensions.length}`));

      if (!enabled) {
        console.log(chalk.gray('\n  To enable extensions:'));
        console.log(chalk.gray('    export OSSA_EXTENSIONS=true'));
      }
    });

  return cmd;
}
