/**
 * OSSA Dependencies Command
 * Validate agent dependencies, detect conflicts, and generate dependency graphs
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { container } from '../../di-container.js';
import { ManifestRepository } from '../../repositories/manifest.repository.js';
import { DependenciesValidator } from '../../services/validators/dependencies.validator.js';
import type { AgentManifest } from '../../services/validators/dependencies.validator.js';

/**
 * ossa validate-dependencies <pattern>
 * Validate all agent dependencies in matching files
 */
const validateDependenciesCommand = new Command('validate')
  .argument('<pattern>', 'Glob pattern for agent manifests (e.g., .gitlab/agents/**/*.ossa.yaml)')
  .option('-v, --verbose', 'Verbose output with detailed validation info')
  .description('Validate all agent dependencies')
  .action(async (pattern: string, options: { verbose?: boolean }) => {
    try {
      console.log(chalk.blue(`\n[CHECK] Validating agent dependencies...`));
      console.log(chalk.gray(`Pattern: ${pattern}\n`));

      // Find all manifests
      const files = await glob(pattern, { absolute: true });
      if (files.length === 0) {
        console.log(chalk.yellow('[WARN]  No agent manifests found matching pattern'));
        process.exit(1);
      }

      console.log(chalk.gray(`Found ${files.length} manifests\n`));

      // Load all manifests
      const manifestRepo = container.get(ManifestRepository);
      const manifests: AgentManifest[] = [];

      for (const file of files) {
        try {
          const manifest = await manifestRepo.load(file);
          manifests.push(manifest as AgentManifest);
        } catch (error: any) {
          console.log(chalk.yellow(`[WARN]  Skipping ${path.basename(file)}: ${error.message}`));
        }
      }

      if (manifests.length === 0) {
        console.log(chalk.red('[FAIL] No valid manifests found'));
        process.exit(1);
      }

      // Validate dependencies
      const validator = container.get(DependenciesValidator);
      const result = validator.validateDependencies(manifests);

      // Output results
      if (result.valid) {
        console.log(chalk.green('\n[PASS] All dependencies are valid!\n'));
        if (options.verbose) {
          console.log(chalk.gray(`Validated ${manifests.length} agents`));
          console.log(chalk.gray(`Total dependencies: ${countDependencies(manifests)}`));
        }
        process.exit(0);
      } else {
        console.log(chalk.red('\n[FAIL] Dependency validation failed!\n'));

        // Show version conflicts
        if (result.conflicts.length > 0) {
          console.log(chalk.yellow('[WARN]  Version Conflicts:'));
          for (const conflict of result.conflicts) {
            console.log(chalk.red(`\n  ${conflict.dependency}:`));
            for (const version of conflict.conflictingVersions) {
              console.log(chalk.gray(`    ${version.requiredBy} requires ${version.version}`));
            }
          }
          console.log();
        }

        // Show circular dependencies
        if (result.circularDependencies.length > 0) {
          console.log(chalk.yellow('[WARN]  Circular Dependencies:'));
          for (const circular of result.circularDependencies) {
            console.log(chalk.red(`    ${circular.cycle.join(' → ')}`));
          }
          console.log();
        }

        // Show missing dependencies
        if (result.missingDependencies.length > 0) {
          console.log(chalk.yellow('[WARN]  Missing Dependencies:'));
          for (const missing of result.missingDependencies) {
            console.log(
              chalk.red(`    ${missing.agent} requires ${missing.dependency} (not found)`)
            );
          }
          console.log();
        }

        // Show contract violations
        if (result.contractViolations.length > 0) {
          console.log(chalk.yellow('[WARN]  Contract Violations:'));
          for (const violation of result.contractViolations) {
            console.log(chalk.red(`    ${violation.agent} → ${violation.dependency}:`));
            console.log(chalk.gray(`      ${violation.violation}`));
          }
          console.log();
        }

        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n[FAIL] Error: ${error.message}\n`));
      if (options.verbose && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

/**
 * ossa dependencies check-conflicts <pattern>
 * Check for version conflicts only (faster than full validation)
 */
const checkConflictsCommand = new Command('check-conflicts')
  .argument('<pattern>', 'Glob pattern for agent manifests')
  .description('Check for version conflicts between agents')
  .action(async (pattern: string) => {
    try {
      console.log(chalk.blue(`\n[CHECK] Checking for version conflicts...\n`));

      // Load manifests
      const files = await glob(pattern, { absolute: true });
      const manifestRepo = container.get(ManifestRepository);
      const manifests: AgentManifest[] = [];

      for (const file of files) {
        try {
          const manifest = await manifestRepo.load(file);
          manifests.push(manifest as AgentManifest);
        } catch {
          // Skip invalid manifests
        }
      }

      // Check conflicts
      const validator = container.get(DependenciesValidator);
      const result = validator.validateDependencies(manifests);

      if (result.conflicts.length === 0) {
        console.log(chalk.green('[PASS] No version conflicts found!\n'));
        process.exit(0);
      } else {
        console.log(chalk.red(`[FAIL] Found ${result.conflicts.length} version conflicts:\n`));
        for (const conflict of result.conflicts) {
          console.log(chalk.yellow(`  ${conflict.dependency}:`));
          for (const version of conflict.conflictingVersions) {
            console.log(chalk.gray(`    ${version.requiredBy} requires ${version.version}`));
          }
          console.log();
        }
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n[FAIL] Error: ${error.message}\n`));
      process.exit(1);
    }
  });

