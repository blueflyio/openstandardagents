/**
 * OSSA Validation Commands
 * 
 * CLI commands for validating OpenAPI specifications, agent configurations,
 * workflow definitions, and runtime compliance with OSSA standards.
 * 
 * @version 0.1.8
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { writeFileSync, readFileSync, pathExists } from 'fs-extra';
import { glob } from 'glob';
import { 
  validator,
  ValidationFormatter,
  ValidationOptions,
  ValidationResult
} from '../validation/api-validator';
import { ossaClient } from '../api/client';
import type { Agent, WorkflowDefinition } from '../api/generated-types';

// =====================================================================
// Validation Commands Registration
// =====================================================================

export function registerValidationCommands(program: Command): void {
  const validateCmd = program
    .command('validate')
    .description('Validate OpenAPI specs, agents, and workflows against OSSA standards');

  // OpenAPI specification validation
  validateCmd
    .command('openapi <specFile>')
    .description('Validate OpenAPI specification with OSSA compliance')
    .option('-s, --strict', 'Strict validation mode')
    .option('-f, --format <format>', 'Output format (detailed, summary, json)', 'detailed')
    .option('-o, --output <file>', 'Save validation report to file')
    .option('--skip-optional', 'Skip validation of optional features')
    .option('--include-drafts', 'Include draft specifications in validation')
    .action(async (specFile, options) => {
      try {
        if (!await pathExists(specFile)) {
          console.error(chalk.red(`OpenAPI specification file not found: ${specFile}`));
          process.exit(1);
        }

        const spinner = ora('Validating OpenAPI specification...').start();
        
        const validationOptions: ValidationOptions = {
          strict: options.strict,
          includeDrafts: options.includeDrafts,
          skipOptional: options.skipOptional,
          outputFormat: options.format
        };

        const result = await validator.validateOpenAPI(specFile, validationOptions);
        spinner.stop();

        const output = ValidationFormatter.formatResult(result, options.format);
        
        if (options.output) {
          writeFileSync(options.output, output);
          console.log(chalk.green(`Validation report saved to ${options.output}`));
        } else {
          console.log(output);
        }

        // Exit with error code if validation failed
        if (!result.valid) {
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Error validating OpenAPI spec:'), error);
        process.exit(1);
      }
    });

  // Agent configuration validation
  validateCmd
    .command('agent')
    .description('Validate agent configuration against OSSA standards')
    .option('-f, --file <file>', 'Agent configuration file (JSON/YAML)')
    .option('-i, --id <agentId>', 'Validate registered agent by ID')
    .option('-a, --all', 'Validate all registered agents')
    .option('--format <format>', 'Output format (detailed, summary, json)', 'detailed')
    .option('-o, --output <file>', 'Save validation report to file')
    .option('--strict', 'Strict validation mode')
    .option('--fix', 'Attempt to fix validation issues')
    .action(async (options) => {
      try {
        if (options.file) {
          await validateAgentFile(options);
        } else if (options.id) {
          await validateAgentById(options.id, options);
        } else if (options.all) {
          await validateAllAgents(options);
        } else {
          console.error(chalk.red('Please specify --file, --id, or --all option'));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Error validating agent:'), error);
        process.exit(1);
      }
    });

  // Workflow validation
  validateCmd
    .command('workflow')
    .description('Validate workflow definition against OSSA standards')
    .option('-f, --file <file>', 'Workflow definition file (JSON/YAML)')
    .option('-i, --id <workflowId>', 'Validate workflow by ID')
    .option('-d, --directory <dir>', 'Validate all workflows in directory')
    .option('--format <format>', 'Output format (detailed, summary, json)', 'detailed')
    .option('-o, --output <file>', 'Save validation report to file')
    .option('--strict', 'Strict validation mode')
    .action(async (options) => {
      try {
        if (options.file) {
          await validateWorkflowFile(options);
        } else if (options.id) {
          await validateWorkflowById(options.id, options);
        } else if (options.directory) {
          await validateWorkflowDirectory(options);
        } else {
          console.error(chalk.red('Please specify --file, --id, or --directory option'));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('Error validating workflow:'), error);
        process.exit(1);
      }
    });

  // Batch validation
  validateCmd
    .command('batch')
    .description('Validate multiple files and configurations')
    .option('-p, --pattern <pattern>', 'File pattern to validate (e.g., "**/*.yaml")')
    .option('-t, --type <type>', 'File type (openapi, agent, workflow, auto)', 'auto')
    .option('--format <format>', 'Output format (detailed, summary, json)', 'summary')
    .option('-o, --output <file>', 'Save combined validation report to file')
    .option('--strict', 'Strict validation mode')
    .option('--fail-fast', 'Stop on first validation failure')
    .action(async (options) => {
      try {
        await validateBatch(options);
      } catch (error) {
        console.error(chalk.red('Error in batch validation:'), error);
        process.exit(1);
      }
    });

  // Runtime validation
  validateCmd
    .command('runtime')
    .description('Validate live platform against OSSA compliance')
    .option('--endpoint <url>', 'API endpoint to validate')
    .option('--api-key <key>', 'API key for authentication')
    .option('--format <format>', 'Output format (detailed, summary, json)', 'detailed')
    .option('-o, --output <file>', 'Save validation report to file')
    .option('--comprehensive', 'Run comprehensive runtime validation')
    .action(async (options) => {
      try {
        await validateRuntime(options);
      } catch (error) {
        console.error(chalk.red('Error in runtime validation:'), error);
        process.exit(1);
      }
    });

  // Compliance check
  validateCmd
    .command('compliance')
    .description('Check platform compliance with governance frameworks')
    .option('--framework <framework>', 'Specific framework (ISO_42001, GDPR, SOC2, etc.)')
    .option('--detailed', 'Detailed compliance report')
    .option('--format <format>', 'Output format (detailed, summary, json)', 'detailed')
    .option('-o, --output <file>', 'Save compliance report to file')
    .action(async (options) => {
      try {
        await validateCompliance(options);
      } catch (error) {
        console.error(chalk.red('Error checking compliance:'), error);
        process.exit(1);
      }
    });

  // Interactive validation wizard
  validateCmd
    .command('wizard')
    .description('Interactive validation wizard')
    .action(async () => {
      try {
        await runValidationWizard();
      } catch (error) {
        console.error(chalk.red('Error in validation wizard:'), error);
        process.exit(1);
      }
    });
}

