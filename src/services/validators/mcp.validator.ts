// @ts-nocheck
/**
 * MCP Validator
 * Validates Model Context Protocol extension
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { injectable } from 'inversify';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@injectable()
export class MCPValidator {
  private ajv: Ajv;
  private validate: any;

  constructor() {
// @ts-expect-error - Ajv v8 API compatibility
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);

    const schemaPath = path.resolve(
      __dirname,
      '../../../spec/v0.3/extensions/mcp/mcp.schema.json'
    );
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    this.validate = this.ajv.compile(schema);
  }

  validateMCP(mcpConfig: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validate(mcpConfig)) {
      if (this.validate.errors) {
        for (const error of this.validate.errors) {
          errors.push(`${error.instancePath} ${error.message}`);
        }
      }
    }

    if (mcpConfig.servers) {
      for (const server of mcpConfig.servers) {
        if (!server.command) {
          errors.push(`MCP server '${server.name}' missing command`);
        }
        if (
          server.transport &&
          !['stdio', 'sse', 'websocket'].includes(server.transport)
        ) {
          errors.push(`Invalid transport: ${server.transport}`);
        }
      }
    }

    if (mcpConfig.tools && mcpConfig.tools.length > 0 && !mcpConfig.servers) {
      warnings.push('MCP tools defined but no servers configured');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
