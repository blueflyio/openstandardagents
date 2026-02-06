import { z } from 'zod';

/**
 * Request schema for agent execution
 */
export const ExecuteAgentRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  input: z.record(z.unknown()).optional().default({}),
  context: z.record(z.unknown()).optional().default({}),
  timeout: z.number().int().positive().max(300000).optional().default(300000), // 5 min max
});

export type ExecuteAgentRequest = z.infer<typeof ExecuteAgentRequestSchema>;

/**
 * Response schema for agent execution
 */
export interface ExecuteAgentResponse {
  success: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    agentId: string;
    executionTime: number;
    traceId?: string;
    timestamp: string;
  };
}

/**
 * Agent metadata schema
 */
export interface AgentMetadata {
  agentId: string;
  name: string;
  description?: string;
  version: string;
  capabilities?: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    agentRuntime: 'ok' | 'error';
    tracing: 'ok' | 'error';
  };
}

/**
 * Error codes for bridge server
 */
export enum BridgeErrorCode {
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  AGENT_EXECUTION_FAILED = 'AGENT_EXECUTION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Custom error class for bridge operations
 */
export class BridgeError extends Error {
  constructor(
    public code: BridgeErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BridgeError';
  }
}
