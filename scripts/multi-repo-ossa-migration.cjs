#!/usr/bin/env node

/**
 * Multi-Repository OSSA Taxonomy Migration Script
 *
 * This script applies the OSSA taxonomy standard to multiple repositories
 * by organizing agents into the proper categories and copying necessary
 * documentation and structure.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Repository paths from the user request
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

// OSSA taxonomy categories
const OSSA_CATEGORIES = [
  'critics',      // code review
  'governors',    // security/compliance
  'integrators',  // API/protocol
  'judges',       // decision-making
  'monitors',     // observation
  'orchestrators', // workflow
  'trainers',     // ML/AI
  'voice',        // speech
  'workers'       // task execution
];

// Enhanced OSSA Taxonomy mapping rules
const TAXONOMY_RULES = {
  critics: [
    'code-reviewer', 'performance-analyzer', 'quality-assessor', 'code-quality',
    'security-reviewer', 'architecture-reviewer', 'test-coverage-analyzer'
  ],
  governors: [
    'audit-logger', 'auth-security-specialist', 'cert-manager', 'compliance-auditor',
    'drools-rules-expert', 'governance-enforcer', 'opa-policy-architect',
    'rbac-configurator', 'security-scanner', 'vault-secrets-expert',
    'policy-enforcer', 'compliance-engine', 'security-agent', 'auth-manager'
  ],
  integrators: [
    'api-connector', 'api-gateway-configurator', 'communication-multiprotocol',
    'mcp-enhanced', 'rest-api-implementer', 'schema-validator',
    'websocket-handler-expert', 'graphql-resolver-expert', 'protocol-bridge',
    'api-integrator', 'connector', 'integration-specialist', 'gateway'
  ],
  judges: [
    'decision-engine', 'conflict-resolver', 'priority-evaluator', 'assessor',
    'quality-judge', 'performance-judge', 'compliance-judge'
  ],
  monitors: [
    'observability-agent', 'telemetry-collector', 'alert-manager',
    'prometheus-metrics-specialist', 'grafana-dashboard-architect',
    'system-monitor', 'performance-monitor', 'health-monitor', 'tracer'
  ],
  orchestrators: [
    'meta-orchestrator', 'roadmap-orchestrator', 'workflow-coordinator',
    'kubernetes-orchestrator', 'istio-mesh-architect', 'workflow-engine',
    'orchestrator', 'coordinator', 'workflow-specialist', 'flow-coordinator'
  ],
  trainers: [
    'embeddings-model-trainer', 'gpu-cluster-manager', 'inference-optimizer',
    'knowledge-distillation-expert', 'llama2-fine-tuning-expert',
    'lora-training-specialist', 'mlops-pipeline-architect',
    'model-serving-specialist', 'ppo-optimization-agent',
    'training-data-curator', 'model-trainer', 'ml-trainer', 'ai-trainer'
  ],
  voice: [
    'speech-recognizer', 'voice-synthesizer', 'audio-processor',
    'voice-assistant', 'speech-to-text', 'text-to-speech'
  ],
  workers: [] // Default category for unmatched agents
};

class MultiRepoOSSAMigrator {
  constructor(ossaSourceDir = '/Users/flux423/Sites/LLM/OSSA') {
    this.ossaSourceDir = ossaSourceDir;
    this.globalReport = {
      repositories: [],
      totalAgentsMigrated: 0,
      totalRepositoriesProcessed: 0,
      errors: [],
      summary: {}
    };
  }

  /**
   * Main migration function for all repositories
   */
  async migrateAllRepositories() {
    console.log('🚀 Starting Multi-Repository OSSA Taxonomy Migration\n');
    console.log('='.repeat(70));

    for (const repoPath of REPOSITORIES) {
      await this.migrateRepository(repoPath);
    }

    this.generateGlobalReport();
  }

  /**
   * Migrate a single repository
   */
  async migrateRepository(repoPath) {
    const repoName = path.basename(repoPath);
    console.log(`\n📦 Processing repository: ${repoName}`);
    console.log(`   Path: ${repoPath}`);

    // Check if repository exists
    if (!fs.existsSync(repoPath)) {
      console.log(`   ❌ Repository not found: ${repoPath}`);
      this.globalReport.errors.push({
        repository: repoName,
        error: 'Repository not found',
        path: repoPath
      });
      return;
    }

    const agentsPath = path.join(repoPath, '.agents');

    // Check if .agents folder exists
    if (!fs.existsSync(agentsPath)) {
      console.log(`   ⏭️  No .agents folder found, skipping`);
      return;
    }

    console.log(`   ✅ Found .agents folder`);

    const repoReport = {
      name: repoName,
      path: repoPath,
      agentsPath,
      agentsMigrated: [],
      errors: [],
      ossaStructureCreated: false,
      documentationCopied: false
    };

    try {
      // Step 1: Analyze current structure
      console.log(`   🔍 Analyzing current agent structure...`);
      const currentAgents = this.discoverAgents(agentsPath);
      console.log(`   📊 Found ${currentAgents.length} agents`);

      // Step 2: Create OSSA directory structure
      console.log(`   🏗️  Creating OSSA taxonomy structure...`);
      this.createOSSAStructure(agentsPath);
      repoReport.ossaStructureCreated = true;

      // Step 3: Copy OSSA documentation and registry
      console.log(`   📚 Copying OSSA documentation...`);
      this.copyOSSADocumentation(agentsPath);
      repoReport.documentationCopied = true;

      // Step 4: Migrate agents to proper categories
      console.log(`   🔄 Migrating agents to taxonomy categories...`);
      for (const agent of currentAgents) {
        const result = this.migrateAgent(agent, agentsPath);
        if (result.success) {
          repoReport.agentsMigrated.push(result);
          this.globalReport.totalAgentsMigrated++;
        } else {
          repoReport.errors.push(result);
        }
      }

      // Step 5: Create/update registry for this repository
      console.log(`   📋 Creating repository-specific registry...`);
      this.createRepositoryRegistry(agentsPath, repoReport.agentsMigrated, repoName);

      console.log(`   ✅ Migration completed for ${repoName}`);
      console.log(`      - Agents migrated: ${repoReport.agentsMigrated.length}`);
      console.log(`      - Errors: ${repoReport.errors.length}`);

    } catch (error) {
      console.log(`   ❌ Error migrating ${repoName}: ${error.message}`);
      repoReport.errors.push({
        type: 'migration_error',
        message: error.message,
        stack: error.stack
      });
    }

    this.globalReport.repositories.push(repoReport);
    this.globalReport.totalRepositoriesProcessed++;
  }

  /**
   * Discover agents in a repository
   */
  discoverAgents(agentsPath) {
    const agents = [];

    const findAgentsRecursive = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);

        if (fs.statSync(itemPath).isDirectory()) {
          // Check if this directory is an agent (has agent.yml)
          const agentConfigPath = path.join(itemPath, 'agent.yml');
          if (fs.existsSync(agentConfigPath)) {
            agents.push({
              name: item,
              path: itemPath,
              relativePath: relativePath,
              configPath: agentConfigPath
            });
          } else {
            // Recursively search subdirectories
            findAgentsRecursive(itemPath, relativePath);
          }
        }
      }
    };

    if (fs.existsSync(agentsPath)) {
      findAgentsRecursive(agentsPath);
    }

    return agents;
  }

  /**
   * Create OSSA taxonomy directory structure
   */
  createOSSAStructure(agentsPath) {
    for (const category of OSSA_CATEGORIES) {
      const categoryPath = path.join(agentsPath, category);
      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
      }
    }
  }

  /**
   * Copy OSSA documentation and reference files
   */
  copyOSSADocumentation(agentsPath) {
    const sourceDocPath = path.join(this.ossaSourceDir, '.agents', 'README.md');
    const sourceRegistryPath = path.join(this.ossaSourceDir, '.agents', 'registry.yml');

    // Copy main README
    if (fs.existsSync(sourceDocPath)) {
      const targetDocPath = path.join(agentsPath, 'README.md');
      fs.copyFileSync(sourceDocPath, targetDocPath);
    }

    // Copy reference examples for each category
    for (const category of OSSA_CATEGORIES) {
      const sourceCategoryPath = path.join(this.ossaSourceDir, '.agents', category);
      const targetCategoryPath = path.join(agentsPath, category);

      if (fs.existsSync(sourceCategoryPath)) {
        // Copy README if exists
        const categoryReadmePath = path.join(sourceCategoryPath, 'README.md');
        if (fs.existsSync(categoryReadmePath)) {
          fs.copyFileSync(categoryReadmePath, path.join(targetCategoryPath, 'README.md'));
        }
      }
    }
  }

  /**
   * Categorize an agent based on name and content
   */
  categorizeAgent(agentName, agentConfig = null) {
    const lowerName = agentName.toLowerCase();

    // First check explicit rules
    for (const [category, agents] of Object.entries(TAXONOMY_RULES)) {
      if (agents.some(agent => lowerName.includes(agent.toLowerCase()))) {
        return category;
      }
    }

    // Pattern-based categorization
    if (lowerName.includes('security') || lowerName.includes('auth') ||
        lowerName.includes('compliance') || lowerName.includes('policy') ||
        lowerName.includes('governance') || lowerName.includes('audit')) {
      return 'governors';
    }

    if (lowerName.includes('api') || lowerName.includes('connector') ||
        lowerName.includes('integration') || lowerName.includes('protocol') ||
        lowerName.includes('gateway') || lowerName.includes('bridge')) {
      return 'integrators';
    }

    if (lowerName.includes('train') || lowerName.includes('model') ||
        lowerName.includes('ml') || lowerName.includes('ai') ||
        lowerName.includes('gpu') || lowerName.includes('inference')) {
      return 'trainers';
    }

    if (lowerName.includes('monitor') || lowerName.includes('metric') ||
        lowerName.includes('telemetry') || lowerName.includes('observ') ||
        lowerName.includes('tracer') || lowerName.includes('alert')) {
      return 'monitors';
    }

    if (lowerName.includes('orchestrat') || lowerName.includes('workflow') ||
        lowerName.includes('coordinate') || lowerName.includes('flow')) {
      return 'orchestrators';
    }

    if (lowerName.includes('critic') || lowerName.includes('review') ||
        lowerName.includes('quality') || lowerName.includes('assess')) {
      return 'critics';
    }

    if (lowerName.includes('judge') || lowerName.includes('decision') ||
        lowerName.includes('evaluate') || lowerName.includes('choose')) {
      return 'judges';
    }

    if (lowerName.includes('voice') || lowerName.includes('speech') ||
        lowerName.includes('audio') || lowerName.includes('tts') ||
        lowerName.includes('stt')) {
      return 'voice';
    }

    // If config is available, analyze capabilities and description
    if (agentConfig) {
      const configStr = JSON.stringify(agentConfig).toLowerCase();

      if (configStr.includes('security') || configStr.includes('compliance')) {
        return 'governors';
      }
      if (configStr.includes('integration') || configStr.includes('api')) {
        return 'integrators';
      }
      if (configStr.includes('training') || configStr.includes('model')) {
        return 'trainers';
      }
      if (configStr.includes('monitoring') || configStr.includes('metrics')) {
        return 'monitors';
      }
      if (configStr.includes('orchestration') || configStr.includes('workflow')) {
        return 'orchestrators';
      }
    }

    return 'workers'; // Default category
  }

  /**
   * Migrate a single agent to the correct category
   */
  migrateAgent(agent, agentsPath) {
    try {
      // Load agent config to help with categorization
      let agentConfig = null;
      if (fs.existsSync(agent.configPath)) {
        const configContent = fs.readFileSync(agent.configPath, 'utf8');
        try {
          agentConfig = yaml.load(configContent);
        } catch (yamlError) {
          console.log(`      ⚠️  Could not parse YAML for ${agent.name}: ${yamlError.message}`);
        }
      }

      const category = this.categorizeAgent(agent.name, agentConfig);
      const targetPath = path.join(agentsPath, category, agent.name);

      // Check if already in correct location
      if (agent.path === targetPath) {
        console.log(`      ✅ ${agent.name} already in correct category: ${category}`);
        return {
          success: true,
          name: agent.name,
          category: category,
          action: 'already_correct',
          from: agent.path,
          to: targetPath
        };
      }

      // Create target directory if it doesn't exist
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });

      // Move the agent
      if (fs.existsSync(targetPath)) {
        // Target exists, need to handle conflict
        const backupPath = `${targetPath}_backup_${Date.now()}`;
        fs.renameSync(targetPath, backupPath);
        console.log(`      ⚠️  Existing agent backed up to: ${path.basename(backupPath)}`);
      }

      fs.renameSync(agent.path, targetPath);
      console.log(`      📦 Migrated ${agent.name} → ${category}/`);

      // Update agent config with OSSA metadata
      this.updateAgentConfig(targetPath, category, agentConfig);

      return {
        success: true,
        name: agent.name,
        category: category,
        action: 'migrated',
        from: agent.path,
        to: targetPath
      };

    } catch (error) {
      console.log(`      ❌ Failed to migrate ${agent.name}: ${error.message}`);
      return {
        success: false,
        name: agent.name,
        error: error.message,
        action: 'failed'
      };
    }
  }

  /**
   * Update agent configuration with OSSA metadata
   */
  updateAgentConfig(agentPath, category, currentConfig) {
    const configPath = path.join(agentPath, 'agent.yml');

    if (!fs.existsSync(configPath)) {
      return;
    }

    try {
      let config = currentConfig;
      if (!config) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        config = yaml.load(configContent) || {};
      }

      // Add OSSA metadata
      config.apiVersion = config.apiVersion || "@bluefly/open-standards-scalable-agents/v0.1.9";
      config.kind = "Agent";
      config.metadata = config.metadata || {};
      config.metadata.namespace = config.metadata.namespace || `ossa-${category}`;
      config.metadata.labels = config.metadata.labels || {};
      config.metadata.labels['ossa.category'] = category;
      config.metadata.labels['ossa.taxonomy'] = 'v1.0';

      // Map category to type
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

      config.spec = config.spec || {};
      config.spec.type = typeMap[category] || 'worker';
      config.spec.category = category;

      // Write updated config
      fs.writeFileSync(configPath, yaml.dump(config, { indent: 2 }));

    } catch (error) {
      console.log(`      ⚠️  Could not update agent config: ${error.message}`);
    }
  }

  /**
   * Create repository-specific registry
   */
  createRepositoryRegistry(agentsPath, migratedAgents, repoName) {
    const registry = {
      apiVersion: "@bluefly/open-standards-scalable-agents/v0.1.9",
      kind: "Registry",
      metadata: {
        name: `${repoName}-agents`,
        namespace: "ossa-agents",
        description: `OSSA Agent Registry for ${repoName}`,
        labels: {
          'registry-type': 'repository',
          'repository': repoName
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      spec: {
        agents: migratedAgents.map(agent => ({
          name: agent.name,
          type: agent.category,
          version: "0.1.9",
          namespace: `ossa-${agent.category}`,
          path: `./${agent.category}/${agent.name}/agent.yml`,
          status: "active",
          conformance: "silver", // Start with silver, upgrade as needed
          description: `${agent.name} agent in ${agent.category} category`
        })),
        statistics: {
          totalAgents: migratedAgents.length,
          byType: this.calculateStatsByType(migratedAgents)
        }
      }
    };

    const registryPath = path.join(agentsPath, 'registry.yml');
    fs.writeFileSync(registryPath, yaml.dump(registry, { indent: 2 }));
  }

  /**
   * Calculate statistics by agent type
   */
  calculateStatsByType(agents) {
    const stats = {};
    for (const category of OSSA_CATEGORIES) {
      stats[category] = 0;
    }

    for (const agent of agents) {
      if (stats.hasOwnProperty(agent.category)) {
        stats[agent.category]++;
      }
    }

    return stats;
  }

  /**
   * Generate global migration report
   */
  generateGlobalReport() {
    console.log('\n' + '='.repeat(70));
    console.log('GLOBAL MIGRATION REPORT');
    console.log('='.repeat(70));

    const successfulRepos = this.globalReport.repositories.filter(r => r.agentsMigrated.length > 0);
    const failedRepos = this.globalReport.repositories.filter(r => r.errors.length > 0);

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total repositories processed: ${this.globalReport.totalRepositoriesProcessed}`);
    console.log(`   Successfully migrated: ${successfulRepos.length}`);
    console.log(`   Had errors: ${failedRepos.length}`);
    console.log(`   Total agents migrated: ${this.globalReport.totalAgentsMigrated}`);

    if (successfulRepos.length > 0) {
      console.log(`\n✅ SUCCESSFUL MIGRATIONS:`);
      for (const repo of successfulRepos) {
        console.log(`   ${repo.name}: ${repo.agentsMigrated.length} agents`);
        for (const agent of repo.agentsMigrated) {
          console.log(`      - ${agent.name} → ${agent.category}/`);
        }
      }
    }

    if (failedRepos.length > 0) {
      console.log(`\n❌ REPOSITORIES WITH ERRORS:`);
      for (const repo of failedRepos) {
        console.log(`   ${repo.name}: ${repo.errors.length} errors`);
        for (const error of repo.errors) {
          console.log(`      - ${error.message || error.error}`);
        }
      }
    }

    // Calculate category distribution
    const categoryStats = {};
    for (const category of OSSA_CATEGORIES) {
      categoryStats[category] = 0;
    }

    for (const repo of this.globalReport.repositories) {
      for (const agent of repo.agentsMigrated) {
        if (categoryStats.hasOwnProperty(agent.category)) {
          categoryStats[agent.category]++;
        }
      }
    }

    console.log(`\n📈 AGENT DISTRIBUTION BY CATEGORY:`);
    for (const [category, count] of Object.entries(categoryStats)) {
      if (count > 0) {
        console.log(`   ${category}: ${count} agents`);
      }
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'ossa-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.globalReport, null, 2));
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);

    console.log('\n🎉 Multi-repository OSSA migration completed!');
  }
}

// CLI execution
if (require.main === module) {
  const migrator = new MultiRepoOSSAMigrator();

  migrator.migrateAllRepositories().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = MultiRepoOSSAMigrator;