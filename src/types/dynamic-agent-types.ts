/**
 * Dynamic Contextual Agent Types System
 * Agent type is determined by context, not static classifications
 *
 * Vision: Agents adapt their type based on runtime context rather than
 * being locked into predefined categories at creation time.
 */

/**
 * Environment where the agent runs
 */
export type AgentEnvironment =
  | 'production'
  | 'staging'
  | 'development'
  | 'local';

/**
 * What triggered the agent execution
 */
export type AgentTrigger =
  | 'webhook' // HTTP webhook event
  | 'schedule' // Cron/scheduled task
  | 'manual' // User-initiated
  | 'pipeline' // CI/CD pipeline stage
  | 'a2a' // Agent-to-agent communication
  | 'event' // Event-driven (pub/sub)
  | 'stream'; // Real-time stream processing

/**
 * Data flow pattern the agent uses
 */
export type AgentDataFlow =
  | 'stateless' // No state between invocations
  | 'stateful' // Maintains state across invocations
  | 'streaming' // Processes data streams
  | 'batch'; // Batch processing

/**
 * Collaboration model with other agents
 */
export type AgentCollaboration =
  | 'solo' // Works independently
  | 'swarm' // Peer-to-peer collaboration
  | 'hierarchical' // Manager/worker structure
  | 'mesh'; // Decentralized mesh network

/**
 * Level of autonomy
 */
export type AgentAutonomy =
  | 'supervised' // Requires human approval
  | 'semi-autonomous' // Some actions require approval
  | 'autonomous' // Fully autonomous
  | 'policy-driven'; // Governed by policies

/**
 * Resource requirements for agent execution
 */
export interface ResourceRequirements {
  /** CPU cores (e.g., 0.5, 1, 2) */
  cpu?: number;
  /** Memory in MB (e.g., 512, 1024) */
  memory?: number;
  /** GPU required (true/false) */
  gpu?: boolean;
  /** GPU memory in MB if GPU is true */
  gpuMemory?: number;
  /** Disk space in MB */
  disk?: number;
  /** Network bandwidth (low/medium/high) */
  network?: 'low' | 'medium' | 'high';
}

/**
 * Context that determines agent type
 * Agent type emerges from the combination of these contextual factors
 */
export interface AgentTypeContext {
  /** Deployment environment */
  environment: AgentEnvironment;

  /** What triggered this execution */
  trigger: AgentTrigger;

  /** Data flow pattern */
  dataFlow: AgentDataFlow;

  /** How it collaborates with other agents */
  collaboration: AgentCollaboration;

  /** Level of autonomy */
  autonomy: AgentAutonomy;

  /** Dynamic capability discovery (e.g., ['http', 'webhook', 'git', 'database']) */
  capabilities: string[];

  /** Resource requirements */
  resources: ResourceRequirements;

  /** Additional context metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Dynamic agent types that emerge from context
 * Type is not predefined but determined by runtime context
 */
export type DynamicAgentType =
  | 'api-orchestrator' // trigger=webhook, stateless, solo
  | 'scheduled-analyst' // trigger=schedule, batch, solo
  | 'swarm-coordinator' // collaboration=swarm, autonomous
  | 'pipeline-worker' // trigger=pipeline, stateful
  | 'mesh-node' // collaboration=mesh, a2a
  | 'policy-enforcer' // autonomy=policy-driven
  | 'stream-processor' // dataFlow=streaming
  | 'event-handler' // trigger=event, stateless
  | 'batch-processor' // dataFlow=batch, scheduled
  | 'supervisor' // autonomy=supervised, hierarchical
  | 'adaptive-hybrid'; // Adapts type based on runtime context

/**
 * Type detection rules for determining agent type from context
 */
export interface TypeDetectionRule {
  /** Type this rule detects */
  type: DynamicAgentType;

