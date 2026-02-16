/**
 * OSSA Capability Create Command
 * Create capability definitions from OpenAPI specs or manual schemas
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import inquirer from 'inquirer';

interface CreateCapabilityOptions {
  fromOpenapi?: string;
  name?: string;
  inputSchema?: string;
  outputSchema?: string;
  output?: string;
  interactive?: boolean;
}

export const capabilityCreateCommand = new Command('create')
  .description('Create OSSA capability definition')
  .option('--from-openapi <url>', 'Generate capabilities from OpenAPI spec URL')
  .option('-n, --name <name>', 'Capability name')
  .option(
    '--input-schema <path>',
    'Path to JSON Schema file for input parameters'
  )
  .option('--output-schema <path>', 'Path to JSON Schema file for output')
  .option('-o, --output <path>', 'Output file path', 'capability.json')
  .option('-i, --interactive', 'Interactive mode with prompts', false)
  .action(async (options: CreateCapabilityOptions) => {
    try {
      let capability: any;

      if (options.fromOpenapi) {
        capability = await createFromOpenAPI(options.fromOpenapi);
      } else if (options.interactive) {
        capability = await createCapabilityInteractive();
      } else {
        capability = await createCapabilityFromOptions(options);
      }

      // Write to file
      const outputPath = options.output || 'capability.json';
      fs.writeFileSync(outputPath, JSON.stringify(capability, null, 2));

      console.log(
        chalk.green(`✓ Created capability definition: ${outputPath}`)
      );
      console.log(chalk.gray(`  Name: ${capability.name}`));

      if (Array.isArray(capability)) {
        console.log(
          chalk.gray(
            `  Generated ${capability.length} capabilities from OpenAPI`
          )
        );
      } else {
        console.log(chalk.gray(`  Type: ${capability.type || 'custom'}`));
      }

      console.log(chalk.blue('\nUsage:'));
      console.log(
        chalk.gray(
          `  Add this capability to your agent manifest in spec.capabilities`
        )
      );
    } catch (error) {
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

async function createFromOpenAPI(url: string): Promise<any[]> {
  console.log(chalk.blue(`Fetching OpenAPI spec from: ${url}`));

  let spec: any;

  // Check if URL or local file
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const response = await axios.get(url);
    spec = response.data;
  } else {
    const content = fs.readFileSync(url, 'utf-8');
    spec = JSON.parse(content);
  }

  if (!spec.paths) {
    throw new Error('Invalid OpenAPI spec: missing paths');
  }

  console.log(
    chalk.green(`✓ Loaded OpenAPI spec: ${spec.info?.title || 'Unknown'}`)
  );

  const capabilities: any[] = [];

  // Generate capability for each operation
  for (const [pathName, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        const op = operation as any;
        const capabilityName =
          op.operationId || `${method}_${pathName.replace(/\//g, '_')}`;

        const capability = {
          name: capabilityName,
          description:
            op.summary ||
            op.description ||
            `${method.toUpperCase()} ${pathName}`,
          type: 'api',
          endpoint: pathName,
          method: method.toUpperCase(),
          input_schema: extractInputSchema(op),
          output_schema: extractOutputSchema(op),
          metadata: {
            openapi_operation_id: op.operationId,
            tags: op.tags || [],
          },
        };

        capabilities.push(capability);
      }
    }
  }

  console.log(chalk.green(`✓ Generated ${capabilities.length} capabilities`));

  return capabilities;
}

async function createCapabilityInteractive(): Promise<any> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Capability name:',
      validate: (input) => (input ? true : 'Name is required'),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
    },
    {
      type: 'list',
      name: 'type',
      message: 'Capability type:',
      choices: ['api', 'function', 'tool', 'custom'],
    },
  ]);

  const hasInput = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'value',
      message: 'Does this capability accept input parameters?',
      default: true,
    },
  ]);

  let input_schema;
  if (hasInput.value) {
    const schemaInput = await inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Path to input JSON Schema file (or press enter to skip):',
      },
    ]);

    if (schemaInput.path) {
      input_schema = JSON.parse(fs.readFileSync(schemaInput.path, 'utf-8'));
    }
  }

  const hasOutput = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'value',
      message: 'Does this capability return output?',
      default: true,
    },
  ]);

  let output_schema;
  if (hasOutput.value) {
    const schemaOutput = await inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Path to output JSON Schema file (or press enter to skip):',
      },
    ]);

    if (schemaOutput.path) {
      output_schema = JSON.parse(fs.readFileSync(schemaOutput.path, 'utf-8'));
    }
  }

  return {
    name: answers.name,
    description: answers.description,
    type: answers.type,
    input_schema,
    output_schema,
  };
}

async function createCapabilityFromOptions(
  options: CreateCapabilityOptions
): Promise<any> {
  if (!options.name) {
    throw new Error('Capability name is required. Use --name <name>');
  }

  const capability: any = {
    name: options.name,
    type: 'custom',
  };

  if (options.inputSchema) {
    if (!fs.existsSync(options.inputSchema)) {
      throw new Error(`Input schema file not found: ${options.inputSchema}`);
    }
    capability.input_schema = JSON.parse(
      fs.readFileSync(options.inputSchema, 'utf-8')
    );
  }

  if (options.outputSchema) {
    if (!fs.existsSync(options.outputSchema)) {
      throw new Error(`Output schema file not found: ${options.outputSchema}`);
    }
    capability.output_schema = JSON.parse(
      fs.readFileSync(options.outputSchema, 'utf-8')
    );
  }

  return capability;
}

function extractInputSchema(operation: any): any {
  const schema: any = {
    type: 'object',
    properties: {},
    required: [],
  };

  // Extract from parameters
  if (operation.parameters) {
    for (const param of operation.parameters) {
      schema.properties[param.name] = param.schema || { type: 'string' };
      if (param.required) {
        schema.required.push(param.name);
      }
    }
  }

  // Extract from requestBody
  if (operation.requestBody?.content) {
    const contentType = Object.keys(operation.requestBody.content)[0];
    const bodySchema = operation.requestBody.content[contentType]?.schema;
    if (bodySchema) {
      return bodySchema;
    }
  }

  return schema;
}

function extractOutputSchema(operation: any): any {
  if (!operation.responses) {
    return { type: 'object' };
  }

  // Look for 200/201 response
  const successResponse =
    operation.responses['200'] ||
    operation.responses['201'] ||
    operation.responses['default'];

  if (successResponse?.content) {
    const contentType = Object.keys(successResponse.content)[0];
    return successResponse.content[contentType]?.schema || { type: 'object' };
  }

  return { type: 'object' };
}
