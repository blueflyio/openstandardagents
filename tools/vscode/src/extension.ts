/**
 * OSSA VS Code Extension
 *
 * Provides comprehensive IDE support for OSSA (Open Standard for Software Agents) manifests:
 * - Real-time validation with JSON Schema
 * - Intelligent code completion
 * - Inline documentation on hover
 * - Manifest scaffolding commands
 * - Status bar integration
 *
 * Supports .ossa.yaml, .ossa.yml, and .ossa.json files across various project structures
 * including GitLab Kagent configurations.
 *
 * @see https://openstandardagents.org for OSSA specification
 */

import * as vscode from 'vscode';
import { OSSAValidator } from './validator';
import { OSSACompletionProvider } from './completion';
import { OSSAHoverProvider } from './hover';
import { OSSACommandProvider } from './commands';

let validator: OSSAValidator;
let commandProvider: OSSACommandProvider;
let statusBarItem: vscode.StatusBarItem;

/**
 * Activate the OSSA extension
 *
 * Initializes all providers and registers commands, completion providers, hover providers,
 * and document event handlers. Sets up the status bar indicator and real-time validation.
 *
 * Registered commands:
 * - ossa.validate - Validate current OSSA manifest
 * - ossa.validateAll - Validate all OSSA manifests in workspace
 * - ossa.newAgent - Create new Agent manifest
 * - ossa.newTask - Create new Task manifest
 * - ossa.newWorkflow - Create new Workflow manifest
 * - ossa.generateDocs - Generate documentation (coming soon)
 *
 * @param context - VS Code extension context for subscriptions and lifecycle management
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('OSSA extension is now active');

  // Initialize providers
  validator = new OSSAValidator();
  commandProvider = new OSSACommandProvider();
  const completionProvider = new OSSACompletionProvider();
  const hoverProvider = new OSSAHoverProvider();

  // Register validation commands
  const validateCommand = vscode.commands.registerCommand(
    'ossa.validate',
    async (uri?: vscode.Uri) => {
      const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('No file selected');
        return;
      }

      const diagnostics = await validator.validate(fileUri);
      const diagnosticCollection =
        vscode.languages.createDiagnosticCollection('ossa');
      diagnosticCollection.set(fileUri, diagnostics);

      if (diagnostics.length === 0) {
        vscode.window.showInformationMessage('OSSA manifest is valid');
      } else {
        vscode.window.showWarningMessage(
          `Found ${diagnostics.length} validation issue(s)`
        );
      }
    }
  );

  const validateAllCommand = vscode.commands.registerCommand(
    'ossa.validateAll',
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const pattern = new vscode.RelativePattern(
        workspaceFolders[0],
        '**/*.ossa.{yaml,yml}'
      );
      const files = await vscode.workspace.findFiles(pattern);

      if (files.length === 0) {
        vscode.window.showInformationMessage('No OSSA manifests found');
        return;
      }

      vscode.window.showInformationMessage(
        `Validating ${files.length} OSSA manifest(s)...`
      );

      const diagnosticCollection =
        vscode.languages.createDiagnosticCollection('ossa');
      let totalIssues = 0;

      for (const file of files) {
        const diagnostics = await validator.validate(file);
        diagnosticCollection.set(file, diagnostics);
        totalIssues += diagnostics.length;
      }

      if (totalIssues === 0) {
        vscode.window.showInformationMessage(
          `All ${files.length} manifest(s) are valid`
        );
      } else {
        vscode.window.showWarningMessage(
          `Found ${totalIssues} issue(s) across ${files.length} manifest(s)`
        );
      }
    }
  );

  // Register creation commands
  const newAgentCommand = vscode.commands.registerCommand(
    'ossa.newAgent',
    () => {
      commandProvider.createNewAgent();
    }
  );

  const newTaskCommand = vscode.commands.registerCommand(
    'ossa.newTask',
    () => {
      commandProvider.createNewTask();
    }
  );

  const newWorkflowCommand = vscode.commands.registerCommand(
    'ossa.newWorkflow',
    () => {
      commandProvider.createNewWorkflow();
    }
  );

  // Register documentation generation command
  const generateDocsCommand = vscode.commands.registerCommand(
    'ossa.generateDocs',
    async () => {
      vscode.window.showInformationMessage(
        'Documentation generation coming soon'
      );
    }
  );

  // Register completion provider for intelligent code completion
  const completionDisposable = vscode.languages.registerCompletionItemProvider(
    'ossa-yaml',
    completionProvider,
    '.',
    ':',
    '-'
  );

  // Register hover provider for inline documentation
  const hoverDisposable = vscode.languages.registerHoverProvider(
    'ossa-yaml',
    hoverProvider
  );

  // Real-time validation on save
  const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(
    async (document) => {
      if (isOSSAFile(document)) {
        const config = vscode.workspace.getConfiguration('ossa');
        if (config.get<boolean>('validation.enabled', true)) {
          const diagnostics = await validator.validate(document.uri);
          const diagnosticCollection =
            vscode.languages.createDiagnosticCollection('ossa');
          diagnosticCollection.set(document.uri, diagnostics);
        }
      }
    }
  );

  // Validate on document open
  const onOpenDisposable = vscode.workspace.onDidOpenTextDocument(
    async (document) => {
      if (isOSSAFile(document)) {
        const config = vscode.workspace.getConfiguration('ossa');
        if (config.get<boolean>('validation.enabled', true)) {
          const diagnostics = await validator.validate(document.uri);
          const diagnosticCollection =
            vscode.languages.createDiagnosticCollection('ossa');
          diagnosticCollection.set(document.uri, diagnostics);
        }
      }
    }
  );

  // Status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(check) OSSA';
  statusBarItem.tooltip = 'OSSA validation enabled - Click to validate';
  statusBarItem.command = 'ossa.validate';

  // Show/hide status bar based on active editor
  const onEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor && isOSSAFile(editor.document)) {
        statusBarItem.show();
      } else {
        statusBarItem.hide();
      }
    }
  );

  // Show status bar if current file is OSSA
  if (
    vscode.window.activeTextEditor &&
    isOSSAFile(vscode.window.activeTextEditor.document)
  ) {
    statusBarItem.show();
  }

  context.subscriptions.push(
    validateCommand,
    validateAllCommand,
    newAgentCommand,
    newTaskCommand,
    newWorkflowCommand,
    generateDocsCommand,
    completionDisposable,
    hoverDisposable,
    onSaveDisposable,
    onOpenDisposable,
    statusBarItem,
    onEditorChangeDisposable
  );
}

