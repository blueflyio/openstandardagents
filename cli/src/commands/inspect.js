/**
 * OSSA Inspect Command
 *
 * Shows detailed information about an OSSA agent manifest.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

module.exports = async function inspect(agentPath, options) {
  try {
    // Load agent manifest
    const manifestPath = path.resolve(process.cwd(), agentPath);
    if (!fs.existsSync(manifestPath)) {
      console.error(`Error: Agent manifest not found at ${manifestPath}`);
      process.exit(1);
    }

    let agent;
    if (manifestPath.endsWith('.json')) {
      agent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } else if (
      manifestPath.endsWith('.yml') ||
      manifestPath.endsWith('.yaml')
    ) {
      agent = yaml.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } else {
      console.error('Error: Manifest must be .json, .yml, or .yaml');
      process.exit(1);
    }

    // Display detailed information
    console.log(
      '\n═══════════════════════════════════════════════════════════'
    );
    console.log('                    AGENT DETAILS');
    console.log(
      '═══════════════════════════════════════════════════════════\n'
    );

    // Basic Info
    console.log('BASIC INFORMATION:');
    console.log(`  ID:           ${agent.agent?.id || 'N/A'}`);
    console.log(`  Name:         ${agent.agent?.name || 'N/A'}`);
    console.log(`  Version:      ${agent.agent?.version || 'N/A'}`);
    console.log(`  OSSA Version: ${agent.ossaVersion || 'N/A'}`);
    console.log(`  Role:         ${agent.agent?.role || 'N/A'}`);
    console.log(`  Description:  ${agent.agent?.description || 'N/A'}`);

    if (agent.agent?.tags && agent.agent.tags.length > 0) {
      console.log(`  Tags:         ${agent.agent.tags.join(', ')}`);
    }
    console.log('');

    // Runtime
    if (agent.agent?.runtime) {
      console.log('RUNTIME:');
      console.log(`  Type:         ${agent.agent.runtime.type || 'N/A'}`);
      if (agent.agent.runtime.image) {
        console.log(`  Image:        ${agent.agent.runtime.image}`);
      }
      if (agent.agent.runtime.resources) {
        console.log(
          `  CPU:          ${agent.agent.runtime.resources.cpu || 'N/A'}`
        );
        console.log(
          `  Memory:       ${agent.agent.runtime.resources.memory || 'N/A'}`
        );
      }
      if (agent.agent.runtime.health_check) {
        console.log(
          `  Health Check: ${agent.agent.runtime.health_check.type} ${
            agent.agent.runtime.health_check.endpoint ||
            agent.agent.runtime.health_check.port ||
            ''
          }`
        );
      }
      console.log('');
    }

    // Capabilities
    if (agent.agent?.capabilities) {
      console.log(`CAPABILITIES (${agent.agent.capabilities.length}):`);
      agent.agent.capabilities.forEach((cap, idx) => {
        console.log(`  ${idx + 1}. ${cap.name}`);
        console.log(`     ${cap.description || 'No description'}`);
        if (cap.timeout_seconds) {
          console.log(`     Timeout: ${cap.timeout_seconds}s`);
        }
        if (options.verbose) {
          console.log(
            `     Input:  ${JSON.stringify(
              cap.input_schema?.type || 'undefined'
            )}`
          );
          console.log(
            `     Output: ${JSON.stringify(
              cap.output_schema?.type || 'undefined'
            )}`
          );
        }
      });
      console.log('');
    }

    // Integration
    if (agent.agent?.integration) {
      console.log('INTEGRATION:');
      console.log(
        `  Protocol:     ${agent.agent.integration.protocol || 'N/A'}`
      );
      if (agent.agent.integration.endpoints) {
        console.log(
          `  Base URL:     ${
            agent.agent.integration.endpoints.base_url || 'N/A'
          }`
        );
        console.log(
          `  Health:       ${agent.agent.integration.endpoints.health || 'N/A'}`
        );
        console.log(
          `  Metrics:      ${
            agent.agent.integration.endpoints.metrics || 'N/A'
          }`
        );
      }
      if (agent.agent.integration.auth) {
        console.log(
          `  Auth Type:    ${agent.agent.integration.auth.type || 'N/A'}`
        );
      }
      console.log('');
    }

    // Monitoring
    if (agent.agent?.monitoring) {
      console.log('MONITORING:');
      console.log(
        `  Traces:       ${
          agent.agent.monitoring.traces ? 'Enabled' : 'Disabled'
        }`
      );
      console.log(
        `  Metrics:      ${
          agent.agent.monitoring.metrics ? 'Enabled' : 'Disabled'
        }`
      );
      console.log(
        `  Logs:         ${
          agent.agent.monitoring.logs ? 'Enabled' : 'Disabled'
        }`
      );
      console.log('');
    }

    // Policies/Security
    if (agent.agent?.policies || agent.agent?.security) {
      console.log('SECURITY & POLICIES:');
      const policies = agent.agent.policies || agent.agent.security;
      if (policies.compliance) {
        console.log(`  Compliance:   ${policies.compliance.join(', ')}`);
      }
      if (policies.encryption !== undefined) {
        console.log(
          `  Encryption:   ${policies.encryption ? 'Required' : 'Optional'}`
        );
      }
      if (policies.audit !== undefined) {
        console.log(
          `  Audit Logs:   ${policies.audit ? 'Enabled' : 'Disabled'}`
        );
      }
      console.log('');
    }

    // Dependencies
    if (agent.agent?.dependencies) {
      console.log('DEPENDENCIES:');
      if (
        agent.agent.dependencies.required &&
        agent.agent.dependencies.required.length > 0
      ) {
        console.log('  Required:');
        agent.agent.dependencies.required.forEach((dep) => {
          console.log(`    - ${dep.agent_id} (>= ${dep.min_version})`);
        });
      }
      if (
        agent.agent.dependencies.optional &&
        agent.agent.dependencies.optional.length > 0
      ) {
        console.log('  Optional:');
        agent.agent.dependencies.optional.forEach((dep) => {
          console.log(`    - ${dep.agent_id}`);
        });
      }
      console.log('');
    }

    // Metadata
    if (agent.agent?.metadata) {
      console.log('METADATA:');
      if (agent.agent.metadata.author) {
        console.log(`  Author:       ${agent.agent.metadata.author}`);
      }
      if (agent.agent.metadata.license) {
        console.log(`  License:      ${agent.agent.metadata.license}`);
      }
      if (agent.agent.metadata.repository) {
        console.log(`  Repository:   ${agent.agent.metadata.repository}`);
      }
      if (agent.agent.metadata.documentation) {
        console.log(`  Docs:         ${agent.agent.metadata.documentation}`);
      }
      console.log('');
    }

    console.log(
      '═══════════════════════════════════════════════════════════\n'
    );

    // JSON output if requested
    if (options.json) {
      console.log(JSON.stringify(agent, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during inspection:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};