  /** Conditions that must be met (all must match) */
  conditions: {
    environment?: AgentEnvironment | AgentEnvironment[];
    trigger?: AgentTrigger | AgentTrigger[];
    dataFlow?: AgentDataFlow | AgentDataFlow[];
    collaboration?: AgentCollaboration | AgentCollaboration[];
    autonomy?: AgentAutonomy | AgentAutonomy[];
    capabilities?: {
      /** Capabilities that must be present (any) */
      has?: string[];
      /** Capabilities that must be absent */
      notHas?: string[];
    };
    resources?: {
      /** Minimum CPU cores required */
      minCpu?: number;
      /** GPU required */
      requiresGpu?: boolean;
    };
  };

  /** Priority when multiple rules match (higher wins) */
  priority: number;

  /** Description of this type */
  description: string;
}

/**
 * Default type detection rules
 */
export const TYPE_DETECTION_RULES: TypeDetectionRule[] = [
  {
    type: 'api-orchestrator',
    conditions: {
      trigger: 'webhook',
      dataFlow: 'stateless',
      collaboration: 'solo',
    },
    priority: 100,
    description: 'Handles HTTP webhooks, stateless API orchestration',
  },
  {
    type: 'scheduled-analyst',
    conditions: {
      trigger: 'schedule',
      dataFlow: ['batch', 'stateless'],
      collaboration: 'solo',
    },
    priority: 90,
    description: 'Runs on schedule, analyzes data in batches',
  },
  {
    type: 'swarm-coordinator',
    conditions: {
      collaboration: 'swarm',
      autonomy: ['autonomous', 'semi-autonomous'],
    },
    priority: 95,
    description: 'Coordinates peer-to-peer agent swarms',
  },
  {
    type: 'pipeline-worker',
    conditions: {
      trigger: 'pipeline',
      dataFlow: 'stateful',
    },
    priority: 90,
    description: 'Executes CI/CD pipeline stages with state',
  },
  {
    type: 'mesh-node',
    conditions: {
      collaboration: 'mesh',
      trigger: 'a2a',
    },
    priority: 95,
    description: 'Decentralized mesh network node',
  },
  {
    type: 'policy-enforcer',
    conditions: {
      autonomy: 'policy-driven',
    },
    priority: 100,
    description: 'Enforces policies and governance rules',
  },
  {
    type: 'stream-processor',
    conditions: {
      dataFlow: 'streaming',
      capabilities: { has: ['stream'] },
    },
    priority: 100,
    description: 'Processes real-time data streams',
  },
  {
    type: 'event-handler',
    conditions: {
      trigger: 'event',
      dataFlow: 'stateless',
    },
    priority: 85,
    description: 'Event-driven stateless handlers',
  },
  {
    type: 'batch-processor',
    conditions: {
      dataFlow: 'batch',
      trigger: ['schedule', 'manual'],
    },
    priority: 80,
    description: 'Batch data processing',
  },
  {
    type: 'supervisor',
    conditions: {
      autonomy: 'supervised',
      collaboration: 'hierarchical',
    },
    priority: 90,
    description: 'Supervises other agents in hierarchy',
  },
];

/**
 * Capabilities typically associated with each agent type
 */
export const TYPE_CAPABILITIES: Record<DynamicAgentType, string[]> = {
  'api-orchestrator': ['http', 'webhook', 'api', 'function', 'rest'],
  'scheduled-analyst': ['schedule', 'batch', 'artifact', 'report', 'analytics'],
  'swarm-coordinator': ['a2a', 'mesh', 'coordination', 'handoff', 'routing'],
  'pipeline-worker': ['pipeline', 'ci', 'cd', 'build', 'deploy', 'test'],
  'mesh-node': ['mesh', 'p2p', 'discovery', 'routing', 'resilience'],
  'policy-enforcer': [
    'policy',
    'governance',
    'compliance',
    'audit',
    'validation',
  ],
  'stream-processor': ['stream', 'realtime', 'kafka', 'kinesis', 'pubsub'],
  'event-handler': ['event', 'pubsub', 'queue', 'async', 'webhook'],
  'batch-processor': ['batch', 'etl', 'transform', 'aggregate', 'schedule'],
  supervisor: [
    'supervision',
    'approval',
    'review',
    'escalation',
    'human-in-loop',
  ],
  'adaptive-hybrid': ['*'], // Can adapt to any capability
};

/**
 * Runtime characteristics for each agent type
 */
export interface AgentTypeCharacteristics {
  /** Typical execution time */
  executionTime: 'short' | 'medium' | 'long';

