/**
 * ManifestBuilder - Fluent API for building OSSA manifests
 *
 * @example
 * ```typescript
 * const llmConfig = LLMConfigBuilder.anthropic('claude-sonnet-4')
 *   .temperature(0.7)
 *   .maxTokens(4096)
 *   .build();
 *
 * const tool = ToolBuilder.mcp('filesystem')
 *   .server('npx -y @modelcontextprotocol/server-filesystem')
 *   .args(['./'])
 *   .build();
 *
 * const safety = SafetyBuilder.create()
 *   .maxActionsPerMinute(10)
 *   .costThreshold(100)
 *   .build();
 *
 * const autonomy = AutonomyBuilder.supervised()
 *   .approvalRequired(['deploy', 'delete'])
 *   .build();
 *
 * const manifest = ManifestBuilder.agent('agent-47')
 *   .version('1.0.0')
 *   .description('My helpful agent')
 *   .namespace('production')
 *   .role('You are a helpful assistant that helps with code reviews')
 *   .llm(llmConfig)
 *   .addTool(tool)
 *   .safety(safety)
 *   .autonomy(autonomy)
 *   .label('team', 'platform')
 *   .label('env', 'production')
 *   .build();
 * ```
 */

import type {
  AgentManifest,
  TaskManifest,
  WorkflowManifest,
  OSSAManifest,
  Metadata,
  AgentSpec,
  TaskSpec,
  WorkflowSpec,
  Tool,
  LLMConfig,
  Safety,
  Capability,
  Identity,
} from '../types.js';
import type { AutonomyConfig } from './autonomy.builder.js';
import { OSSA_VERSION } from '../types.js';

export class ManifestBuilder<
  K extends 'Agent' | 'Task' | 'Workflow' = 'Agent',
