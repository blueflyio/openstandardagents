/**
 * OSSA Resources for Claude Desktop Integration
 * Provides access to OSSA schemas, documentation, and agent manifests
 */

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { OSSALogger } from '../utils/logger.js';

const logger = new OSSALogger('ossa-resources');

export interface OSSAResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export class OSSAResources {
  private static resources: OSSAResource[] = [
    {
      uri: 'file://ossa/schemas/v0.2.0',
      name: 'ossa_schemas',
      description: 'OSSA v0.2.0 schema definitions and validation rules',
      mimeType: 'application/yaml'
    },
    {
      uri: 'file://ossa/templates/agents',
      name: 'agent_templates',
      description: 'Agent manifest templates and implementation patterns',
      mimeType: 'application/yaml'
    },
    {
      uri: 'file://ossa/compliance/rules',
      name: 'compliance_rules',
      description: 'OSSA compliance validation rules and standards',
      mimeType: 'application/json'
    },
    {
      uri: 'file://ossa/docs/guides',
      name: 'documentation',
      description: 'OSSA documentation and implementation guides',
      mimeType: 'text/markdown'
    },
    {
      uri: 'file://ossa/roadmap',
      name: 'roadmap',
      description: 'OSSA development roadmap and milestones',
      mimeType: 'text/markdown'
    },
    {
      uri: 'file://ossa/agents/registry',
      name: 'agent_registry',
      description: 'Registered OSSA agents and their capabilities',
      mimeType: 'application/json'
    }
  ];

  static getResources(): OSSAResource[] {
    return this.resources;
  }

  static async readResource(uri: string): Promise<any> {
    logger.info(`Reading resource: ${uri}`);

    try {
      const resourcePath = this.uriToPath(uri);
      
      if (!resourcePath) {
        throw new Error(`Unknown resource URI: ${uri}`);
      }

      const content = await fs.readFile(resourcePath, 'utf-8');
      const resource = this.resources.find(r => r.uri === uri);
      
      return {
        contents: [
          {
            uri: uri,
            mimeType: resource?.mimeType || 'text/plain',
            text: content
          }
        ]
      };
    } catch (error) {
      logger.error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private static uriToPath(uri: string): string | null {
    const projectRoot = process.cwd();
    
    switch (uri) {
      case 'file://ossa/schemas/v0.2.0':
        return join(projectRoot, 'src', 'schemas', 'ossa-v0.2.0-schema.yaml');
      
      case 'file://ossa/templates/agents':
        return join(projectRoot, 'src', 'templates', 'voice-mcp-agent-manifest.yaml');
      
      case 'file://ossa/compliance/rules':
        return join(projectRoot, 'src', 'core', 'compliance', 'ComplianceEngine.ts');
      
      case 'file://ossa/docs/guides':
        return join(projectRoot, 'docs', 'guides', 'best-practices.md');
      
      case 'file://ossa/roadmap':
        return join(projectRoot, 'ROADMAP.md');
      
      case 'file://ossa/agents/registry':
        return join(projectRoot, '.agents', 'registry.yml');
      
      default:
        return null;
    }
  }

  static async listAgentManifests(): Promise<string[]> {
    try {
      const agentsDir = join(process.cwd(), '.agents');
      const entries = await fs.readdir(agentsDir, { withFileTypes: true });
      
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      logger.error(`Failed to list agent manifests: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  static async getAgentManifest(agentName: string): Promise<any> {
    try {
      const manifestPath = join(process.cwd(), '.agents', agentName, 'agent.yml');
      const content = await fs.readFile(manifestPath, 'utf-8');
      
      return {
        uri: `file://ossa/agents/${agentName}`,
        name: agentName,
        mimeType: 'application/yaml',
        text: content
      };
    } catch (error) {
      logger.error(`Failed to get agent manifest for ${agentName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  static async getSchemaValidationRules(): Promise<any> {
    try {
      const schemaPath = join(process.cwd(), 'src', 'schemas', 'ossa-v0.2.0-schema.yaml');
      const content = await fs.readFile(schemaPath, 'utf-8');
      
      return {
        uri: 'file://ossa/schemas/validation-rules',
        name: 'validation_rules',
        mimeType: 'application/yaml',
        text: content
      };
    } catch (error) {
      logger.error(`Failed to get schema validation rules: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  static async getDocumentationIndex(): Promise<any> {
    try {
      const docsDir = join(process.cwd(), 'docs');
      const entries = await fs.readdir(docsDir, { withFileTypes: true });
      
      const docs = [];
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = await fs.readFile(join(docsDir, entry.name), 'utf-8');
          docs.push({
            name: entry.name,
            path: join(docsDir, entry.name),
            content: content.substring(0, 500) + '...' // Preview
          });
        }
      }
      
      return {
        uri: 'file://ossa/docs/index',
        name: 'documentation_index',
        mimeType: 'application/json',
        text: JSON.stringify(docs, null, 2)
      };
    } catch (error) {
      logger.error(`Failed to get documentation index: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
