#!/usr/bin/env tsx
/**
 * Quick installation and testing script for OSSA VS Code Extension
 * 
 * Replaces install-and-test.sh - shell scripts are forbidden per project policy
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const extensionDir = __dirname;

function exec(command: string, options?: { cwd?: string; stdio?: 'inherit' | 'pipe' }): string {
  try {
    return execSync(command, {
      cwd: options?.cwd || extensionDir,
      stdio: options?.stdio || 'pipe',
      encoding: 'utf8',
    }) as string;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
    throw error;
  }
}

function checkNodeVersion(): void {
  console.log('1️⃣  Checking Node.js version...');
  const version = exec('node -v', { stdio: 'pipe' });
  const majorVersion = parseInt(version.trim().replace('v', '').split('.')[0]);
  
  if (majorVersion < 18) {
    console.error(`❌ Error: Node.js 18+ required (found: ${version.trim()})`);
    process.exit(1);
  }
  console.log(`   ✅ Node.js ${version.trim()}`);
  console.log('');
}

function installDependencies(): void {
  console.log('2️⃣  Installing dependencies...');
  exec('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dependencies installed');
  console.log('');
}

function compileTypeScript(): void {
  console.log('3️⃣  Compiling TypeScript...');
  exec('npm run compile', { stdio: 'inherit' });
  console.log('   ✅ Compilation successful');
  console.log('');
}

function runLinter(): void {
  console.log('4️⃣  Running linter...');
  try {
    exec('npm run lint', { stdio: 'inherit' });
  } catch {
    console.log('   ⚠️  Linting warnings (non-fatal)');
  }
  console.log('');
}

function checkIcon(): void {
  console.log('5️⃣  Checking for extension icon...');
  const iconPath = join(extensionDir, 'images', 'icon.png');
  if (existsSync(iconPath)) {
    console.log('   ✅ Icon found at images/icon.png');
  } else {
    console.log('   ⚠️  No icon found (recommended for publishing)');
    console.log('      Create 128x128px PNG at: images/icon.png');
  }
  console.log('');
}

function packageExtension(): void {
  console.log('6️⃣  Packaging extension (optional)...');
  try {
    exec('npm run package', { stdio: 'inherit' });
    // Check for .vsix file
    const vsixFiles = exec('ls *.vsix 2>/dev/null || true', { stdio: 'pipe' });
    if (vsixFiles.trim()) {
      console.log(`   ✅ Extension packaged: ${vsixFiles.trim()}`);
    }
  } catch {
    console.log('   ℹ️  vsce not installed (optional for testing)');
    console.log('      Install with: npm install -g @vscode/vsce');
  }
  console.log('');
}

function printNextSteps(): void {
  console.log('========================================');
  console.log('✅ Setup Complete!');
  console.log('========================================');
  console.log('');
  console.log('Next steps:');
  console.log('');
  console.log('1. Test in VS Code:');
  console.log('   code .');
  console.log('   # Then press F5 to launch Extension Development Host');
  console.log('');
  console.log('2. Create a test file:');
  console.log("   echo 'apiVersion: ossa/v0.3.0' > test.ossa.yaml");
  console.log("   # Type 'ossa-agent' and press Tab");
  console.log('');
  console.log('3. Test validation:');
  console.log('   # Open test.ossa.yaml in Extension Development Host');
  console.log('   # Make intentional errors to see red squiggles');
  console.log('');
  console.log('4. Test commands:');
  console.log('   # In Extension Development Host:');
  console.log("   # Cmd+Shift+P → 'OSSA: New Agent'");
  console.log('');
  console.log('5. When ready to publish:');
  console.log('   npm run package      # Creates .vsix file');
  console.log('   vsce publish         # Publishes to marketplace');
  console.log('');
  console.log('Documentation:');
  console.log('   README.md       - User guide');
  console.log('   QUICKSTART.md   - 5-minute start');
  console.log('   DEVELOPMENT.md  - Developer guide');
  console.log('   PUBLISHING.md   - Publishing guide');
  console.log('');
  console.log('Happy OSSA development! 🚀');
}

function main(): void {
  console.log('========================================');
  console.log('OSSA VS Code Extension - Setup & Test');
  console.log('========================================');
  console.log('');

  // Check if we're in the right directory
  if (!existsSync(join(extensionDir, 'package.json'))) {
    console.error('❌ Error: Run this script from the vscode-ossa directory');
    console.error('   cd src/tools/vscode-ossa');
    process.exit(1);
  }

  checkNodeVersion();
  installDependencies();
  compileTypeScript();
  runLinter();
  checkIcon();
  packageExtension();
  printNextSteps();
}

main();