/**
 * Deactivate the OSSA extension
 *
 * Cleans up resources when the extension is deactivated. Disposes of the status
 * bar item to prevent resource leaks.
 */
export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

/**
 * Check if document is an OSSA manifest file
 *
 * Validates file type and naming conventions according to OSSA specification.
 * Supports multiple file patterns:
 * - *.ossa.yaml / *.ossa.yml / *.ossa.json
 * - .agents/manifest.yaml (generic agent directory)
 * - .gitlab/agents/manifest.ossa.yaml (GitLab Kagent)
 *
 * @param document - VS Code text document to validate
 * @returns true if document matches OSSA manifest patterns
 */
function isOSSAFile(document: vscode.TextDocument): boolean {
  if (
    document.languageId === 'ossa-yaml' ||
    document.languageId === 'yaml' ||
    document.languageId === 'json'
  ) {
    const fileName = document.fileName.toLowerCase();
    return (
      fileName.endsWith('.ossa.yaml') ||
      fileName.endsWith('.ossa.yml') ||
      fileName.endsWith('.ossa.json') ||
      (fileName.includes('/.agents/') && fileName.endsWith('manifest.yaml')) ||
      (fileName.includes('/.gitlab/agents/') &&
        fileName.endsWith('manifest.ossa.yaml'))
    );
  }
  return false;
}