/**
 * ossa dependencies graph <pattern>
 * Generate dependency graph in DOT format
 */
const graphCommand = new Command('graph')
  .argument('<pattern>', 'Glob pattern for agent manifests')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('-f, --format <format>', 'Output format: dot, json', 'dot')
  .description('Generate dependency graph visualization')
  .action(async (pattern: string, options: { output?: string; format?: string }) => {
    try {
      // Load manifests
      const files = await glob(pattern, { absolute: true });
      const manifestRepo = container.get(ManifestRepository);
      const manifests: AgentManifest[] = [];

      for (const file of files) {
        try {
          const manifest = await manifestRepo.load(file);
          manifests.push(manifest as AgentManifest);
        } catch {
          // Skip invalid manifests
        }
      }

      if (manifests.length === 0) {
        console.log(chalk.red('[FAIL] No valid manifests found'));
        process.exit(1);
      }

      // Generate graph
      const validator = container.get(DependenciesValidator);
      let output: string;

      if (options.format === 'json') {
        // Generate JSON format
        const graph: any = {
          nodes: manifests.map((m) => ({
            id: m.metadata.name,
            version: m.metadata.version || 'unknown',
          })),
          edges: [],
        };

        for (const manifest of manifests) {
          const deps = manifest.spec.dependencies?.agents || [];
          for (const dep of deps) {
            graph.edges.push({
              from: manifest.metadata.name,
              to: dep.name,
              version: dep.version,
              required: dep.required,
            });
          }
        }

        output = JSON.stringify(graph, null, 2);
      } else {
        // Generate DOT format
        output = validator.generateDependencyGraph(manifests);
      }

      // Output
      if (options.output) {
        fs.writeFileSync(options.output, output, 'utf-8');
        console.log(chalk.green(`\n[PASS] Dependency graph written to ${options.output}`));
        if (options.format === 'dot') {
          console.log(chalk.gray(`\nGenerate PNG: dot -Tpng ${options.output} -o graph.png\n`));
        }
      } else {
        console.log(output);
      }

      process.exit(0);
    } catch (error: any) {
      console.error(chalk.red(`\n[FAIL] Error: ${error.message}\n`));
      process.exit(1);
    }
  });

/**
 * ossa dependencies deploy-order <pattern>
 * Calculate deployment order based on dependencies
 */
const deployOrderCommand = new Command('deploy-order')
  .argument('<pattern>', 'Glob pattern for agent manifests')
  .option('-f, --format <format>', 'Output format: text, json', 'text')
  .description('Calculate deployment order for agents')
  .action(async (pattern: string, options: { format?: string }) => {
    try {
      console.log(chalk.blue(`\n[CHECK] Calculating deployment order...\n`));

      // Load manifests
      const files = await glob(pattern, { absolute: true });
      const manifestRepo = container.get(ManifestRepository);
      const manifests: AgentManifest[] = [];

      for (const file of files) {
        try {
          const manifest = await manifestRepo.load(file);
          manifests.push(manifest as AgentManifest);
        } catch {
          // Skip invalid manifests
        }
      }

      if (manifests.length === 0) {
        console.log(chalk.red('[FAIL] No valid manifests found'));
        process.exit(1);
      }

      // Calculate deployment order
      const validator = container.get(DependenciesValidator);
      const batches = validator.calculateDeploymentOrder(manifests);

      // Output
      if (options.format === 'json') {
        const output = {
          batches: batches.map((batch, i) => ({
            batch_id: i + 1,
            parallel: batch.length > 1,
            agents: batch,
          })),
          total_agents: manifests.length,
          total_batches: batches.length,
        };
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(chalk.green(`[PASS] Deployment order (${batches.length} batches):\n`));
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          console.log(chalk.yellow(`Batch ${i + 1}:`));
          if (batch.length > 1) {
            console.log(chalk.gray(`  (Can deploy in parallel)`));
          }
          for (const agent of batch) {
            console.log(chalk.cyan(`  - ${agent}`));
          }
          console.log();
        }
      }

      process.exit(0);
    } catch (error: any) {
      console.error(chalk.red(`\n[FAIL] Error: ${error.message}\n`));
      process.exit(1);
    }
  });

/**
 * Helper: Count total dependencies
 */
function countDependencies(manifests: AgentManifest[]): number {
  let count = 0;
  for (const manifest of manifests) {
    const agents = manifest.spec.dependencies?.agents || [];
    const services = manifest.spec.dependencies?.services || [];
    const mcp = manifest.spec.dependencies?.mcp || [];
    count += agents.length + services.length + mcp.length;
  }
  return count;
}

/**
 * Main dependencies command group
 */
export const dependenciesCommand = new Command('dependencies')
  .description('Validate agent dependencies and detect conflicts')
  .addCommand(validateDependenciesCommand)
  .addCommand(checkConflictsCommand)
  .addCommand(graphCommand)
  .addCommand(deployOrderCommand);
