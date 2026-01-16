/**
 * OSSA v0.3.5 CLI Commands
 *
 * Production-grade tooling for v0.3.5 features
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { V035FeatureValidator } from '../../../tools/validation/validate-v0.3.5-features.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

export const v035Command = new Command('v0.3.5')
  .alias('v035')
  .description('OSSA v0.3.5 feature commands');

// Validate v0.3.5 features
v035Command
  .command('validate')
  .alias('val')
  .description('Validate v0.3.5 features in a manifest')
  .argument('<manifest>', 'Path to OSSA manifest file')
  .option('--strict', 'Fail on warnings', false)
  .action(async (manifest: string, options: { strict: boolean }) => {
    console.log(chalk.blue('🔍 OSSA v0.3.5 Feature Validation\n'));

    const validator = new V035FeatureValidator();
    const result = validator.validate(manifest);

    if (result.valid && (!options.strict || result.warnings.length === 0)) {
      console.log(chalk.green('✅ Validation passed!\n'));
    } else {
      console.log(chalk.red('❌ Validation failed:\n'));
      result.errors.forEach((err: string) =>
        console.log(chalk.red(`  • ${err}`))
      );
      if (options.strict && result.warnings.length > 0) {
        result.warnings.forEach((warn: string) =>
          console.log(chalk.yellow(`  ⚠️  ${warn}`))
        );
        process.exit(1);
      }
    }

    if (result.warnings.length > 0 && !options.strict) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach((warn: string) =>
        console.log(chalk.yellow(`  • ${warn}`))
      );
    }

    console.log(chalk.blue('\n📊 Features Detected:'));
    Object.entries(result.features).forEach(([feature, detected]) => {
      console.log(
        `  ${detected ? chalk.green('✅') : chalk.gray('❌')} ${feature}`
      );
    });

    process.exit(result.valid ? 0 : 1);
  });

// Migrate v0.3.4 to v0.3.5
v035Command
  .command('migrate')
  .alias('mig')
  .description('Migrate v0.3.4 manifest to v0.3.5')
  .argument('<input>', 'Input manifest file (v0.3.4)')
  .argument('[output]', 'Output manifest file (v0.3.5)', '')
  .option('--add-completion', 'Add completion signals', false)
  .option('--add-checkpointing', 'Add checkpointing', false)
  .option('--add-moe', 'Add MoE extension', false)
  .action(async (input: string, output: string, options: any) => {
    console.log(chalk.blue('🔄 Migrating OSSA v0.3.4 → v0.3.5\n'));

    if (!existsSync(input)) {
      console.error(chalk.red(`❌ File not found: ${input}`));
      process.exit(1);
    }

    const content = readFileSync(input, 'utf-8');
    const manifest = yaml.parse(content);

    // Update API version
    manifest.apiVersion = 'ossa/v0.3.5';

    // Ensure spec exists
    if (!manifest.spec) {
      manifest.spec = {};
    }

    // Add completion signals if requested
    if (options.addCompletion && !manifest.spec.completion) {
      manifest.spec.completion = {
        default_signal: 'complete',
        signals: [
          { signal: 'continue', condition: 'iteration_count < max_iterations' },
          { signal: 'blocked', condition: 'confidence < 0.5' },
        ],
        max_iterations: 10,
      };
      console.log(chalk.green('  ✅ Added completion signals'));
    }

    // Add checkpointing if requested
    if (options.addCheckpointing && !manifest.spec.checkpointing) {
      manifest.spec.checkpointing = {
        enabled: true,
        interval: 'iteration',
        interval_value: 5,
        storage: {
          backend: 'agent-brain',
        },
      };
      console.log(chalk.green('  ✅ Added checkpointing'));
    }

    // Ensure extensions exists
    if (!manifest.extensions) {
      manifest.extensions = {};
    }

    // Add MoE if requested
    if (options.addMoe && !manifest.extensions.experts) {
      manifest.extensions.experts = {
        registry: [],
        selection_strategy: 'agent_controlled',
      };
      console.log(chalk.green('  ✅ Added MoE extension'));
    }

    const outputPath = output || input.replace(/\.(yaml|yml)$/, '.v0.3.5.$1');
    writeFileSync(outputPath, yaml.stringify(manifest, { indent: 2 }), 'utf-8');

    console.log(chalk.green(`\n✅ Migrated: ${outputPath}`));
  });

// Generate v0.3.5 example
v035Command
  .command('example')
  .alias('ex')
  .description('Generate v0.3.5 example agent')
  .argument('[name]', 'Agent name', 'example-v0.3.5-agent')
  .option('--features <features...>', 'Features to include', [
    'completion',
    'checkpointing',
    'moe',
    'bat',
    'moe-metrics',
  ])
  .action(async (name: string, options: { features: string[] }) => {
    console.log(chalk.blue(`📝 Generating v0.3.5 example: ${name}\n`));

    const example: any = {
      apiVersion: 'ossa/v0.3.5',
      kind: 'Agent',
      metadata: {
        name,
        version: '1.0.0',
        description: 'OSSA v0.3.5 example agent with forward-thinking features',
      },
      spec: {
        identity: {
          id: `@${name}`,
          display_name: name,
          tier: 'worker',
        },
        llm: {
          provider: '${LLM_PROVIDER:-anthropic}',
          model: '${LLM_MODEL:-claude-sonnet}',
          profile: 'balanced',
        },
      },
    };

    // Add features based on options
    if (options.features.includes('completion')) {
      example.spec.completion = {
        default_signal: 'complete',
        signals: [
          { signal: 'continue', condition: 'iteration_count < max_iterations' },
          { signal: 'blocked', condition: 'confidence < 0.5' },
        ],
        max_iterations: 10,
      };
    }

    if (options.features.includes('checkpointing')) {
      example.spec.checkpointing = {
        enabled: true,
        interval: 'iteration',
        interval_value: 5,
        storage: {
          backend: 'agent-brain',
        },
      };
    }

    if (options.features.includes('moe')) {
      example.extensions = example.extensions || {};
      example.extensions.experts = {
        registry: [
          {
            id: 'reasoning-expert',
            model: { provider: 'anthropic', model: 'claude-opus-4-5-20251101' },
            specializations: ['complex_reasoning'],
            cost_tier: 'premium',
          },
        ],
        selection_strategy: 'agent_controlled',
      };
    }

    const outputPath = join(process.cwd(), 'examples', `${name}.ossa.yaml`);
    writeFileSync(outputPath, yaml.stringify(example, { indent: 2 }), 'utf-8');

    console.log(chalk.green(`✅ Generated: ${outputPath}`));
    console.log(
      chalk.blue(`\nFeatures included: ${options.features.join(', ')}`)
    );
  });

// List v0.3.5 features
v035Command
  .command('features')
  .alias('feat')
  .description('List available v0.3.5 features')
  .action(() => {
    console.log(chalk.blue('🚀 OSSA v0.3.5 Features\n'));

    const features = [
      {
        name: 'Completion Signals',
        description: 'Standardized agent termination conditions',
        schema: 'completion-signals.schema.json',
      },
      {
        name: 'Session Checkpointing',
        description: 'Resilient state management with resume',
        schema: 'checkpoint.schema.json',
      },
      {
        name: 'Mixture of Experts (MoE)',
        description: 'Agent-controlled expert selection',
        schema: 'mixture-of-experts.schema.json',
      },
      {
        name: 'BAT Framework',
        description: 'Best Available Technology selection',
        schema: 'bat-framework.schema.json',
      },
      {
        name: 'MOE Metrics',
        description: 'Measure of Effectiveness evaluation',
        schema: 'moe-metrics.schema.json',
      },
      {
        name: 'Flow Kind',
        description: 'Native flow-based orchestration',
        schema: 'flow-kind.schema.json',
      },
      {
        name: 'Capability Discovery',
        description: 'Runtime-adaptive capabilities',
        schema: 'capability-discovery.schema.json',
      },
      {
        name: 'Feedback Loops',
        description: 'Continuous improvement mechanisms',
        schema: 'feedback-loops.schema.json',
      },
      {
        name: 'Infrastructure Substrate',
        description: 'Infrastructure as agent-addressable resources',
        schema: 'infrastructure-substrate.schema.json',
      },
    ];

    features.forEach((feature, idx) => {
      console.log(chalk.green(`${idx + 1}. ${feature.name}`));
      console.log(chalk.gray(`   ${feature.description}`));
      console.log(chalk.gray(`   Schema: spec/v0.3/${feature.schema}\n`));
    });
  });