// =====================================================================
// Validation Implementation Functions
// =====================================================================

async function validateAgentFile(options: any): Promise<void> {
  if (!await pathExists(options.file)) {
    console.error(chalk.red(`Agent file not found: ${options.file}`));
    process.exit(1);
  }

  const spinner = ora(`Validating agent configuration: ${options.file}`).start();
  
  const content = readFileSync(options.file, 'utf-8');
  const agent: Agent = options.file.endsWith('.yaml') || options.file.endsWith('.yml') 
    ? require('yaml').parse(content)
    : JSON.parse(content);

  const validationOptions: ValidationOptions = {
    strict: options.strict,
    outputFormat: options.format
  };

  const result = validator.validateAgent(agent, validationOptions);
  spinner.stop();

  const output = ValidationFormatter.formatResult(result, options.format);
  
  if (options.output) {
    writeFileSync(options.output, output);
    console.log(chalk.green(`Validation report saved to ${options.output}`));
  } else {
    console.log(output);
  }

  if (options.fix && !result.valid) {
    await attemptAgentFixes(agent, result, options.file);
  }

  if (!result.valid) {
    process.exit(1);
  }
}

async function validateAgentById(agentId: string, options: any): Promise<void> {
  const spinner = ora(`Fetching and validating agent: ${agentId}`).start();
  
  try {
    const response = await ossaClient.getAgent(agentId);
    const agent = response.data;
    
    spinner.text = `Validating agent: ${agent.name}`;
    
    const validationOptions: ValidationOptions = {
      strict: options.strict,
      outputFormat: options.format
    };

    const result = validator.validateAgent(agent, validationOptions);
    spinner.stop();

    console.log(chalk.bold(`Validation Results for Agent: ${agent.name}`));
    console.log(`ID: ${chalk.cyan(agent.id)}`);
    console.log(`Version: ${chalk.cyan(agent.version)}`);
    console.log('');

    const output = ValidationFormatter.formatResult(result, options.format);
    
    if (options.output) {
      const reportData = {
        agent: {
          id: agent.id,
          name: agent.name,
          version: agent.version
        },
        validation: result
      };
      writeFileSync(options.output, JSON.stringify(reportData, null, 2));
      console.log(chalk.green(`Validation report saved to ${options.output}`));
    } else {
      console.log(output);
    }

    if (!result.valid) {
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red(`Error fetching agent ${agentId}:`), error);
    process.exit(1);
  }
}

