/**
 * Claude Adapter Types
 * Type definitions for Claude/Anthropic runtime adapter
 */

import type { OssaAgent } from '../../../types/index.js';

/**
 * Claude-specific tool definition
 */
export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool handler function type
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

/**
 * Tool definition with optional handler
 */
export interface ToolDefinition extends ClaudeTool {
  handler?: ToolHandler;
}

/**
 * Claude message content types
 */
export type ClaudeMessageContent =
  | string
  | Array<{
      type: 'text' | 'tool_use' | 'tool_result';
      text?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
      tool_use_id?: string;
      content?: string;
    }>;

/**
 * Claude message format
 */
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: ClaudeMessageContent;
}

/**
 * Claude API response
 */
export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Runtime options for Claude adapter
 */
export interface ClaudeRunOptions {
  verbose?: boolean;
  maxTurns?: number;
  streaming?: boolean;
}

/**
 * Claude adapter configuration
 */
export interface ClaudeAdapterConfig {
  apiKey?: string;
  manifest: OssaAgent;
}

/**
 * Agent information returned by adapter
 */
export interface AgentInfo {
  name: string;
  model: string;
  tools: string[];
  provider: 'anthropic';
}

/**
 * Anthropic extension from OSSA manifest
 */
export interface AnthropicExtension {
  enabled?: boolean;
  model?: string;
  system?: string;
  max_tokens?: number;
  temperature?: number;
  tools?: ClaudeTool[];
  streaming?: boolean;
  stop_sequences?: string[];
}

/**
 * Extended OSSA manifest with Anthropic extension
 */
export interface OssaManifestWithAnthropic extends OssaAgent {
  extensions?: {
    anthropic?: AnthropicExtension;
    [key: string]: unknown;
  };
}
