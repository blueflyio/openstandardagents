#!/usr/bin/env tsx
/**
 * Validate OSSA v0.3.5 specific features
 *
 * Validates:
 * - Completion signals configuration
 * - Checkpointing configuration
 * - MoE extension
 * - BAT framework
 * - MOE metrics
 * - Flow kind
 * - Capability discovery
 * - Feedback loops
 * - Infrastructure substrate
 */

import { readFileSync } from 'fs';
import yaml from 'yaml';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  features: {
    completion_signals?: boolean;
    checkpointing?: boolean;
    moe?: boolean;
    bat?: boolean;
    moe_metrics?: boolean;
    flow_kind?: boolean;
    capability_discovery?: boolean;
    feedback_loops?: boolean;
    infrastructure?: boolean;
    agentscope?: boolean;
  };
}

export class V035FeatureValidator {
  constructor(private readonly _rootDir: string = process.cwd()) {}

  /**
   * Validate v0.3.5 features in a manifest
   */
  validate(manifestPath: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      features: {},
    };

    try {
      const content = readFileSync(manifestPath, 'utf-8');
      const manifest = yaml.parse(content);

      // Check API version
      if (!manifest.apiVersion || !manifest.apiVersion.includes('v0.3.5')) {
        result.warnings.push('Manifest does not use ossa/v0.3.5 API version');
      }

      // Validate completion signals
      if (manifest.spec?.completion) {
        result.features.completion_signals = true;
        this.validateCompletionSignals(manifest.spec.completion, result);
      }

      // Validate checkpointing
      if (manifest.spec?.checkpointing) {
        result.features.checkpointing = true;
        this.validateCheckpointing(manifest.spec.checkpointing, result);
      }

      // Validate MoE extension
      if (manifest.extensions?.experts) {
        result.features.moe = true;
        this.validateMoE(manifest.extensions.experts, result);
      }

      // Validate BAT framework
      if (manifest.extensions?.bat) {
        result.features.bat = true;
        this.validateBAT(manifest.extensions.bat, result);
      }

      // Validate MOE metrics
      if (manifest.extensions?.moe) {
        result.features.moe_metrics = true;
        this.validateMOEMetrics(manifest.extensions.moe, result);
      }

      // Validate Flow kind
      if (manifest.kind === 'Flow') {
        result.features.flow_kind = true;
        this.validateFlowKind(manifest.spec, result);
      }

      // Validate capability discovery
      if (manifest.extensions?.capabilities) {
        result.features.capability_discovery = true;
        this.validateCapabilityDiscovery(
          manifest.extensions.capabilities,
          result
        );
      }

      // Validate feedback loops
      if (manifest.extensions?.feedback) {
        result.features.feedback_loops = true;
        this.validateFeedbackLoops(manifest.extensions.feedback, result);
      }

      // Validate infrastructure substrate
      if (manifest.spec?.infrastructure || manifest.infrastructure) {
        result.features.infrastructure = true;
        this.validateInfrastructure(
          manifest.spec?.infrastructure || manifest.infrastructure,
          result
        );
      }

      // Validate AgentScope extension
      if (manifest.extensions?.agentscope) {
        result.features.agentscope = true;
        this.validateAgentScope(manifest.extensions.agentscope, result);
      }

      result.valid = result.errors.length === 0;
    } catch (error) {
      result.valid = false;
      result.errors.push(
        `Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return result;
  }

  private validateCompletionSignals(
    completion: any,
    result: ValidationResult
  ): void {
    if (!completion.default_signal) {
      result.warnings.push(
        'completion.default_signal not specified, using "complete"'
      );
    }

    const validSignals = [
      'continue',
      'complete',
      'blocked',
      'escalate',
      'checkpoint',
    ];
    if (
      completion.default_signal &&
      !validSignals.includes(completion.default_signal)
    ) {
      result.errors.push(
        `Invalid completion.default_signal: ${completion.default_signal}`
      );
    }

    if (completion.signals) {
      for (const signal of completion.signals) {
        if (!validSignals.includes(signal.signal)) {
          result.errors.push(
            `Invalid signal in completion.signals: ${signal.signal}`
          );
        }
        if (signal.condition && typeof signal.condition !== 'string') {
          result.errors.push(
            'completion.signals[].condition must be a string expression'
          );
        }
      }
    }
  }

  private validateCheckpointing(
    checkpointing: any,
    result: ValidationResult
  ): void {
    if (checkpointing.enabled === false) {
      return; // Checkpointing disabled, skip validation
    }

    const validIntervals = ['iteration', 'time', 'manual'];
    if (
      checkpointing.interval &&
      !validIntervals.includes(checkpointing.interval)
    ) {
      result.errors.push(
        `Invalid checkpointing.interval: ${checkpointing.interval}`
      );
    }

    if (checkpointing.storage) {
      const validBackends = ['agent-brain', 's3', 'local'];
      if (!validBackends.includes(checkpointing.storage.backend)) {
        result.errors.push(
          `Invalid checkpointing.storage.backend: ${checkpointing.storage.backend}`
        );
      }
    }
  }

  private validateMoE(experts: any, result: ValidationResult): void {
    if (!experts.registry || !Array.isArray(experts.registry)) {
      result.errors.push('experts.registry must be an array');
      return;
    }

    for (const expert of experts.registry) {
      if (!expert.id) {
        result.errors.push('Expert missing required field: id');
      }
      if (!expert.model) {
        result.errors.push(
          `Expert ${expert.id || 'unknown'} missing required field: model`
        );
      }
      if (expert.model && !expert.model.provider) {
        result.errors.push(
          `Expert ${expert.id || 'unknown'} model missing provider`
        );
      }
    }

    const validStrategies = [
      'agent_controlled',
      'cost_optimized',
      'capability_match',
      'hybrid',
    ];
    if (
      experts.selection_strategy &&
      !validStrategies.includes(experts.selection_strategy)
    ) {
      result.errors.push(
        `Invalid experts.selection_strategy: ${experts.selection_strategy}`
      );
    }
  }

  private validateBAT(bat: any, result: ValidationResult): void {
    if (!bat.selection_criteria || !Array.isArray(bat.selection_criteria)) {
      result.errors.push('bat.selection_criteria must be an array');
      return;
    }

    for (const criterion of bat.selection_criteria) {
      if (!criterion.dimension) {
        result.errors.push('BAT criterion missing required field: dimension');
      }
      if (!criterion.options || !Array.isArray(criterion.options)) {
        result.errors.push(
          `BAT criterion ${criterion.dimension || 'unknown'} missing options array`
        );
      }
    }
  }

  private validateMOEMetrics(moe: any, result: ValidationResult): void {
    if (!moe.primary) {
      result.errors.push('moe.primary metric is required');
      return;
    }

    if (!moe.primary.metric) {
      result.errors.push('moe.primary.metric is required');
    }
    if (moe.primary.target === undefined) {
      result.errors.push('moe.primary.target is required');
    }
    if (!moe.primary.measurement) {
      result.errors.push('moe.primary.measurement is required');
    }
  }

  private validateFlowKind(spec: any, result: ValidationResult): void {
    if (!spec.flow_schema) {
      result.errors.push('Flow spec missing required field: flow_schema');
      return;
    }

    if (!spec.flow_schema.initial_state) {
      result.errors.push(
        'Flow flow_schema missing required field: initial_state'
      );
    }
    if (!spec.flow_schema.states || !Array.isArray(spec.flow_schema.states)) {
      result.errors.push('Flow flow_schema.states must be an array');
    }
    if (!spec.transitions || !Array.isArray(spec.transitions)) {
      result.errors.push('Flow spec missing required field: transitions');
    }
  }

  private validateCapabilityDiscovery(
    capabilities: any,
    result: ValidationResult
  ): void {
    if (capabilities.discovery) {
      const validRegistries = ['agent-mesh', 'mcp-registry', 'local'];
      if (
        capabilities.discovery.registry &&
        !validRegistries.includes(capabilities.discovery.registry)
      ) {
        result.errors.push(
          `Invalid capabilities.discovery.registry: ${capabilities.discovery.registry}`
        );
      }
    }
  }

  private validateFeedbackLoops(feedback: any, result: ValidationResult): void {
    if (feedback.learning) {
      const validStrategies = ['reinforcement', 'supervised', 'unsupervised'];
      if (
        feedback.learning.strategy &&
        !validStrategies.includes(feedback.learning.strategy)
      ) {
        result.errors.push(
          `Invalid feedback.learning.strategy: ${feedback.learning.strategy}`
        );
      }
    }
  }

  private validateInfrastructure(
    infrastructure: any,
    result: ValidationResult
  ): void {
    if (!Array.isArray(infrastructure)) {
      result.errors.push('infrastructure must be an array');
      return;
    }

    for (const infra of infrastructure) {
      if (!infra.type) {
        result.errors.push('Infrastructure entry missing required field: type');
      }
      if (!infra.hostname) {
        result.errors.push(
          'Infrastructure entry missing required field: hostname'
        );
      }
    }
  }

  /**
   * Validate AgentScope extension (extensions.agentscope)
   */
  private validateAgentScope(agentscope: any, result: ValidationResult): void {
    // Validate agent_class enum
    const validAgentClasses = [
      'ReActAgent',
      'DialogAgent',
      'DictDialogAgent',
      'UserAgent',
      'TextToImageAgent',
      'RpcAgent',
    ];
    if (agentscope.agent_class) {
      if (!validAgentClasses.includes(agentscope.agent_class)) {
        result.warnings.push(
          `extensions.agentscope.agent_class "${agentscope.agent_class}" is not a known AgentScope class: ${validAgentClasses.join(', ')}`
        );
      }
    } else {
      result.errors.push(
        'extensions.agentscope.agent_class is required (e.g. ReActAgent, DialogAgent)'
      );
    }

    // Validate memory_backend enum
    const validMemoryBackends = ['mem0', 'local', 'redis', 'none'];
    if (agentscope.memory_backend) {
      if (!validMemoryBackends.includes(agentscope.memory_backend)) {
        result.warnings.push(
          `extensions.agentscope.memory_backend "${agentscope.memory_backend}" is not a known backend: ${validMemoryBackends.join(', ')}`
        );
      }
    }

    // Validate orchestration enum
    const validOrchestrations = [
      'msghub',
      'pipeline',
      'sequential',
      'forlooppipeline',
      'whilelooppipeline',
      'ifelsepipeline',
      'switchpipeline',
    ];
    if (agentscope.orchestration) {
      if (!validOrchestrations.includes(agentscope.orchestration)) {
        result.warnings.push(
          `extensions.agentscope.orchestration "${agentscope.orchestration}" is not a known pattern: ${validOrchestrations.join(', ')}`
        );
      }
    }

    // Validate formatter enum
    const validFormatters = ['anthropic', 'openai', 'dashscope', 'raw'];
    if (agentscope.formatter) {
      if (!validFormatters.includes(agentscope.formatter)) {
        result.warnings.push(
          `extensions.agentscope.formatter "${agentscope.formatter}" is not a known formatter: ${validFormatters.join(', ')}`
        );
      }
    }

    // Validate version is present
    if (!agentscope.version) {
      result.warnings.push(
        'extensions.agentscope.version not specified (recommended for reproducibility)'
      );
    }

    // Validate max_iters is positive if present
    if (
      agentscope.max_iters !== undefined &&
      (typeof agentscope.max_iters !== 'number' || agentscope.max_iters < 1)
    ) {
      result.errors.push(
        'extensions.agentscope.max_iters must be a positive integer'
      );
    }

    // Validate compression config if present
    if (agentscope.compression) {
      if (
        agentscope.compression.trigger_threshold !== undefined &&
        (typeof agentscope.compression.trigger_threshold !== 'number' ||
          agentscope.compression.trigger_threshold < 0)
      ) {
        result.errors.push(
          'extensions.agentscope.compression.trigger_threshold must be a non-negative number'
        );
      }
      if (
        agentscope.compression.keep_recent !== undefined &&
        (typeof agentscope.compression.keep_recent !== 'number' ||
          agentscope.compression.keep_recent < 0)
      ) {
        result.errors.push(
          'extensions.agentscope.compression.keep_recent must be a non-negative integer'
        );
      }
    }

    // Validate capabilities array if present
    if (agentscope.capabilities) {
      if (!Array.isArray(agentscope.capabilities)) {
        result.errors.push(
          'extensions.agentscope.capabilities must be an array'
        );
      } else {
        const knownCapabilities = [
          'rag',
          'parallel_tool_calls',
          'code_execution',
          'web_search',
          'file_operations',
        ];
        for (const cap of agentscope.capabilities) {
          if (typeof cap !== 'string') {
            result.errors.push(
              'extensions.agentscope.capabilities entries must be strings'
            );
          } else if (!knownCapabilities.includes(cap)) {
            result.warnings.push(
              `extensions.agentscope.capabilities "${cap}" is not a known capability: ${knownCapabilities.join(', ')}`
            );
          }
        }
      }
    }
  }
}

// CLI interface - only execute when run directly (not imported)
// Skip execution in test environments to avoid import.meta parsing issues in Jest
if (
  typeof process !== 'undefined' &&
  process.env.NODE_ENV !== 'test' &&
  !process.env.JEST_WORKER_ID
) {
  // Use eval to avoid Jest parsing import.meta.url at parse time
  // This allows the code to be parsed by Jest without syntax errors
  const shouldRunCLI = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      return eval(
        'typeof import.meta !== "undefined" && import.meta.url === `file://${process.argv[1]}`'
      );
    } catch {
      return false;
    }
  })();

  if (shouldRunCLI) {
    const validator = new V035FeatureValidator();
    const manifestPath =
      process.argv[2] || 'examples/forward-thinking-agent.ossa.yaml';
    const result = validator.validate(manifestPath);

    console.log('🔍 OSSA v0.3.5 Feature Validation\n');
    console.log(`Manifest: ${manifestPath}\n`);

    if (result.valid) {
      console.log('✅ Validation passed!\n');
    } else {
      console.log('❌ Validation failed:\n');
      result.errors.forEach((err) => console.log(`  • ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warn) => console.log(`  • ${warn}`));
    }

    console.log('\n📊 Features Detected:');
    Object.entries(result.features).forEach(([feature, detected]) => {
      console.log(`  ${detected ? '✅' : '❌'} ${feature}`);
    });

    process.exit(result.valid ? 0 : 1);
  }
}

// Export already defined above
