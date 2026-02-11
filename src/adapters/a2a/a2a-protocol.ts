/**
 * A2A (Agent-to-Agent) Communication Protocol
 *
 * Extends MCP (Model Context Protocol) with advanced multi-agent capabilities
 * Based on OSSA v0.4.4 spec and MCP specification
 *
 * References:
 * - MCP Spec: https://spec.modelcontextprotocol.io/
 * - OSSA A2A Protocol: v0.3.0
 *
 * @module adapters/a2a/a2a-protocol
 */

import { z } from 'zod';

/**
 * Agent Identity
 * Represents a unique agent in the mesh
 */
export interface AgentIdentity {
  /** Unique agent ID (UUID) */
  id: string;
  /** Agent namespace (e.g., 'production', 'staging') */
  namespace: string;
  /** Agent name */
  name: string;
  /** Agent URI format: agent://{namespace}/{name} */
  uri: string;
  /** Agent capabilities */
  capabilities: string[];
  /** Agent version */
  version: string;
}

/**
 * Message Priority Levels
 */
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Message Types
 */
export enum A2AMessageType {
  /** Request-reply pattern */
  REQUEST = 'request',
  /** Response to a request */
  RESPONSE = 'response',
  /** Broadcast to multiple agents */
  BROADCAST = 'broadcast',
  /** Coordination message for swarm intelligence */
  COORDINATION = 'coordination',
  /** Task delegation */
  DELEGATION = 'delegation',
  /** Event notification */
  EVENT = 'event',
  /** Command (RPC) */
  COMMAND = 'command',
}

/**
 * W3C Trace Context for distributed tracing
 * @see https://www.w3.org/TR/trace-context/
 */
export interface TraceContext {
  /** W3C traceparent header (version-trace_id-parent_id-trace_flags) */
  traceparent: string;
  /** W3C tracestate header (vendor-specific trace data) */
  tracestate?: string;
  /** Trace ID (32 hex chars) */
  traceId: string;
  /** Span ID (16 hex chars) */
  spanId: string;
  /** Parent span ID */
  parentSpanId?: string;
}

/**
 * Message Metadata
 */
export interface MessageMetadata {
  /** Priority level */
  priority: MessagePriority;
  /** Message timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  retries: number;
  /** W3C trace context */
  traceContext: TraceContext;
  /** Correlation ID for grouping related messages */
  correlationId?: string;
  /** Content type */
  contentType?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Retry count (incremented on each retry) */
  retryCount?: number;
  /** Created timestamp (ISO 8601) */
  createdAt: string;
  /** Expires at timestamp (ISO 8601) */
  expiresAt?: string;
}

/**
 * A2A Message Envelope
 * Core message structure for agent-to-agent communication
 */
export interface A2AMessage<TPayload = unknown> {
  /** Unique message ID (UUID) */
  id: string;
  /** Sender agent identity */
  from: AgentIdentity;
  /** Recipient agent(s) - single agent or array for multicast */
  to: AgentIdentity | AgentIdentity[];
  /** Message type */
  type: A2AMessageType;
  /** Application-specific payload */
  payload: TPayload;
  /** Message metadata */
  metadata: MessageMetadata;
  /** Protocol version */
  version: string;
}

/**
 * Consensus Algorithm Types
 */
export enum ConsensusAlgorithm {
  /** Simple majority voting */
  MAJORITY = 'majority',
  /** Unanimous agreement required */
  UNANIMOUS = 'unanimous',
  /** Weighted voting based on agent capabilities */
  WEIGHTED = 'weighted',
  /** Raft consensus (leader election) */
  RAFT = 'raft',
  /** Paxos consensus */
  PAXOS = 'paxos',
}

/**
 * Coordination Pattern Types
 */
export enum CoordinationPatternType {
  /** One-to-many broadcast */
  BROADCAST = 'broadcast',
  /** Request-reply pattern */
  REQUEST_REPLY = 'request-reply',
  /** Publish-subscribe pattern */
  PUB_SUB = 'pub-sub',
  /** Pipeline pattern (sequential processing) */
  PIPELINE = 'pipeline',
  /** Swarm pattern (distributed coordination) */
  SWARM = 'swarm',
  /** Hierarchical pattern (tree-based) */
  HIERARCHICAL = 'hierarchical',
  /** Mesh pattern (peer-to-peer) */
  MESH = 'mesh',
}

/**
 * Coordination Pattern Configuration
 */
export interface CoordinationPattern {
  /** Pattern type */
  pattern: CoordinationPatternType;
  /** Participating agents */
  participants: AgentIdentity[];
  /** Coordinator agent (for hierarchical patterns) */
  coordinator?: AgentIdentity;
  /** Consensus algorithm (for swarm patterns) */
  consensus?: ConsensusAlgorithm;
  /** Timeout for coordination (milliseconds) */
  timeout?: number;
  /** Minimum required participants */
  minParticipants?: number;
}

/**
 * Agent Connection (Edge in mesh graph)
 */
