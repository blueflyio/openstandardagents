#!/usr/bin/env node
/**
 * OSSA Agent Migration Script
 * Converts OSSA v1.0 agents to v0.2.2 format
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Migration mapping configuration
const MIGRATION_CONFIG = {
  // Framework-specific role mappings
  roleMapping: {
    integration: 'integration',
    data: 'data_processing',
    chat: 'chat',
    orchestration: 'orchestration',
    audit: 'audit',
    workflow: 'workflow',
    monitoring: 'monitoring',
  },

  // Framework detection patterns
  frameworkPatterns: {
    kagent: ['kubernetes', 'k8s', 'deployment', 'replicas'],
    buildkit: ['buildkit', 'deployment'],
    librachat: ['librechat', 'actions'],
    drupal: ['drupal', 'module'],
    mcp: ['mcp', 'server_type', 'stdio'],
    langchain: ['langchain', 'chain'],
    crewai: ['crewai', 'agent_type'],
  },
};

function migrateAgent(inputFile, outputFile) {
  console.log(`Migrating: ${inputFile}`);

  try {
    // Read input file
    const content = fs.readFileSync(inputFile, 'utf8');
    const agent = yaml.parse(content);

    // Check if it's already v0.2.2 or v1.0
    if (agent.apiVersion && agent.kind === 'Agent') {
      console.log(`  Already v0.2.2 format`);
      return true;
    }

    if (!agent.ossaVersion || agent.ossaVersion !== '1.0' || !agent.agent) {
      console.log(`  Unsupported format, skipping`);
      return false;
    }

    // Start migration
    const migrated = {
      apiVersion: 'ossa/v1',
      kind: 'Agent',
      metadata: {
        name: agent.agent.id,
        version: agent.agent.version || '0.1.0',
        description: agent.agent.description || agent.agent.name || '',
        labels: {},
        annotations: {},
      },
      spec: {},
    };

    // Convert tags to labels
    if (agent.agent.tags && Array.isArray(agent.agent.tags)) {
      agent.agent.tags.forEach((tag) => {
        migrated.metadata.labels[tag] = 'true';
      });
    }

    // Add migration annotations
    migrated.metadata.annotations['ossa.io/migration'] = 'v1.0 to v0.2.2';
    migrated.metadata.annotations['ossa.io/migrated-date'] = new Date()
      .toISOString()
      .split('T')[0];

    // Copy root metadata if exists
    if (agent.metadata) {
      if (agent.metadata.authors) {
        migrated.metadata.annotations.author = Array.isArray(
          agent.metadata.authors
        )
          ? agent.metadata.authors.join(', ')
          : agent.metadata.authors;
      }
      if (agent.metadata.license) {
        migrated.metadata.annotations.license = agent.metadata.license;
      }
      if (agent.metadata.repository) {
        migrated.metadata.annotations.repository = agent.metadata.repository;
      }
    }

    // Convert role
    migrated.spec.role =
      typeof agent.agent.role === 'string'
        ? agent.agent.role
        : agent.agent.role;

    // Add taxonomy
    migrated.spec.taxonomy = {
      domain: detectDomain(agent.agent),
      subdomain: detectSubdomain(agent.agent),
      capability: detectCapability(agent.agent),
    };

    // Convert LLM config - normalize provider and move extra properties
    if (agent.agent.llm) {
      migrated.spec.llm = {
        provider: agent.agent.llm.provider === 'auto' ? 'openai' : agent.agent.llm.provider,
        model: agent.agent.llm.model,
        temperature: agent.agent.llm.temperature,
        maxTokens: agent.agent.llm.maxTokens,
        topP: agent.agent.llm.topP,
        frequencyPenalty: agent.agent.llm.frequencyPenalty,
        presencePenalty: agent.agent.llm.presencePenalty
      };
      
      // Move extra LLM properties to extensions
      if (agent.agent.llm.fallback_providers || agent.agent.llm.multi_provider) {
        if (!migrated.spec.extensions) migrated.spec.extensions = {};
        if (!migrated.spec.extensions.llm) migrated.spec.extensions.llm = {};
        migrated.spec.extensions.llm.fallback_providers = agent.agent.llm.fallback_providers || agent.agent.llm.multi_provider;
        migrated.spec.extensions.llm.multi_provider = true;
      }
    }

    // Convert capabilities to tools
    if (agent.agent.capabilities && Array.isArray(agent.agent.capabilities)) {
      migrated.spec.tools = agent.agent.capabilities.map((cap) => {
        const tool = {
          type: 'mcp',
          name: cap.name || 'unnamed_tool',
        };

        // Map capabilities to server
        if (agent.agent.integration?.mcp?.server_name) {
          tool.server = agent.agent.integration.mcp.server_name;
        } else if (migrated.metadata.name) {
          tool.server = migrated.metadata.name;
        }

        if (cap.input_schema) {
          tool.capabilities = ['with_input_schema'];
        }

        return tool;
      });
    }

    // Convert autonomy
    if (agent.agent.autonomy) {
      migrated.spec.autonomy = agent.agent.autonomy;
    }

    // Convert constraints
    if (agent.agent.constraints) {
      migrated.spec.constraints = agent.agent.constraints;
    }

    // Convert observability - only simple tracing/metrics/logging allowed
    if (agent.agent.observability || agent.agent.monitoring) {
      const obs = agent.agent.observability || agent.agent.monitoring;

      // Normalize metrics to object format if it's a boolean
      let normalizedMetrics = obs.metrics;
      if (normalizedMetrics === true) {
        normalizedMetrics = { enabled: true };
      } else if (!normalizedMetrics || typeof normalizedMetrics !== 'object') {
        normalizedMetrics = { enabled: true };
      }

      if (obs.tracing || normalizedMetrics || obs.logging) {
        migrated.spec.observability = {
          tracing: obs.tracing || { enabled: true },
          metrics: normalizedMetrics,
          logging: obs.logging || { level: 'info', format: 'json' },
        };
      } else {
        // Complex observability goes to extensions
        migrated.spec.extensions.observability = obs;
      }
    }

    // Initialize extensions section
    if (!migrated.spec.extensions) {
      migrated.spec.extensions = {};
    }

    // Detect and add framework-specific extensions
    const frameworks = detectFrameworks(agent);

    // MCP extension
    if (frameworks.includes('mcp') || agent.agent.integration?.mcp) {
      migrated.spec.extensions.mcp = {
        enabled: agent.agent.integration?.mcp?.enabled !== false,
        server_type:
          agent.agent.integration?.mcp?.protocol ||
          agent.agent.integration?.mcp?.server_type ||
          'stdio',
      };

      if (agent.agent.capabilities) {
        migrated.spec.extensions.mcp.tools = agent.agent.capabilities.map(
          (cap) => ({
            name: cap.name || 'unnamed',
            description: cap.description || '',
          })
        );
      }
    }

    // Buildkit extension
    if (frameworks.includes('buildkit') || agent.agent.deployment) {
      migrated.spec.extensions.buildkit = {
        deployment: {
          replicas: agent.agent.deployment?.replicas || { min: 1, max: 4 },
        },
        container: {
          image: agent.agent.runtime?.image,
          runtime: agent.agent.runtime?.type || 'docker',
          resources: agent.agent.runtime?.resources || {},
        },
      };

      if (agent.agent.runtime?.health_check) {
        migrated.spec.extensions.buildkit.deployment.health_check = {
          path: agent.agent.runtime.health_check.endpoint || '/health',
          port: agent.agent.runtime.health_check.port,
        };
      }
    }

    // kagent extension
    if (frameworks.includes('kagent') || agent.agent.runtime?.type === 'k8s') {
      migrated.spec.extensions.kagent = {
        kubernetes: {
          namespace: 'default',
          labels: {
            app: migrated.metadata.name,
          },
        },
        deployment: {
          replicas: 2,
          strategy: 'rolling-update',
        },
      };

      if (agent.agent.runtime?.resources) {
        migrated.spec.extensions.kagent.kubernetes.resourceLimits =
          agent.agent.runtime.resources;
      }
    }

    // Runtime extension
    if (agent.agent.runtime) {
      migrated.spec.extensions.runtime = {
        type: agent.agent.runtime.type || 'docker',
        image: agent.agent.runtime.image,
        requirements: agent.agent.runtime.requirements,
        resources: agent.agent.runtime.resources,
        health_check: agent.agent.runtime.health_check,
      };
    }

    // Integration extension
    if (agent.agent.integration) {
      migrated.spec.extensions.integration = agent.agent.integration;
    }

    // Write output
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const output = yaml.stringify(migrated, {
      indent: 2,
      lineWidth: 120,
    });

    fs.writeFileSync(outputFile, output);
    console.log(`  Migrated to: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return false;
  }
}

function detectDomain(agent) {
  // Infer domain from name, description, or tags
  const searchText = [
    agent.id,
    agent.name,
    agent.description,
    ...(agent.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  if (
    searchText.includes('infrastructure') ||
    searchText.includes('k8s') ||
    searchText.includes('kubernetes')
  ) {
    return 'infrastructure';
  }
  if (searchText.includes('security') || searchText.includes('compliance')) {
    return 'security';
  }
  if (
    searchText.includes('data') ||
    searchText.includes('vector') ||
    searchText.includes('database')
  ) {
    return 'data';
  }
  if (searchText.includes('chat') || searchText.includes('conversation')) {
    return 'conversation';
  }
  if (searchText.includes('workflow') || searchText.includes('orchestra')) {
    return 'automation';
  }

  return 'integration';
}

function detectSubdomain(agent) {
  const searchText = [
    agent.id,
    agent.name,
    agent.description,
    ...(agent.tags || []),
  ]
    .join(' ')
    .toLowerCase();

  if (searchText.includes('kubernetes') || searchText.includes('k8s')) {
    return 'kubernetes';
  }
  if (searchText.includes('protocol') || searchText.includes('mcp')) {
    return 'protocol';
  }
  if (searchText.includes('workflow') || searchText.includes('eca')) {
    return 'workflow';
  }

  return 'general';
}

function detectCapability(agent) {
  const searchText = [agent.id, agent.name, agent.description]
    .join(' ')
    .toLowerCase();

  if (searchText.includes('troubleshoot')) return 'troubleshooting';
  if (searchText.includes('monitor')) return 'monitoring';
  if (searchText.includes('route')) return 'routing';
  if (searchText.includes('search') || searchText.includes('vector'))
    return 'search';

  return 'general';
}

function detectFrameworks(agent) {
  const frameworks = [];
  const searchText = JSON.stringify(agent).toLowerCase();

  for (const [framework, patterns] of Object.entries(
    MIGRATION_CONFIG.frameworkPatterns
  )) {
    if (patterns.some((pattern) => searchText.includes(pattern))) {
      frameworks.push(framework);
    }
  }

  return frameworks;
}

// Main execution
const inputDir = process.argv[2] || process.cwd();
const recursive =
  process.argv.includes('--recursive') || process.argv.includes('-r');
const dryRun =
  process.argv.includes('--dry-run') || process.argv.includes('-d');

console.log('OSSA Agent Migration Tool v1.0 to v0.2.2\n');
console.log(`Input: ${inputDir}`);
console.log(`Recursive: ${recursive}`);
console.log(`Dry Run: ${dryRun}\n`);

// Find all .ossa.yaml files
function findFiles(dir, recursive = false) {
  const files = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (
          recursive &&
          entry.name !== 'node_modules' &&
          entry.name !== '.git'
        ) {
          scan(fullPath);
        }
      } else if (
        entry.name.endsWith('.ossa.yaml') ||
        entry.name.endsWith('.ossa.yml')
      ) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

const files = findFiles(inputDir, recursive);
console.log(`Found ${files.length} OSSA agent files\n`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const file of files) {
  // Skip already migrated files
  if (file.includes('.v0.2.2.')) {
    skipCount++;
    continue;
  }

  const outputFile = file.replace(/(\.ossa\.ya?ml)$/, '.v0.2.2$1');

  if (dryRun) {
    console.log(`Would migrate: ${file}`);
    console.log(`  -> ${outputFile}`);
    successCount++;
  } else {
    if (migrateAgent(file, outputFile)) {
      successCount++;
    } else {
      errorCount++;
    }
  }
}

console.log(`\nMigration Summary:`);
console.log(`  Successfully migrated: ${successCount}`);
console.log(`  Skipped: ${skipCount}`);
console.log(`  Errors: ${errorCount}`);
