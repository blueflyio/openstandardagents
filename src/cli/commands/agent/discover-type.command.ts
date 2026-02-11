/**
 * Agent Type Discovery Command
 * Interactive command to discover optimal agent type based on context
 */

import { Command } from 'commander';
import { inject, injectable } from 'inversify';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import { TYPES } from '../../../di-container.js';
import type { IManifestRepository } from '../../../types/index.js';
import { AgentTypeDetectorService } from '../../../services/agent-type-detector.service.js';
import {
  type AgentTypeContext,
  type AgentEnvironment,
  type AgentTrigger,
  type AgentDataFlow,
  type AgentCollaboration,
  type AgentAutonomy,
  type DynamicAgentType,
  determineAgentType,
  TYPE_CHARACTERISTICS,
} from '../../../types/dynamic-agent-types.js';

interface DiscoverTypeOptions {
  from?: string;
  interactive?: boolean;
  output?: string;
  verbose?: boolean;
}

@injectable()
export class DiscoverTypeCommand {
  constructor(
    @inject(TYPES.ManifestRepository)
    private manifestRepository: IManifestRepository,
    @inject(AgentTypeDetectorService)
    private typeDetector: AgentTypeDetectorService
  ) {}

  createCommand(): Command {
    const command = new Command('discover-type')
      .description('Discover optimal agent type based on context')
      .option('--from <path>', 'Path to OSSA manifest file')
      .option('-i, --interactive', 'Interactive mode to build context')
      .option('-o, --output <path>', 'Save results to file')
      .option('-v, --verbose', 'Show detailed analysis')
      .action(async (options: DiscoverTypeOptions) => {
        await this.execute(options);
      });

    return command;
  }

