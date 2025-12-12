/**
 * Manifest Parser for Claude Adapter
 * Parses OSSA manifest files and extracts Claude/Anthropic-specific configuration
 */

import type {
  OssaManifestWithAnthropic,
  AnthropicExtension,
} from './types.js';

/**
 * Parse and validate OSSA manifest for Claude adapter
 */
export class ManifestParser {
  private manifest: OssaManifestWithAnthropic;

  constructor(manifest: OssaManifestWithAnthropic) {
    this.manifest = manifest;
  }

  /**
   * Get the Claude model to use
   * Priority: extensions.anthropic.model > spec.llm.model > default
   */
  getModel(): string {
    // Check Anthropic extension first
    if (this.manifest.extensions?.anthropic?.model) {
      return this.manifest.extensions.anthropic.model;
    }

    // Fall back to LLM config
    if (this.manifest.spec?.llm?.model) {
      return this.manifest.spec.llm.model;
    }

    // Default to latest Claude Sonnet
    return 'claude-3-5-sonnet-20241022';
  }

  /**
   * Get system prompt for Claude
   * Priority: extensions.anthropic.system > spec.role > default
   */
  getSystemPrompt(): string {
    // Check Anthropic extension first
    if (this.manifest.extensions?.anthropic?.system) {
      return this.manifest.extensions.anthropic.system;
    }

    // Fall back to role
    if (this.manifest.spec?.role) {
      return this.manifest.spec.role;
    }

    // Default system prompt
    return 'You are a helpful AI assistant.';
  }

  /**
   * Get max tokens configuration
   * Priority: extensions.anthropic.max_tokens > spec.llm.maxTokens > default
   */
  getMaxTokens(): number {
    // Check Anthropic extension first
    if (this.manifest.extensions?.anthropic?.max_tokens) {
      return this.manifest.extensions.anthropic.max_tokens;
    }

    // Fall back to LLM config
    if (this.manifest.spec?.llm?.maxTokens) {
      return this.manifest.spec.llm.maxTokens;
    }

    // Default
    return 4096;
  }

  /**
   * Get temperature configuration
   * Priority: extensions.anthropic.temperature > spec.llm.temperature > default
   */
  getTemperature(): number {
    // Check Anthropic extension first
    if (
      this.manifest.extensions?.anthropic?.temperature !== undefined
    ) {
      return this.manifest.extensions.anthropic.temperature;
    }

    // Fall back to LLM config
    if (this.manifest.spec?.llm?.temperature !== undefined) {
      return this.manifest.spec.llm.temperature;
    }

    // Default
    return 1.0;
  }

  /**
   * Get streaming configuration
   */
  getStreaming(): boolean {
    return this.manifest.extensions?.anthropic?.streaming ?? false;
  }

  /**
   * Get stop sequences
   */
  getStopSequences(): string[] | undefined {
    return this.manifest.extensions?.anthropic?.stop_sequences;
  }

  /**
   * Get Anthropic extension configuration
   */
  getAnthropicExtension(): AnthropicExtension | undefined {
    return this.manifest.extensions?.anthropic;
  }

  /**
   * Get agent metadata
   */
  getMetadata(): {
    name: string;
    version?: string;
    description?: string;
  } {
    // v0.2.x format
    if (this.manifest.metadata) {
      return {
        name: this.manifest.metadata.name,
        version: this.manifest.metadata.version,
        description: this.manifest.metadata.description,
      };
    }

    // Legacy format fallback
    if (this.manifest.agent) {
      return {
        name: this.manifest.agent.name,
        version: this.manifest.agent.version,
        description: this.manifest.agent.description,
      };
    }

    // Default
    return {
      name: 'unknown-agent',
      version: '1.0.0',
    };
  }

  /**
   * Get OSSA spec tools (for mapping to Claude tools)
   */
  getSpecTools(): Array<{
    type: string;
    name?: string;
    capabilities?: string[];
    config?: Record<string, unknown>;
  }> {
    return this.manifest.spec?.tools ?? [];
  }

  /**
   * Check if Claude/Anthropic integration is enabled
   */
  isAnthropicEnabled(): boolean {
    return this.manifest.extensions?.anthropic?.enabled ?? true;
  }

  /**
   * Validate manifest has required fields
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for metadata
    if (!this.manifest.metadata && !this.manifest.agent) {
      errors.push('Manifest must have metadata or agent field');
    }

    // Check for spec or agent
    if (!this.manifest.spec && !this.manifest.agent) {
      errors.push('Manifest must have spec or agent field');
    }

    // Check API version format
    if (this.manifest.apiVersion) {
      const validVersionPattern = /^ossa\/v(0\.[1-3]\.\d+|0\.2\.\d+-RC)/;
      if (!validVersionPattern.test(this.manifest.apiVersion)) {
        errors.push(
          `Invalid apiVersion: ${this.manifest.apiVersion}. Must match pattern ossa/v0.x.x`
        );
      }
    }

    // Check kind
    if (this.manifest.kind && this.manifest.kind !== 'Agent') {
      errors.push(`Invalid kind: ${this.manifest.kind}. Must be "Agent"`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get full manifest
   */
  getManifest(): OssaManifestWithAnthropic {
    return this.manifest;
  }
}
