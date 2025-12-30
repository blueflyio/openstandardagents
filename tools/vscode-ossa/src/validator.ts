import * as vscode from 'vscode';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import * as yaml from 'yaml';

export class OSSAValidator {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private ajv: Ajv;
  private schemaCache: Map<string, any> = new Map();

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ossa');
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true
    });
    addFormats(this.ajv);
  }

  async validateDocument(document: vscode.TextDocument): Promise<void> {
    const diagnostics: vscode.Diagnostic[] = [];

    try {
      // Parse document
      const text = document.getText();
      let data: any;

      if (document.fileName.endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        data = yaml.parse(text);
      }

      // Get schema version from config or manifest
      const config = vscode.workspace.getConfiguration('ossa');
      const configVersion = config.get<string>('validation.schemaVersion', 'vv0.3.2');
      const manifestVersion = data?.apiVersion?.replace('ossa/', '') || configVersion;

      // Fetch and validate against schema
      const schema = await this.getSchema(manifestVersion);
      const validate = this.ajv.compile(schema);
      const valid = validate(data);

      if (!valid && validate.errors) {
        for (const error of validate.errors) {
          const diagnostic = this.createDiagnostic(error, document);
          if (diagnostic) {
            diagnostics.push(diagnostic);
          }
        }
      }

      // Additional OSSA-specific validations
      this.performOSSAValidations(data, diagnostics, document);

    } catch (error) {
      // Parse errors
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `Failed to parse OSSA manifest: ${error instanceof Error ? error.message : String(error)}`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);

    // Show validation result
    if (diagnostics.length === 0) {
      vscode.window.setStatusBarMessage('$(check) OSSA: Valid', 3000);
    } else {
      const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
      const warningCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;
      vscode.window.setStatusBarMessage(
        `$(warning) OSSA: ${errorCount} errors, ${warningCount} warnings`,
        5000
      );
    }
  }

  private async getSchema(version: string): Promise<any> {
    if (this.schemaCache.has(version)) {
      return this.schemaCache.get(version);
    }

    const schemaUrl = `https://openstandardagents.org/schemas/${version}/manifest.json`;

    try {
      const response = await fetch(schemaUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }
      const schema = await response.json();
      this.schemaCache.set(version, schema);
      return schema;
    } catch (error) {
      // Fallback to local schema if available
      vscode.window.showWarningMessage(
        `Could not fetch OSSA schema ${version} from remote. Using basic validation.`
      );
      // Return minimal schema for basic validation
      return {
        type: 'object',
        required: ['apiVersion', 'kind', 'metadata'],
        properties: {
          apiVersion: { type: 'string' },
          kind: { type: 'string', enum: ['Agent', 'Task', 'Workflow'] },
          metadata: { type: 'object' }
        }
      };
    }
  }

  private createDiagnostic(error: ErrorObject, document: vscode.TextDocument): vscode.Diagnostic | null {
    // Find the line number for the error
    const instancePath = error.instancePath || '';
    const line = this.findLineForPath(document, instancePath);

    const range = new vscode.Range(
      new vscode.Position(line, 0),
      new vscode.Position(line, 100)
    );

    let message = error.message || 'Validation error';
    if (error.instancePath) {
      message = `${error.instancePath}: ${message}`;
    }
    if (error.params) {
      const params = Object.entries(error.params)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(', ');
      message += ` (${params})`;
    }

    return new vscode.Diagnostic(
      range,
      message,
      vscode.DiagnosticSeverity.Error
    );
  }

  private findLineForPath(document: vscode.TextDocument, path: string): number {
    // Simple implementation - find the line containing the path key
    const pathParts = path.split('/').filter(p => p);
    if (pathParts.length === 0) return 0;

    const lastKey = pathParts[pathParts.length - 1];
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(lastKey + ':')) {
        return i;
      }
    }

    return 0;
  }

  private performOSSAValidations(
    data: any,
    diagnostics: vscode.Diagnostic[],
    document: vscode.TextDocument
  ): void {
    // Validate kind-specific requirements
    if (data.kind === 'Agent') {
      if (!data.spec?.role && !data.spec?.prompts?.system) {
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          'Agent must have either spec.role or spec.prompts.system defined',
          vscode.DiagnosticSeverity.Error
        ));
      }

      if (!data.spec?.llm) {
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          'Agent must have spec.llm configuration',
          vscode.DiagnosticSeverity.Error
        ));
      }
    }

    // Check for common mistakes
    if (data.metadata?.name) {
      const name = data.metadata.name;
      if (name !== name.toLowerCase()) {
        diagnostics.push(new vscode.Diagnostic(
          this.findRangeForKey(document, 'name'),
          'metadata.name should be lowercase (Kubernetes DNS-1123 format)',
          vscode.DiagnosticSeverity.Warning
        ));
      }
      if (name.includes('_')) {
        diagnostics.push(new vscode.Diagnostic(
          this.findRangeForKey(document, 'name'),
          'metadata.name should use hyphens instead of underscores',
          vscode.DiagnosticSeverity.Warning
        ));
      }
    }

    // Validate version format
    if (data.metadata?.version) {
      const version = data.metadata.version;
      const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
      if (!semverPattern.test(version)) {
        diagnostics.push(new vscode.Diagnostic(
          this.findRangeForKey(document, 'version'),
          'metadata.version should follow semantic versioning (e.g., 1.0.0)',
          vscode.DiagnosticSeverity.Warning
        ));
      }
    }
  }

  private findRangeForKey(document: vscode.TextDocument, key: string): vscode.Range {
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const keyIndex = line.indexOf(key + ':');
      if (keyIndex !== -1) {
        return new vscode.Range(
          new vscode.Position(i, keyIndex),
          new vscode.Position(i, line.length)
        );
      }
    }

    return new vscode.Range(0, 0, 0, 0);
  }
}
