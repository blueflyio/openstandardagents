#!/usr/bin/env node

/**
 * OSSA Agent Migration Script
 * Migrates agents to proper OSSA taxonomy categories
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// OSSA Taxonomy mapping rules
const TAXONOMY_RULES = {
  critics: [
    'code-reviewer', 'performance-analyzer', 'quality-assessor'
  ],
  governors: [
    'audit-logger', 'auth-security-specialist', 'cert-manager',
    'compliance-auditor', 'drools-rules-expert', 'governance-enforcer',
    'opa-policy-architect', 'rbac-configurator', 'security-scanner',
    'vault-secrets-expert'
  ],
  integrators: [
    'api-connector', 'api-gateway-configurator', 'communication-multiprotocol',
    'mcp-enhanced', 'rest-api-implementer', 'schema-validator',
    'websocket-handler-expert', 'graphql-resolver-expert'
  ],
  judges: [
    'decision-engine', 'conflict-resolver', 'priority-evaluator'
  ],
  monitors: [
    'observability-agent', 'telemetry-collector', 'alert-manager',
    'prometheus-metrics-specialist', 'grafana-dashboard-architect'
  ],
  orchestrators: [
    'meta-orchestrator', 'roadmap-orchestrator', 'workflow-coordinator',
    'kubernetes-orchestrator', 'istio-mesh-architect'
  ],
  trainers: [
    'embeddings-model-trainer', 'gpu-cluster-manager', 'inference-optimizer',
    'knowledge-distillation-expert', 'llama2-fine-tuning-expert',
    'lora-training-specialist', 'mlops-pipeline-architect',
    'model-serving-specialist', 'ppo-optimization-agent',
    'training-data-curator'
  ],
  voice: [
    'speech-recognizer', 'voice-synthesizer', 'audio-processor'
  ],
  workers: [] // Default category for unmatched agents
};

class AgentMigrator {
  constructor(agentsDir = '.agents') {
    this.agentsDir = path.resolve(agentsDir);
    this.report = {
      migrated: [],
      errors: [],
      validated: [],
      missing: []
    };
  }

  /**
   * Determine the correct category for an agent
   */
  categorizeAgent(agentName) {
    for (const [category, agents] of Object.entries(TAXONOMY_RULES)) {
      if (agents.includes(agentName)) {
        return category;
      }
    }

    // Pattern-based categorization
    if (agentName.includes('security') || agentName.includes('auth') || agentName.includes('compliance')) {
      return 'governors';
    }
    if (agentName.includes('api') || agentName.includes('connector') || agentName.includes('integration')) {
      return 'integrators';
    }
    if (agentName.includes('train') || agentName.includes('model') || agentName.includes('ml') || agentName.includes('gpu')) {
      return 'trainers';
    }
    if (agentName.includes('monitor') || agentName.includes('metric') || agentName.includes('telemetry')) {
      return 'monitors';
    }
    if (agentName.includes('orchestrat') || agentName.includes('workflow')) {
      return 'orchestrators';
    }

    return 'workers'; // Default category
  }

  /**
   * Validate agent structure
   */
  validateAgent(agentPath) {
    const required = ['agent.yml', 'openapi.yaml', 'README.md'];
    const missing = [];

    for (const file of required) {
      const filePath = path.join(agentPath, file);
      if (!fs.existsSync(filePath) && !fs.existsSync(filePath.replace('.yaml', '.yml'))) {
        missing.push(file);
      }
    }

    return { valid: missing.length === 0, missing };
  }

  /**
   * Update agent.yml with category information
   */
  updateAgentConfig(agentPath, category) {
    const configPath = path.join(agentPath, 'agent.yml');

    if (fs.existsSync(configPath)) {
      try {
        const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
        config.category = category;
        config.taxonomy_version = '1.0';

        // Determine type based on category
        const typeMap = {
          critics: 'critic',
          governors: 'governor',
          integrators: 'integrator',
          judges: 'judge',
          monitors: 'monitor',
          orchestrators: 'orchestrator',
          trainers: 'trainer',
          voice: 'voice',
          workers: 'worker'
        };

        config.type = typeMap[category] || 'worker';

        fs.writeFileSync(configPath, yaml.dump(config, { indent: 2 }));
        return true;
      } catch (error) {
        console.error(`Error updating ${configPath}: ${error.message}`);
        return false;
      }
    }
    return false;
  }

  /**
   * Migrate a single agent
   */
  migrateAgent(agentName, currentPath) {
    const targetCategory = this.categorizeAgent(agentName);
    const targetPath = path.join(this.agentsDir, targetCategory, agentName);

    // Skip if already in correct location
    if (currentPath === targetPath) {
      console.log(`✅ ${agentName} already in correct category: ${targetCategory}`);
      return;
    }

    // Create target directory
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Move agent
    if (fs.existsSync(currentPath)) {
      fs.renameSync(currentPath, targetPath);
      console.log(`📦 Migrated ${agentName} to ${targetCategory}/`);

      // Update agent config
      this.updateAgentConfig(targetPath, targetCategory);

      this.report.migrated.push({
        name: agentName,
        from: currentPath,
        to: targetPath,
        category: targetCategory
      });
    }
  }

  /**
   * Scan and migrate all agents
   */
  async migrateAll() {
    console.log('🔍 Scanning agents directory...\n');

    // Find all agents
    const agents = this.findAllAgents(this.agentsDir);

    console.log(`Found ${agents.length} agents\n`);

    for (const agent of agents) {
      // Validate agent structure
      const validation = this.validateAgent(agent.path);

      if (!validation.valid) {
        console.log(`⚠️  ${agent.name} missing files: ${validation.missing.join(', ')}`);
        this.report.missing.push({
          name: agent.name,
          missing: validation.missing
        });
      } else {
        this.report.validated.push(agent.name);
      }

      // Migrate if needed
      this.migrateAgent(agent.name, agent.path);
    }

    this.generateReport();
  }

  /**
   * Find all agents in directory
   */
  findAllAgents(dir, agents = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Check if this is an agent directory
        if (fs.existsSync(path.join(itemPath, 'agent.yml'))) {
          agents.push({
            name: path.basename(itemPath),
            path: itemPath
          });
        } else {
          // Recurse into subdirectory
          this.findAllAgents(itemPath, agents);
        }
      }
    }

    return agents;
  }

  /**
   * Generate migration report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION REPORT');
    console.log('='.repeat(60));

    console.log(`\n✅ Validated: ${this.report.validated.length} agents`);
    console.log(`📦 Migrated: ${this.report.migrated.length} agents`);
    console.log(`⚠️  Missing files: ${this.report.missing.length} agents`);
    console.log(`❌ Errors: ${this.report.errors.length}`);

    if (this.report.migrated.length > 0) {
      console.log('\nMigrated agents:');
      for (const agent of this.report.migrated) {
        console.log(`  - ${agent.name} → ${agent.category}/`);
      }
    }

    if (this.report.missing.length > 0) {
      console.log('\nAgents with missing files:');
      for (const agent of this.report.missing) {
        console.log(`  - ${agent.name}: ${agent.missing.join(', ')}`);
      }
    }

    // Save report to file
    const reportPath = path.join(process.cwd(), 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📊 Full report saved to: ${reportPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const migrator = new AgentMigrator();

  console.log('🚀 OSSA Agent Migration Tool\n');

  migrator.migrateAll().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = AgentMigrator;