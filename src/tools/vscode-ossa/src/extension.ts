import * as vscode from 'vscode';
import { OSSAValidator } from './validator';
import { OSSACommandProvider } from './commands';

let validator: OSSAValidator;
let commandProvider: OSSACommandProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('OSSA extension is now active');

  // Initialize validator
  validator = new OSSAValidator();

  // Initialize command provider
  commandProvider = new OSSACommandProvider();

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('ossa.validate', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const document = editor.document;
      if (!isOSSAFile(document)) {
        vscode.window.showWarningMessage('Current file is not an OSSA manifest');
        return;
      }

      await validator.validateDocument(document);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ossa.newAgent', () => {
      commandProvider.createNewAgent();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ossa.newTask', () => {
      commandProvider.createNewTask();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('ossa.newWorkflow', () => {
      commandProvider.createNewWorkflow();
    })
  );

  // Validate on document save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (isOSSAFile(document)) {
        const config = vscode.workspace.getConfiguration('ossa');
        if (config.get('validation.enabled', true)) {
          await validator.validateDocument(document);
        }
      }
    })
  );

  // Validate on document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(async (document) => {
      if (isOSSAFile(document)) {
        const config = vscode.workspace.getConfiguration('ossa');
        if (config.get('validation.enabled', true)) {
          await validator.validateDocument(document);
        }
      }
    })
  );

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(check) OSSA';
  statusBarItem.tooltip = 'OSSA validation enabled';
  statusBarItem.command = 'ossa.validate';

  context.subscriptions.push(statusBarItem);

  // Show status bar only for OSSA files
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && isOSSAFile(editor.document)) {
        statusBarItem.show();
      } else {
        statusBarItem.hide();
      }
    })
  );

  // Show status bar if current file is OSSA
  if (vscode.window.activeTextEditor &&
      isOSSAFile(vscode.window.activeTextEditor.document)) {
    statusBarItem.show();
  }
}

export function deactivate() {
  // Cleanup if needed
}

function isOSSAFile(document: vscode.TextDocument): boolean {
  const fileName = document.fileName.toLowerCase();
  return fileName.endsWith('.ossa.yaml') ||
         fileName.endsWith('.ossa.yml') ||
         fileName.endsWith('.ossa.json') ||
         (fileName.includes('/.agents/') && fileName.endsWith('manifest.yaml')) ||
         (fileName.includes('/.gitlab/agents/') && fileName.endsWith('manifest.ossa.yaml'));
}
