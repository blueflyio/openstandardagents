import * as vscode from 'vscode';

/**
 * OSSA Completion Provider
 *
 * Provides intelligent code completion for OSSA manifest files with context-aware
 * suggestions based on cursor position and document structure.
 *
 * Completion categories:
 * - Top-level fields (apiVersion, kind, metadata, spec)
 * - Metadata fields (name, version, description, tags)
 * - Spec fields (role, llm, tools, capabilities, etc.)
 * - LLM provider names with descriptions
 *
 * All completions use VS Code snippets with placeholders for efficient editing.
 */
export class OSSACompletionProvider implements vscode.CompletionItemProvider {
  /**
   * Provide completion items based on cursor position and context
   *
   * Analyzes the text before the cursor to determine appropriate completions:
   * - Empty lines or comments: top-level fields
   * - Inside metadata section: metadata fields
   * - Inside spec section: spec fields
   * - After provider field: LLM provider names
   *
   * @param document - Current text document
   * @param position - Current cursor position
   * @param token - Cancellation token
   * @param context - Completion context
   * @returns Array of completion items or null
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const line = document.lineAt(position.line);
    const textBeforeCursor = line.text.substring(0, position.character);

    const completions: vscode.CompletionItem[] = [];

    // Top-level completions
    if (textBeforeCursor.trim() === '' || textBeforeCursor.trim().startsWith('#')) {
      completions.push(
        this.createCompletion('apiVersion', 'apiVersion: ossa.io/v1', 'OSSA API version'),
        this.createCompletion('kind', 'kind: Agent', 'Resource kind (Agent, Task, Workflow)'),
        this.createCompletion('metadata', 'metadata:\n  name: ', 'Agent metadata'),
        this.createCompletion('spec', 'spec:\n  role: |\n    ', 'Agent specification')
      );
    }

    // Metadata completions
    if (textBeforeCursor.includes('metadata:')) {
      completions.push(
        this.createCompletion('name', 'name: ${1:agent-name}', 'Agent name (DNS-1123)'),
        this.createCompletion('version', 'version: 1.0.0', 'Agent version'),
        this.createCompletion('description', 'description: ${1:Agent description}', 'Agent description'),
        this.createCompletion('tags', 'tags:\n  - ${1:tag}', 'Tags for categorization')
      );
    }

    // Spec completions
    if (textBeforeCursor.includes('spec:')) {
      completions.push(
        this.createCompletion('role', 'role: |\n    ${1:Agent role description}', 'Agent role/system prompt'),
        this.createCompletion('llm', 'llm:\n  provider: ${1|anthropic,openai,azure|}\n  model: ${2:model-name}', 'LLM configuration'),
        this.createCompletion('tools', 'tools:\n  - type: ${1|capability,function|}\n    name: ${2:tool-name}', 'Agent tools'),
        this.createCompletion('capabilities', 'capabilities:\n  - name: ${1:capability-name}\n    description: ${2:description}', 'Agent capabilities'),
        this.createCompletion('integrations', 'integrations:\n  ${1:platform}:\n    enabled: true', 'Platform integrations'),
        this.createCompletion('observability', 'observability:\n  enabled: true\n  log_level: ${1|debug,info,warn,error|}\n  metrics_enabled: true\n  tracing_enabled: true', 'Observability configuration')
      );
    }

    // LLM provider completions
    if (textBeforeCursor.includes('provider:')) {
      completions.push(
        this.createCompletion('anthropic', 'anthropic', 'Anthropic Claude'),
        this.createCompletion('openai', 'openai', 'OpenAI GPT'),
        this.createCompletion('azure', 'azure', 'Azure OpenAI'),
        this.createCompletion('bedrock', 'bedrock', 'AWS Bedrock'),
        this.createCompletion('gemini', 'gemini', 'Google Gemini'),
        this.createCompletion('mistral', 'mistral', 'Mistral AI'),
        this.createCompletion('ollama', 'ollama', 'Ollama (local)')
      );
    }

    return completions;
  }

  /**
   * Create a completion item with snippet support
   *
   * Constructs a VS Code completion item with snippet placeholders and markdown
   * documentation for rich inline help.
   *
   * @param label - Display label in completion list
   * @param insertText - Snippet text with ${N:placeholder} syntax
   * @param documentation - Markdown documentation string
   * @returns Configured completion item
   */
  private createCompletion(
    label: string,
    insertText: string,
    documentation: string
  ): vscode.CompletionItem {
    const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Field);
    item.insertText = new vscode.SnippetString(insertText);
    item.documentation = new vscode.MarkdownString(documentation);
    return item;
  }
}
