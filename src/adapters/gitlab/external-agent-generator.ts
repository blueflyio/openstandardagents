/**
 * GitLab Duo External Agent Generator
 * Generates external agent YAML configurations for GitLab Duo AI Gateway integration
 *
 * External agents run in GitLab CI/CD pipelines and use AI Gateway for model access.
 * This generator creates the YAML configuration needed to register and execute external agents.
 */

import type { OssaAgent } from '../../types/index.js';
import type { ExternalAgentConfig } from './types.js';

export interface ExternalAgentGenerationResult {
  success: boolean;
  yaml?: string;
  config?: ExternalAgentConfig;
  error?: string;
}

export class ExternalAgentGenerator {
  /**
   * Generate external agent configuration from OSSA manifest
   */
  generate(manifest: OssaAgent): ExternalAgentGenerationResult {
    try {
      const config = this.buildConfig(manifest);
      const yaml = this.generateYAML(config, manifest);

      return {
        success: true,
        yaml,
        config,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build external agent configuration
   */
  private buildConfig(manifest: OssaAgent): ExternalAgentConfig {
    const image = this.selectDockerImage(manifest);
    const commands = this.generateCommands(manifest);
    const variables = this.extractVariables(manifest);
    const injectGatewayToken = this.needsAIGateway(manifest);

    return {
      image,
      commands,
      variables,
      injectGatewayToken,
    };
  }

  /**
   * Select appropriate Docker image based on OSSA runtime
   */
  private selectDockerImage(manifest: OssaAgent): string {
    const runtime = manifest.metadata?.agentArchitecture?.runtime as
      | {
          type?: string;
          image?: string;
          [key: string]: unknown;
        }
      | undefined;

    // Use explicit image if provided
    if (runtime?.image) {
      return runtime.image;
    }

    // Detect runtime from spec
    const runtimeType = runtime?.type;

    // Check for Node.js indicators
    if (this.isNodeRuntime(manifest, runtimeType)) {
      return 'node:22-slim';
    }

    // Check for Python indicators
    if (this.isPythonRuntime(manifest, runtimeType)) {
      return 'python:3.12-slim';
    }

    // Check for Go indicators
    if (this.isGoRuntime(manifest, runtimeType)) {
      return 'golang:1.22-alpine';
    }

    // Check for Ruby indicators
    if (this.isRubyRuntime(manifest, runtimeType)) {
      return 'ruby:3.3-slim';
    }

    // Default to Node.js (most common for GitLab agents)
    return 'node:22-slim';
  }

  /**
   * Check if agent uses Node.js runtime
   */
  private isNodeRuntime(
    manifest: OssaAgent,
    runtimeType?: string
  ): boolean {
    if (runtimeType === 'nodejs' || runtimeType === 'node') {
      return true;
    }

    // Check tools for Node.js indicators
    const tools = manifest.spec?.tools || [];
    return tools.some(
      (tool: { type?: string }) =>
        tool.type === 'mcp' || tool.type === 'npm'
    );
  }

  /**
   * Check if agent uses Python runtime
   */
  private isPythonRuntime(
    manifest: OssaAgent,
    runtimeType?: string
  ): boolean {
    if (runtimeType === 'python' || runtimeType === 'py') {
      return true;
    }

    const tools = manifest.spec?.tools || [];
    return tools.some(
      (tool: { type?: string }) => tool.type === 'pip' || tool.type === 'poetry'
    );
  }

  /**
   * Check if agent uses Go runtime
   */
  private isGoRuntime(manifest: OssaAgent, runtimeType?: string): boolean {
    if (runtimeType === 'go' || runtimeType === 'golang') {
      return true;
    }

    return false;
  }

  /**
   * Check if agent uses Ruby runtime
   */
  private isRubyRuntime(
    manifest: OssaAgent,
    runtimeType?: string
  ): boolean {
    if (runtimeType === 'ruby' || runtimeType === 'rb') {
      return true;
    }

    const tools = manifest.spec?.tools || [];
    return tools.some(
      (tool: { type?: string }) => tool.type === 'gem' || tool.type === 'bundler'
    );
  }

  /**
   * Generate commands to execute agent
   */
  private generateCommands(manifest: OssaAgent): string[] {
    const runtime = manifest.metadata?.agentArchitecture?.runtime as
      | {
          type?: string;
          command?: string[];
          image?: string;
          [key: string]: unknown;
        }
      | undefined;

    // Use explicit commands if provided
    if (runtime?.command && runtime.command.length > 0) {
      return runtime.command;
    }

    // Generate commands based on runtime type
    const image = this.selectDockerImage(manifest);

    if (image.startsWith('node:')) {
      return ['npm ci', 'npm run build', 'node dist/index.js'];
    }

    if (image.startsWith('python:')) {
      return [
        'pip install --no-cache-dir -r requirements.txt',
        'python main.py',
      ];
    }

    if (image.startsWith('golang:')) {
      return ['go build -o agent .', './agent'];
    }

    if (image.startsWith('ruby:')) {
      return ['bundle install', 'bundle exec ruby main.rb'];
    }

    // Default Node.js commands
    return ['npm ci', 'npm run build', 'node dist/index.js'];
  }

  /**
   * Extract required environment variables from manifest
   */
  private extractVariables(manifest: OssaAgent): string[] {
    const variables = new Set<string>();

    // Always include GitLab standard variables
    variables.add('GITLAB_TOKEN');
    variables.add('GITLAB_HOST');

    // Add AI Flow variables for GitLab Duo integration
    variables.add('AI_FLOW_CONTEXT');
    variables.add('AI_FLOW_INPUT');
    variables.add('AI_FLOW_EVENT');

    // Extract from spec.workflow if present
    const workflow = manifest.spec?.workflow;
    if (workflow && typeof workflow === 'object') {
      const steps = (workflow as { steps?: unknown[] }).steps || [];
      for (const step of steps) {
        this.extractStepVariables(step, variables);
      }
    }

    // Extract from extensions.gitlab if present
    const extensions = (manifest as { extensions?: { gitlab?: unknown } })
      .extensions;
    if (extensions?.gitlab && typeof extensions.gitlab === 'object') {
      const gitlabExt = extensions.gitlab as { variables?: string[] };
      if (gitlabExt.variables) {
        gitlabExt.variables.forEach((v) => variables.add(v));
      }
    }

    // Extract from spec.tools auth requirements
    const tools = manifest.spec?.tools || [];
    for (const tool of tools) {
      const auth = (tool as { auth?: { credentials?: string } }).auth;
      if (auth?.credentials) {
        variables.add(auth.credentials);
      }
    }

    return Array.from(variables).sort();
  }

  /**
   * Extract variables from workflow step
   */
  private extractStepVariables(
    step: unknown,
    variables: Set<string>
  ): void {
    if (!step || typeof step !== 'object') return;

    const stepObj = step as Record<string, unknown>;

    // Extract from params
    if (stepObj.params && typeof stepObj.params === 'object') {
      const params = stepObj.params as Record<string, unknown>;
      for (const value of Object.values(params)) {
        if (typeof value === 'string') {
          const matches = value.match(/\$\{([A-Z_]+)\}/g);
          if (matches) {
            matches.forEach((match) => {
              const varName = match.slice(2, -1);
              variables.add(varName);
            });
          }
        }
      }
    }

    // Extract from input
    if (typeof stepObj.input === 'string') {
      const matches = stepObj.input.match(/\$\{([A-Z_]+)\}/g);
      if (matches) {
        matches.forEach((match) => {
          const varName = match.slice(2, -1);
          variables.add(varName);
        });
      }
    }

    // Extract from condition
    if (typeof stepObj.condition === 'string') {
      const matches = stepObj.condition.match(/\$\{([A-Z_]+)\}/g);
      if (matches) {
        matches.forEach((match) => {
          const varName = match.slice(2, -1);
          variables.add(varName);
        });
      }
    }
  }

  /**
   * Check if agent needs AI Gateway token injection
   */
  private needsAIGateway(manifest: OssaAgent): boolean {
    // If agent has LLM config, it needs AI Gateway
    return !!manifest.spec?.llm;
  }

  /**
   * Generate external agent YAML
   */
  generateYAML(
    config: ExternalAgentConfig,
    manifest: OssaAgent
  ): string {
    const name = manifest.metadata?.name || 'agent';
    const description =
      manifest.metadata?.description || 'External agent for GitLab Duo';

    const lines: string[] = [];

    // Header comment
    lines.push('# GitLab Duo External Agent Configuration');
    lines.push(`# Agent: ${name}`);
    lines.push(`# Generated from OSSA manifest v${manifest.metadata?.version || '1.0.0'}`);
    lines.push('');
    lines.push('# External agents run in GitLab CI/CD pipelines and use AI Gateway');
    lines.push('# for model access. This YAML defines the agent execution environment.');
    lines.push('');

    // Agent metadata
    lines.push(`name: ${name}`);
    lines.push(`description: ${this.escapeYAML(description)}`);
    lines.push('');

    // Image
    lines.push('# Docker image for agent execution');
    lines.push(`image: ${config.image}`);
    lines.push('');

    // Commands
    lines.push('# Commands to execute agent');
    lines.push('commands:');
    for (const command of config.commands) {
      lines.push(`  - ${this.escapeYAML(command)}`);
    }
    lines.push('');

    // Variables
    lines.push('# Environment variables required by agent');
    lines.push('variables:');
    for (const variable of config.variables) {
      lines.push(`  - ${variable}`);
    }
    lines.push('');

    // AI Gateway integration
    if (config.injectGatewayToken) {
      lines.push('# Inject AI Gateway token for model access');
      lines.push('injectGatewayToken: true');
      lines.push('');
    }

    // LLM configuration (if present)
    const llm = manifest.spec?.llm;
    if (llm && typeof llm === 'object') {
      const llmConfig = llm as {
        provider?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };

      lines.push('# LLM configuration for AI Gateway');
      lines.push('llm:');
      if (llmConfig.provider) {
        lines.push(`  provider: ${llmConfig.provider}`);
      }
      if (llmConfig.model) {
        lines.push(`  model: ${llmConfig.model}`);
      }
      if (llmConfig.temperature !== undefined) {
        lines.push(`  temperature: ${llmConfig.temperature}`);
      }
      if (llmConfig.maxTokens) {
        lines.push(`  max_tokens: ${llmConfig.maxTokens}`);
      }
      lines.push('');
    }

    // Runtime configuration
    const runtime = manifest.metadata?.agentArchitecture?.runtime;
    if (runtime && typeof runtime === 'object') {
      const runtimeConfig = runtime as {
        type?: string;
        port?: number;
        path?: string;
      };

      if (runtimeConfig.type === 'webhook') {
        lines.push('# Webhook runtime configuration');
        lines.push('runtime:');
        lines.push(`  type: ${runtimeConfig.type}`);
        if (runtimeConfig.port) {
          lines.push(`  port: ${runtimeConfig.port}`);
        }
        if (runtimeConfig.path) {
          lines.push(`  path: ${runtimeConfig.path}`);
        }
        lines.push('');
      }
    }

    // Usage instructions
    lines.push('# Usage:');
    lines.push('# 1. Register agent: glab duo agent register external-agent.yaml');
    lines.push('# 2. Test agent: glab duo agent test ' + name);
    lines.push(
      '# 3. Deploy agent: Agent runs in GitLab CI/CD when triggered'
    );
    lines.push('');
    lines.push('# Documentation:');
    lines.push(
      '# https://docs.gitlab.com/ee/user/gitlab_duo/external_agents.html'
    );

    return lines.join('\n');
  }

  /**
   * Escape YAML string values
   */
  private escapeYAML(value: string): string {
    // Check if value needs quoting
    if (
      value.includes(':') ||
      value.includes('#') ||
      value.includes('\n') ||
      value.includes('"') ||
      value.includes("'")
    ) {
      // Use double quotes and escape internal quotes
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
}
