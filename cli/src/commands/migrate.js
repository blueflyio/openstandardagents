/**
 * OSSA Migrate Command
 *
 * Migrates v0.1.9 agent manifests to OSSA 1.0 format.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

module.exports = async function migrate(sourcePath, options) {
  try {
    console.log(`Migrating agent from v0.1.9 to OSSA 1.0: ${sourcePath}`);

    // Load source manifest
    const manifestPath = path.resolve(process.cwd(), sourcePath);
    if (!fs.existsSync(manifestPath)) {
      console.error(`Error: Source manifest not found at ${manifestPath}`);
      process.exit(1);
    }

    const source = yaml.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Detect version
    if (source.ossaVersion === '1.0') {
      console.log('\u2713 Manifest is already OSSA 1.0 format');
      process.exit(0);
    }

    if (!source.apiVersion || !source.apiVersion.includes('0.1.9')) {
      console.error('Error: Source does not appear to be v0.1.9 format');
      console.error('Expected: apiVersion: "@bluefly/open-standards-scalable-agents/v0.1.9"');
      process.exit(1);
    }

    // Perform migration
    const migrated = migrateManifest(source);

    // Output
    if (options.dryRun) {
      console.log('\nMigration preview (--dry-run):\n');
      console.log(yaml.stringify(migrated));
      console.log('\nTo apply migration, run without --dry-run');
    } else {
      const outputPath = options.output || sourcePath.replace('.yml', '-v1.0.yml');
      fs.writeFileSync(outputPath, yaml.stringify(migrated), 'utf-8');
      console.log(`\n\u2713 Migrated manifest written to: ${outputPath}`);
      console.log('\nNext steps:');
      console.log(`  1. Review: cat ${outputPath}`);
      console.log(`  2. Validate: ossa validate ${outputPath}`);
      console.log(`  3. Replace original if satisfied`);
    }

  } catch (error) {
    console.error('Error during migration:', error.message);
    process.exit(1);
  }
};

function migrateManifest(source) {
  const metadata = source.metadata || {};
  const spec = source.spec || {};

  // Map role from type/subtype
  const roleMap = {
    'worker': 'custom',
    'orchestrator': 'orchestration',
    'integrator': 'integration',
    'monitor': 'monitoring',
    'critic': 'development',
    'judge': 'custom',
    'governor': 'compliance',
    'compliance': 'compliance',
    'chat': 'chat',
    'audit': 'audit',
    'workflow': 'workflow',
    'data_processing': 'data_processing'
  };

  const agentType = spec.type || 'custom';
  const role = roleMap[agentType] || 'custom';

  // Extract capabilities
  const capabilities = [];
  if (spec.capabilities && spec.capabilities.operations) {
    spec.capabilities.operations.forEach(op => {
      capabilities.push({
        name: op.name,
        description: op.description,
        input_schema: op.inputSchema || { type: 'object' },
        output_schema: op.outputSchema || { type: 'object' },
        timeout_seconds: op.timeout || 300
      });
    });
  }

  // Ensure at least one capability
  if (capabilities.length === 0) {
    capabilities.push({
      name: 'process_request',
      description: 'Process incoming requests',
      input_schema: { type: 'object' },
      output_schema: { type: 'object' }
    });
  }

  // Build OSSA 1.0 manifest
  const migrated = {
    ossaVersion: '1.0',
    agent: {
      id: metadata.name || 'migrated-agent',
      name: metadata.name?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Migrated Agent',
      version: metadata.version || '1.0.0',
      description: metadata.description || '',
      role: role,
      tags: metadata.labels ? Object.values(metadata.labels) : []
    }
  };

  // Runtime
  migrated.agent.runtime = {
    type: 'docker'
  };

  if (spec.resources) {
    migrated.agent.runtime.resources = {
      cpu: spec.resources.requests?.cpu || '500m',
      memory: spec.resources.requests?.memory || '512Mi'
    };
  }

  // Capabilities
  migrated.agent.capabilities = capabilities;

  // Policies
  if (spec.conformance) {
    migrated.agent.policies = {};

    if (spec.conformance.certifications) {
      // Map certifications to compliance frameworks
      const complianceMap = {
        'ISO-42001': 'iso42001',
        'ISO-27001': 'iso27001',
        'SOC2': 'soc2-type2',
        'HIPAA': 'hipaa',
        'FedRAMP': 'fedramp-moderate',
        'OWASP-SAMM': 'nist-800-53'
      };

      const compliance = spec.conformance.certifications
        .map(cert => complianceMap[cert] || null)
        .filter(c => c !== null);

      if (compliance.length > 0) {
        migrated.agent.policies.compliance = compliance;
      }
    }

    if (spec.conformance.auditLogging) {
      migrated.agent.policies.audit = true;
    }
  }

  // Integration
  if (spec.protocols) {
    const primaryProtocol = spec.protocols.preferred || 'http';

    migrated.agent.integration = {
      protocol: primaryProtocol === 'ossa' ? 'http' : primaryProtocol,
      endpoints: {
        base_url: 'http://localhost:3000',
        health: '/health',
        metrics: '/metrics'
      }
    };

    // Auth
    const protocolConfig = spec.protocols.supported?.find(p => p.name === primaryProtocol);
    if (protocolConfig?.authentication) {
      migrated.agent.integration.auth = {
        type: protocolConfig.authentication.type || 'jwt'
      };
    } else {
      migrated.agent.integration.auth = { type: 'jwt' };
    }
  }

  // Monitoring
  migrated.agent.monitoring = {
    traces: true,
    metrics: true,
    logs: true
  };

  // Metadata
  if (metadata.author || metadata.license) {
    migrated.agent.metadata = {};
    if (metadata.author) migrated.agent.metadata.author = metadata.author;
    if (metadata.license) migrated.agent.metadata.license = metadata.license;
    if (metadata.repository) migrated.agent.metadata.repository = metadata.repository;
  }

  return migrated;
}
