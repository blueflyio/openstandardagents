/**
 * OpenAI Runtime Adapter
 * Runs OSSA agents using OpenAI's function calling API
 */

import * as crypto from 'crypto';
import { createOpenAI } from '@ai-sdk/openai';
import { ToolLoopAgent, stepCountIs, type ModelMessage } from 'ai';
import { z } from 'zod';

export interface OssaManifest {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    version?: string;
    description?: string;
  };
  spec: {
    role: string;
    llm?: {
      provider: string;
      model: string;
      temperature?: number;
      maxTokens?: number;
    };
    tools?: Array<{
      type: string;
      name?: string;
      capabilities?: string[];
      config?: Record<string, unknown>;
    }>;
  };
  economics?: {
    execution_profile?: string;
    token_class?: string;
    compression_policy?: string;
    token_sovereignty?: {
      tokenization_boundary?: 'local' | 'provider' | 'hybrid';
      context_retention?: string;
      sovereign_embeddings?: boolean;
    };
  };
  security?: {
    tier?: string;
  };
  extensions?: {
    statemesh?: {
      emits?: Array<{ schema: string; ttl?: string; projections_supported?: string[] }>;
      consumes?: Array<{ schema: string; required_attestation?: boolean }>;
      authority?: { can_challenge?: string[]; can_merge?: boolean };
    };
    openai_agents?: {
      model?: string;
      instructions?: string;
      tools_mapping?: Array<{
        ossa_capability: string;
        openai_tool_name?: string;
        description?: string;
        parameters?: Record<string, unknown>;
      }>;
    };
  };
}

export interface RunOptions {
  verbose?: boolean;
  maxTurns?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler?: (args: any) => Promise<string>;
}

export class OpenAIAdapter {
  private manifest: OssaManifest;
  private tools: Map<string, ToolDefinition> = new Map();
  private messages: ModelMessage[] = [];
  private apiKey?: string;