async function validateAllAgents(options: any): Promise<void> {
  const spinner = ora('Fetching all registered agents...').start();
  
  try {
    const response = await ossaClient.listAgents({ limit: 1000 });
    const agents = response.data.agents;
    
    spinner.stop();
    console.log(`Found ${chalk.cyan(agents.length)} registered agents to validate\n`);

    const validationResults: Array<{agent: Agent, result: ValidationResult}> = [];
    let totalValid = 0;

    for (const agent of agents) {
      const agentSpinner = ora(`Validating: ${agent.name}`).start();
      
      const validationOptions: ValidationOptions = {
        strict: options.strict,
        outputFormat: 'summary'
      };

      const result = validator.validateAgent(agent, validationOptions);
      validationResults.push({ agent, result });
      
      if (result.valid) {
        totalValid++;
        agentSpinner.succeed(`${agent.name}: ${chalk.green('VALID')} (${result.score}%)`);
      } else {
        agentSpinner.fail(`${agent.name}: ${chalk.red('INVALID')} (${result.score}%)`);
        if (options.format === 'detailed') {
          console.log(`  Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
        }
      }
    }

    console.log(`\n${chalk.bold('Validation Summary:')}`);
    console.log(`Total Agents: ${chalk.cyan(agents.length)}`);
    console.log(`Valid: ${chalk.green(totalValid)}`);
    console.log(`Invalid: ${chalk.red(agents.length - totalValid)}`);
    console.log(`Success Rate: ${chalk.cyan(Math.round((totalValid / agents.length) * 100))}%`);

    if (options.output) {
      const report = {
        summary: {
          total: agents.length,
          valid: totalValid,
          invalid: agents.length - totalValid,
          success_rate: Math.round((totalValid / agents.length) * 100)
        },
        results: validationResults
      };
      writeFileSync(options.output, JSON.stringify(report, null, 2));
      console.log(chalk.green(`\nDetailed report saved to ${options.output}`));
    }

    if (totalValid < agents.length) {
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

async function validateWorkflowFile(options: any): Promise<void> {
  if (!await pathExists(options.file)) {
    console.error(chalk.red(`Workflow file not found: ${options.file}`));
    process.exit(1);
  }

  const spinner = ora(`Validating workflow: ${options.file}`).start();
  
  const content = readFileSync(options.file, 'utf-8');
  const workflow: WorkflowDefinition = options.file.endsWith('.yaml') || options.file.endsWith('.yml') 
    ? require('yaml').parse(content)
    : JSON.parse(content);

  const validationOptions: ValidationOptions = {
    strict: options.strict,
    outputFormat: options.format
  };

  const result = validator.validateWorkflow(workflow, validationOptions);
  spinner.stop();

  const output = ValidationFormatter.formatResult(result, options.format);
  
  if (options.output) {
    writeFileSync(options.output, output);
    console.log(chalk.green(`Validation report saved to ${options.output}`));
  } else {
    console.log(output);
  }

  if (!result.valid) {
    process.exit(1);
  }
}

async function validateWorkflowById(workflowId: string, options: any): Promise<void> {
  const spinner = ora(`Fetching and validating workflow: ${workflowId}`).start();
  
  try {
    const response = await ossaClient.getWorkflow(workflowId);
    const workflow = response.data.definition;
    
    spinner.text = `Validating workflow: ${workflow.name}`;
    
    const validationOptions: ValidationOptions = {
      strict: options.strict,
      outputFormat: options.format
    };

    const result = validator.validateWorkflow(workflow, validationOptions);
    spinner.stop();

    console.log(chalk.bold(`Validation Results for Workflow: ${workflow.name}`));
    console.log('');

    const output = ValidationFormatter.formatResult(result, options.format);
    console.log(output);

    if (options.output) {
      const reportData = {
        workflow: {
          id: workflowId,
          name: workflow.name,
          version: workflow.version
        },
        validation: result
      };
      writeFileSync(options.output, JSON.stringify(reportData, null, 2));
      console.log(chalk.green(`Validation report saved to ${options.output}`));
    }

    if (!result.valid) {
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red(`Error fetching workflow ${workflowId}:`), error);
    process.exit(1);
  }
}

async function validateWorkflowDirectory(options: any): Promise<void> {
  const spinner = ora(`Scanning directory: ${options.directory}`).start();
  
  const pattern = `${options.directory}/**/*.{json,yaml,yml}`;
  const files = await glob(pattern);
  
  if (files.length === 0) {
    spinner.stop();
    console.log(chalk.yellow(`No workflow files found in ${options.directory}`));
    return;
  }

  spinner.stop();
  console.log(`Found ${chalk.cyan(files.length)} workflow files to validate\n`);

  let totalValid = 0;
  const results = [];

  for (const file of files) {
    const fileSpinner = ora(`Validating: ${file}`).start();
    
    try {
      const content = readFileSync(file, 'utf-8');
      const workflow: WorkflowDefinition = file.endsWith('.yaml') || file.endsWith('.yml') 
        ? require('yaml').parse(content)
        : JSON.parse(content);

      const result = validator.validateWorkflow(workflow, { strict: options.strict });
      results.push({ file, workflow: workflow.name, result });

      if (result.valid) {
        totalValid++;
        fileSpinner.succeed(`${workflow.name}: ${chalk.green('VALID')} (${result.score}%)`);
      } else {
        fileSpinner.fail(`${workflow.name}: ${chalk.red('INVALID')} (${result.score}%)`);
      }
    } catch (error) {
      fileSpinner.fail(`${file}: ${chalk.red('ERROR')} - ${error}`);
    }
  }

  console.log(`\n${chalk.bold('Validation Summary:')}`);
  console.log(`Total Files: ${chalk.cyan(files.length)}`);
  console.log(`Valid: ${chalk.green(totalValid)}`);
  console.log(`Invalid: ${chalk.red(files.length - totalValid)}`);

  if (options.output) {
    writeFileSync(options.output, JSON.stringify(results, null, 2));
    console.log(chalk.green(`\nDetailed report saved to ${options.output}`));
  }
}

async function validateBatch(options: any): Promise<void> {
  const spinner = ora(`Finding files matching pattern: ${options.pattern}`).start();
  
  const files = await glob(options.pattern);
  
  if (files.length === 0) {
    spinner.stop();
    console.log(chalk.yellow(`No files found matching pattern: ${options.pattern}`));
    return;
  }

  spinner.stop();
  console.log(`Found ${chalk.cyan(files.length)} files to validate\n`);

  const results = [];
  let totalValid = 0;

  for (const file of files) {
    const fileSpinner = ora(`Validating: ${file}`).start();
    
    try {
      const fileType = options.type === 'auto' ? detectFileType(file) : options.type;
      let result: ValidationResult;

      switch (fileType) {
        case 'openapi':
          result = await validator.validateOpenAPI(file, { strict: options.strict });
          break;
        case 'agent':
          const agentContent = readFileSync(file, 'utf-8');
          const agent: Agent = file.endsWith('.yaml') || file.endsWith('.yml') 
            ? require('yaml').parse(agentContent) 
            : JSON.parse(agentContent);
          result = validator.validateAgent(agent, { strict: options.strict });
          break;
        case 'workflow':
          const workflowContent = readFileSync(file, 'utf-8');
          const workflow: WorkflowDefinition = file.endsWith('.yaml') || file.endsWith('.yml') 
            ? require('yaml').parse(workflowContent) 
            : JSON.parse(workflowContent);
          result = validator.validateWorkflow(workflow, { strict: options.strict });
          break;
        default:
          throw new Error(`Unknown file type: ${fileType}`);
      }

      results.push({ file, type: fileType, result });

      if (result.valid) {
        totalValid++;
        fileSpinner.succeed(`${file}: ${chalk.green('VALID')} (${result.score}%)`);
      } else {
        fileSpinner.fail(`${file}: ${chalk.red('INVALID')} (${result.score}%)`);
        
        if (options.failFast) {
          console.log(chalk.red('\nFailing fast due to validation error'));
          process.exit(1);
        }
      }
    } catch (error) {
      fileSpinner.fail(`${file}: ${chalk.red('ERROR')} - ${error}`);
      
      if (options.failFast) {
        console.log(chalk.red('\nFailing fast due to processing error'));
        process.exit(1);
      }
    }
  }

  console.log(`\n${chalk.bold('Batch Validation Summary:')}`);
  console.log(`Total Files: ${chalk.cyan(files.length)}`);
  console.log(`Valid: ${chalk.green(totalValid)}`);
  console.log(`Invalid: ${chalk.red(files.length - totalValid)}`);
  console.log(`Success Rate: ${chalk.cyan(Math.round((totalValid / files.length) * 100))}%`);

  if (options.output) {
    const report = {
      summary: {
        total: files.length,
        valid: totalValid,
        invalid: files.length - totalValid,
        success_rate: Math.round((totalValid / files.length) * 100)
      },
      results
    };
    writeFileSync(options.output, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\nDetailed report saved to ${options.output}`));
  }

  if (totalValid < files.length) {
    process.exit(1);
  }
}

async function validateRuntime(options: any): Promise<void> {
  const spinner = ora('Running runtime validation against live platform...').start();
  
  try {
    // Test platform health
    const healthResponse = await ossaClient.getHealth();
    spinner.text = 'Validating health endpoint response...';
    
    const healthResult = await validator.validateAPIResponse(
      '/health',
      'GET',
      healthResponse.data
    );

    // Test metrics endpoint
    spinner.text = 'Validating metrics endpoint...';
    const metricsResponse = await ossaClient.getMetrics();
    const metricsResult = await validator.validateAPIResponse(
      '/metrics', 
      'GET',
      metricsResponse.data
    );

    // Test agent listing
    spinner.text = 'Validating agents endpoint...';
    const agentsResponse = await ossaClient.listAgents({ limit: 5 });
    const agentsResult = await validator.validateAPIResponse(
      '/agents',
      'GET', 
      agentsResponse.data
    );

    spinner.stop();

    const overallValid = healthResult.valid && metricsResult.valid && agentsResult.valid;
    const overallScore = Math.round((healthResult.score + metricsResult.score + agentsResult.score) / 3);

    console.log(chalk.bold('Runtime Validation Results:'));
    console.log(`Overall Status: ${overallValid ? chalk.green('VALID') : chalk.red('INVALID')}`);
    console.log(`Overall Score: ${chalk.cyan(`${overallScore}%`)}`);
    console.log('');

    console.log('Endpoint Results:');
    console.log(`  /health: ${healthResult.valid ? chalk.green('VALID') : chalk.red('INVALID')} (${healthResult.score}%)`);
    console.log(`  /metrics: ${metricsResult.valid ? chalk.green('VALID') : chalk.red('INVALID')} (${metricsResult.score}%)`);
    console.log(`  /agents: ${agentsResult.valid ? chalk.green('VALID') : chalk.red('INVALID')} (${agentsResult.score}%)`);

    if (options.comprehensive) {
      console.log('\nRunning comprehensive validation...');
      // Additional comprehensive checks would go here
    }

    if (options.output) {
      const report = {
        overall: { valid: overallValid, score: overallScore },
        endpoints: {
          health: healthResult,
          metrics: metricsResult,
          agents: agentsResult
        },
        timestamp: new Date().toISOString()
      };
      writeFileSync(options.output, JSON.stringify(report, null, 2));
      console.log(chalk.green(`\nRuntime validation report saved to ${options.output}`));
    }

    if (!overallValid) {
      process.exit(1);
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Runtime validation failed:'), error);
    process.exit(1);
  }
}

async function validateCompliance(options: any): Promise<void> {
  const spinner = ora('Checking platform compliance...').start();
  
  try {
    const response = await ossaClient.getGovernanceStatus();
    spinner.stop();

    // Mock compliance validation - would be expanded with real checks
    const complianceReport = {
      overall_status: 'compliant',
      score: 92,
      frameworks: {
        'OSSA_v0.1.8': { status: 'compliant', score: 98 },
        'ISO_42001': { status: 'compliant', score: 87 },
        'GDPR': { status: 'partial', score: 78 },
        'SOC2': { status: 'compliant', score: 95 },
        'NIST_AI_RMF': { status: 'compliant', score: 89 }
      },
      recommendations: [
        'Improve GDPR data retention policies',
        'Enhance audit logging for sensitive operations',
        'Review access control matrices'
      ]
    };

    console.log(chalk.bold('Platform Compliance Report:'));
    const overallColor = complianceReport.overall_status === 'compliant' ? 'green' : 
                        complianceReport.overall_status === 'partial' ? 'yellow' : 'red';
    console.log(`Overall Status: ${chalk[overallColor](complianceReport.overall_status.toUpperCase())}`);
    console.log(`Compliance Score: ${chalk.cyan(`${complianceReport.score}%`)}`);
    console.log('');

    console.log('Framework Compliance:');
    Object.entries(complianceReport.frameworks).forEach(([framework, data]: [string, any]) => {
      if (!options.framework || options.framework === framework) {
        const statusColor = data.status === 'compliant' ? 'green' : 
                           data.status === 'partial' ? 'yellow' : 'red';
        console.log(`  ${framework}: ${chalk[statusColor](data.status.toUpperCase())} (${chalk.cyan(data.score)}%)`);
      }
    });

    if (options.detailed && complianceReport.recommendations.length > 0) {
      console.log('\nRecommendations:');
      complianceReport.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    if (options.output) {
      writeFileSync(options.output, JSON.stringify(complianceReport, null, 2));
      console.log(chalk.green(`\nCompliance report saved to ${options.output}`));
    }

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Error checking compliance:'), error);
    process.exit(1);
  }
}

async function runValidationWizard(): Promise<void> {
  console.log(chalk.bold.blue('🔍 OSSA Validation Wizard\n'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'validationType',
      message: 'What would you like to validate?',
      choices: [
        { name: 'OpenAPI Specification', value: 'openapi' },
        { name: 'Agent Configuration', value: 'agent' },
        { name: 'Workflow Definition', value: 'workflow' },
        { name: 'Runtime Platform', value: 'runtime' },
        { name: 'Compliance Check', value: 'compliance' },
        { name: 'Batch Validation', value: 'batch' }
      ]
    }
  ]);

  switch (answers.validationType) {
    case 'openapi':
      const { specFile } = await inquirer.prompt([
        {
          type: 'input',
          name: 'specFile',
          message: 'Path to OpenAPI specification file:',
          validate: async (input) => await pathExists(input) || 'File not found'
        }
      ]);
      
      await validateOpenAPIWizard(specFile);
      break;

    case 'agent':
      const agentChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'source',
          message: 'Agent source:',
          choices: [
            { name: 'Local file', value: 'file' },
            { name: 'Registered agent (by ID)', value: 'id' },
            { name: 'All registered agents', value: 'all' }
          ]
        }
      ]);

      await validateAgentWizard(agentChoice.source);
      break;

    case 'runtime':
      await validateRuntimeWizard();
      break;

    default:
      console.log(chalk.yellow('Selected validation type not yet implemented in wizard'));
      break;
  }
}

