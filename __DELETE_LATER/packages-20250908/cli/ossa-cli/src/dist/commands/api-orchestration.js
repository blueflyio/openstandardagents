/**
 * OSSA Platform Orchestration Commands
 *
 * CLI commands for multi-agent workflow orchestration and execution
 * with comprehensive workflow management capabilities.
 *
 * @version 0.1.8
 */
import chalk from 'chalk';
import { table } from 'table';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
const { writeFileSync, readFileSync } = fs;
import { ossaClient } from '../api/client.js';
// =====================================================================
// Orchestration Commands Registration
// =====================================================================
export function registerOrchestrationCommands(program) {
    const orchestrationCmd = program
        .command('orchestration')
        .alias('orch')
        .description('Multi-agent workflow orchestration commands');
    // Workflow management commands
    orchestrationCmd
        .command('workflows')
        .alias('wf')
        .description('List all orchestration workflows')
        .option('-s, --status <status>', 'Filter by status (active, paused, completed, failed)')
        .option('-l, --limit <number>', 'Number of workflows to return', '20')
        .option('-o, --offset <number>', 'Number of workflows to skip', '0')
        .option('-j, --json', 'Output in JSON format')
        .action(async (options) => {
        try {
            const spinner = ora('Fetching workflows...').start();
            const filters = {
                limit: parseInt(options.limit),
                offset: parseInt(options.offset),
                ...(options.status && { status: options.status })
            };
            const response = await ossaClient.listWorkflows(filters);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayWorkflowsTable(response.data.data);
                console.log(chalk.gray(`\nTotal: ${response.data.pagination.total} workflows`));
            }
        }
        catch (error) {
            console.error(chalk.red('Error listing workflows:'), error);
            process.exit(1);
        }
    });
    orchestrationCmd
        .command('create')
        .description('Create a new orchestration workflow')
        .option('-f, --file <file>', 'Workflow definition file (JSON/YAML)')
        .option('-i, --interactive', 'Interactive workflow creation')
        .option('-t, --template <template>', 'Use workflow template')
        .action(async (options) => {
        try {
            let definition;
            if (options.file) {
                const content = readFileSync(options.file, 'utf-8');
                definition = options.file.endsWith('.yaml') || options.file.endsWith('.yml')
                    ? require('yaml').parse(content)
                    : JSON.parse(content);
            }
            else if (options.template) {
                definition = getWorkflowTemplate(options.template);
            }
            else if (options.interactive) {
                definition = await promptWorkflowDefinition();
            }
            else {
                console.error(chalk.red('Please provide --file, --template, or --interactive option'));
                process.exit(1);
            }
            const spinner = ora('Creating workflow...').start();
            const response = await ossaClient.createWorkflow(definition);
            spinner.stop();
            console.log(chalk.green('Workflow created successfully!'));
            console.log(`Workflow ID: ${chalk.cyan(response.data.id)}`);
            displayWorkflowDetails(response.data);
        }
        catch (error) {
            console.error(chalk.red('Error creating workflow:'), error);
            process.exit(1);
        }
    });
    orchestrationCmd
        .command('get <workflowId>')
        .description('Get detailed information about a workflow')
        .option('-j, --json', 'Output in JSON format')
        .action(async (workflowId, options) => {
        try {
            const spinner = ora(`Fetching workflow ${workflowId}...`).start();
            const response = await ossaClient.getWorkflow(workflowId);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayWorkflowDetails(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red(`Error fetching workflow ${workflowId}:`), error);
            process.exit(1);
        }
    });
    orchestrationCmd
        .command('execute <workflowId>')
        .description('Execute a workflow')
        .option('-i, --input <file>', 'Input data file (JSON)')
        .option('-p, --priority <priority>', 'Execution priority (low, normal, high, critical)', 'normal')
        .option('-t, --timeout <timeout>', 'Execution timeout (e.g., 30s, 5m, 1h)')
        .option('--retry <retries>', 'Maximum retry attempts', '3')
        .option('--interactive', 'Interactive input prompt')
        .option('-w, --wait', 'Wait for execution to complete')
        .action(async (workflowId, options) => {
        try {
            let inputData = {};
            if (options.input) {
                inputData = JSON.parse(readFileSync(options.input, 'utf-8'));
            }
            else if (options.interactive) {
                const { data } = await inquirer.prompt([
                    {
                        type: 'editor',
                        name: 'data',
                        message: 'Enter input data (JSON format):',
                        default: '{}',
                        validate: (input) => {
                            try {
                                JSON.parse(input);
                                return true;
                            }
                            catch {
                                return 'Invalid JSON format';
                            }
                        }
                    }
                ]);
                inputData = JSON.parse(data);
            }
            const executionRequest = {
                input_data: inputData,
                execution_context: {
                    priority: options.priority,
                    ...(options.timeout && { timeout: options.timeout }),
                    retry_policy: {
                        max_retries: parseInt(options.retry),
                        backoff_strategy: 'exponential'
                    }
                }
            };
            const spinner = ora(`Executing workflow ${workflowId}...`).start();
            const response = await ossaClient.executeWorkflow(workflowId, executionRequest);
            spinner.stop();
            console.log(chalk.green('Workflow execution started!'));
            console.log(`Execution ID: ${chalk.cyan(response.data.id)}`);
            if (options.wait) {
                await waitForExecution(response.data.id);
            }
            else {
                console.log(chalk.gray(`Use 'ossa orchestration execution ${response.data.id}' to check status`));
            }
        }
        catch (error) {
            console.error(chalk.red(`Error executing workflow ${workflowId}:`), error);
            process.exit(1);
        }
    });
    orchestrationCmd
        .command('execution <executionId>')
        .alias('exec')
        .description('Get workflow execution status and results')
        .option('-j, --json', 'Output in JSON format')
        .option('-w, --watch', 'Watch execution status in real-time')
        .action(async (executionId, options) => {
        try {
            if (options.watch) {
                await watchExecution(executionId, options.json);
            }
            else {
                const spinner = ora(`Fetching execution ${executionId}...`).start();
                const response = await ossaClient.getExecution(executionId);
                spinner.stop();
                if (options.json) {
                    console.log(JSON.stringify(response.data, null, 2));
                }
                else {
                    displayExecutionDetails(response.data);
                }
            }
        }
        catch (error) {
            console.error(chalk.red(`Error fetching execution ${executionId}:`), error);
            process.exit(1);
        }
    });
    orchestrationCmd
        .command('cancel <executionId>')
        .description('Cancel a running workflow execution')
        .option('-y, --yes', 'Skip confirmation prompt')
        .action(async (executionId, options) => {
        try {
            if (!options.yes) {
                const { confirm } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: `Are you sure you want to cancel execution ${executionId}?`,
                        default: false
                    }
                ]);
                if (!confirm) {
                    console.log('Operation cancelled');
                    return;
                }
            }
            const spinner = ora(`Cancelling execution ${executionId}...`).start();
            const response = await ossaClient.cancelExecution(executionId);
            spinner.stop();
            console.log(chalk.yellow(`Execution ${executionId} cancelled`));
            console.log(response.data.message);
        }
        catch (error) {
            console.error(chalk.red(`Error cancelling execution ${executionId}:`), error);
            process.exit(1);
        }
    });
    orchestrationCmd
        .command('templates')
        .description('List available workflow templates')
        .action(async () => {
        displayWorkflowTemplates();
    });
}
// =====================================================================
// GraphQL Commands Registration
// =====================================================================
export function registerGraphQLCommands(program) {
    const graphqlCmd = program
        .command('graphql')
        .alias('gql')
        .description('GraphQL API commands with federation support');
    graphqlCmd
        .command('query')
        .description('Execute a GraphQL query')
        .option('-q, --query <query>', 'GraphQL query string')
        .option('-f, --file <file>', 'Query file (.graphql, .gql)')
        .option('-v, --variables <variables>', 'Query variables (JSON)')
        .option('--variables-file <file>', 'Variables file (JSON)')
        .option('-o, --operation <name>', 'Operation name (for multiple operations)')
        .option('-j, --json', 'Output raw JSON')
        .option('-i, --interactive', 'Interactive query builder')
        .action(async (options) => {
        try {
            let query;
            let variables;
            if (options.file) {
                query = readFileSync(options.file, 'utf-8');
            }
            else if (options.query) {
                query = options.query;
            }
            else if (options.interactive) {
                const { queryInput } = await inquirer.prompt([
                    {
                        type: 'editor',
                        name: 'queryInput',
                        message: 'Enter your GraphQL query:',
                        default: '{\n  \n}'
                    }
                ]);
                query = queryInput;
            }
            else {
                console.error(chalk.red('Please provide query with --query, --file, or --interactive'));
                process.exit(1);
            }
            if (options.variablesFile) {
                variables = JSON.parse(readFileSync(options.variablesFile, 'utf-8'));
            }
            else if (options.variables) {
                variables = JSON.parse(options.variables);
            }
            const spinner = ora('Executing GraphQL query...').start();
            const response = await ossaClient.query(query, variables, options.operation);
            spinner.stop();
            if (options.json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayGraphQLResponse(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red('Error executing GraphQL query:'), error);
            process.exit(1);
        }
    });
    graphqlCmd
        .command('schema')
        .description('Get GraphQL schema information')
        .option('-i, --introspection', 'Full introspection query')
        .option('-t, --types', 'List available types')
        .action(async (options) => {
        try {
            let query;
            if (options.introspection) {
                query = `
            query IntrospectionQuery {
              __schema {
                queryType { name }
                mutationType { name }
                subscriptionType { name }
                types {
                  ...FullType
                }
              }
            }
            
            fragment FullType on __Type {
              kind
              name
              description
              fields(includeDeprecated: true) {
                name
                description
                args {
                  ...InputValue
                }
                type {
                  ...TypeRef
                }
                isDeprecated
                deprecationReason
              }
            }
            
            fragment InputValue on __InputValue {
              name
              description
              type { ...TypeRef }
              defaultValue
            }
            
            fragment TypeRef on __Type {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          `;
            }
            else {
                query = `
            query SchemaInfo {
              __schema {
                queryType { name }
                mutationType { name }
                subscriptionType { name }
                types {
                  name
                  kind
                  description
                }
              }
            }
          `;
            }
            const spinner = ora('Fetching GraphQL schema...').start();
            const response = await ossaClient.query(query);
            spinner.stop();
            if (options.types) {
                displaySchemaTypes(response.data.data?.__schema?.types || []);
            }
            else {
                displayGraphQLResponse(response.data);
            }
        }
        catch (error) {
            console.error(chalk.red('Error fetching GraphQL schema:'), error);
            process.exit(1);
        }
    });
}
// =====================================================================
// Display Functions
// =====================================================================
function displayWorkflowsTable(workflows) {
    if (workflows.length === 0) {
        console.log(chalk.yellow('No workflows found'));
        return;
    }
    const data = [
        ['ID', 'Name', 'Version', 'Status', 'Created', 'Steps']
    ];
    workflows.forEach(workflow => {
        const statusColor = getStatusColor(workflow.status);
        data.push([
            workflow.id,
            workflow.name,
            workflow.version,
            chalk[statusColor](workflow.status),
            new Date(workflow.created_at).toLocaleDateString(),
            workflow.definition.steps.length.toString()
        ]);
    });
    console.log(table(data));
}
function displayWorkflowDetails(workflow) {
    console.log(chalk.bold(`Workflow: ${workflow.name}`));
    console.log(`ID: ${chalk.cyan(workflow.id)}`);
    console.log(`Version: ${chalk.cyan(workflow.version)}`);
    console.log(`Description: ${workflow.description || 'N/A'}`);
    const statusColor = getStatusColor(workflow.status);
    console.log(`Status: ${chalk[statusColor](workflow.status.toUpperCase())}`);
    console.log(`Created: ${new Date(workflow.created_at).toLocaleString()}`);
    if (workflow.updated_at) {
        console.log(`Updated: ${new Date(workflow.updated_at).toLocaleString()}`);
    }
    console.log(`\nSteps (${workflow.definition.steps.length}):`);
    workflow.definition.steps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step.name || step.id} (${step.type})`);
        console.log(`     Agent: ${chalk.cyan(step.agent_id)}`);
    });
    if (workflow.definition.error_handling) {
        console.log('\nError Handling:');
        console.log(`  Strategy: ${chalk.blue(workflow.definition.error_handling.strategy)}`);
        if (workflow.definition.error_handling.max_retries) {
            console.log(`  Max Retries: ${chalk.cyan(workflow.definition.error_handling.max_retries)}`);
        }
        if (workflow.definition.error_handling.timeout) {
            console.log(`  Timeout: ${chalk.cyan(workflow.definition.error_handling.timeout)}`);
        }
    }
}
function displayExecutionDetails(execution) {
    console.log(chalk.bold(`Workflow Execution: ${execution.id}`));
    console.log(`Workflow ID: ${chalk.cyan(execution.workflow_id)}`);
    const statusColor = getExecutionStatusColor(execution.status);
    console.log(`Status: ${chalk[statusColor](execution.status.toUpperCase())}`);
    console.log(`Created: ${new Date(execution.created_at).toLocaleString()}`);
    if (execution.started_at) {
        console.log(`Started: ${new Date(execution.started_at).toLocaleString()}`);
    }
    if (execution.completed_at) {
        console.log(`Completed: ${new Date(execution.completed_at).toLocaleString()}`);
        const duration = new Date(execution.completed_at).getTime() - new Date(execution.started_at || execution.created_at).getTime();
        console.log(`Duration: ${chalk.cyan(Math.round(duration / 1000))}s`);
    }
    if (execution.input_data && Object.keys(execution.input_data).length > 0) {
        console.log('\nInput Data:');
        console.log(JSON.stringify(execution.input_data, null, 2));
    }
    if (execution.output_data && Object.keys(execution.output_data).length > 0) {
        console.log('\nOutput Data:');
        console.log(JSON.stringify(execution.output_data, null, 2));
    }
    if (execution.steps && execution.steps.length > 0) {
        console.log('\nStep Execution:');
        execution.steps.forEach((step, index) => {
            const stepStatusColor = getExecutionStatusColor(step.status);
            console.log(`  ${index + 1}. ${step.step_id}: ${chalk[stepStatusColor](step.status)}`);
            if (step.started_at) {
                console.log(`     Started: ${new Date(step.started_at).toLocaleString()}`);
            }
            if (step.completed_at) {
                console.log(`     Completed: ${new Date(step.completed_at).toLocaleString()}`);
            }
            if (step.error) {
                console.log(`     Error: ${chalk.red(step.error)}`);
            }
        });
    }
}
function displayGraphQLResponse(response) {
    if (response.errors && response.errors.length > 0) {
        console.log(chalk.red('GraphQL Errors:'));
        response.errors.forEach((error) => {
            console.log(`  ${chalk.red('•')} ${error.message}`);
            if (error.locations) {
                error.locations.forEach((loc) => {
                    console.log(`    at line ${loc.line}, column ${loc.column}`);
                });
            }
        });
        console.log('');
    }
    if (response.data) {
        console.log(chalk.bold('GraphQL Response:'));
        console.log(JSON.stringify(response.data, null, 2));
    }
}
function displaySchemaTypes(types) {
    const userTypes = types.filter(type => !type.name.startsWith('__'));
    console.log(chalk.bold('GraphQL Schema Types:'));
    const typesByKind = userTypes.reduce((acc, type) => {
        if (!acc[type.kind])
            acc[type.kind] = [];
        acc[type.kind].push(type);
        return acc;
    }, {});
    Object.entries(typesByKind).forEach(([kind, typeList]) => {
        console.log(`\n${chalk.blue(kind)}:`);
        typeList.forEach((type) => {
            console.log(`  ${chalk.green(type.name)}`);
            if (type.description) {
                console.log(`    ${chalk.gray(type.description)}`);
            }
        });
    });
}
async function waitForExecution(executionId) {
    const spinner = ora('Waiting for execution to complete...').start();
    while (true) {
        try {
            const response = await ossaClient.getExecution(executionId);
            const execution = response.data;
            if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
                spinner.stop();
                console.log(`\nExecution ${chalk.cyan(execution.status)}`);
                displayExecutionDetails(execution);
                break;
            }
            // Update spinner text with current status
            spinner.text = `Execution ${execution.status}... (${new Date().toLocaleTimeString()})`;
            // Wait 2 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        catch (error) {
            spinner.stop();
            console.error(chalk.red('Error checking execution status:'), error);
            break;
        }
    }
}
async function watchExecution(executionId, json = false) {
    console.log(chalk.blue(`Watching execution ${executionId}... (Press Ctrl+C to stop)`));
    setInterval(async () => {
        try {
            const response = await ossaClient.getExecution(executionId);
            console.clear();
            console.log(chalk.blue(`Watching execution ${executionId}... (Press Ctrl+C to stop)`));
            console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
            console.log('');
            if (json) {
                console.log(JSON.stringify(response.data, null, 2));
            }
            else {
                displayExecutionDetails(response.data);
            }
            if (response.data.status === 'completed' || response.data.status === 'failed' || response.data.status === 'cancelled') {
                console.log(chalk.gray('\nExecution finished. Watch mode stopped.'));
                process.exit(0);
            }
        }
        catch (error) {
            console.error(chalk.red('Error watching execution:'), error);
        }
    }, 3000);
}
// =====================================================================
// Utility Functions
// =====================================================================
function getStatusColor(status) {
    switch (status) {
        case 'active': return 'green';
        case 'paused': return 'yellow';
        case 'completed': return 'blue';
        case 'failed': return 'red';
        default: return 'gray';
    }
}
function getExecutionStatusColor(status) {
    switch (status) {
        case 'completed': return 'green';
        case 'running': return 'blue';
        case 'queued': return 'yellow';
        case 'failed': return 'red';
        case 'cancelled': return 'gray';
        default: return 'gray';
    }
}
function getWorkflowTemplate(templateName) {
    const templates = {
        'data-pipeline': {
            name: 'Data Processing Pipeline',
            description: 'Multi-stage data processing workflow',
            version: '1.0.0',
            steps: [
                {
                    id: 'extract',
                    name: 'Data Extraction',
                    type: 'agent_call',
                    agent_id: 'data-extractor-agent'
                },
                {
                    id: 'transform',
                    name: 'Data Transformation',
                    type: 'agent_call',
                    agent_id: 'data-transformer-agent'
                },
                {
                    id: 'load',
                    name: 'Data Loading',
                    type: 'agent_call',
                    agent_id: 'data-loader-agent'
                }
            ]
        },
        'content-generation': {
            name: 'Content Generation Workflow',
            description: 'AI-powered content creation pipeline',
            version: '1.0.0',
            steps: [
                {
                    id: 'research',
                    name: 'Content Research',
                    type: 'agent_call',
                    agent_id: 'research-agent'
                },
                {
                    id: 'generate',
                    name: 'Content Generation',
                    type: 'agent_call',
                    agent_id: 'content-generator-agent'
                },
                {
                    id: 'review',
                    name: 'Quality Review',
                    type: 'agent_call',
                    agent_id: 'review-agent'
                }
            ]
        },
        'parallel-analysis': {
            name: 'Parallel Data Analysis',
            description: 'Run multiple analysis agents in parallel',
            version: '1.0.0',
            steps: [
                {
                    id: 'parallel-analysis',
                    name: 'Parallel Analysis',
                    type: 'parallel',
                    agent_id: 'coordinator-agent',
                    next_steps: ['statistical-analysis', 'ml-analysis', 'visual-analysis']
                },
                {
                    id: 'statistical-analysis',
                    type: 'agent_call',
                    agent_id: 'statistics-agent'
                },
                {
                    id: 'ml-analysis',
                    type: 'agent_call',
                    agent_id: 'ml-analysis-agent'
                },
                {
                    id: 'visual-analysis',
                    type: 'agent_call',
                    agent_id: 'visualization-agent'
                },
                {
                    id: 'aggregate',
                    name: 'Aggregate Results',
                    type: 'agent_call',
                    agent_id: 'aggregation-agent'
                }
            ]
        }
    };
    if (!templates[templateName]) {
        throw new Error(`Template '${templateName}' not found. Available templates: ${Object.keys(templates).join(', ')}`);
    }
    return templates[templateName];
}
function displayWorkflowTemplates() {
    console.log(chalk.bold('Available Workflow Templates:'));
    const templates = [
        {
            name: 'data-pipeline',
            description: 'Multi-stage data processing workflow (ETL)',
            steps: 3
        },
        {
            name: 'content-generation',
            description: 'AI-powered content creation pipeline',
            steps: 3
        },
        {
            name: 'parallel-analysis',
            description: 'Run multiple analysis agents in parallel',
            steps: 5
        }
    ];
    templates.forEach(template => {
        console.log(`\n${chalk.green(template.name)}`);
        console.log(`  Description: ${template.description}`);
        console.log(`  Steps: ${chalk.cyan(template.steps)}`);
        console.log(`  Usage: ${chalk.gray(`ossa orchestration create --template ${template.name}`)}`);
    });
}
async function promptWorkflowDefinition() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Workflow name:',
            validate: (input) => input.length > 0 || 'Name is required'
        },
        {
            type: 'input',
            name: 'description',
            message: 'Description (optional):'
        },
        {
            type: 'input',
            name: 'version',
            message: 'Version:',
            default: '1.0.0'
        }
    ]);
    // For simplicity, create a basic sequential workflow
    // In a full implementation, you'd have a more complex step builder
    console.log(chalk.yellow('\nNote: This creates a basic sequential workflow.'));
    console.log(chalk.yellow('For complex workflows, use a definition file with --file option.'));
    const definition = {
        name: answers.name,
        description: answers.description || undefined,
        version: answers.version,
        steps: [
            {
                id: 'step-1',
                name: 'First Step',
                type: 'agent_call',
                agent_id: 'example-agent'
            }
        ],
        error_handling: {
            strategy: 'fail_fast',
            max_retries: 3
        }
    };
    return definition;
}