  /** Scaling strategy */
  scaling: 'none' | 'horizontal' | 'vertical' | 'auto';

  /** State persistence needed */
  statePersistence: boolean;

  /** Requires human interaction */
  requiresHuman: boolean;

  /** Cost profile (relative) */
  costProfile: 'low' | 'medium' | 'high';
}

/**
 * Characteristics for each dynamic agent type
 */
export const TYPE_CHARACTERISTICS: Record<
  DynamicAgentType,
  AgentTypeCharacteristics
> = {
  'api-orchestrator': {
    executionTime: 'short',
    scaling: 'horizontal',
    statePersistence: false,
    requiresHuman: false,
    costProfile: 'low',
  },
  'scheduled-analyst': {
    executionTime: 'medium',
    scaling: 'none',
    statePersistence: true,
    requiresHuman: false,
    costProfile: 'medium',
  },
  'swarm-coordinator': {
    executionTime: 'medium',
    scaling: 'horizontal',
    statePersistence: true,
    requiresHuman: false,
    costProfile: 'medium',
  },
  'pipeline-worker': {
    executionTime: 'medium',
    scaling: 'horizontal',
    statePersistence: true,
    requiresHuman: false,
    costProfile: 'medium',
  },
  'mesh-node': {
    executionTime: 'short',
    scaling: 'horizontal',
    statePersistence: true,
    requiresHuman: false,
    costProfile: 'low',
  },
  'policy-enforcer': {
    executionTime: 'short',
    scaling: 'horizontal',
    statePersistence: false,
    requiresHuman: true,
    costProfile: 'low',
  },
  'stream-processor': {
    executionTime: 'long',
    scaling: 'auto',
    statePersistence: true,
    requiresHuman: false,
    costProfile: 'high',
  },
  'event-handler': {
    executionTime: 'short',
    scaling: 'horizontal',
    statePersistence: false,
    requiresHuman: false,
    costProfile: 'low',
  },
  'batch-processor': {
    executionTime: 'long',
    scaling: 'vertical',
    statePersistence: true,
    requiresHuman: false,
    costProfile: 'high',
  },
  supervisor: {
    executionTime: 'short',
    scaling: 'none',
    statePersistence: true,
    requiresHuman: true,
    costProfile: 'low',
  },
  'adaptive-hybrid': {
    executionTime: 'medium',
    scaling: 'auto',
    statePersistence: true,
    requiresHuman: false,
    costProfile: 'medium',
  },
};

/**
 * Determine agent type from context
 * Algorithm matches context against detection rules and returns best match
 */
export function determineAgentType(
  context: AgentTypeContext
): DynamicAgentType {
  const matches: Array<{ type: DynamicAgentType; priority: number }> = [];

  for (const rule of TYPE_DETECTION_RULES) {
    if (matchesRule(context, rule)) {
      matches.push({ type: rule.type, priority: rule.priority });
    }
  }

  // Sort by priority (highest first)
  matches.sort((a, b) => b.priority - a.priority);

  // Return highest priority match, or 'adaptive-hybrid' if none
  return matches[0]?.type ?? 'adaptive-hybrid';
}

/**
 * Check if context matches a detection rule
 */
function matchesRule(
  context: AgentTypeContext,
  rule: TypeDetectionRule
): boolean {
  const { conditions } = rule;

  // Check environment
  if (conditions.environment) {
    if (!matchesValue(context.environment, conditions.environment)) {
      return false;
    }
  }

  // Check trigger
  if (conditions.trigger) {
    if (!matchesValue(context.trigger, conditions.trigger)) {
      return false;
    }
  }

  // Check data flow
  if (conditions.dataFlow) {
    if (!matchesValue(context.dataFlow, conditions.dataFlow)) {
      return false;
    }
  }

  // Check collaboration
  if (conditions.collaboration) {
    if (!matchesValue(context.collaboration, conditions.collaboration)) {
      return false;
    }
  }

  // Check autonomy
  if (conditions.autonomy) {
    if (!matchesValue(context.autonomy, conditions.autonomy)) {
      return false;
    }
  }

  // Check capabilities
  if (conditions.capabilities) {
    const { has, notHas } = conditions.capabilities;

    if (has && !has.some((cap) => context.capabilities.includes(cap))) {
      return false;
    }

    if (notHas && notHas.some((cap) => context.capabilities.includes(cap))) {
      return false;
    }
  }

  // Check resources
  if (conditions.resources) {
    const { minCpu, requiresGpu } = conditions.resources;

    if (minCpu !== undefined && (context.resources.cpu ?? 0) < minCpu) {
      return false;
    }

    if (requiresGpu !== undefined && context.resources.gpu !== requiresGpu) {
      return false;
    }
  }

  return true;
}

/**
 * Helper to check if a value matches (supports single value or array)
 */
function matchesValue<T>(actual: T, expected: T | T[]): boolean {
  if (Array.isArray(expected)) {
    return expected.includes(actual);
  }
  return actual === expected;
}

/**
 * Get suggested capabilities for an agent type
 */
export function suggestCapabilities(type: DynamicAgentType): string[] {
  return TYPE_CAPABILITIES[type] || [];
}

/**
 * Get characteristics for an agent type
 */
export function getTypeCharacteristics(
  type: DynamicAgentType
): AgentTypeCharacteristics {
  return TYPE_CHARACTERISTICS[type];
}

/**
 * Validate if capabilities are compatible with agent type
 */
export interface CapabilityValidationResult {
  valid: boolean;
  missing: string[]; // Recommended capabilities that are missing
  extra: string[]; // Capabilities that don't match this type
  warnings: string[]; // Other validation warnings
}

export function validateTypeCapabilities(
  type: DynamicAgentType,
  capabilities: string[]
): CapabilityValidationResult {
  const suggested = suggestCapabilities(type);
  const missing: string[] = [];
  const extra: string[] = [];
  const warnings: string[] = [];

  // Check for adaptive-hybrid (accepts all)
  if (type === 'adaptive-hybrid') {
    return { valid: true, missing: [], extra: [], warnings: [] };
  }

  // Find missing recommended capabilities
  for (const cap of suggested) {
    if (!capabilities.includes(cap) && cap !== '*') {
      missing.push(cap);
    }
  }

  // Find extra capabilities
  for (const cap of capabilities) {
    if (!suggested.includes(cap) && !suggested.includes('*')) {
      extra.push(cap);
    }
  }

  // Generate warnings
  if (missing.length > 0) {
    warnings.push(
      `Missing recommended capabilities for ${type}: ${missing.join(', ')}`
    );
  }

  if (extra.length > 3) {
    warnings.push(
      `Many extra capabilities detected. Consider 'adaptive-hybrid' type.`
    );
  }

  // Valid if no critical missing capabilities
  const valid = missing.length === 0;

  return { valid, missing, extra, warnings };
}

/**
 * Extract context from OSSA manifest
 * Analyzes manifest to build context for type detection
 */
export function extractContextFromManifest(
  manifest: Record<string, unknown>
): AgentTypeContext | null {
  try {
    // Extract metadata
    const metadata = (manifest.metadata || {}) as Record<string, unknown>;
    const spec = (manifest.spec || {}) as Record<string, unknown>;

    // Determine environment (default to development)
    const environment: AgentEnvironment = 'development'; // Could be extracted from labels

    // Determine trigger from tools/capabilities
    const tools = (spec.tools || []) as Array<Record<string, unknown>>;
    const trigger = inferTrigger(tools, spec);

    // Determine data flow from architecture
    const architecture = (metadata.agentArchitecture || {}) as Record<
      string,
      unknown
    >;
    const dataFlow = inferDataFlow(architecture, spec);

    // Determine collaboration
    const collaboration = inferCollaboration(architecture, spec);

    // Determine autonomy
    const autonomy = inferAutonomy(spec);

    // Extract capabilities
    const capabilities = extractCapabilities(tools, spec);

    // Extract resources
    const resources = extractResources(spec);

    return {
      environment,
      trigger,
      dataFlow,
      collaboration,
      autonomy,
      capabilities,
      resources,
      metadata: { manifest },
    };
  } catch (error) {
    console.error('Failed to extract context from manifest:', error);
    return null;
  }
}

function inferTrigger(
  tools: Array<Record<string, unknown>>,
  spec: Record<string, unknown>
): AgentTrigger {
  // Check for webhook tools
  if (tools.some((t) => t.type === 'http' || t.type === 'webhook')) {
    return 'webhook';
  }

  // Check for schedule in messaging
  const messaging = (spec.messaging || {}) as Record<string, unknown>;
  if (messaging.subscribes) {
    const subscribes = messaging.subscribes as Array<Record<string, unknown>>;
    if (subscribes.some((s) => s.channel?.toString().includes('schedule'))) {
      return 'schedule';
    }
  }

  // Default to manual
  return 'manual';
}

function inferDataFlow(
  architecture: Record<string, unknown>,
  spec: Record<string, unknown>
): AgentDataFlow {
  // Check for streaming capability
  const capabilities = architecture.capabilities as string[] | undefined;
  if (capabilities?.includes('streaming')) {
    return 'streaming';
  }

  // Check for workflow (suggests stateful)
  const workflow = spec.workflow as Record<string, unknown> | undefined;
  if (
    workflow?.steps &&
    Array.isArray(workflow.steps) &&
    workflow.steps.length > 1
  ) {
    return 'stateful';
  }

  // Default to stateless
  return 'stateless';
}

function inferCollaboration(
  architecture: Record<string, unknown>,
  spec: Record<string, unknown>
): AgentCollaboration {
  const pattern = architecture.pattern as string | undefined;

  if (pattern === 'swarm') return 'swarm';
  if (pattern === 'hierarchical') return 'hierarchical';

  // Check for dependencies
  const dependencies = (spec.dependencies || {}) as Record<string, unknown>;
  const agents = dependencies.agents as
    | Array<Record<string, unknown>>
    | undefined;
  if (agents && agents.length > 0) {
    return 'mesh';
  }

  return 'solo';
}

function inferAutonomy(spec: Record<string, unknown>): AgentAutonomy {
  const autonomy = (spec.autonomy || {}) as Record<string, unknown>;

  if (autonomy.approval_required === true) {
    return 'supervised';
  }

  const policies = (spec.policies || []) as Array<Record<string, unknown>>;
  if (policies.length > 0) {
    return 'policy-driven';
  }

  const level = autonomy.level as string | undefined;
  if (level === 'full') return 'autonomous';
  if (level === 'partial') return 'semi-autonomous';

  return 'semi-autonomous';
}

function extractCapabilities(
  tools: Array<Record<string, unknown>>,
  spec: Record<string, unknown>
): string[] {
  const caps = new Set<string>();

  // Add tool types
  for (const tool of tools) {
    if (tool.type) {
      caps.add(tool.type.toString());
    }
  }

  // Add architecture capabilities
  const specCaps = (spec.capabilities || []) as Array<
    string | Record<string, unknown>
  >;
  for (const cap of specCaps) {
    if (typeof cap === 'string') {
      caps.add(cap);
    } else if (cap.id) {
      caps.add(cap.id.toString());
    }
  }

  return Array.from(caps);
}

function extractResources(spec: Record<string, unknown>): ResourceRequirements {
  const constraints = (spec.constraints || {}) as Record<string, unknown>;
  const resourcesSpec = (constraints.resources || {}) as Record<
    string,
    unknown
  >;

  return {
    cpu: parseFloat(resourcesSpec.cpu?.toString() || '0') || undefined,
    memory: parseFloat(resourcesSpec.memory?.toString() || '0') || undefined,
    gpu: resourcesSpec.gpu === 'true' || resourcesSpec.gpu === true,
    disk: parseFloat(resourcesSpec.disk?.toString() || '0') || undefined,
  };
}
