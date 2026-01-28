import * as vscode from 'vscode';
import { OSSAValidator } from './validator';
import { OSSACompletionProvider } from './completion';
import { OSSAHoverProvider } from './hover';

export function activate(context: vscode.ExtensionContext) {
  console.log('OSSA extension is now active');

  const validator = new OSSAValidator();
  const completionProvider = new OSSACompletionProvider();
  const hoverProvider = new OSSAHoverProvider();

  // Register validation command
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

  // Register validate all command
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

  // Register documentation generation command
  const generateDocsCommand = vscode.commands.registerCommand(
    'ossa.generateDocs',
    async () => {
      vscode.window.showInformationMessage(
        'Documentation generation coming soon'
      );
    }
  );

  // Register completion provider
  const completionDisposable = vscode.languages.registerCompletionItemProvider(
    'ossa-yaml',
    completionProvider,
    '.',
    ':',
    '-'
  );

  // Register hover provider
  const hoverDisposable = vscode.languages.registerHoverProvider(
    'ossa-yaml',
    hoverProvider
  );

  // Real-time validation on save
  const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(
    async (document) => {
      if (
        document.languageId === 'ossa-yaml' ||
        document.fileName.endsWith('.ossa.yaml') ||
        document.fileName.endsWith('.ossa.yml')
      ) {
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

  context.subscriptions.push(
    validateCommand,
    validateAllCommand,
    generateDocsCommand,
    completionDisposable,
    hoverDisposable,
    onSaveDisposable
  );
}

export function deactivate() {}
