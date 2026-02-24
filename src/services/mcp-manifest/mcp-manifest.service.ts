/**
 * MCPManifestService — CRUD for mcp.ossa.yaml manifests
 */

import { injectable, inject } from 'inversify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import fg from 'fast-glob';
import { ValidationService } from '../validation.service.js';
import type { OssaMCPServer, ValidationResult } from '../../types/index.js';
import { safeParseYAML } from '../../utils/yaml-parser.js';

export interface CreateMCPInput {
  name: string;
  version?: string;
  description?: string;
  transport?: 'stdio' | 'sse' | 'streamable-http';
}

@injectable()
export class MCPManifestService {
  constructor(
    @inject(ValidationService) private validationService: ValidationService
  ) {}

  async create(input: CreateMCPInput): Promise<OssaMCPServer> {
    const manifest = {
      apiVersion: 'ossa/v1',
      kind: 'MCPServer' as const,
      metadata: {
        name: input.name,
        version: input.version || '1.0.0',
        description: input.description || `MCP Server: ${input.name}`,
      },
      spec: {
        transport: (input.transport || 'stdio') as 'stdio' | 'sse' | 'streamable-http',
        tools: [] as Array<Record<string, unknown>>,
        resources: [] as Array<Record<string, unknown>>,
      },
    } as unknown as OssaMCPServer;

    return manifest;
  }

  async read(filePath: string): Promise<OssaMCPServer> {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    return safeParseYAML(content) as OssaMCPServer;
  }

  async validate(manifest: unknown): Promise<ValidationResult> {
    return this.validationService.validate(manifest);
  }

  async list(directory: string): Promise<OssaMCPServer[]> {
    const dir = path.resolve(directory);
    const patterns = ['**/*.mcp.ossa.yaml', '**/*.mcp.ossa.yml', '**/mcp.ossa.yaml'];
    const files = await fg(patterns, {
      cwd: dir,
      ignore: ['**/node_modules/**', '**/dist/**'],
      absolute: true,
    });

    const servers: OssaMCPServer[] = [];
    for (const f of files) {
      try {
        const content = fs.readFileSync(f, 'utf8');
        const parsed = safeParseYAML(content) as OssaMCPServer;
        if (parsed.kind === 'MCPServer') {
          servers.push(parsed);
        }
      } catch {
        // Skip unparseable files
      }
    }
    return servers;
  }
}
