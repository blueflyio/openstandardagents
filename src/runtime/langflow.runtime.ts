/**
 * Langflow Runtime Bridge
 * 
 * Executes OSSA agents via Langflow API.
 * SOLID: Single Responsibility - Langflow execution only
 * DRY: Reuses LangflowAdapter for format conversion
 */

import { z } from 'zod';
import axios from 'axios';
import type { OssaAgent } from '../types/index.js';
import { LangflowAdapter } from '../adapters/langflow-adapter.js';

const LangflowRunRequestSchema = z.object({
  input_value: z.string(),
  input_type: z.enum(['chat', 'text', 'any']).default('chat'),
  output_type: z.enum(['chat', 'text', 'any']).default('chat'),
  tweaks: z.record(z.unknown()).optional(),
  stream: z.boolean().default(false),
  session_id: z.string().uuid().optional(),
});

const LangflowRunResponseSchema = z.object({
  outputs: z.array(z.object({
    outputs: z.array(z.object({
      results: z.record(z.unknown()),
      artifacts: z.record(z.unknown()).optional(),
    })),
  })),
  session_id: z.string().uuid().optional(),
});

export type LangflowRunRequest = z.infer<typeof LangflowRunRequestSchema>;
export type LangflowRunResponse = z.infer<typeof LangflowRunResponseSchema>;

export interface LangflowRuntimeConfig {
  base_url: string;
  api_key?: string;
  flow_id: string;
  timeout_seconds?: number;
}

export class LangflowRuntime {
  private config: LangflowRuntimeConfig;
  private adapter: LangflowAdapter;

  constructor(config: LangflowRuntimeConfig) {
    this.config = config;
    this.adapter = new LangflowAdapter();
  }

  /**
   * Execute OSSA agent via Langflow API
   * CRUD: Create operation (executes agent)
   */
  async execute(manifest: OssaAgent, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Get flow_id from manifest extensions
    const flowId = this.getFlowId(manifest);
    if (!flowId) {
      throw new Error('Langflow flow_id not found in manifest extensions');
    }

    // Convert OSSA inputs to Langflow format
    const langflowInputs = this.mapOSSAInputsToLangflow(inputs, manifest);

    // Prepare request
    const request = LangflowRunRequestSchema.parse({
      input_value: langflowInputs.input_value || JSON.stringify(inputs),
      input_type: langflowInputs.input_type || 'chat',
      output_type: 'chat',
      tweaks: langflowInputs.tweaks,
      stream: false,
      session_id: langflowInputs.session_id,
    });

    // Call Langflow API
    const response = await axios.post(
      `${this.config.base_url}/api/v1/run/${flowId}`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.api_key ? { 'Authorization': `Bearer ${this.config.api_key}` } : {}),
        },
        timeout: (this.config.timeout_seconds || 120) * 1000,
      }
    );

    // Validate response
    const validated = LangflowRunResponseSchema.parse(response.data);

    // Convert Langflow outputs to OSSA format
    return this.mapLangflowOutputsToOSSA(validated, manifest);
  }

  /**
   * Get flow_id from manifest extensions
   */
  private getFlowId(manifest: OssaAgent): string | null {
    const extensions = (manifest as any).extensions;
    if (!extensions?.langflow?.flow_id) {
      return null;
    }
    return extensions.langflow.flow_id;
  }

  /**
   * Map OSSA inputs to Langflow format
   */
  private mapOSSAInputsToLangflow(
    inputs: Record<string, unknown>,
    manifest: OssaAgent
  ): Partial<LangflowRunRequest> {
    const extensions = (manifest as any).extensions?.langflow;
    const inputMapping = extensions?.input_mapping;

    // If input mapping is defined, use it
    if (inputMapping?.field_mappings) {
      const mapped: Record<string, unknown> = {};
      for (const [ossaField, mapping] of Object.entries(inputMapping.field_mappings)) {
        if (inputs[ossaField] !== undefined) {
          // Map to Langflow component parameter
          const componentId = (mapping as any).component;
          const parameter = (mapping as any).parameter;
          if (!mapped[componentId]) {
            mapped[componentId] = {};
          }
          (mapped[componentId] as Record<string, unknown>)[parameter] = inputs[ossaField];
        }
      }
      return {
        input_value: JSON.stringify(mapped),
        tweaks: mapped,
      };
    }

    // Default: use first input value as input_value
    const firstValue = Object.values(inputs)[0];
    return {
      input_value: typeof firstValue === 'string' ? firstValue : JSON.stringify(inputs),
    };
  }

  /**
   * Map Langflow outputs to OSSA format
   */
  private mapLangflowOutputsToOSSA(
    response: LangflowRunResponse,
    manifest: OssaAgent
  ): Record<string, unknown> {
    const extensions = (manifest as any).extensions?.langflow;
    const outputMapping = extensions?.output_mapping;

    // Extract outputs from Langflow response
    const outputs = response.outputs[0]?.outputs[0]?.results || {};

    // If output mapping is defined, use it
    if (outputMapping?.field_mappings) {
      const mapped: Record<string, unknown> = {};
      for (const [ossaField, mapping] of Object.entries(outputMapping.field_mappings)) {
        const componentId = (mapping as any).component;
        const outputField = (mapping as any).output_field || 'message';
        if (outputs[componentId]?.[outputField] !== undefined) {
          mapped[ossaField] = outputs[componentId][outputField];
        }
      }
      return mapped;
    }

    // Default: return all outputs
    return outputs;
  }
}
