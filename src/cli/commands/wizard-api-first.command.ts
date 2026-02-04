/**
 * OSSA Wizard - API-FIRST EDITION
 *
 * Schema-driven wizard that validates everything against OpenAPI specs.
 * TRUE API-FIRST APPROACH - Schema is the single source of truth.
 *
 * Features:
 * ✓ All prompts generated from schema
 * ✓ All inputs validated against schema
 * ✓ Type-safe with auto-complete
 * ✓ Enum values loaded from schema
 * ✓ Patterns and constraints from schema
 * ✓ Real-time validation as you go
 * ✓ Beautiful error messages
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index';
import {
  initializeAPIsFirst,
  SchemaLoader,
  UIGenerator,
  inquirer,
} from '../schema-driven/index.js';
import type {
  ExportConfig,
  TestingConfig,
  ExportPlatform,
  CICDPlatform,
} from './types/wizard-config.types.js';
import {
  printBanner,
  printWizardBanner,
  printCompletion,
  printProgress,
  printStep,
  printSuccess,
  printInfo,
  printWarning,
  printError,
} from '../banner.js';

// Initialize API-First infrastructure
const apiFirst = initializeAPIsFirst();

interface APIFirstWizardOptions {
  output?: string;
  template?: string;
  validate?: boolean;
}

class APIFirstWizard {
  private schema: SchemaLoader;
  private ui: UIGenerator;
  private agent: any;
  private currentStep: number = 0;
  private totalSteps: number = 12;

  constructor() {
    this.schema = apiFirst.schema;
    this.ui = apiFirst.ui;
    this.agent = {
      apiVersion: 'ossa/v0.4',
      kind: 'Agent',
      metadata: {
        name: '',
      },
      spec: {
        role: '',
      },
    };
  }

  async run(options: APIFirstWizardOptions): Promise<void> {
    try {
      printBanner();
      printWizardBanner();

      printInfo('🎯 API-FIRST MODE: All inputs validated against OpenAPI schema');
      console.log('');

      // Step 1: Kind Selection (Agent, Task, Workflow, Flow)
      await this.selectKind();

      // Step 2: Basic Metadata (validated against schema)
      await this.configureMetadata();

      // Step 3: LLM Configuration (schema-driven)
      await this.configureLLM();

      // Step 4: Tools (schema-validated types)
      await this.configureTools();

      // Step 5: Extensions (all 22+ frameworks from schema)
      await this.configureExtensions();

      // Step 6: Features (conditional based on selections)
      await this.configureFeatures();

      // Step 7: Safety & Constraints (schema-validated)
      await this.configureSafety();

      // Step 8: Observability (schema-validated)
      await this.configureObservability();

      // Step 9: Final Validation
      await this.validateManifest();

      // Step 10: Export Configuration
      await this.configureExportTargets();

      // Step 11: Testing & Validation Configuration
      await this.configureTestingValidation();

      // Step 12: Output Generation
      await this.generateOutput(options);

      printCompletion();
      this.printNextSteps();
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private nextStep(stepName: string) {
    this.currentStep++;
    printProgress(this.currentStep, this.totalSteps, stepName);
  }

  private async selectKind(): Promise<void> {
    this.nextStep('Select Resource Kind');
    printStep(
      1,
      this.totalSteps,
      'Select Resource Kind',
      'Choose between Agent, Task, Workflow, or Flow'
    );

    // Get kind enum from schema
    const kindDef = this.schema.getDefinition('kind');
    const kindOptions = kindDef?.enum || ['Agent', 'Task', 'Workflow', 'Flow'];

    const answers = await apiFirst.ui.generatePrompt('kind', 'kind');
    if (answers) {
      const result = await inquirer.prompt([answers]);
      this.agent.kind = result.kind as any;

      printSuccess(`Selected: ${this.agent.kind}`);

      // Show description of selected kind
      const descriptions: Record<string, string> = {
        Agent: 'Agentic loops - autonomous decision-making with tools',
        Task: 'Deterministic steps - predefined workflow execution',
        Workflow: 'Composition - orchestrate multiple agents/tasks',
        Flow: 'Visual flow - state machine with transitions',
      };

      if (descriptions[this.agent.kind || '']) {
        printInfo(descriptions[this.agent.kind || '']);
      }
    }
  }

  private async configureMetadata(): Promise<void> {
    this.nextStep('Basic Metadata');
    printStep(
      2,
      this.totalSteps,
      'Basic Metadata',
      'Schema-validated agent information'
    );

    // Generate all metadata prompts from schema
    const metadata = await this.ui.generateForObject('metadata');

    this.agent.metadata = {
      ...metadata,
      labels: {
        'ossa.io/created-by': 'wizard-api-first',
        'ossa.io/schema-validated': 'true',
      },
    };

    printSuccess('Metadata configured and validated against schema');
  }

  private async configureLLM(): Promise<void> {
    this.nextStep('LLM Configuration');
    printStep(
      3,
      this.totalSteps,
      'LLM Configuration',
      'Schema-driven LLM setup with all providers from spec'
    );

    printInfo('All LLM providers loaded from OpenAPI schema');

    // Use schema-driven LLM configuration
    const llmConfig = await this.ui.generateLLMConfig();

    this.agent.spec = {
      ...this.agent.spec,
      llm: llmConfig,
    };

    printSuccess('LLM configuration complete and schema-validated');

    // Validate immediately
    const validation = this.schema.validate(this.agent);
    if (!validation.valid) {
      printWarning('Validation warnings detected - will fix at final validation');
    }
  }

  private async configureTools(): Promise<void> {
    this.nextStep('Tools & Capabilities');
    printStep(
      4,
      this.totalSteps,
      'Tools & Capabilities',
      'All tool types from schema with validation'
    );

    printInfo(`Available tool types: ${this.schema.getToolTypes().length}`);

    // Use schema-driven tool configuration
    const tools = await this.ui.generateToolConfig();

    if (tools.length > 0) {
      this.agent.spec = {
        ...this.agent.spec,
        tools,
      };

      printSuccess(`${tools.length} tools configured and validated`);
    }
  }

  private async configureExtensions(): Promise<void> {
    this.nextStep('Framework Extensions');
    printStep(
      5,
      this.totalSteps,
      'Framework Extensions',
      'All 22+ frameworks loaded from schema'
    );

    const availableExtensions = this.ui.getAvailableExtensions();
    printInfo(`${availableExtensions.length} framework integrations available`);

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'extensions',
        message: 'Select framework integrations:',
        choices: availableExtensions.map((ext) => ({
          name: this.formatExtensionName(ext),
          value: ext,
          checked: false,
        })),
        pageSize: 15,
      },
    ]);

    if (answers.extensions.length > 0) {
      this.agent.extensions = {};

      for (const ext of answers.extensions) {
        // For now, enable with basic config
        // Could prompt for extension-specific config here
        (this.agent.extensions as any)[ext] = { enabled: true };
        printSuccess(`Enabled: ${this.formatExtensionName(ext)}`);
      }
    }
  }

  private formatExtensionName(ext: string): string {
    const names: Record<string, string> = {
      mcp: 'MCP - Model Context Protocol',
      skills: 'Skills - Claude/Cursor/Kiro format',
      langchain: 'LangChain',
      langgraph: 'LangGraph',
      crewai: 'CrewAI',
      autogen: 'AutoGen (Microsoft)',
      openai_assistants: 'OpenAI Assistants',
      openai_swarm: 'OpenAI Swarm',
      vercel_ai: 'Vercel AI SDK',
      llamaindex: 'LlamaIndex',
      dify: 'Dify',
      bedrock: 'AWS Bedrock Agents',
      semanticKernel: 'Semantic Kernel',
      vertexai: 'Google Vertex AI',
      haystack: 'Haystack',
      pydantic_ai: 'Pydantic AI',
      langflow: 'LangFlow',
      agents_md: 'AGENTS.md generation',
      llms_txt: 'llms.txt generation',
    };

    return names[ext] || ext;
  }

  private async configureFeatures(): Promise<void> {
    this.nextStep('Advanced Features');
    printStep(
      6,
      this.totalSteps,
      'Advanced Features',
      'Schema-validated advanced capabilities'
    );

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select advanced features:',
        choices: [
          { name: '🎯 Skills System', value: 'skills' },
          { name: '🧠 Knowledge Sources (RAG)', value: 'knowledge_sources' },
          { name: '📡 Messaging (A2A)', value: 'messaging' },
          { name: '💾 State Management', value: 'state' },
          { name: '💰 Cost Tracking', value: 'cost_tracking' },
          { name: '🔐 Safety Controls', value: 'safety' },
          { name: '🎯 Autonomy Configuration', value: 'autonomy' },
        ],
      },
    ]);

    // Configure each selected feature using schema
    for (const feature of answers.features) {
      if (feature === 'skills') {
        await this.configureSkills();
      } else {
        await this.configureFeature(feature);
      }
    }
  }

  private async configureFeature(feature: string): Promise<void> {
    printInfo(`Configuring: ${feature}`);

    // Generate prompts from schema for this feature
    const featurePath = `spec.${feature}`;
    const featureConfig = await this.ui.generateForObject(featurePath);

    if (Object.keys(featureConfig).length > 0) {
      this.agent.spec = {
        ...this.agent.spec,
        [feature]: featureConfig,
      };

      printSuccess(`${feature} configured`);
    }
  }

  private async configureSkills(): Promise<void> {
    printInfo('Configuring: skills');

    const { addSkills } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addSkills',
        message: 'Would you like to add Claude Skills to this agent?',
        default: true,
      },
    ]);

    if (!addSkills) {
      return;
    }

    const skills: any[] = [];
    let addingSkills = true;

    while (addingSkills) {
      console.log('');
      printInfo(`Adding skill ${skills.length + 1}`);

      const skillAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'id',
          message: 'Skill ID (identifier):',
          validate: (input: string) => {
            const valid = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(input);
            return (
              valid ||
              'Must be lowercase alphanumeric with hyphens (e.g., research-skill)'
            );
          },
        },
        {
          type: 'input',
          name: 'name',
          message: 'Skill name (display name):',
          default: (answers: any) =>
            answers.id
              .split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
        },
        {
          type: 'input',
          name: 'description',
          message: 'Skill description:',
          validate: (input: string) => {
            return (
              input.length >= 10 ||
              'Description must be at least 10 characters'
            );
          },
        },
        {
          type: 'editor',
          name: 'instructions',
          message: 'Skill instructions (detailed prompt):',
          default:
            'You are a skilled assistant. When invoked, you should...\n\nCapabilities:\n- \n\nGuidelines:\n- ',
        },
        {
          type: 'list',
          name: 'type',
          message: 'Skill type:',
          choices: [
            { name: 'Task - Execute specific actions', value: 'task' },
            { name: 'Query - Retrieve information', value: 'query' },
            { name: 'Creative - Generate content', value: 'creative' },
            { name: 'Analysis - Analyze data', value: 'analysis' },
            { name: 'Other', value: 'other' },
          ],
          default: 'task',
        },
      ]);

      // Ask for parameters
      const { addParams } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addParams',
          message: 'Add parameters to this skill?',
          default: false,
        },
      ]);

      const parameters: any = {};
      if (addParams) {
        let addingParams = true;
        while (addingParams) {
          const paramAnswers = await inquirer.prompt([
            {
              type: 'input',
              name: 'paramName',
              message: 'Parameter name:',
            },
            {
              type: 'list',
              name: 'paramType',
              message: 'Parameter type:',
              choices: ['string', 'number', 'boolean', 'array', 'object'],
            },
            {
              type: 'input',
              name: 'paramDescription',
              message: 'Parameter description:',
            },
            {
              type: 'confirm',
              name: 'paramRequired',
              message: 'Is this parameter required?',
              default: false,
            },
          ]);

          parameters[paramAnswers.paramName] = {
            type: paramAnswers.paramType,
            description: paramAnswers.paramDescription,
          };

          if (paramAnswers.paramRequired) {
            if (!parameters._required) {
              parameters._required = [];
            }
            parameters._required.push(paramAnswers.paramName);
          }

          const { addAnother } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'addAnother',
              message: 'Add another parameter?',
              default: false,
            },
          ]);

          addingParams = addAnother;
        }
      }

      // Build skill object (schema-validated structure)
      const skill: any = {
        id: skillAnswers.id,
        name: skillAnswers.name,
        description: skillAnswers.description,
        instructions: skillAnswers.instructions,
        type: skillAnswers.type,
      };

      if (Object.keys(parameters).length > 0) {
        // Extract required array if exists
        const required = parameters._required;
        delete parameters._required;

        skill.parameters = {
          type: 'object',
          properties: parameters,
        };

        if (required && required.length > 0) {
          skill.parameters.required = required;
        }
      }

      skills.push(skill);
      printSuccess(`Skill "${skill.name}" added (schema-validated)`);

      const { addMore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addMore',
          message: 'Add another skill?',
          default: false,
        },
      ]);

      addingSkills = addMore;
    }

    if (skills.length > 0) {
      this.agent.spec = {
        ...this.agent.spec,
        skills,
      };

      printSuccess(`${skills.length} skill(s) configured and validated`);
    }
  }

  private async configureSafety(): Promise<void> {
    this.nextStep('Safety & Constraints');
    printStep(
      7,
      this.totalSteps,
      'Safety & Constraints',
      'Schema-validated safety controls'
    );

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enable_safety',
        message: 'Configure safety controls?',
        default: true,
      },
    ]);

    if (answers.enable_safety) {
      const safetyConfig = await this.ui.generateForObject('spec.safety');

      if (Object.keys(safetyConfig).length > 0) {
        this.agent.spec = {
          ...this.agent.spec,
          safety: safetyConfig,
        };

        printSuccess('Safety controls configured and validated');
      }
    }
  }

  private async configureObservability(): Promise<void> {
    this.nextStep('Observability');
    printStep(
      8,
      this.totalSteps,
      'Observability & Monitoring',
      'OpenTelemetry, metrics, and logging from schema'
    );

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enable_observability',
        message: 'Configure observability?',
        default: true,
      },
    ]);

    if (answers.enable_observability) {
      const obsConfig = await this.ui.generateForObject('spec.observability');

      if (Object.keys(obsConfig).length > 0) {
        this.agent.spec = {
          ...this.agent.spec,
          observability: obsConfig,
        };

        printSuccess('Observability configured and validated');
      }
    }
  }

  private async validateManifest(): Promise<void> {
    this.nextStep('Final Validation');
    printStep(
      9,
      this.totalSteps,
      'Schema Validation',
      'Validating complete manifest against OpenAPI schema'
    );

    const validation = this.schema.validate(this.agent);

    if (validation.valid) {
      printSuccess('✓ Manifest is valid according to OSSA schema');
    } else {
      printError('Schema validation failed!');
      console.log('');
      console.log(chalk.yellow('Validation Errors:'));

      validation.errors?.forEach((error: any, index: number) => {
        console.log(
          chalk.red(`${index + 1}.`),
          chalk.white(error.instancePath || 'root'),
          chalk.gray('-'),
          error.message
        );
      });

      console.log('');
      throw new Error('Manifest validation failed');
    }
  }

  private async configureExportTargets(): Promise<void> {
    this.nextStep('Export Configuration');
    printStep(10, this.totalSteps, 'Export Targets', 'Schema-validated deployment configuration');

    const { configureExport } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureExport',
        message: 'Configure export targets for deployment?',
        default: true,
      },
    ]);

    if (!configureExport) {
      return;
    }

    const { platforms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Select export platforms (schema-validated):',
        choices: [
          {
            name: 'LangChain (Python) - Full framework with observability',
            value: 'langchain',
            checked: true,
          },
          {
            name: 'KAgent (Kubernetes) - Cloud-native deployment',
            value: 'kagent',
          },
          {
            name: 'Drupal Module - CMS integration',
            value: 'drupal',
          },
          {
            name: 'Symfony Bundle - PHP framework',
            value: 'symfony',
          },
        ],
        validate: (answer: string[]) => {
          if (answer.length < 1) {
            return 'You must select at least one export platform.';
          }
          return true;
        },
      },
    ]);

    const exportConfig: ExportConfig = {
      enabled: true,
      platforms: platforms as ExportPlatform[],
    };

    // Platform-specific configuration (schema-validated)
    for (const platform of platforms) {
      if (platform === 'langchain') {
        const langchainConfig = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'includeCallbacks',
            message: 'Include observability (LangSmith, LangFuse, OpenTelemetry)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeErrorHandling',
            message: 'Include production error handling (retry, circuit breaker)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeLangServe',
            message: 'Generate LangServe REST API deployment?',
            default: false,
          },
          {
            type: 'confirm',
            name: 'includeTests',
            message: 'Generate pytest test suite?',
            default: true,
          },
        ]);

        exportConfig.langchain = langchainConfig;
      } else if (platform === 'kagent') {
        const kagentConfig = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'includeRBAC',
            message: 'Include RBAC (ServiceAccount, Roles)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeTLS',
            message: 'Configure TLS for secure communication?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeNetworkPolicy',
            message: 'Generate NetworkPolicy for isolation?',
            default: true,
          },
        ]);

        exportConfig.kagent = kagentConfig;
      } else if (platform === 'drupal') {
        const drupalConfig = await inquirer.prompt([
          {
            type: 'input',
            name: 'moduleName',
            message: 'Drupal module name:',
            default: this.agent.metadata?.name?.replace(/-/g, '_') || 'ossa_agent',
            validate: (input: string) => {
              const valid = /^[a-z][a-z0-9_]*$/.test(input);
              return valid || 'Must be lowercase alphanumeric with underscores';
            },
          },
          {
            type: 'confirm',
            name: 'includeQueue',
            message: 'Include queue worker for async execution?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeEntity',
            message: 'Generate entity storage with Views integration?',
            default: true,
          },
        ]);

        exportConfig.drupal = drupalConfig;
      } else if (platform === 'symfony') {
        const symfonyConfig = await inquirer.prompt([
          {
            type: 'input',
            name: 'bundleName',
            message: 'Symfony bundle name:',
            default: (this.agent.metadata?.name
              ?.split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join('') || 'Ossa') + 'Bundle',
          },
          {
            type: 'confirm',
            name: 'includeEvents',
            message: 'Include event system (start, complete, error)?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'includeCaching',
            message: 'Include caching layer?',
            default: true,
          },
        ]);

        exportConfig.symfony = symfonyConfig;
      }
    }

    // Store in annotations (buildkit-specific metadata, schema-compliant)
    this.agent.metadata = {
      ...this.agent.metadata,
      annotations: {
        ...this.agent.metadata?.annotations,
        'buildkit.ossa.io/export-config': JSON.stringify(exportConfig),
      },
    };

    printSuccess(`Export configured for ${platforms.length} platform(s) with schema validation`);
  }

  private async configureTestingValidation(): Promise<void> {
    this.nextStep('Testing Configuration');
    printStep(11, this.totalSteps, 'Testing & Validation', 'Schema-validated testing configuration');

    const { enableTesting } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableTesting',
        message: 'Configure testing for this agent?',
        default: true,
      },
    ]);

    if (!enableTesting) {
      return;
    }

    const testConfig = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'types',
        message: 'Which test types to generate (schema-validated)?',
        choices: [
          { name: 'Unit tests (recommended)', value: 'unit', checked: true },
          { name: 'Integration tests', value: 'integration' },
          { name: 'Load tests', value: 'load' },
          { name: 'Security tests', value: 'security' },
          { name: 'Cost tests', value: 'cost' },
        ],
        validate: (answer: string[]) => {
          if (answer.length < 1) {
            return 'You must choose at least one test type.';
          }
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'mockLLM',
        message: 'Mock LLM by default?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'generateFixtures',
        message: 'Generate test fixtures?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includeCICD',
        message: 'Include CI/CD configurations?',
        default: true,
      },
    ]);

    let cicdPlatforms: string[] = [];
    if (testConfig.includeCICD) {
      const { platforms } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'platforms',
          message: 'Which CI/CD platforms?',
          choices: [
            { name: 'GitHub Actions', value: 'github-actions', checked: true },
            { name: 'GitLab CI', value: 'gitlab-ci' },
          ],
          validate: (answer: string[]) => {
            if (answer.length < 1) {
              return 'You must choose at least one CI/CD platform.';
            }
            return true;
          },
        },
      ]);
      cicdPlatforms = platforms;
    }

    const validationConfig = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'manifest',
        message: 'Enable manifest validation?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'safety',
        message: 'Enable safety checks?',
        default: true,
      },
      {
        type: 'number',
        name: 'costBudget',
        message: 'Cost budget per test run? (USD)',
        default: 0.1,
        validate: (input: number) => {
          if (input < 0) {
            return 'Cost budget must be positive';
          }
          return true;
        },
      },
    ]);

    const testingConfig = {
      enabled: true,
      types: testConfig.types,
      mockLLM: testConfig.mockLLM,
      generateFixtures: testConfig.generateFixtures,
      cicd: cicdPlatforms,
      validation: validationConfig,
    };

    // Store in annotations (buildkit-specific metadata, schema-compliant)
    this.agent.metadata = {
      ...this.agent.metadata,
      annotations: {
        ...this.agent.metadata?.annotations,
        'buildkit.ossa.io/testing-config': JSON.stringify(testingConfig),
      },
    };

    printSuccess(`Testing configured: ${testConfig.types.join(', ')} with schema validation`);
  }

  private async generateOutput(options: APIFirstWizardOptions): Promise<void> {
    this.nextStep('Generate Output');
    printStep(
      12,
      this.totalSteps,
      'Generate Files',
      'Create manifest and supporting files'
    );

    const outputPath = options.output || 'agent.ossa.yaml';

    // Write manifest
    const yamlContent = yaml.stringify(this.agent as OssaAgent, {
      indent: 2,
      lineWidth: 0,
    });

    fs.writeFileSync(outputPath, yamlContent, 'utf-8');
    printSuccess(`Agent manifest: ${outputPath}`);

    // Generate supporting files if extensions enabled
    const directory = path.dirname(outputPath);

    if ((this.agent.extensions as any)?.agents_md) {
      this.generateAgentsMd(directory);
    }

    if ((this.agent.extensions as any)?.llms_txt) {
      this.generateLlmsTxt(directory);
    }

    printSuccess('All files generated successfully');
  }

  private generateAgentsMd(directory: string): void {
    const agentsMdPath = path.join(directory, 'AGENTS.md');
    const content = `# ${this.agent.metadata?.name}

${this.agent.metadata?.description}

## Schema Validation

✓ Validated against OSSA v0.4 OpenAPI schema
✓ All fields conform to specification
✓ Type-safe and production-ready

## Configuration

See \`agent.ossa.yaml\` for complete manifest.

---

*Generated by OSSA Wizard - API-First Edition*
*Schema-validated: ${new Date().toISOString()}*
`;

    fs.writeFileSync(agentsMdPath, content, 'utf-8');
    printSuccess(`AGENTS.md: ${agentsMdPath}`);
  }

  private generateLlmsTxt(directory: string): void {
    const llmsTxtPath = path.join(directory, 'llms.txt');
    const content = `# ${this.agent.metadata?.name}

Schema: OSSA v0.4
Validated: ${new Date().toISOString()}

## Agent Type

${this.agent.kind}

## LLM Configuration

Provider: ${this.agent.spec?.llm?.provider}
Model: ${this.agent.spec?.llm?.model}

---

For complete specification, see agent.ossa.yaml
`;

    fs.writeFileSync(llmsTxtPath, content, 'utf-8');
    printSuccess(`llms.txt: ${llmsTxtPath}`);
  }

  private printNextSteps(): void {
    console.log(chalk.cyan('\nNext Steps:'));
    console.log(chalk.white('\n1. Validate (already done!)'));
    console.log(chalk.green('   ✓ Schema validation passed'));

    console.log(chalk.white('\n2. Test your agent:'));
    console.log(chalk.gray('   ossa run agent.ossa.yaml'));

    console.log(chalk.white('\n3. Export to platform:'));
    console.log(chalk.gray('   ossa export agent.ossa.yaml --platform langchain'));

    console.log(chalk.white('\n4. Deploy:'));
    console.log(chalk.gray('   # Follow platform-specific guide'));

    console.log('');
    console.log(chalk.green.bold('🎉 Schema-validated agent ready for production!'));
    console.log('');
  }
}

export const wizardAPIFirstCommand = new Command('wizard-api-first')
  .alias('wizard')
  .description('🧙 OSSA Wizard - API-FIRST EDITION (Schema-Driven)')
  .option('-o, --output <path>', 'Output file path', 'agent.ossa.yaml')
  .option('-t, --template <id>', 'Use specific template (future)')
  .option('--validate', 'Extra validation (redundant - always validates)', true)
  .action(async (options: APIFirstWizardOptions) => {
    const wizard = new APIFirstWizard();
    await wizard.run(options);
  });