  constructor(manifest: OssaManifest, apiKey?: string) {
    this.manifest = manifest;
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  /**
   * Get the model to use from manifest
   */
  private getModelName(): string {
    if (this.manifest.extensions?.openai_agents?.model) {
      return this.manifest.extensions.openai_agents.model;
    }
    if (this.manifest.spec.llm?.model) {
      return this.manifest.spec.llm.model;
    }
    return 'gpt-4o-mini';
  }

  /**
   * Get system prompt from manifest
   */
  private getSystemPrompt(): string {
    if (this.manifest.extensions?.openai_agents?.instructions) {
      return this.manifest.extensions.openai_agents.instructions;
    }
    return this.manifest.spec.role;
  }

  /**
   * Register a tool handler
   */
  registerToolHandler(
    name: string,
    handler: (args: any) => Promise<string>
  ): void {
    // Basic tool mapping from manifest
    const toolsMapping = this.manifest.extensions?.openai_agents?.tools_mapping;
    if (toolsMapping) {
      for (const mapping of toolsMapping) {
        const tName = mapping.openai_tool_name || mapping.ossa_capability;
        if (tName === name) {
          this.tools.set(name, {
            name,
            description: mapping.description || `Execute ${mapping.ossa_capability}`,
            parameters: (mapping.parameters as any) || { type: 'object', properties: {} },
            handler,
          });
          return;
        }
      }
    }

    // Fallback for spec.tools
    if (this.manifest.spec.tools) {
      for (const tool of this.manifest.spec.tools) {
        if (tool.name === name) {
          this.tools.set(name, {
            name,
            description: `Execute ${tool.name} (${tool.type})`,
            parameters: { type: 'object', properties: {} },
            handler,
          });
          return;
        }
      }
    }
  }

  /**
   * Initialize the conversation
   */
  initialize(): void {
    this.messages = [];
  }

  /**
   * Send a message and get a response using AI SDK ToolLoopAgent.
   * Publishes StateClaims and ReplayPackets to ContractPlane.
   */
  async chat(userMessage: string, options?: RunOptions): Promise<string> {
    const contractPlaneUrl = process.env.CONTRACTPLANE_URL || 'https://contractplane.blueflyagents.com';
    const startTime = new Date().toISOString();
    
    // 1. Resolve Context Packs (Economy Layer)
    const contextPacks = await this.resolveContextPacks(contractPlaneUrl);
    const enrichedSystemPrompt = this.getSystemPrompt() + "\n\nContext Packs:\n" + JSON.stringify(contextPacks);

    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    // Convert internal tools to AI SDK tools
    const sdkTools: Record<string, any> = {};
    for (const [name, def] of this.tools) {
      sdkTools[name] = {
        description: def.description,
        parameters: z.any(),
        execute: async (args: any) => {
          if (options?.verbose) {
            console.log(`  → ${name}(${JSON.stringify(args)})`);
          }
          const result = await def.handler!(args);
          
          // Publish tool execution as a StateClaim (Evidence)
          await this.publishStateClaim(contractPlaneUrl, {
            subject: `task:${this.manifest.metadata.name}`,
            claim_type: 'evidence.tool_execution',
            payload: {
              tool: name,
              args,
              result_summary: result.substring(0, 500)
            }
          });

          if (options?.verbose) {
            console.log(`  ← ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
          }
          return result;
        },
      };
    }

    // 2. Execute with Economics (ExecutionProfile) via ToolLoopAgent
    const openaiProvider = createOpenAI({
      apiKey: this.apiKey,
    });

    const agent = new ToolLoopAgent({
      model: openaiProvider(this.getModelName()),
      instructions: enrichedSystemPrompt,
      tools: sdkTools,
      stopWhen: stepCountIs(options?.maxTurns || 10),
    });

    const result = await agent.generate({
      prompt: userMessage,
    });

    // Sync result back to history
    this.messages.push({
      role: 'assistant',
      content: result.text,
    });

    // 3. Publish final intent/judgment as a StateClaim
    await this.publishStateClaim(contractPlaneUrl, {
      subject: `conversation:${this.manifest.metadata.name}`,
      claim_type: 'intent.response',
      payload: {
        text: result.text,
        usage: result.usage,
      }
    });

    // 4. Generate and Publish Replay Packet (Reproducibility & Escrow)
    const reasoningTrace = JSON.stringify(this.messages);
    const reasoningHash = crypto.createHash('sha256').update(reasoningTrace).digest('hex');

    await this.publishReplayPacket(contractPlaneUrl, {
      metadata: {
        id: `replay:${Math.random().toString(36).substring(7)}`,
        timestamp: startTime,
        agent_id: this.manifest.metadata.name
      },
      spec: {
        execution_profile: this.manifest.economics?.execution_profile || 'default-balanced',
        model_class: this.manifest.economics?.token_class || 'balanced-work',
        inputs: {
          prompts: [enrichedSystemPrompt, userMessage],
          context_packs: this.manifest.spec.tools?.filter(t => t.type === 'context_pack').map(t => t.name!) || []
        },
        accounting: {
          compute_tokens: result.usage.totalTokens,
          context_tokens: 0 // Calculated by mesh
        },
        escrow: {
          mode: 'structured-only',
          reasoning_hash: reasoningHash,
          policy_gate: 'audit_only'
        },
        output: {
          text: result.text,
          confidence: 1.0 // Simple heuristic for now
        }
      }
    });

    return result.text;
  }

  /**
   * Resolves context packs via the State Plane.
   */
  private async resolveContextPacks(baseUrl: string): Promise<any[]> {
    const packs: any[] = [];
    const contextPackRefs = this.manifest.spec.tools?.filter(t => t.type === 'context_pack') || [];
    
    for (const ref of contextPackRefs) {
      try {
        const response = await fetch(`${baseUrl}/api/v1/statemesh/context/${ref.name}`);
        if (response.ok) {
          packs.push(await response.json());
        }
      } catch (e) {
        console.error(`Failed to resolve context pack: ${ref.name}`);
      }
    }
    return packs;
  }

  /**
   * Publish a Replay Packet to ContractPlane.
   */
  private async publishReplayPacket(baseUrl: string, packet: any): Promise<void> {
    try {
      await fetch(`${baseUrl}/api/v1/statemesh/replays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet)
      });
    } catch (e) {
      console.error('Failed to record Replay Packet');
    }
  }

  /**
   * Publish a claim to the ContractPlane State Plane API
   */
  private async publishStateClaim(baseUrl: string, claim: { subject: string, claim_type: string, payload: any }): Promise<void> {
    try {
      await fetch(`${baseUrl}/api/v1/statemesh/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...claim,
          producer_id: `agent://${this.manifest.metadata.name}`,
          confidence: 100,
          trust_tier: this.manifest.security?.tier || 'unverified'
        })
      });
    } catch (error) {
      console.error(`Failed to publish StateClaim: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get agent info
   */
  getAgentInfo(): { name: string; model: string; tools: string[] } {
    return {
      name: this.manifest.metadata.name,
      model: this.getModelName(),
      tools: Array.from(this.tools.keys()),
    };
  }
}
