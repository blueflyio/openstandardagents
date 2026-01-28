import * as vscode from 'vscode';

export class OSSAHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    const line = document.lineAt(position.line).text;

    // Field documentation
    const fieldDocs: Record<string, string> = {
      apiVersion: 'OSSA API version. Use `ossa.io/v1` for latest.',
      kind: 'Resource kind: `Agent`, `Task`, `Workflow`, or `AgentRegistry`.',
      metadata: 'Metadata section containing name, version, description, and tags.',
      name: 'Agent name (DNS-1123 compliant: lowercase alphanumeric with hyphens).',
      version: 'Semantic version of the agent (e.g., 1.0.0).',
      description: 'Human-readable description of the agent.',
      spec: 'Agent specification containing role, LLM config, tools, and capabilities.',
      role: 'System prompt defining the agent\'s role and behavior.',
      llm: 'Large Language Model configuration (provider and model).',
      provider: 'LLM provider: anthropic, openai, azure, bedrock, gemini, mistral, ollama.',
      model: 'Specific model identifier (e.g., claude-sonnet-4-20250514).',
      tools: 'List of tools available to the agent (capabilities or functions).',
      capabilities: 'List of agent capabilities with descriptions.',
      integrations: 'Platform-specific integration configurations.',
      observability: 'Observability configuration (logging, metrics, tracing).',
    };

    if (fieldDocs[word]) {
      return new vscode.Hover(
        new vscode.MarkdownString(`**${word}**\n\n${fieldDocs[word]}`)
      );
    }

    // Check for common patterns
    if (line.includes('apiVersion:')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**apiVersion**\n\nOSSA API version. Use `ossa.io/v1` for the latest version.'
        )
      );
    }

    if (line.includes('kind:')) {
      return new vscode.Hover(
        new vscode.MarkdownString(
          '**kind**\n\nResource kind. Common values:\n- `Agent`: An AI agent\n- `Task`: A task definition\n- `Workflow`: A workflow definition\n- `AgentRegistry`: An agent registry'
        )
      );
    }

    return null;
  }
}
