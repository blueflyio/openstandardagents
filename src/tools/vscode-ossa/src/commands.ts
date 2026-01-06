import * as vscode from 'vscode';

export class OSSACommandProvider {
  async createNewAgent(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter agent name (lowercase, hyphens)',
      placeHolder: 'my-agent',
      validateInput: (value) => {
        if (!value) return 'Name is required';
        if (value !== value.toLowerCase()) return 'Name must be lowercase';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Name must be lowercase alphanumeric with hyphens';
        return null;
      }
    });

    if (!name) return;

    const version = await vscode.window.showInputBox({
      prompt: 'Enter version',
      placeHolder: '1.0.0',
      value: '1.0.0',
      validateInput: (value) => {
        if (!/^\d+\.\d+\.\d+/.test(value)) return 'Version must be semantic (e.g., 1.0.0)';
        return null;
      }
    });

    if (!version) return;

    const provider = await vscode.window.showQuickPick(
      ['anthropic', 'openai', 'google', 'azure', 'groq', 'ollama'],
      { placeHolder: 'Select LLM provider' }
    );

    if (!provider) return;

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

    if (!model) return;

    const content = this.generateAgentManifest(name, version, provider, model);

    const document = await vscode.workspace.openTextDocument({
      content,
      language: 'yaml'
    });

    await vscode.window.showTextDocument(document);
  }

  async createNewTask(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter task name (lowercase, hyphens)',
      placeHolder: 'my-task',
      validateInput: (value) => {
        if (!value) return 'Name is required';
        if (value !== value.toLowerCase()) return 'Name must be lowercase';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Name must be lowercase alphanumeric with hyphens';
        return null;
      }
    });

    if (!name) return;

    const version = await vscode.window.showInputBox({
      prompt: 'Enter version',
      placeHolder: '1.0.0',
      value: '1.0.0'
    });

    if (!version) return;

    const content = this.generateTaskManifest(name, version);

    const document = await vscode.workspace.openTextDocument({
      content,
      language: 'yaml'
    });

    await vscode.window.showTextDocument(document);
  }

  async createNewWorkflow(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter workflow name (lowercase, hyphens)',
      placeHolder: 'my-workflow',
      validateInput: (value) => {
        if (!value) return 'Name is required';
        if (value !== value.toLowerCase()) return 'Name must be lowercase';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Name must be lowercase alphanumeric with hyphens';
        return null;
      }
    });

    if (!name) return;

    const version = await vscode.window.showInputBox({
      prompt: 'Enter version',
      placeHolder: '1.0.0',
      value: '1.0.0'
    });

    if (!version) return;

    const content = this.generateWorkflowManifest(name, version);

    const document = await vscode.workspace.openTextDocument({
      content,
      language: 'yaml'
    });

    await vscode.window.showTextDocument(document);
  }

  private generateAgentManifest(name: string, version: string, provider: string, model: string): string {
    return `apiVersion: ossa/v0.3.2
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

  private generateTaskManifest(name: string, version: string): string {
    return `apiVersion: ossa/v0.3.2
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

  private generateWorkflowManifest(name: string, version: string): string {
    return `apiVersion: ossa/v0.3.2
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
