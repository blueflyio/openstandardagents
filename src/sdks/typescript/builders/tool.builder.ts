/**
 * ToolBuilder - Fluent API for building OSSA tool definitions
 *
 * @example
 * ```typescript
 * // MCP tool
 * const mcpTool = ToolBuilder.mcp('filesystem')
 *   .server('npx -y @modelcontextprotocol/server-filesystem')
 *   .args(['./'])
 *   .description('File system access')
 *   .build();
 *
 * // Webhook tool
 * const webhookTool = ToolBuilder.webhook('github-webhook')
 *   .url('https://api.example.com/webhook')
 *   .events(['push', 'pull_request'])
 *   .build();
 *
 * // Schedule tool
 * const scheduleTool = ToolBuilder.schedule('daily-report')
 *   .cron('0 9 * * *')
 *   .timezone('America/New_York')
 *   .build();
 * ```
 */

import type { Tool } from '../types.js';
import type { ToolType } from '../constants.js';

export class ToolBuilder {
  private tool: Partial<Tool> & { type?: ToolType };

  private constructor(type: ToolType, name: string) {
    this.tool = {
      type,
      name,
    };
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Create an MCP (Model Context Protocol) tool
   */
  static mcp(name: string): ToolBuilder {
    return new ToolBuilder('mcp', name);
  }

  /**
   * Create a webhook tool
   */
  static webhook(name: string): ToolBuilder {
    return new ToolBuilder('webhook', name);
  }

  /**
   * Create a schedule (cron) tool
   */
  static schedule(name: string): ToolBuilder {
    return new ToolBuilder('schedule', name);
  }

  /**
   * Create an HTTP tool
   */
  static http(name: string): ToolBuilder {
    return new ToolBuilder('http', name);
  }

  /**
   * Create an API tool
   */
  static api(name: string): ToolBuilder {
    return new ToolBuilder('api', name);
  }

  /**
   * Create a gRPC tool
   */
  static grpc(name: string): ToolBuilder {
    return new ToolBuilder('grpc', name);
  }

  /**
   * Create a function tool
   */
  static function(name: string): ToolBuilder {
    return new ToolBuilder('function', name);
  }

  /**
   * Create an agent-to-agent (a2a) tool
   */
  static a2a(name: string): ToolBuilder {
    return new ToolBuilder('a2a', name);
  }

  /**
   * Create a Kubernetes tool
   */
  static kubernetes(name: string): ToolBuilder {
    return new ToolBuilder('kubernetes', name);
  }

  /**
   * Create a pipeline tool
   */
  static pipeline(name: string): ToolBuilder {
    return new ToolBuilder('pipeline', name);
  }

  /**
   * Create a workflow tool
   */
  static workflow(name: string): ToolBuilder {
    return new ToolBuilder('workflow', name);
  }

  /**
   * Create an artifact tool
   */
  static artifact(name: string): ToolBuilder {
    return new ToolBuilder('artifact', name);
  }

  /**
   * Create a git-commit tool
   */
  static gitCommit(name: string): ToolBuilder {
    return new ToolBuilder('git-commit', name);
  }

  /**
   * Create a CI status tool
   */
  static ciStatus(name: string): ToolBuilder {
    return new ToolBuilder('ci-status', name);
  }

  /**
   * Create a comment tool
   */
  static comment(name: string): ToolBuilder {
    return new ToolBuilder('comment', name);
  }

  /**
   * Create a library tool
   */
  static library(name: string): ToolBuilder {
    return new ToolBuilder('library', name);
  }

  /**
   * Create a custom tool
   */
  static custom(name: string): ToolBuilder {
    return new ToolBuilder('custom', name);
  }

  // ============================================================================
  // Common Builder Methods
  // ============================================================================

  /**
   * Set tool description
   */
  description(description: string): this {
    this.tool.description = description;
    return this;
  }

  /**
   * Set handler runtime
   */
  runtime(runtime: string): this {
    if (!this.tool.handler) {
      this.tool.handler = {};
    }
    this.tool.handler.runtime = runtime;
    return this;
  }

  /**
   * Set handler capability
   */
  capability(capability: string): this {
    if (!this.tool.handler) {
      this.tool.handler = {};
    }
    this.tool.handler.capability = capability;
    return this;
  }

  /**
   * Set handler endpoint
   */
  endpoint(endpoint: string): this {
    if (!this.tool.handler) {
      this.tool.handler = {};
    }
    this.tool.handler.endpoint = endpoint;
    return this;
  }

  /**
   * Set handler method
   */
  method(method: string): this {
    if (!this.tool.handler) {
      this.tool.handler = {};
    }
    this.tool.handler.method = method;
    return this;
  }

  /**
   * Set tool parameters
   */
  parameters(parameters: Record<string, unknown>): this {
    this.tool.parameters = parameters;
    return this;
  }

  /**
   * Add a single parameter
   */
  parameter(key: string, value: unknown): this {
    if (!this.tool.parameters) {
      this.tool.parameters = {};
    }
    this.tool.parameters[key] = value;
    return this;
  }

  // ============================================================================
  // MCP-Specific Methods
  // ============================================================================

  /**
   * Set MCP server command
   */
  server(command: string): this {
    return this.parameter('server', command);
  }

  /**
   * Set MCP server arguments
   */
  args(args: string[]): this {
    return this.parameter('args', args);
  }

  /**
   * Set MCP environment variables
   */
  env(env: Record<string, string>): this {
    return this.parameter('env', env);
  }

  // ============================================================================
  // Webhook-Specific Methods
  // ============================================================================

  /**
   * Set webhook URL
   */
  url(url: string): this {
    return this.parameter('url', url);
  }

  /**
   * Set webhook events
   */
  events(events: string[]): this {
    return this.parameter('events', events);
  }

  /**
   * Set webhook secret
   */
  secret(secret: string): this {
    return this.parameter('secret', secret);
  }

  // ============================================================================
  // Schedule-Specific Methods
  // ============================================================================

  /**
   * Set cron expression
   */
  cron(expression: string): this {
    return this.parameter('cron', expression);
  }

  /**
   * Set timezone for schedule
   */
  timezone(timezone: string): this {
    return this.parameter('timezone', timezone);
  }

  // ============================================================================
  // HTTP/API-Specific Methods
  // ============================================================================

  /**
   * Set HTTP method (GET, POST, etc.)
   */
  httpMethod(method: string): this {
    return this.method(method);
  }

  /**
   * Set HTTP headers
   */
  headers(headers: Record<string, string>): this {
    return this.parameter('headers', headers);
  }

  /**
   * Set request body
   */
  body(body: unknown): this {
    return this.parameter('body', body);
  }

  /**
   * Set authentication config
   */
  auth(auth: Record<string, unknown>): this {
    return this.parameter('auth', auth);
  }

  // ============================================================================
  // Build Method
  // ============================================================================

  /**
   * Build the tool object
   */
  build(): Tool {
    if (!this.tool.name) {
      throw new Error('Tool name is required');
    }

    // The type field is part of the OSSA schema but not in our current Tool interface
    // We'll cast to any to allow the type field
    return this.tool as Tool;
  }
}