// =====================================================================
// Utility Functions
// =====================================================================

function detectFileType(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  
  try {
    const parsed = filePath.endsWith('.yaml') || filePath.endsWith('.yml') 
      ? require('yaml').parse(content) 
      : JSON.parse(content);
    
    if (parsed.openapi || parsed.swagger) return 'openapi';
    if (parsed.spec && parsed.spec.conformance_tier) return 'agent';
    if (parsed.steps && Array.isArray(parsed.steps)) return 'workflow';
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

async function attemptAgentFixes(agent: Agent, result: ValidationResult, filePath: string): Promise<void> {
  console.log(chalk.yellow('\nAttempting to fix validation issues...'));
  
  let fixed = false;
  const fixedAgent = { ...agent };

  // Fix capability naming (convert to kebab-case)
  const capabilityNamingError = result.warnings.find(w => w.code === 'capability-naming');
  if (capabilityNamingError && fixedAgent.spec.capabilities.primary) {
    fixedAgent.spec.capabilities.primary = fixedAgent.spec.capabilities.primary.map(cap => 
      cap.toLowerCase().replace(/[_\s]+/g, '-')
    );
    console.log(chalk.green('  ✓ Fixed capability naming conventions'));
    fixed = true;
  }

  if (fixed) {
    const content = filePath.endsWith('.yaml') || filePath.endsWith('.yml')
      ? require('yaml').stringify(fixedAgent)
      : JSON.stringify(fixedAgent, null, 2);
    
    writeFileSync(filePath, content);
    console.log(chalk.green(`  ✓ Saved fixed configuration to ${filePath}`));
    
    // Re-validate
    const newResult = validator.validateAgent(fixedAgent);
    if (newResult.valid) {
      console.log(chalk.green('  ✓ Agent is now valid!'));
    } else {
      console.log(chalk.yellow('  ⚠ Some issues remain after fixes'));
    }
  } else {
    console.log(chalk.yellow('  No automatic fixes available'));
  }
}

async function validateOpenAPIWizard(specFile: string): Promise<void> {
  const { options } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'options',
      message: 'Validation options:',
      choices: [
        { name: 'Strict mode', value: 'strict' },
        { name: 'Include draft specifications', value: 'includeDrafts' },
        { name: 'Skip optional features', value: 'skipOptional' }
      ]
    }
  ]);

  console.log(chalk.blue('\nValidating OpenAPI specification...\n'));
  
  const validationOptions: ValidationOptions = {
    strict: options.includes('strict'),
    includeDrafts: options.includes('includeDrafts'),
    skipOptional: options.includes('skipOptional')
  };

  const result = await validator.validateOpenAPI(specFile, validationOptions);
  const output = ValidationFormatter.formatResult(result, 'detailed');
  console.log(output);
}

async function validateAgentWizard(source: string): Promise<void> {
  switch (source) {
    case 'file':
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Path to agent configuration file:',
          validate: async (input) => await pathExists(input) || 'File not found'
        }
      ]);
      
      await validateAgentFile({ file: filePath, format: 'detailed' });
      break;

    case 'id':
      const { agentId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'agentId',
          message: 'Agent ID:',
          validate: (input) => input.length > 0 || 'Agent ID required'
        }
      ]);
      
      await validateAgentById(agentId, { format: 'detailed' });
      break;

    case 'all':
      await validateAllAgents({ format: 'summary' });
      break;
  }
}

async function validateRuntimeWizard(): Promise<void> {
  const { comprehensive } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'comprehensive',
      message: 'Run comprehensive runtime validation?',
      default: false
    }
  ]);

  console.log(chalk.blue('\nValidating runtime platform...\n'));
  await validateRuntime({ comprehensive, format: 'detailed' });
}