export interface AgentConnection {
  /** Source agent */
  from: AgentIdentity;
  /** Target agent */
  to: AgentIdentity;
  /** Connection weight (for routing) */
  weight: number;
  /** Connection latency (milliseconds) */
  latency: number;
  /** Connection status */
  status: 'active' | 'degraded' | 'inactive';
  /** Connection metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Agent Node (Vertex in mesh graph)
 */
export interface AgentNode {
  /** Agent identity */
  identity: AgentIdentity;
  /** Agent status */
  status: 'healthy' | 'degraded' | 'unavailable';
  /** Current load (0-1) */
  load: number;
  /** Available capacity (0-1) */
  capacity: number;
  /** Endpoint URL */
  endpoint: string;
  /** Health check URL */
  healthCheck: string;
  /** Last heartbeat timestamp */
  lastHeartbeat: string;
  /** Node metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Routing Algorithm Types
 */
export enum RoutingAlgorithm {
  /** Round-robin routing */
  ROUND_ROBIN = 'round-robin',
  /** Least connections routing */
  LEAST_CONNECTIONS = 'least-connections',
  /** Weighted round-robin */
  WEIGHTED_ROUND_ROBIN = 'weighted-round-robin',
  /** Shortest path (Dijkstra) */
  SHORTEST_PATH = 'shortest-path',
  /** Random routing */
  RANDOM = 'random',
  /** Consistent hashing */
  CONSISTENT_HASH = 'consistent-hash',
}

/**
 * Service Discovery Types
 */
export enum ServiceDiscovery {
  /** DNS-based service discovery */
  DNS = 'dns',
  /** Consul service discovery */
  CONSUL = 'consul',
  /** Kubernetes service discovery */
  KUBERNETES = 'kubernetes',
  /** Static configuration */
  STATIC = 'static',
  /** Gossip protocol (SWIM) */
  GOSSIP = 'gossip',
}

/**
 * Mesh Topology Configuration
 * Represents the agent mesh network structure
 */
export interface MeshTopology {
  /** Agent nodes in the mesh */
  nodes: AgentNode[];
  /** Connections between agents */
  edges: AgentConnection[];
  /** Routing algorithm */
  routing: RoutingAlgorithm;
  /** Service discovery mechanism */
  discovery: ServiceDiscovery;
  /** Mesh metadata */
  metadata?: {
    /** Mesh name */
    name?: string;
    /** Mesh namespace */
    namespace?: string;
    /** Mesh version */
    version?: string;
  };
}

/**
 * A2A Error Types
 */
export enum A2AErrorType {
  /** Agent not found in mesh */
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  /** Agent unreachable (network error) */
  AGENT_UNREACHABLE = 'AGENT_UNREACHABLE',
  /** Message timeout */
  MESSAGE_TIMEOUT = 'MESSAGE_TIMEOUT',
  /** Invalid message format */
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  /** Authentication failed */
  AUTH_FAILED = 'AUTH_FAILED',
  /** Insufficient permissions */
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  /** Rate limited */
  RATE_LIMITED = 'RATE_LIMITED',
  /** Circuit breaker open */
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * A2A Error
 */
export class A2AError extends Error {
  constructor(
    public type: A2AErrorType,
    public message: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'A2AError';
  }
}

/**
 * Zod Schemas for validation
 */

export const AgentIdentitySchema = z.object({
  id: z.string().uuid(),
  namespace: z.string().min(1),
  name: z.string().min(1),
  uri: z.string().regex(/^agent:\/\/[\w-]+\/[\w-]+$/),
  capabilities: z.array(z.string()),
  version: z.string(),
});

export const TraceContextSchema = z.object({
  traceparent: z.string().regex(/^\d{2}-[a-f0-9]{32}-[a-f0-9]{16}-\d{2}$/),
  tracestate: z.string().optional(),
  traceId: z.string().length(32),
  spanId: z.string().length(16),
  parentSpanId: z.string().length(16).optional(),
});

export const MessageMetadataSchema = z.object({
  priority: z.nativeEnum(MessagePriority),
  timeout: z.number().positive(),
  retries: z.number().min(0).max(10),
  traceContext: TraceContextSchema,
  correlationId: z.string().uuid().optional(),
  contentType: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retryCount: z.number().min(0).optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

export const A2AMessageSchema = z.object({
  id: z.string().uuid(),
  from: AgentIdentitySchema,
  to: z.union([AgentIdentitySchema, z.array(AgentIdentitySchema)]),
  type: z.nativeEnum(A2AMessageType),
  payload: z.unknown(),
  metadata: MessageMetadataSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

/**
 * Validate A2A message
 */
export function validateA2AMessage(message: unknown): A2AMessage {
  return A2AMessageSchema.parse(message) as A2AMessage;
}

/**
 * Create A2A message
 */
export function createA2AMessage<TPayload>(
  from: AgentIdentity,
  to: AgentIdentity | AgentIdentity[],
  type: A2AMessageType,
  payload: TPayload,
  options?: Partial<MessageMetadata>
): A2AMessage<TPayload> {
  const now = new Date().toISOString();
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  return {
    id: crypto.randomUUID(),
    from,
    to,
    type,
    payload,
    version: '0.4.4',
    metadata: {
      priority: MessagePriority.NORMAL,
      timeout: 30000, // 30 seconds default
      retries: 3,
      traceContext: {
        traceparent: `00-${traceId}-${spanId}-01`,
        traceId,
        spanId,
      },
      createdAt: now,
      ...options,
    },
  };
}

/**
 * Generate W3C trace ID (32 hex chars)
 */
function generateTraceId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate W3C span ID (16 hex chars)
 */
function generateSpanId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Check if message is expired
 */
export function isMessageExpired(message: A2AMessage): boolean {
  if (!message.metadata.expiresAt) {
    return false;
  }
  return new Date(message.metadata.expiresAt) < new Date();
}

/**
 * Check if message should be retried
 */
export function shouldRetryMessage(message: A2AMessage, error: A2AError): boolean {
  const retryCount = message.metadata.retryCount || 0;
  return error.retryable && retryCount < message.metadata.retries;
}
