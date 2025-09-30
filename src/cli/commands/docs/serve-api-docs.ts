/**
 * Converted from serve-api-docs.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash
    // Serve OSSA API Documentation with Redocly

    console.log('🚀 Starting OSSA API Documentation Server');
    console.log('=========================================');
    console.log('');

    // Color codes
    const GREEN = '\\033[0;32m';
    const YELLOW = '\\033[1;33m';
    const BLUE = '\\033[0;34m';
    execSync("NC='\\033[0m' # No Color", { stdio: 'inherit' });

    // Check if Redocly CLI is installed
    execSync('if ! npm list @redocly/cli >/dev/null 2>&1; then', { stdio: 'inherit' });
    console.log('-e ${YELLOW}Installing Redocly CLI...${NC}');
    execSync('npm install --save-dev @redocly/cli', { stdio: 'inherit' });
    execSync('fi', { stdio: 'inherit' });

    // Build latest documentation
    console.log('-e ${BLUE}Building API documentation...${NC}');
    execSync('npm run api:docs:build', { stdio: 'inherit' });

    // Serve the documentation
    console.log('-e ${GREEN}✅ API Documentation available at:${NC}');
    console.log('-e ${GREEN}   http://localhost:8080${NC}');
    console.log('');
    console.log('Available endpoints:');
    console.log('  - OSSA Complete API');
    console.log('  - Core Specification');
    console.log('  - ACDL Specification');
    console.log('  - Clean Architecture API');
    console.log('  - MCP Infrastructure');
    console.log('');
    console.log('Press Ctrl+C to stop the server');

    // Start simple HTTP server
    execSync('npx serve dist/api-docs -l 8080', { stdio: 'inherit' });
    console.log(chalk.green('✅ Script completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Script failed:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
