/**
 * OSSA v0.3.0 Messaging Extension Types
 * Type definitions for agent-to-agent messaging
 */

/**
 * Messaging extension configuration
 */
export interface MessagingExtension {
  publishes?: PublishedChannel[];
  subscribes?: Subscription[];
  commands?: Command[];
  reliability?: ReliabilityConfig;
}

/**
 * Channel that an agent publishes messages to
 */
export interface PublishedChannel {
  channel: string;
  description?: string;
  schema: Record<string, unknown>;
  examples?: Record<string, unknown>[];
  contentType?: string;
  tags?: string[];
}

/**
 * Channel subscription configuration
 */
export interface Subscription {
  channel: string;
  description?: string;
  schema?: Record<string, unknown>;
  handler?: string;
  filter?: {
    expression?: string;
    fields?: Record<string, unknown>;
  };
  priority?: 'low' | 'normal' | 'high' | 'critical';
  maxConcurrency?: number;
}

/**
 * RPC-style command that an agent accepts
 */
export interface Command {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  timeoutSeconds?: number;
  idempotent?: boolean;
  async?: boolean;
}

/**
 * Message delivery reliability configuration
 */
export interface ReliabilityConfig {
  deliveryGuarantee?: 'at-least-once' | 'at-most-once' | 'exactly-once';
  retry?: {
    maxAttempts?: number;
    backoff?: {
      strategy?: 'exponential' | 'linear' | 'constant';
      initialDelayMs?: number;
      maxDelayMs?: number;
      multiplier?: number;
    };
  };
  dlq?: {
    enabled?: boolean;
    channel?: string;
    retentionDays?: number;
  };
  ordering?: {
    guarantee?: 'per-source' | 'global';
    timeoutSeconds?: number;
  };
  acknowledgment?: {
    mode?: 'manual' | 'automatic';
    timeoutSeconds?: number;
  };
}

/**
 * Message envelope format
 */
export interface MessageEnvelope {
  id: string;
  timestamp: string;
  source: string;
  channel: string;
  payload: Record<string, unknown>;
  metadata?: {
    correlationId?: string;
    traceId?: string;
    spanId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttlSeconds?: number;
    retryCount?: number;
    contentType?: string;
    headers?: Record<string, string>;
  };
}

/**
 * Message routing rule
 */
export interface RoutingRule {
  id?: string;
  source: string;
  channel: string;
  targets: string[];
  filter?: {
    expression?: string;
    fields?: Record<string, unknown>;
  };
  transform?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  enabled?: boolean;
}
