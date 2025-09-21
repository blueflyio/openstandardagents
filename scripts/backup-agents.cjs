#!/usr/bin/env node

/**
 * Agent Backup Script
 *
 * Creates backups of all .agents directories before migration
 */

const fs = require('fs');
const path = require('path');

const REPOSITORIES = [
  // Common NPM packages
  '/Users/flux423/Sites/LLM/common_npm/agent-brain',
  '/Users/flux423/Sites/LLM/common_npm/agent-chat',
  '/Users/flux423/Sites/LLM/common_npm/agent-docker',
  '/Users/flux423/Sites/LLM/common_npm/agent-mesh',
  '/Users/flux423/Sites/LLM/common_npm/agent-ops',
  '/Users/flux423/Sites/LLM/common_npm/agent-protocol',
  '/Users/flux423/Sites/LLM/common_npm/agent-router',
  '/Users/flux423/Sites/LLM/common_npm/agent-studio',
  '/Users/flux423/Sites/LLM/common_npm/agent-tracer',
  '/Users/flux423/Sites/LLM/common_npm/agentic-flows',
  '/Users/flux423/Sites/LLM/common_npm/compliance-engine',
  '/Users/flux423/Sites/LLM/common_npm/doc-engine',
  '/Users/flux423/Sites/LLM/common_npm/foundation-bridge',
  '/Users/flux423/Sites/LLM/common_npm/rfp-automation',
  '/Users/flux423/Sites/LLM/common_npm/studio-ui',
  '/Users/flux423/Sites/LLM/common_npm/workflow-engine',
  // Other projects
  '/Users/flux423/Sites/LLM/agent_buildkit',
  '/Users/flux423/Sites/LLM/models/agent-studio_model',
  '/Users/flux423/Sites/LLM/models/gov-policy_model',
  '/Users/flux423/Sites/LLM/models/gov-rfp_model',
  '/Users/flux423/Sites/LLM/models/llm-platform_model',
  '/Users/flux423/Sites/LLM/.gitlab'
];

class AgentBackup {
  constructor() {
    this.backupDir = `/Users/flux423/Sites/LLM/backups/agents-${new Date().toISOString().split('T')[0]}`;
    this.report = {
      backups: [],
      errors: [],
      totalBackups: 0
    };
  }

  async createBackups() {
    console.log('🔐 Creating backups of all .agents directories');
    console.log(`📁 Backup location: ${this.backupDir}\n`);

    // Create backup directory
    fs.mkdirSync(this.backupDir, { recursive: true });

    for (const repoPath of REPOSITORIES) {
      await this.backupRepository(repoPath);
    }

    this.generateReport();
  }

  async backupRepository(repoPath) {
    const repoName = path.basename(repoPath);
    const agentsPath = path.join(repoPath, '.agents');

    if (!fs.existsSync(repoPath)) {
      console.log(`⏭️  Repository not found: ${repoName}`);
      return;
    }

    if (!fs.existsSync(agentsPath)) {
      console.log(`⏭️  No .agents folder in: ${repoName}`);
      return;
    }

    try {
      const backupPath = path.join(this.backupDir, repoName, '.agents');

      console.log(`📦 Backing up ${repoName}...`);

      // Create backup directory
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });

      // Copy entire .agents directory
      this.copyRecursive(agentsPath, backupPath);

      console.log(`   ✅ Backup completed: ${backupPath}`);

      this.report.backups.push({
        repository: repoName,
        originalPath: agentsPath,
        backupPath: backupPath,
        timestamp: new Date().toISOString()
      });

      this.report.totalBackups++;

    } catch (error) {
      console.log(`   ❌ Backup failed for ${repoName}: ${error.message}`);
      this.report.errors.push({
        repository: repoName,
        error: error.message
      });
    }
  }

  copyRecursive(src, dest) {
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      const items = fs.readdirSync(src);

      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        this.copyRecursive(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('BACKUP REPORT');
    console.log('='.repeat(50));

    console.log(`✅ Total backups created: ${this.report.totalBackups}`);
    console.log(`❌ Errors: ${this.report.errors.length}`);

    if (this.report.backups.length > 0) {
      console.log('\nBackups created:');
      for (const backup of this.report.backups) {
        console.log(`  - ${backup.repository}`);
      }
    }

    if (this.report.errors.length > 0) {
      console.log('\nErrors:');
      for (const error of this.report.errors) {
        console.log(`  - ${error.repository}: ${error.error}`);
      }
    }

    // Save report
    const reportPath = path.join(this.backupDir, 'backup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📋 Backup report saved to: ${reportPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const backup = new AgentBackup();

  backup.createBackups().catch(error => {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  });
}

module.exports = AgentBackup;