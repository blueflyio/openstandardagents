import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import Ajv from 'ajv';

export class OSSAValidator {
  private ajv: Ajv;
  private schema: any;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    this.loadSchema();
  }

  private async loadSchema() {
    try {
      // Try to load schema from local spec directory
      const schemaPath = path.join(
        __dirname,
        '../../../spec/v0.3.4/ossa-0.3.4.schema.json'
      );
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        this.schema = JSON.parse(schemaContent);
      } else {
        // Fallback to remote schema
        const response = await fetch(
          'https://raw.githubusercontent.com/blueflyio/ossa/main/spec/v0.3.4/ossa-0.3.4.schema.json'
        );
        this.schema = await response.json();
      }
    } catch (error) {
      console.error('Failed to load OSSA schema:', error);
    }
  }

  async validate(uri: vscode.Uri): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();

      // Parse YAML
      let manifest: any;
      try {
        manifest = yaml.parse(content);
      } catch (yamlError: any) {
        const line = yamlError.line || 0;
        const pos = new vscode.Position(line, 0);
        const range = new vscode.Range(
          pos,
          new vscode.Position(line, document.lineAt(line).text.length)
        );
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `YAML parse error: ${yamlError.message}`,
            vscode.DiagnosticSeverity.Error
          )
        );
        return diagnostics;
      }

      // Validate against schema if available
      if (this.schema) {
        const validate = this.ajv.compile(this.schema);
        const valid = validate(manifest);

        if (!valid && validate.errors) {
          for (const error of validate.errors) {
            const pathParts = error.instancePath.split('/').filter(Boolean);
            let line = 0;
            let column = 0;

            // Try to find line number from path
            if (pathParts.length > 0) {
              // Simple heuristic: search for the field in content
              const fieldName = pathParts[pathParts.length - 1];
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(fieldName)) {
                  line = i;
                  column = lines[i].indexOf(fieldName);
                  break;
                }
              }
            }

            const pos = new vscode.Position(line, column);
            const range = new vscode.Range(
              pos,
              new vscode.Position(line, document.lineAt(line).text.length)
            );

            diagnostics.push(
              new vscode.Diagnostic(
                range,
                `${error.instancePath}: ${error.message}`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }
        }
      }

      // Basic OSSA-specific validations
      if (!manifest.apiVersion) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            'Missing required field: apiVersion',
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      if (!manifest.kind) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            'Missing required field: kind',
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      if (manifest.kind === 'Agent' && !manifest.metadata?.name) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            'Missing required field: metadata.name',
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    } catch (error: any) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `Validation error: ${error.message}`,
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    return diagnostics;
  }
}
