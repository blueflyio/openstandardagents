import * as vscode from 'vscode';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import * as yaml from 'yaml';

/**
 * OSSA Manifest Validator
 *
 * Provides real-time validation of OSSA (Open Standard for Software Agents) manifest files
 * using JSON Schema validation via Ajv. Validates both schema compliance and OSSA-specific
 * requirements.
 *
 * Features:
 * - JSON Schema validation against versioned OSSA schemas
 * - YAML and JSON format support
 * - Real-time diagnostics in VS Code editor
 * - Schema caching for performance
 * - OSSA-specific semantic validation
 *
 * @see https://openstandardagents.org for OSSA specification
 */
export class OSSAValidator {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private ajv: Ajv;
  private schemaCache: Map<string, any> = new Map();

  /**
   * Initialize the OSSA validator
   *
   * Creates a diagnostic collection for displaying validation errors and configures
   * the Ajv validator with format validation support.
   */
  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ossa');
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true
    });
    addFormats(this.ajv);
  }

  /**
   * Validate an OSSA manifest document
   *
   * Performs comprehensive validation including:
   * 1. Document parsing (YAML/JSON)
   * 2. JSON Schema validation against versioned OSSA schema
   * 3. OSSA-specific semantic validation
   * 4. Real-time diagnostic reporting to VS Code
   *
   * @param document - VS Code text document containing OSSA manifest
   */
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
      const configVersion = config.get<string>('validation.schemaVersion', 'v0.3.3');
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

  /**
   * Retrieve OSSA JSON Schema for a specific version
   *
   * Fetches the JSON Schema from openstandardagents.org with caching support.
   * Falls back to a minimal schema if remote fetch fails, allowing basic validation
   * to continue in offline scenarios.
   *
   * @param version - OSSA schema version (e.g., "v0.3.5")
   * @returns JSON Schema object for validation
   */
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

  /**
   * Create VS Code diagnostic from Ajv validation error
   *
   * Converts JSON Schema validation errors into VS Code diagnostics with precise
   * line numbers and detailed error messages including parameter information.
   *
   * @param error - Ajv validation error object
   * @param document - VS Code document being validated
   * @returns VS Code diagnostic for display in the editor
   */
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

  /**
   * Find line number for a JSON path in the document
   *
   * Locates the line containing a specific JSON path key for accurate error positioning.
   * Uses simple string matching on the last path component.
   *
   * @param document - VS Code document
   * @param path - JSON path (e.g., "/metadata/name")
   * @returns Line number (0-indexed) or 0 if not found
   */
  private findLineForPath(document: vscode.TextDocument, path: string): number {
    // Simple implementation - find the line containing the path key
    const pathParts = path.split('/').filter(p => p);
    if (pathParts.length === 0) {return 0;}

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

  /**
   * Perform OSSA-specific semantic validations
   *
   * Validates business logic and OSSA conventions beyond JSON Schema validation:
   * - Kind-specific requirements (Agent requires role and llm configuration)
   * - Kubernetes naming conventions (DNS-1123 compliance)
   * - Semantic versioning format
   *
   * @param data - Parsed OSSA manifest data
   * @param diagnostics - Array to append diagnostics to
   * @param document - VS Code document for line number lookup
   */
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

  /**
   * Find the exact range of a key in the document
   *
   * Locates a YAML key and returns a VS Code range covering the key and its value
   * for precise diagnostic positioning.
   *
   * @param document - VS Code document
   * @param key - YAML key to find (e.g., "name", "version")
   * @returns VS Code range or 0,0 if not found
   */
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
