/**
 * Converted from monitor-activation.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash

    // FEDERATED LEARNING ACTIVATION MONITOR

    console.log('🔍 MONITORING FEDERATED LEARNING ACTIVATION...');

    // Check Qdrant status
    console.log('📊 Qdrant Status:');
    execSync('if curl -f http://localhost:6333/health >/dev/null 2>&1; then', { stdio: 'inherit' });
    console.log('✅ Qdrant is running on http://localhost:6333');
    console.log('📈 Collections:');
    execSync(
      'curl -s http://localhost:6333/collections | jq \'.result.collections[] | .name\' 2>/dev/null || echo "   No collections yet"',
      { stdio: 'inherit' }
    );
    execSync('else', { stdio: 'inherit' });
    console.log('❌ Qdrant is not ready yet');
    execSync('fi', { stdio: 'inherit' });

    console.log('');

    // Check Docker containers
    console.log('🐳 Docker Status:');
    execSync('docker ps --filter "name=qdrant-federated" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', {
      stdio: 'inherit'
    });

    console.log('');

    // Check for log files
    console.log('📝 Activation Logs:');
    execSync(
      'ls -la /Users/flux423/Sites/LLM/OSSA/logs/federated-activation-*.log 2>/dev/null || echo "   No log files yet"',
      { stdio: 'inherit' }
    );

    console.log('');

    // Check OSSA agents
    console.log('🤖 OSSA Agent Status:');
    process.chdir('/Users/flux423/Sites/LLM/OSSA');
    execSync('node dist/cli/ossa-cli.js status 2>/dev/null || echo "   OSSA CLI not ready"', { stdio: 'inherit' });

    console.log('');

    // Check agent-brain build status
    console.log('🧠 Agent-Brain Status:');
    execSync('if [ -f "/Users/flux423/Sites/LLM/common_npm/agent-brain/dist/index.js" ]; then', { stdio: 'inherit' });
    console.log('✅ Agent-Brain is built');
    execSync('else', { stdio: 'inherit' });
    console.log('⚠️ Agent-Brain needs building');
    execSync('fi', { stdio: 'inherit' });

    console.log('');
    console.log('🔄 Run this script again to check progress: ./scripts/monitor-activation.sh');
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
