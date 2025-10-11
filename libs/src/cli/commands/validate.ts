#!/usr/bin/env tsx

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { validateOpenAPISpec } from '../../core/validation/openapi-validator.js';

export function createValidateCommand(): Command {
  const validate = new Command('validate');

  validate
    .description('Validate specifications for OSSA compliance')
    .addCommand(createOpenAPIValidateCommand())
    .addCommand(createAgentValidateCommand())
    .addCommand(createProjectValidateCommand());

  return validate;
}

function createOpenAPIValidateCommand(): Command {
  const openapi = new Command('openapi');

  openapi
    .description('Validate OpenAPI specifications for OSSA compliance')
    .argument('<spec-path>', 'Path to OpenAPI specification file')
    .option('--no-ossa', 'Disable OSSA-specific validation')
    .option('--no-agent-metadata', 'Skip agent metadata validation')
    .option('--no-security', 'Skip security scheme validation')
    .option('--no-examples', 'Skip examples validation')
    .option('--ossa-version <version>', 'OSSA version to validate against', '0.1.9')
    .option('--json', 'Output results as JSON')
    .option('--output <file>', 'Save validation report to file')
    .action(async (specPath: string, options: any) => {
      try {
        // Validate the file exists
        if (!fs.existsSync(specPath)) {
          console.error(`❌ File not found: ${specPath}`);
          process.exit(1);
        }

        // Run validation
        await validateOpenAPISpec(specPath, options);

        console.log('✅ Validation completed successfully');
      } catch (error) {
        console.error(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });

  return openapi;
}

function createAgentValidateCommand(): Command {
  const agent = new Command('agent');

  agent
    .description('Validate agent manifest for OSSA compliance')
    .argument('<agent-path>', 'Path to agent manifest file')
    .option('--schema <path>', 'Custom schema file path')
    .option('--json', 'Output results as JSON')
    .action(async (agentPath: string, options: any) => {
      console.log(`🤖 Validating agent manifest: ${agentPath}`);

      if (!fs.existsSync(agentPath)) {
        console.error(`❌ Agent manifest not found: ${agentPath}`);
        process.exit(1);
      }

      // TODO: Implement agent manifest validation
      console.log('🚧 Agent validation coming soon...');
    });

  return agent;
}

function createProjectValidateCommand(): Command {
  const project = new Command('project');

  project
    .description('Validate entire project for OSSA compliance')
    .argument('[project-path]', 'Path to project directory', '.')
    .option('--config <path>', 'Path to OSSA configuration file')
    .option('--fix', 'Automatically fix common issues')
    .option('--report <file>', 'Generate detailed compliance report')
    .action(async (projectPath: string, options: any) => {
      console.log(`📁 Validating project: ${projectPath}`);

      // Find all OpenAPI specs in the project
      const specs = findOpenAPISpecs(projectPath);

      if (specs.length === 0) {
        console.log('ℹ️  No OpenAPI specifications found in project');
        return;
      }

      console.log(`🔍 Found ${specs.length} OpenAPI specification(s)`);

      let allValid = true;
      for (const spec of specs) {
        console.log(`\n📋 Validating: ${spec}`);
        try {
          await validateOpenAPISpec(spec, {
            ...options,
            quiet: true // Don't output individual reports in project mode
          });
          console.log(`✅ ${spec} - Valid`);
        } catch (error) {
          console.log(`❌ ${spec} - Invalid`);
          allValid = false;
        }
      }

      if (allValid) {
        console.log('\n🎉 All specifications are OSSA compliant!');
      } else {
        console.log('\n❌ Some specifications failed validation');
        process.exit(1);
      }
    });

  return project;
}

function findOpenAPISpecs(projectPath: string): string[] {
  const specs: string[] = [];
  const extensions = ['.yml', '.yaml', '.json'];

  function searchDirectory(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          searchDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          // Check if it's an OpenAPI spec by looking for openapi field
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('openapi:') || content.includes('"openapi"')) {
              specs.push(fullPath);
            }
          } catch (error) {
            // Ignore files that can't be read
          }
        }
      }
    }
  }

  searchDirectory(projectPath);
  return specs;
}

export default createValidateCommand;
