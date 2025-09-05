#!/usr/bin/env node

/**
 * OSSA v0.1.7 Compliance Validation Tool
 * Validates agents against the latest OSSA specifications
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OSSA v0.1.7 Required Fields
const REQUIRED_SCHEMA = {
  apiVersion: 'open-standards-scalable-agents/v0.1.7',
  metadata: {
    required: ['name', 'version', 'description', 'labels'],
    labels: {
      required: ['tier', 'category', 'framework-compatibility']
    }
  },
  spec: {
    required: ['conformance', 'framework_adapters', 'capabilities', 'protocols', 'security', 'performance'],
    conformance: {
      required: ['tier', 'level']
    },
    framework_adapters: {
      required: ['mcp', 'langchain', 'crewai', 'autogen', 'openai']
    },
    protocols: {
      required_protocols: ['openapi', 'mcp', 'agent2agent']
    },
    security: {
      required: ['authentication', 'authorization', 'encryption', 'audit']
    },
    performance: {
      required: ['sla', 'resources', 'scaling']
    }
  },
  extensions: {
    required: ['x-ossa-token-optimization', 'x-ossa-memory-integration', 'x-ossa-orchestration', 'x-ossa-monitoring', 'x-ossa-deployment']
  }
};

class OSSAValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validationResults = {};
  }

  async validateAgent(agentPath) {
    console.log(`🔍 Validating agent: ${agentPath}`);
    
    try {
      // Load agent configuration
      const agentYaml = await fs.readFile(agentPath, 'utf8');
      const agent = yaml.parse(agentYaml);
      
      // Reset validation state
      this.errors = [];
      this.warnings = [];
      
      // Validate structure
      await this.validateSchema(agent);
      await this.validateFrameworkAdapters(agent);
      await this.validateSecurity(agent);
      await this.validatePerformance(agent);
      await this.validateExtensions(agent);
      
      // Check for accompanying files
      await this.validateAccompanyingFiles(agentPath, agent);
      
      // Generate validation report
      const results = {
        agent: path.basename(agentPath),
        valid: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        compliance_score: this.calculateComplianceScore(),
        v0_1_7_features: this.checkV017Features(agent)
      };
      
      this.validationResults[path.basename(agentPath)] = results;
      return results;
      
    } catch (error) {
      this.errors.push(`Failed to parse agent configuration: ${error.message}`);
      return {
        agent: path.basename(agentPath),
        valid: false,
        errors: this.errors,
        warnings: this.warnings,
        compliance_score: 0
      };
    }
  }

  validateSchema(agent) {
    // Check API version
    if (agent.apiVersion !== REQUIRED_SCHEMA.apiVersion) {
      this.errors.push(`Invalid apiVersion: expected ${REQUIRED_SCHEMA.apiVersion}, got ${agent.apiVersion}`);
    }

    // Check metadata
    if (!agent.metadata) {
      this.errors.push('Missing required metadata section');
    } else {
      REQUIRED_SCHEMA.metadata.required.forEach(field => {
        if (!agent.metadata[field]) {
          this.errors.push(`Missing required metadata.${field}`);
        }
      });

      // Check labels
      if (!agent.metadata.labels) {
        this.errors.push('Missing required metadata.labels');
      } else {
        REQUIRED_SCHEMA.metadata.labels.required.forEach(label => {
          if (!agent.metadata.labels[label]) {
            this.errors.push(`Missing required label: ${label}`);
          }
        });
      }
    }

    // Check spec
    if (!agent.spec) {
      this.errors.push('Missing required spec section');
    } else {
      REQUIRED_SCHEMA.spec.required.forEach(field => {
        if (!agent.spec[field]) {
          this.errors.push(`Missing required spec.${field}`);
        }
      });
    }
  }

  validateFrameworkAdapters(agent) {
    if (!agent.spec?.framework_adapters) {
      this.errors.push('Missing required framework_adapters section');
      return;
    }

    const adapters = agent.spec.framework_adapters;
    
    // Check required framework adapters
    REQUIRED_SCHEMA.spec.framework_adapters.required.forEach(framework => {
      if (!adapters[framework]) {
        this.errors.push(`Missing required framework adapter: ${framework}`);
      } else {
        // Check if adapter is properly configured
        if (adapters[framework].enabled && !adapters[framework].version) {
          this.warnings.push(`Framework adapter ${framework} is enabled but missing version`);
        }
      }
    });

    // Validate MCP adapter (mandatory in v0.1.7)
    if (adapters.mcp && adapters.mcp.enabled) {
      if (!adapters.mcp.endpoint) {
        this.errors.push('MCP adapter is enabled but missing endpoint');
      }
      if (!adapters.mcp.tools) {
        this.warnings.push('MCP adapter has no tools defined');
      }
    }
  }

  validateSecurity(agent) {
    if (!agent.spec?.security) {
      this.errors.push('Missing required security configuration');
      return;
    }

    const security = agent.spec.security;
    
    REQUIRED_SCHEMA.spec.security.required.forEach(field => {
      if (!security[field]) {
        this.errors.push(`Missing required security.${field}`);
      }
    });

    // Check authentication methods
    if (security.authentication) {
      if (!Array.isArray(security.authentication.methods)) {
        this.errors.push('security.authentication.methods must be an array');
      } else if (security.authentication.methods.length === 0) {
        this.errors.push('At least one authentication method must be specified');
      }
    }

    // Check encryption standards
    if (security.encryption) {
      const validEncryption = ['tls_1_2', 'tls_1_3', 'aes_256_gcm', 'chacha20_poly1305'];
      if (security.encryption.in_transit && !validEncryption.some(enc => security.encryption.in_transit.includes(enc))) {
        this.warnings.push('Consider using stronger encryption standards (TLS 1.3, AES-256-GCM)');
      }
    }
  }

  validatePerformance(agent) {
    if (!agent.spec?.performance) {
      this.errors.push('Missing required performance configuration');
      return;
    }

    const performance = agent.spec.performance;
    
    REQUIRED_SCHEMA.spec.performance.required.forEach(field => {
      if (!performance[field]) {
        this.errors.push(`Missing required performance.${field}`);
      }
    });

    // Check SLA requirements
    if (performance.sla) {
      if (!performance.sla.availability) {
        this.errors.push('Missing SLA availability requirement');
      }
      if (!performance.sla.latency) {
        this.errors.push('Missing SLA latency requirements');
      }
    }

    // Validate resource requirements
    if (performance.resources) {
      const requiredResources = ['cpu_cores', 'memory_gb'];
      requiredResources.forEach(resource => {
        if (typeof performance.resources[resource] !== 'number') {
          this.warnings.push(`Resource requirement ${resource} should be a number`);
        }
      });
    }
  }

  validateExtensions(agent) {
    REQUIRED_SCHEMA.extensions.required.forEach(extension => {
      if (!agent[extension]) {
        this.errors.push(`Missing required extension: ${extension}`);
      }
    });

    // Validate token optimization
    if (agent['x-ossa-token-optimization']) {
      const tokenOpt = agent['x-ossa-token-optimization'];
      if (!tokenOpt.total_budget || typeof tokenOpt.total_budget !== 'number') {
        this.errors.push('x-ossa-token-optimization.total_budget must be a number');
      }
      if (!tokenOpt.allocation || typeof tokenOpt.allocation !== 'object') {
        this.errors.push('x-ossa-token-optimization.allocation must be an object');
      }
    }

    // Validate memory integration
    if (agent['x-ossa-memory-integration']) {
      const memoryInteg = agent['x-ossa-memory-integration'];
      if (memoryInteg.vector_storage && !memoryInteg.vector_storage.provider) {
        this.errors.push('x-ossa-memory-integration.vector_storage must specify a provider');
      }
    }

    // Validate orchestration capabilities
    if (agent['x-ossa-orchestration']) {
      const orchestration = agent['x-ossa-orchestration'];
      if (!orchestration.discovery) {
        this.warnings.push('Consider enabling orchestration discovery for better agent coordination');
      }
    }
  }

  async validateAccompanyingFiles(agentPath, agent) {
    const agentDir = path.dirname(agentPath);
    
    // Check for required OpenAPI spec
    const protocols = agent.spec?.protocols || [];
    const hasOpenAPI = protocols.some(p => p.name === 'openapi' && p.required);
    
    if (hasOpenAPI) {
      const openApiPath = path.join(agentDir, 'openapi.yaml');
      try {
        await fs.access(openApiPath);
      } catch {
        this.errors.push('OpenAPI specification file (openapi.yaml) is required but not found');
      }
    }

    // Check for MCP tools manifest
    const hasMCP = protocols.some(p => p.name === 'mcp');
    if (hasMCP) {
      const mcpToolsPath = path.join(agentDir, 'mcp-tools.json');
      try {
        await fs.access(mcpToolsPath);
      } catch {
        this.warnings.push('MCP tools manifest (mcp-tools.json) not found');
      }
    }
  }

  calculateComplianceScore() {
    const totalChecks = 50; // Approximate number of validation checks
    const errorWeight = 2;
    const warningWeight = 1;
    
    const deductions = (this.errors.length * errorWeight) + (this.warnings.length * warningWeight);
    const score = Math.max(0, 100 - (deductions * 2)); // Each deduction = 2 points
    
    return Math.round(score);
  }

  checkV017Features(agent) {
    const features = {
      universal_framework_compatibility: false,
      three_tier_conformance: false,
      enhanced_security: false,
      token_optimization: false,
      memory_integration: false,
      orchestration_support: false,
      monitoring_integration: false
    };

    // Check universal framework compatibility
    const adapters = agent.spec?.framework_adapters || {};
    const requiredAdapters = ['mcp', 'langchain', 'crewai', 'autogen'];
    const enabledAdapters = requiredAdapters.filter(adapter => adapters[adapter]?.enabled);
    features.universal_framework_compatibility = enabledAdapters.length >= 3;

    // Check three-tier conformance
    features.three_tier_conformance = !!(agent.spec?.conformance?.tier && 
      ['core', 'governed', 'advanced'].includes(agent.spec.conformance.tier));

    // Check enhanced security
    const security = agent.spec?.security || {};
    features.enhanced_security = !!(security.authentication?.methods?.length > 1 && 
      security.encryption && security.audit);

    // Check extensions
    features.token_optimization = !!agent['x-ossa-token-optimization'];
    features.memory_integration = !!agent['x-ossa-memory-integration'];
    features.orchestration_support = !!agent['x-ossa-orchestration'];
    features.monitoring_integration = !!agent['x-ossa-monitoring'];

    return features;
  }

  async generateReport() {
    const report = {
      validation_timestamp: new Date().toISOString(),
      ossa_version: '0.1.7',
      total_agents: Object.keys(this.validationResults).length,
      valid_agents: Object.values(this.validationResults).filter(r => r.valid).length,
      average_compliance_score: this.calculateAverageScore(),
      agents: this.validationResults,
      summary: this.generateSummary()
    };

    const reportPath = path.join(__dirname, 'validation-report-v0.1.7.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Validation Report Generated: ${reportPath}`);
    return report;
  }

  calculateAverageScore() {
    const scores = Object.values(this.validationResults).map(r => r.compliance_score || 0);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  }

  generateSummary() {
    const results = Object.values(this.validationResults);
    
    return {
      compliance_distribution: {
        excellent: results.filter(r => (r.compliance_score || 0) >= 90).length,
        good: results.filter(r => (r.compliance_score || 0) >= 70 && (r.compliance_score || 0) < 90).length,
        needs_improvement: results.filter(r => (r.compliance_score || 0) < 70).length
      },
      common_issues: this.getCommonIssues(),
      v0_1_7_adoption: this.getFeatureAdoption()
    };
  }

  getCommonIssues() {
    const allErrors = Object.values(this.validationResults)
      .flatMap(r => r.errors || []);
    
    const errorCounts = {};
    allErrors.forEach(error => {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  getFeatureAdoption() {
    const results = Object.values(this.validationResults);
    const features = {};
    
    if (results.length > 0) {
      // Calculate percentage adoption for each v0.1.7 feature
      const featureKeys = Object.keys(results[0].v0_1_7_features || {});
      featureKeys.forEach(feature => {
        const adopted = results.filter(r => r.v0_1_7_features?.[feature]).length;
        features[feature] = Math.round((adopted / results.length) * 100);
      });
    }
    
    return features;
  }
}

// Main execution
async function main() {
  console.log('🚀 OSSA v0.1.7 Compliance Validator\n');
  
  const validator = new OSSAValidator();
  const agentsDir = __dirname;
  
  try {
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    
    // Find all agent configurations
    const agentPaths = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const agentYamlPath = path.join(agentsDir, entry.name, 'agent-v0.1.7.yml');
        try {
          await fs.access(agentYamlPath);
          agentPaths.push(agentYamlPath);
        } catch {
          // Try fallback to agent.yml
          const fallbackPath = path.join(agentsDir, entry.name, 'agent.yml');
          try {
            await fs.access(fallbackPath);
            agentPaths.push(fallbackPath);
          } catch {
            // No agent configuration found
          }
        }
      }
    }
    
    if (agentPaths.length === 0) {
      console.log('⚠️  No agent configurations found');
      return;
    }
    
    console.log(`Found ${agentPaths.length} agent configurations\n`);
    
    // Validate each agent
    for (const agentPath of agentPaths) {
      const result = await validator.validateAgent(agentPath);
      
      if (result.valid) {
        console.log(`✅ ${result.agent} - Compliance Score: ${result.compliance_score}%`);
      } else {
        console.log(`❌ ${result.agent} - ${result.errors.length} errors, ${result.warnings.length} warnings`);
        result.errors.slice(0, 3).forEach(error => {
          console.log(`   🔸 ${error}`);
        });
      }
    }
    
    // Generate report
    console.log('\n📈 Generating validation report...');
    const report = await validator.generateReport();
    
    console.log(`\n🎯 Summary:`);
    console.log(`   Valid Agents: ${report.valid_agents}/${report.total_agents}`);
    console.log(`   Average Compliance Score: ${report.average_compliance_score}%`);
    console.log(`   v0.1.7 Features Adoption Rate: ${Math.round(Object.values(report.summary.v0_1_7_adoption || {}).reduce((a, b) => a + b, 0) / 7)}%`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { OSSAValidator };