> {
  private metadata: Partial<Metadata>;
  private spec: Partial<AgentSpec | TaskSpec | WorkflowSpec>;
  private kind: K;

  private constructor(kind: K, name: string) {
    this.kind = kind;
    this.metadata = {
      name,
    };
    this.spec = {};
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Create an Agent manifest builder
   */
  static agent(name: string): ManifestBuilder<'Agent'> {
    return new ManifestBuilder('Agent', name);
  }

  /**
   * Create a Task manifest builder
   */
  static task(name: string): ManifestBuilder<'Task'> {
    return new ManifestBuilder('Task', name);
  }

  /**
   * Create a Workflow manifest builder
   */
  static workflow(name: string): ManifestBuilder<'Workflow'> {
    return new ManifestBuilder('Workflow', name);
  }

  // ============================================================================
  // Metadata Methods
  // ============================================================================

  /**
   * Set version (semver format)
   */
  version(version: string): this {
    this.metadata.version = version;
    return this;
  }

  /**
   * Set namespace
   */
  namespace(namespace: string): this {
    this.metadata.namespace = namespace;
    return this;
  }

  /**
   * Set description
   */
  description(description: string): this {
    this.metadata.description = description;
    return this;
  }

  /**
   * Add a label
   */
  label(key: string, value: string): this {
    if (!this.metadata.labels) {
      this.metadata.labels = {};
    }
    this.metadata.labels[key] = value;
    return this;
  }

  /**
   * Set all labels
   */
  labels(labels: Record<string, string>): this {
    this.metadata.labels = labels;
    return this;
  }

  /**
   * Add an annotation
   */
  annotation(key: string, value: string): this {
    if (!this.metadata.annotations) {
      this.metadata.annotations = {};
    }
    this.metadata.annotations[key] = value;
    return this;
  }

  /**
   * Set all annotations
   */
  annotations(annotations: Record<string, string>): this {
    this.metadata.annotations = annotations;
    return this;
  }

  // ============================================================================
  // Agent Spec Methods (only for Agent kind)
  // ============================================================================

  /**
   * Set agent role/system prompt
   */
  role(role: string): this {
    if (this.kind !== 'Agent') {
      throw new Error('role() is only available for Agent manifests');
    }
    (this.spec as AgentSpec).role = role;
    return this;
  }

  /**
   * Set LLM configuration
   */
  llm(config: LLMConfig): this {
    if (this.kind !== 'Agent') {
      throw new Error('llm() is only available for Agent manifests');
    }
    (this.spec as AgentSpec).llm = config;
    return this;
  }

  /**
   * Add a tool
   */
  addTool(tool: Tool): this {
    if (this.kind !== 'Agent') {
      throw new Error('addTool() is only available for Agent manifests');
    }
    const agentSpec = this.spec as AgentSpec;
    if (!agentSpec.tools) {
      agentSpec.tools = [];
    }
    agentSpec.tools.push(tool);
    return this;
  }

  /**
   * Set all tools
   */
  tools(tools: Tool[]): this {
    if (this.kind !== 'Agent') {
      throw new Error('tools() is only available for Agent manifests');
    }
    (this.spec as AgentSpec).tools = tools;
    return this;
  }

  /**
   * Add a capability
   */
  addCapability(name: string, description?: string): this {
    if (this.kind !== 'Agent') {
      throw new Error('addCapability() is only available for Agent manifests');
    }
    const agentSpec = this.spec as AgentSpec;
    if (!agentSpec.capabilities) {
      agentSpec.capabilities = [];
    }
    agentSpec.capabilities.push({ name, description });
    return this;
  }

  /**
   * Set all capabilities
   */
  capabilities(capabilities: Capability[]): this {
    if (this.kind !== 'Agent') {
      throw new Error('capabilities() is only available for Agent manifests');
    }
    (this.spec as AgentSpec).capabilities = capabilities;
    return this;
  }

  /**
   * Set safety configuration
   */
  safety(safety: Safety): this {
    if (this.kind !== 'Agent') {
      throw new Error('safety() is only available for Agent manifests');
    }
    (this.spec as AgentSpec).safety = safety;
    return this;
  }

  /**
   * Set autonomy/access tier configuration
   */
  autonomy(config: AutonomyConfig): this {
    if (this.kind !== 'Agent') {
      throw new Error('autonomy() is only available for Agent manifests');
    }
    const agentSpec = this.spec as AgentSpec;
    agentSpec.access_tier = config.accessTier;

    // If there's additional config, store in identity
    if (config.approvalRequired || config.maxCost) {
      if (!agentSpec.identity) {
        agentSpec.identity = {};
      }
      // Store additional config in annotations or custom fields
      // (These may need to be stored differently depending on implementation)
    }

    return this;
  }

  /**
   * Set identity configuration
   */
  identity(identity: Identity): this {
    if (this.kind !== 'Agent') {
      throw new Error('identity() is only available for Agent manifests');
    }
    (this.spec as AgentSpec).identity = identity;
    return this;
  }

  /**
   * Set access tier directly
   */
  accessTier(tier: string): this {
    if (this.kind !== 'Agent') {
      throw new Error('accessTier() is only available for Agent manifests');
    }
    (this.spec as AgentSpec).access_tier = tier as any;
    return this;
  }

  // ============================================================================
  // Task Spec Methods (only for Task kind)
  // ============================================================================

  /**
   * Set task description
   */
  taskDescription(description: string): this {
    if (this.kind !== 'Task') {
      throw new Error('taskDescription() is only available for Task manifests');
    }
    (this.spec as TaskSpec).description = description;
    return this;
  }

  /**
   * Add a task step
   */
  addStep(name: string, action?: string, parameters?: Record<string, unknown>): this {
    if (this.kind !== 'Task') {
      throw new Error('addStep() is only available for Task manifests');
    }
    const taskSpec = this.spec as TaskSpec;
    if (!taskSpec.steps) {
      taskSpec.steps = [];
    }
    taskSpec.steps.push({
      name,
      action,
      parameters,
    });
    return this;
  }

  // ============================================================================
  // Workflow Spec Methods (only for Workflow kind)
  // ============================================================================

  /**
   * Add a workflow agent
   */
  addAgent(name: string, ref?: string, role?: string): this {
    if (this.kind !== 'Workflow') {
      throw new Error('addAgent() is only available for Workflow manifests');
    }
    const workflowSpec = this.spec as WorkflowSpec;
    if (!workflowSpec.agents) {
      workflowSpec.agents = [];
    }
    workflowSpec.agents.push({
      name,
      ref,
      role,
    });
    return this;
  }

  /**
   * Add a workflow step
   */
  addWorkflowStep(
    id: string,
    kind: 'Task' | 'Agent' | 'Parallel' | 'Conditional' | 'Loop',
    config?: {
      name?: string;
      ref?: string;
      dependsOn?: string[];
      input?: Record<string, unknown>;
      output?: Record<string, unknown>;
    }
  ): this {
    if (this.kind !== 'Workflow') {
      throw new Error('addWorkflowStep() is only available for Workflow manifests');
    }
    const workflowSpec = this.spec as WorkflowSpec;
    if (!workflowSpec.steps) {
      workflowSpec.steps = [];
    }
    workflowSpec.steps.push({
      id,
      name: config?.name,
      kind,
      ref: config?.ref,
      depends_on: config?.dependsOn,
      input: config?.input,
      output: config?.output,
    });
    return this;
  }

  // ============================================================================
  // Build Method
  // ============================================================================

  /**
   * Build the manifest
   */
  build(): OSSAManifest {
    if (!this.metadata.name) {
      throw new Error('Manifest name is required');
    }

    const baseManifest = {
      apiVersion: OSSA_VERSION,
      kind: this.kind,
      metadata: this.metadata as Metadata,
      spec: this.spec,
    };

    return baseManifest as OSSAManifest;
  }
}
