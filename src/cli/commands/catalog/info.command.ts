import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../../di-container.js';
import { IndexService } from '../../../services/registry/index.service.js';

export const catalogInfoCommand = new Command('info')
  .description('Show detailed agent information from registry')
  .argument('<agent-id>', 'Agent ID to retrieve')
  .option('--registry <path>', 'Path to registry directory', './registry')
  .option('--json', 'Output as JSON')
  .action(async (agentId, options) => {
    try {
      const indexService = container.get(IndexService);
      const registryPath = options.registry || './registry';

      // Get agent from registry
      const agent = await indexService.getAgent(registryPath, agentId);

      if (!agent) {
        console.error(chalk.red(`✗ Agent not found: ${agentId}`));
        process.exit(1);
      }

      if (options.json) {
        // JSON output
        console.log(JSON.stringify(agent, null, 2));
      } else {
        // Formatted output
        console.log(chalk.blue('\nAgent Information:\n'));

        console.log(chalk.green(`${agent.name}`));
        console.log(chalk.gray(`ID: ${agent.id}`));
        console.log(chalk.gray(`Version: ${agent.version}`));
        console.log(chalk.gray(`Schema: ${agent.schema_version}`));
        console.log();

        if (agent.description) {
          console.log(chalk.bold('Description:'));
          console.log(agent.description);
          console.log();
        }

        if (agent.license) {
          console.log(chalk.bold('License:'));
          console.log(`  ${agent.license}`);
          console.log();
        }

        if (agent.frameworks && agent.frameworks.length > 0) {
          console.log(chalk.bold('Frameworks:'));
          agent.frameworks.forEach((fw: string) => console.log(`  - ${fw}`));
          console.log();
        }

        if (agent.capabilities && agent.capabilities.length > 0) {
          console.log(chalk.bold('Capabilities:'));
          agent.capabilities.forEach((cap: string) =>
            console.log(`  - ${cap}`)
          );
          console.log();
        }

        if (agent.tags && agent.tags.length > 0) {
          console.log(chalk.bold('Tags:'));
          console.log(`  ${agent.tags.join(', ')}`);
          console.log();
        }

        // Display artifacts and security info
        if (agent.artifacts) {
          console.log(chalk.bold('Artifacts:'));
          console.log(
            `  Bundle SHA-256: ${agent.artifacts.bundle.sha256.substring(0, 16)}...`
          );
          if (agent.artifacts.bundle.size) {
            console.log(
              `  Bundle Size: ${(agent.artifacts.bundle.size / 1024).toFixed(2)} KB`
            );
          }
          if (agent.artifacts.sbom) {
            console.log(
              `  SBOM SHA-256: ${agent.artifacts.sbom.sha256.substring(0, 16)}...`
            );
            console.log(
              `  SBOM Format: ${agent.artifacts.sbom.format || 'cyclonedx'}`
            );
          }
          console.log();
        } else if (agent.sbom_sha256) {
          // Backwards compatibility
          console.log(chalk.bold('Security:'));
          console.log(
            `  SBOM SHA-256: ${agent.sbom_sha256.substring(0, 16)}...`
          );
          console.log();
        }

        // Display security posture if available
        if (agent.security_posture) {
          console.log(chalk.bold('Security Posture:'));
          if (agent.security_posture.compliance_level) {
            console.log(
              `  Compliance Level: ${agent.security_posture.compliance_level}`
            );
          }
          if (agent.security_posture.network) {
            if (agent.security_posture.network.egress !== undefined) {
              console.log(
                `  Network Egress: ${agent.security_posture.network.egress ? 'Required' : 'Not required'}`
              );
            }
            if (agent.security_posture.network.ingress !== undefined) {
              console.log(
                `  Network Ingress: ${agent.security_posture.network.ingress ? 'Required' : 'Not required'}`
              );
            }
          }
          if (agent.security_posture.tools) {
            if (agent.security_posture.tools.exec !== undefined) {
              console.log(
                `  Requires Exec: ${agent.security_posture.tools.exec ? 'Yes' : 'No'}`
              );
            }
            if (agent.security_posture.tools.file_system !== undefined) {
              console.log(
                `  Requires File System: ${agent.security_posture.tools.file_system ? 'Yes' : 'No'}`
              );
            }
          }
          if (
            agent.security_posture.secrets?.required &&
            agent.security_posture.secrets.required.length > 0
          ) {
            console.log(
              `  Required Secrets: ${agent.security_posture.secrets.required.join(', ')}`
            );
          }
          console.log();
        }

        // Display entrypoints if available
        if (agent.entrypoints && agent.entrypoints.length > 0) {
          console.log(chalk.bold('Entrypoints:'));
          agent.entrypoints.forEach((ep: any) => {
            console.log(`  - Type: ${ep.type}`);
            if (ep.command) console.log(`    Command: ${ep.command}`);
            if (ep.endpoint) console.log(`    Endpoint: ${ep.endpoint}`);
          });
          console.log();
        }

        // Display registry info
        console.log(chalk.bold('Registry Info:'));
        console.log(`  Manifest URL: ${agent.manifest_url}`);
        if (agent.bundle_url) {
          console.log(`  Bundle URL: ${agent.bundle_url}`);
        }
        if (agent.git_url) {
          console.log(`  Git URL: ${agent.git_url}`);
        }
        console.log(
          `  Published At: ${new Date(agent.published_at).toLocaleString()}`
        );
        if (agent.published_by) {
          console.log(`  Published By: ${agent.published_by}`);
        }
        console.log();
      }
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