  private async execute(options: DiscoverTypeOptions): Promise<void> {
    console.log(chalk.blue.bold('\n🔍 Agent Type Discovery\n'));

    try {
      if (options.from) {
        await this.discoverFromManifest(options);
      } else if (options.interactive) {
        await this.discoverInteractive(options);
      } else {
        console.log(chalk.yellow('Please specify --from <manifest> or --interactive'));
        console.log(chalk.gray('\nExamples:'));
        console.log(chalk.gray('  ossa agent discover-type --from manifest.yaml'));
        console.log(chalk.gray('  ossa agent discover-type --interactive'));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Discover type from existing manifest
   */
  private async discoverFromManifest(options: DiscoverTypeOptions): Promise<void> {
    if (!options.from) {
      throw new Error('Manifest path required');
    }

    console.log(chalk.gray(`Loading manifest from: ${options.from}\n`));

    // Load manifest
    const manifest = await this.manifestRepository.load(options.from);

    // Detect type
    const result = this.typeDetector.detectType(manifest);

    // Display results
    this.displayResults(result, options.verbose);

    // Analyze current type vs suggested
    const analysis = this.typeDetector.analyzeManifest(manifest);

    if (analysis.shouldChange) {
      console.log(chalk.yellow('\n⚠️  Type Change Recommended:'));
      console.log(chalk.gray('  Current:  '), chalk.cyan(analysis.currentType));
      console.log(chalk.gray('  Suggested:'), chalk.green(analysis.suggestedType));
      console.log();

      for (const reason of analysis.reasons) {
        console.log(chalk.gray('  • '), reason);
      }
    } else {
      console.log(chalk.green('\n✓ Current type matches analysis'));
    }

    // Save if output specified
    if (options.output) {
      await this.saveResults(options.output, result);
    }
  }

  /**
   * Interactive type discovery
   */
  private async discoverInteractive(options: DiscoverTypeOptions): Promise<void> {
    console.log(chalk.gray('Answer the following questions to discover optimal agent type:\n'));

    // Build context interactively
    const context = await this.buildContextInteractively();

    // Determine type
    const type = determineAgentType(context);
    const characteristics = TYPE_CHARACTERISTICS[type];

    console.log(chalk.green.bold(`\n✓ Detected Type: ${type}\n`));

    // Display characteristics
    console.log(chalk.cyan('Characteristics:'));
    console.log(chalk.gray('  Execution Time:    '), characteristics.executionTime);
    console.log(chalk.gray('  Scaling:           '), characteristics.scaling);
    console.log(chalk.gray('  State Persistence: '), characteristics.statePersistence ? 'Yes' : 'No');
    console.log(chalk.gray('  Requires Human:    '), characteristics.requiresHuman ? 'Yes' : 'No');
    console.log(chalk.gray('  Cost Profile:      '), characteristics.costProfile);

    // Show recommended capabilities
    const recommended = this.typeDetector.suggestCapabilitiesForType(type);
    console.log(chalk.cyan('\nRecommended Capabilities:'));
    for (const cap of recommended.slice(0, 10)) {
      console.log(chalk.gray('  • '), cap);
    }

    // Ask if user wants to create manifest
    const { createManifest } = await inquirer.prompt<{ createManifest: boolean }>([
      {
        type: 'confirm',
        name: 'createManifest',
        message: 'Create manifest with this type?',
        default: false,
      },
    ]);

    if (createManifest) {
      const { name } = await inquirer.prompt<{ name: string }>([
        {
          type: 'input',
          name: 'name',
          message: 'Agent name:',
          validate: (input: string) => input.length > 0 || 'Name required',
        },
      ]);

      const manifestPath = options.output || `.agents/${name}/manifest.yaml`;
      console.log(chalk.gray(`\nCreating manifest at: ${manifestPath}`));

      // Create basic manifest with detected type
      const manifest = this.createManifestFromContext(name, type, context);

      await this.manifestRepository.save(manifestPath, manifest);

      console.log(chalk.green(`\n✓ Manifest created: ${manifestPath}`));
    }
  }

  /**
   * Build context interactively through prompts
   */
  private async buildContextInteractively(): Promise<AgentTypeContext> {
    const answers = await inquirer.prompt<{
      environment: AgentEnvironment;
      trigger: AgentTrigger;
      dataFlow: AgentDataFlow;
      collaboration: AgentCollaboration;
      autonomy: AgentAutonomy;
      capabilities: string[];
      needsGpu: boolean;
    }>([
      {
        type: 'list',
        name: 'environment',
        message: 'Target environment:',
        choices: ['production', 'staging', 'development', 'local'],
        default: 'development',
      },
      {
        type: 'list',
        name: 'trigger',
        message: 'How will this agent be triggered?',
        choices: [
          { name: 'HTTP Webhook', value: 'webhook' },
          { name: 'Schedule (cron)', value: 'schedule' },
          { name: 'Manual execution', value: 'manual' },
          { name: 'CI/CD Pipeline', value: 'pipeline' },
          { name: 'Agent-to-Agent', value: 'a2a' },
          { name: 'Event (pub/sub)', value: 'event' },
          { name: 'Stream processing', value: 'stream' },
        ],
      },
      {
        type: 'list',
        name: 'dataFlow',
        message: 'Data flow pattern:',
        choices: [
          { name: 'Stateless (no state between runs)', value: 'stateless' },
          { name: 'Stateful (maintains state)', value: 'stateful' },
          { name: 'Streaming (real-time streams)', value: 'streaming' },
          { name: 'Batch processing', value: 'batch' },
        ],
      },
      {
        type: 'list',
        name: 'collaboration',
        message: 'Collaboration model:',
        choices: [
          { name: 'Solo (works independently)', value: 'solo' },
          { name: 'Swarm (peer-to-peer)', value: 'swarm' },
          { name: 'Hierarchical (manager/worker)', value: 'hierarchical' },
          { name: 'Mesh (decentralized)', value: 'mesh' },
        ],
      },
      {
        type: 'list',
        name: 'autonomy',
        message: 'Autonomy level:',
        choices: [
          { name: 'Supervised (requires approval)', value: 'supervised' },
          { name: 'Semi-autonomous (some approval)', value: 'semi-autonomous' },
          { name: 'Autonomous (fully independent)', value: 'autonomous' },
          { name: 'Policy-driven (governed by policies)', value: 'policy-driven' },
        ],
      },
      {
        type: 'checkbox',
        name: 'capabilities',
        message: 'Select capabilities:',
        choices: [
          'http',
          'webhook',
          'api',
          'git',
          'database',
          'queue',
          'stream',
          'batch',
          'schedule',
          'artifact',
          'mesh',
          'coordination',
          'policy',
        ],
      },
      {
        type: 'confirm',
        name: 'needsGpu',
        message: 'Requires GPU?',
        default: false,
      },
    ]);

    return {
      environment: answers.environment,
      trigger: answers.trigger,
      dataFlow: answers.dataFlow,
      collaboration: answers.collaboration,
      autonomy: answers.autonomy,
      capabilities: answers.capabilities,
      resources: {
        gpu: answers.needsGpu,
        cpu: 1,
        memory: 512,
      },
    };
  }

  /**
   * Display detection results
   */
  private displayResults(
    result: {
      type: DynamicAgentType;
      confidence: number;
      context: AgentTypeContext;
      alternatives: Array<{ type: DynamicAgentType; confidence: number; reason: string }>;
      recommendations: string[];
    },
    verbose = false
  ): void {
    console.log(chalk.green.bold(`Detected Type: ${result.type}`));
    console.log(chalk.gray(`Confidence: ${(result.confidence * 100).toFixed(1)}%\n`));

    const characteristics = TYPE_CHARACTERISTICS[result.type];

    console.log(chalk.cyan('Characteristics:'));
    console.log(chalk.gray('  Execution Time:    '), characteristics.executionTime);
    console.log(chalk.gray('  Scaling:           '), characteristics.scaling);
    console.log(chalk.gray('  State Persistence: '), characteristics.statePersistence ? 'Yes' : 'No');
    console.log(chalk.gray('  Requires Human:    '), characteristics.requiresHuman ? 'Yes' : 'No');
    console.log(chalk.gray('  Cost Profile:      '), characteristics.costProfile);

    if (verbose) {
      console.log(chalk.cyan('\nContext:'));
      console.log(chalk.gray('  Environment:   '), result.context.environment);
      console.log(chalk.gray('  Trigger:       '), result.context.trigger);
      console.log(chalk.gray('  Data Flow:     '), result.context.dataFlow);
      console.log(chalk.gray('  Collaboration: '), result.context.collaboration);
      console.log(chalk.gray('  Autonomy:      '), result.context.autonomy);
      console.log(chalk.gray('  Capabilities:  '), result.context.capabilities.join(', ') || 'none');
    }

    if (result.alternatives.length > 0) {
      console.log(chalk.cyan('\nAlternative Types:'));
      for (const alt of result.alternatives) {
        console.log(
          chalk.gray('  • '),
          alt.type,
          chalk.gray(`(${(alt.confidence * 100).toFixed(1)}%)`),
          chalk.gray('-'),
          alt.reason
        );
      }
    }

    if (result.recommendations.length > 0) {
      console.log(chalk.cyan('\nRecommendations:'));
      for (const rec of result.recommendations) {
        console.log(chalk.gray('  • '), rec);
      }
    }
  }

  /**
   * Create manifest from context
   */
  private createManifestFromContext(
    name: string,
    type: DynamicAgentType,
    context: AgentTypeContext
  ): Record<string, unknown> {
    const capabilities = this.typeDetector.suggestCapabilitiesForType(type);

    return {
      apiVersion: 'ossa.bluefly.io/v1',
      kind: 'Agent',
      metadata: {
        name,
        annotations: {
          'ossa.io/agent-type': type,
        },
      },
      spec: {
        role: `${type} agent`,
        llm: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        },
        capabilities: capabilities.map(id => ({ id })),
        autonomy: {
          level: context.autonomy === 'autonomous' ? 'full' : 'partial',
          approval_required: context.autonomy === 'supervised',
        },
        constraints: {
          resources: context.resources,
        },
      },
    };
  }

  /**
   * Save results to file
   */
  private async saveResults(path: string, result: unknown): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(path, JSON.stringify(result, null, 2));
    console.log(chalk.green(`\n✓ Results saved to: ${path}`));
  }
}
