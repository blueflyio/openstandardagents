import * as vscode from 'vscode';

/**
 * OSSA Command Provider
 *
 * Provides VS Code commands for scaffolding new OSSA manifests:
 * - Agent manifests with LLM configuration
 * - Task manifests with step definitions
 * - Workflow manifests with orchestration logic
 *
 * Includes interactive prompts for configuration values and validation
 * of naming conventions (DNS-1123 compliance, semantic versioning).
 */
export class OSSACommandProvider {
  /**
   * Create a new Agent manifest interactively
   *
   * Prompts the user for:
   * 1. Agent name (validated for DNS-1123 compliance)
   * 2. Semantic version
   * 3. LLM provider (anthropic, openai, google, etc.)
   * 4. Model name (with provider-specific defaults)
   *
   * Opens the generated manifest in a new editor window for further customization.
   */
  async createNewAgent(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter agent name (lowercase, hyphens)',
      placeHolder: 'my-agent',
      validateInput: (value) => {
        if (!value) {return 'Name is required';}
        if (value !== value.toLowerCase()) {return 'Name must be lowercase';}
        if (!/^[a-z0-9-]+$/.test(value)) {return 'Name must be lowercase alphanumeric with hyphens';}
        return null;
      }
    });

    if (!name) {return;}

    const version = await vscode.window.showInputBox({
      prompt: 'Enter version',
      placeHolder: '1.0.0',
      value: '1.0.0',
      validateInput: (value) => {
        if (!/^\d+\.\d+\.\d+/.test(value)) {return 'Version must be semantic (e.g., 1.0.0)';}
        return null;
      }
    });

    if (!version) {return;}

    const provider = await vscode.window.showQuickPick(
      ['anthropic', 'openai', 'google', 'azure', 'groq', 'ollama'],
      { placeHolder: 'Select LLM provider' }
    );

    if (!provider) {return;}

    const modelDefaults: Record<string, string> = {
      'anthropic': 'claude-sonnet-4-20250514',
      'openai': 'gpt-4o',
      'google': 'gemini-2.0-flash',
      'azure': 'gpt-4',
      'groq': 'llama-3.1-70b-versatile',
      'ollama': 'llama3.1'
    };

    const model = await vscode.window.showInputBox({
      prompt: 'Enter model name',
      placeHolder: modelDefaults[provider],
      value: modelDefaults[provider]
    });

    if (!model) {return;}

    const content = this.generateAgentManifest(name, version, provider, model);

    const document = await vscode.workspace.openTextDocument({
      content,
      language: 'yaml'
    });

    await vscode.window.showTextDocument(document);
  }

  /**
   * Create a new Task manifest interactively
   *
   * Prompts the user for:
   * 1. Task name (validated for DNS-1123 compliance)
   * 2. Semantic version
   *
   * Generates a basic task manifest with a single echo step as a starting point.
   * Opens the generated manifest in a new editor window for further customization.
   */
  async createNewTask(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter task name (lowercase, hyphens)',
      placeHolder: 'my-task',
      validateInput: (value) => {
        if (!value) {return 'Name is required';}
        if (value !== value.toLowerCase()) {return 'Name must be lowercase';}
        if (!/^[a-z0-9-]+$/.test(value)) {return 'Name must be lowercase alphanumeric with hyphens';}
        return null;
      }
    });

    if (!name) {return;}

    const version = await vscode.window.showInputBox({
      prompt: 'Enter version',
      placeHolder: '1.0.0',
      value: '1.0.0'
    });

    if (!version) {return;}

    const content = this.generateTaskManifest(name, version);

    const document = await vscode.workspace.openTextDocument({
      content,
      language: 'yaml'
    });

    await vscode.window.showTextDocument(document);
  }

  /**
   * Create a new Workflow manifest interactively
   *
   * Prompts the user for:
   * 1. Workflow name (validated for DNS-1123 compliance)
   * 2. Semantic version
   *
   * Generates a basic workflow manifest with an entrypoint and example node structure.
   * Opens the generated manifest in a new editor window for further customization.
   */
  async createNewWorkflow(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter workflow name (lowercase, hyphens)',
      placeHolder: 'my-workflow',
      validateInput: (value) => {
        if (!value) {return 'Name is required';}
        if (value !== value.toLowerCase()) {return 'Name must be lowercase';}
        if (!/^[a-z0-9-]+$/.test(value)) {return 'Name must be lowercase alphanumeric with hyphens';}
        return null;
      }
    });

    if (!name) {return;}

    const version = await vscode.window.showInputBox({
      prompt: 'Enter version',
      placeHolder: '1.0.0',
      value: '1.0.0'
    });

    if (!version) {return;}

    const content = this.generateWorkflowManifest(name, version);

    const document = await vscode.workspace.openTextDocument({
      content,
      language: 'yaml'
    });

    await vscode.window.showTextDocument(document);
  }

  /**
   * Generate Agent manifest YAML content
   *
   * Creates a complete Agent manifest with:
   * - Metadata (name, version, description)
   * - LLM configuration (provider, model, temperature)
   * - Example tool configuration (commented out)
   * - Example safety controls (commented out)
   * - Example autonomy settings (commented out)
   *
   * @param name - Agent name (DNS-1123 compliant)
   * @param version - Semantic version
   * @param provider - LLM provider
   * @param model - Model identifier
   * @returns YAML manifest string
   */
  private generateAgentManifest(name: string, version: string, provider: string, model: string): string {
    return `apiVersion: ossa/v0.3.3
kind: Agent

metadata:
  name: ${name}
  version: ${version}
  description: |
    TODO: Describe what this agent does

spec:
  role: |
    You are a helpful AI assistant.

    TODO: Define the agent's role, capabilities, and behavior guidelines.

  llm:
    provider: ${provider}
    model: ${model}
    temperature: 0.7

  # Optional: Add tools for the agent
  # tools:
  #   - type: mcp
  #     name: filesystem
  #     description: File system access
  #     server:
  #       command: npx
  #       args:
  #         - -y
  #         - "@modelcontextprotocol/server-filesystem"

  # Optional: Add safety controls
  # safety:
  #   pii:
  #     detection: enabled
  #     policy: block
  #   rateLimit:
  #     requestsPerMinute: 10

  # Optional: Configure autonomy
  # autonomy:
  #   level: supervised
  #   approval_required: true
`;
  }

  /**
   * Generate Task manifest YAML content
   *
   * Creates a basic Task manifest with:
   * - Metadata (name, version, description)
   * - Single echo step as starting point
   * - Example error handling (commented out)
   *
   * @param name - Task name (DNS-1123 compliant)
   * @param version - Semantic version
   * @returns YAML manifest string
   */
  private generateTaskManifest(name: string, version: string): string {
    return `apiVersion: ossa/v0.3.3
kind: Task

metadata:
  name: ${name}
  version: ${version}
  description: |
    TODO: Describe what this task does

spec:
  steps:
    - name: step1
      type: script
      description: TODO: Describe this step
      config:
        command: echo
        args:
          - "Hello from OSSA Task"
      # Optional: Add error handling
      # onError: continue  # or: fail, retry
      # retries: 3
`;
  }

  /**
   * Generate Workflow manifest YAML content
   *
   * Creates a basic Workflow manifest with:
   * - Metadata (name, version, description)
   * - Entrypoint definition
   * - Example node structure with agent reference
   * - Example parallel execution (commented out)
   * - Example conditional routing (commented out)
   *
   * @param name - Workflow name (DNS-1123 compliant)
   * @param version - Semantic version
   * @returns YAML manifest string
   */
  private generateWorkflowManifest(name: string, version: string): string {
    return `apiVersion: ossa/v0.3.3
kind: Workflow

metadata:
  name: ${name}
  version: ${version}
  description: |
    TODO: Describe what this workflow orchestrates

spec:
  entrypoint: main

  nodes:
    - name: main
      type: agent
      ref: agent-name  # Reference to an Agent manifest
      # Optional: Define next steps
      # next: next-node

    # Add more nodes to build your workflow
    # - name: next-node
    #   type: task
    #   ref: task-name

  # Optional: Define parallel execution
  # parallel:
  #   - node1
  #   - node2

  # Optional: Conditional routing
  # conditions:
  #   - if: \${output.status == 'success'}
  #     then: success-handler
  #     else: error-handler
`;
  }
}
