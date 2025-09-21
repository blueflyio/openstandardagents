#!/usr/bin/env node

/**
 * OSSA Migration Validation Script
 *
 * Validates that the OSSA taxonomy migration was successful
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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

const OSSA_CATEGORIES = [
  'critics', 'governors', 'integrators', 'judges',
  'monitors', 'orchestrators', 'trainers', 'voice', 'workers'
];

class MigrationValidator {
  constructor() {
    this.report = {
      validRepositories: [],
      invalidRepositories: [],
      totalAgents: 0,
      categoryDistribution: {},
      errors: []
    };
  }

  async validateAll() {
    console.log('🔍 Validating OSSA taxonomy migration\n');
    console.log('='.repeat(60));

    for (const repoPath of REPOSITORIES) {
      await this.validateRepository(repoPath);
    }

    this.generateReport();
  }

  async validateRepository(repoPath) {
    const repoName = path.basename(repoPath);
    console.log(`\n📦 Validating: ${repoName}`);

    if (!fs.existsSync(repoPath)) {
      console.log(`   ❌ Repository not found`);
      return;
    }

    const agentsPath = path.join(repoPath, '.agents');

    if (!fs.existsSync(agentsPath)) {
      console.log(`   ⏭️  No .agents folder`);
      return;
    }

    const repoValidation = {
      name: repoName,
      path: repoPath,
      hasOSSAStructure: false,
      hasDocumentation: false,
      hasRegistry: false,
      categories: {},
      agents: [],
      issues: []
    };

    try {
      // Check OSSA structure
      console.log(`   🏗️  Checking OSSA structure...`);
      repoValidation.hasOSSAStructure = this.validateOSSAStructure(agentsPath, repoValidation);

      // Check documentation
      console.log(`   📚 Checking documentation...`);
      repoValidation.hasDocumentation = this.validateDocumentation(agentsPath, repoValidation);

      // Check registry
      console.log(`   📋 Checking registry...`);
      repoValidation.hasRegistry = this.validateRegistry(agentsPath, repoValidation);

      // Validate agents in categories
      console.log(`   🤖 Validating agents...`);
      this.validateAgents(agentsPath, repoValidation);

      const isValid = repoValidation.hasOSSAStructure &&
                     repoValidation.hasDocumentation &&
                     repoValidation.hasRegistry &&
                     repoValidation.issues.length === 0;

      if (isValid) {
        console.log(`   ✅ Repository validation passed`);
        this.report.validRepositories.push(repoValidation);
      } else {
        console.log(`   ⚠️  Repository has issues: ${repoValidation.issues.length}`);
        this.report.invalidRepositories.push(repoValidation);
      }

    } catch (error) {
      console.log(`   ❌ Validation error: ${error.message}`);
      repoValidation.issues.push(`Validation error: ${error.message}`);
      this.report.invalidRepositories.push(repoValidation);
    }
  }

  validateOSSAStructure(agentsPath, repoValidation) {
    let hasAllCategories = true;

    for (const category of OSSA_CATEGORIES) {
      const categoryPath = path.join(agentsPath, category);
      const exists = fs.existsSync(categoryPath);

      repoValidation.categories[category] = {
        exists: exists,
        agentCount: 0
      };

      if (!exists) {
        hasAllCategories = false;
        repoValidation.issues.push(`Missing category directory: ${category}`);
      }
    }

    return hasAllCategories;
  }

  validateDocumentation(agentsPath, repoValidation) {
    const readmePath = path.join(agentsPath, 'README.md');
    const hasReadme = fs.existsSync(readmePath);

    if (!hasReadme) {
      repoValidation.issues.push('Missing README.md in .agents directory');
    }

    return hasReadme;
  }

  validateRegistry(agentsPath, repoValidation) {
    const registryPath = path.join(agentsPath, 'registry.yml');
    const hasRegistry = fs.existsSync(registryPath);

    if (!hasRegistry) {
      repoValidation.issues.push('Missing registry.yml in .agents directory');
      return false;
    }

    try {
      const registryContent = fs.readFileSync(registryPath, 'utf8');
      const registry = yaml.load(registryContent);

      // Validate registry structure
      if (!registry.apiVersion || !registry.apiVersion.includes('open-standards-scalable-agents')) {
        repoValidation.issues.push('Registry missing proper apiVersion');
      }

      if (!registry.spec || !registry.spec.agents) {
        repoValidation.issues.push('Registry missing agents specification');
      }

      return true;

    } catch (error) {
      repoValidation.issues.push(`Invalid registry.yml: ${error.message}`);
      return false;
    }
  }

  validateAgents(agentsPath, repoValidation) {
    for (const category of OSSA_CATEGORIES) {
      const categoryPath = path.join(agentsPath, category);

      if (!fs.existsSync(categoryPath)) {
        continue;
      }

      const items = fs.readdirSync(categoryPath);

      for (const item of items) {
        const itemPath = path.join(categoryPath, item);

        if (fs.statSync(itemPath).isDirectory()) {
          const agentConfigPath = path.join(itemPath, 'agent.yml');

          if (fs.existsSync(agentConfigPath)) {
            const agentValidation = this.validateSingleAgent(agentConfigPath, category, item);
            repoValidation.agents.push(agentValidation);
            repoValidation.categories[category].agentCount++;
            this.report.totalAgents++;

            // Update category distribution
            if (!this.report.categoryDistribution[category]) {
              this.report.categoryDistribution[category] = 0;
            }
            this.report.categoryDistribution[category]++;

            if (!agentValidation.isValid) {
              repoValidation.issues.push(`Invalid agent: ${item} in ${category}`);
            }
          }
        }
      }
    }
  }

  validateSingleAgent(configPath, expectedCategory, agentName) {
    const validation = {
      name: agentName,
      category: expectedCategory,
      configPath: configPath,
      isValid: true,
      issues: []
    };

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent);

      // Check OSSA metadata
      if (!config.apiVersion || !config.apiVersion.includes('open-standards-scalable-agents')) {
        validation.issues.push('Missing or invalid apiVersion');
        validation.isValid = false;
      }

      if (!config.metadata || !config.metadata.labels || !config.metadata.labels['ossa.category']) {
        validation.issues.push('Missing OSSA category label');
        validation.isValid = false;
      } else if (config.metadata.labels['ossa.category'] !== expectedCategory) {
        validation.issues.push(`Category mismatch: expected ${expectedCategory}, found ${config.metadata.labels['ossa.category']}`);
        validation.isValid = false;
      }

      if (!config.spec || !config.spec.type) {
        validation.issues.push('Missing agent type in spec');
        validation.isValid = false;
      }

    } catch (error) {
      validation.issues.push(`Config parsing error: ${error.message}`);
      validation.isValid = false;
    }

    return validation;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION VALIDATION REPORT');
    console.log('='.repeat(60));

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Valid repositories: ${this.report.validRepositories.length}`);
    console.log(`   Invalid repositories: ${this.report.invalidRepositories.length}`);
    console.log(`   Total agents validated: ${this.report.totalAgents}`);

    if (this.report.validRepositories.length > 0) {
      console.log(`\n✅ VALID REPOSITORIES:`);
      for (const repo of this.report.validRepositories) {
        console.log(`   ${repo.name}: ${repo.agents.length} agents`);
      }
    }

    if (this.report.invalidRepositories.length > 0) {
      console.log(`\n⚠️  REPOSITORIES WITH ISSUES:`);
      for (const repo of this.report.invalidRepositories) {
        console.log(`   ${repo.name}: ${repo.issues.length} issues`);
        for (const issue of repo.issues) {
          console.log(`      - ${issue}`);
        }
      }
    }

    console.log(`\n📈 AGENT DISTRIBUTION BY CATEGORY:`);
    for (const [category, count] of Object.entries(this.report.categoryDistribution)) {
      console.log(`   ${category}: ${count} agents`);
    }

    // Save report
    const reportPath = path.join(process.cwd(), 'ossa-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📋 Validation report saved to: ${reportPath}`);

    // Summary
    const totalRepos = this.report.validRepositories.length + this.report.invalidRepositories.length;
    const successRate = totalRepos > 0 ? (this.report.validRepositories.length / totalRepos * 100).toFixed(1) : 0;

    console.log(`\n🎯 SUCCESS RATE: ${successRate}% (${this.report.validRepositories.length}/${totalRepos})`);

    if (this.report.invalidRepositories.length === 0) {
      console.log('🎉 All repositories passed validation!');
    } else {
      console.log(`⚠️  ${this.report.invalidRepositories.length} repositories need attention`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new MigrationValidator();

  validator.validateAll().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = MigrationValidator;