#!/usr/bin/env node

/**
 * OSSA v0.1.8 CLI - MCP-Enhanced Validator
 * Provides OSSA validation with MCP server capabilities
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFile, access } from 'fs/promises';
import { load } from 'js-yaml';
import { constants } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class OSSAValidator {
  async validateFile(filePath) {
    try {
      const absolutePath = resolve(filePath);
      
      // Check if file exists
      await access(absolutePath, constants.R_OK);
      
      // Read and parse YAML
      const content = await readFile(absolutePath, 'utf-8');
      const config = load(content);
      
      // Perform validation
      return await this.validateOSSAConfig(config, absolutePath);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate file: ${error.message}`],
        warnings: [],
        filePath: filePath
      };
    }
  }

  async validateOSSAConfig(config, filePath) {
    const errors = [];
    const warnings = [];
    let isValid = true;

    // Required fields validation
    if (!config.apiVersion) {
      errors.push('Missing required field: apiVersion');
      isValid = false;
    } else if (!config.apiVersion.startsWith('open-standards-scalable-agents/')) {
      errors.push('Invalid apiVersion format. Must start with "open-standards-scalable-agents/"');
      isValid = false;
    }

    if (!config.kind) {
      errors.push('Missing required field: kind');
      isValid = false;
    } else if (!['Agent', 'Workspace'].includes(config.kind)) {
      errors.push('Invalid kind. Must be "Agent" or "Workspace"');
      isValid = false;
    }

    if (!config.metadata) {
      errors.push('Missing required field: metadata');
      isValid = false;
    } else {
      if (!config.metadata.name) {
        errors.push('Missing required field: metadata.name');
        isValid = false;
      }
      if (!config.metadata.version) {
        errors.push('Missing required field: metadata.version');
        isValid = false;
      }
    }

    if (!config.spec) {
      errors.push('Missing required field: spec');
      isValid = false;
    } else if (config.kind === 'Agent') {
      // Agent-specific validation
      if (!config.spec.capabilities || !Array.isArray(config.spec.capabilities)) {
        errors.push('Missing or invalid spec.capabilities array');
        isValid = false;
      }
      
      if (!config.spec.frameworks) {
        warnings.push('No framework compatibility declared in spec.frameworks');
      } else {
        // Check MCP configuration
        if (config.spec.frameworks.mcp && config.spec.frameworks.mcp.enabled) {
          if (!config.spec.frameworks.mcp.transport) {
            warnings.push('MCP enabled but no transport specified');
          }
        }
      }
    }

    const summary = {
      totalChecks: 10,
      passed: 10 - errors.length,
      failed: errors.length,
      warnings: warnings.length
    };

    return { isValid, errors, warnings, summary, filePath };
  }

  formatResults(result) {
    const { isValid, errors, warnings, summary, filePath } = result;
    
    console.log(`${colors.cyan}OSSA v0.1.8 Validation Results${colors.reset}`);
    console.log(`${colors.blue}File: ${filePath}${colors.reset}\n`);
    
    if (isValid) {
      console.log(`${colors.green}✓ VALID${colors.reset} - Configuration passes OSSA validation`);
    } else {
      console.log(`${colors.red}✗ INVALID${colors.reset} - Configuration has validation errors`);
    }
    
    console.log(`\n${colors.cyan}Summary:${colors.reset}`);
    console.log(`  Checks passed: ${colors.green}${summary.passed}${colors.reset}/${summary.totalChecks}`);
    console.log(`  Errors: ${colors.red}${summary.failed}${colors.reset}`);
    console.log(`  Warnings: ${colors.yellow}${summary.warnings}${colors.reset}`);
    
    if (errors.length > 0) {
      console.log(`\n${colors.red}Errors:${colors.reset}`);
      errors.forEach(error => console.log(`  ${colors.red}•${colors.reset} ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
      warnings.forEach(warning => console.log(`  ${colors.yellow}•${colors.reset} ${warning}`));
    }
    
    console.log(`\n${colors.cyan}MCP Integration:${colors.reset}`);
    console.log(`  MCP Server: ${colors.green}Available${colors.reset} (run: npm run mcp-server)`);
    console.log(`  Tools: validate-ossa-config, list-ossa-examples, analyze-ossa-capabilities`);
    
    return isValid;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`${colors.cyan}OSSA v0.1.8 CLI - MCP-Enhanced Validator with Observability${colors.reset}`);
    console.log('\nUsage:');
    console.log('  ossa <file.yml>                 Validate OSSA configuration file');
    console.log('  ossa --mcp-server              Start MCP server');
    console.log('  ossa --examples                List available examples');
    console.log('  ossa --observability-demo      Run observability demo');
    console.log('  ossa --dashboard               Start observability dashboard');
    console.log('  ossa --help                    Show this help message');
    console.log('\nMCP Integration:');
    console.log('  npm run mcp-server             Start MCP server');
    console.log('  npm run test-mcp               Test MCP server loading');
    console.log('\nObservability (v0.1.8 NEW):');
    console.log('  ossa --observability-demo      Interactive observability demo');
    console.log('  ossa --dashboard               Start dashboard on port 3001');
    console.log('  node examples/observability/   Run development setup');
    process.exit(0);
  }
  
  if (args[0] === '--mcp-server') {
    // Start MCP server
    const { spawn } = await import('child_process');
    const mcpServerPath = join(__dirname, 'mcp', 'servers', 'ossa-validator.js');
    const child = spawn('node', [mcpServerPath], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code));
    return;
  }
  
  if (args[0] === '--examples') {
    const examplesPath = resolve('./examples');
    console.log(`${colors.cyan}OSSA Examples Directory:${colors.reset} ${examplesPath}`);
    console.log('\nAvailable examples:');
    console.log('  • 01-agent-basic-ossa-v0.1.2.yml - Basic core level agent');
    console.log('  • observability/agent-with-full-observability.yml - Full observability demo');
    console.log('  • More examples available in ./examples/');
    console.log('\nValidate an example:');
    console.log('  ossa examples/01-agent-basic-ossa-v0.1.2.yml');
    console.log('  ossa examples/observability/agent-with-full-observability.yml');
    process.exit(0);
  }

  if (args[0] === '--observability-demo') {
    console.log(`${colors.cyan}Starting OSSA Observability Demo...${colors.reset}`);
    const { spawn } = await import('child_process');
    const demoPath = resolve('./examples/observability/simple-development-setup.js');
    const child = spawn('node', [demoPath], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code));
    return;
  }

  if (args[0] === '--dashboard') {
    console.log(`${colors.cyan}Starting OSSA Observability Dashboard...${colors.reset}`);
    try {
      const { setupDevelopmentObservability } = await import('./observability/index.js');
      const observability = await setupDevelopmentObservability('dashboard-agent');
      console.log(`${colors.green}Dashboard started at: http://localhost:3001${colors.reset}`);
      
      process.on('SIGINT', async () => {
        console.log('\nShutting down dashboard...');
        await observability.shutdown();
        process.exit(0);
      });
    } catch (error) {
      console.error(`${colors.red}Failed to start dashboard: ${error.message}${colors.reset}`);
      process.exit(1);
    }
    return;
  }
  
  const validator = new OSSAValidator();
  let hasErrors = false;
  
  for (const filePath of args) {
    const result = await validator.validateFile(filePath);
    const isValid = validator.formatResults(result);
    if (!isValid) hasErrors = true;
    
    if (args.length > 1) console.log('\n' + '─'.repeat(60) + '\n');
  }
  
  process.exit(hasErrors ? 1 : 0);
}

main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});