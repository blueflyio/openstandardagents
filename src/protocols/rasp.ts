import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIV3_1 } from 'openapi-types';

/**
 * RASP - Roadmap-Aware Specification Protocol
 *
 * Parses ROADMAP.md annotations to generate OpenAPI 3.1 specifications
 * for OSSA agent implementations and roadmap features.
 */

interface RoadmapAnnotation {
  phase: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'planned' | 'in_progress' | 'complete';
  commands?: string[];
  endpoints?: string[];
  schemas?: string[];
}

interface RaspConfig {
  roadmapPath: string;
  outputPath?: string;
  version: string;
  title: string;
}

export class RoadmapSpecificationParser {
  private config: RaspConfig;
  private annotations: Map<string, RoadmapAnnotation> = new Map();

  constructor(config: RaspConfig) {
    this.config = config;
  }

  /**
   * Parse ROADMAP.md and extract annotated features
   */
  public parseRoadmap(): RoadmapAnnotation[] {
    const roadmapContent = fs.readFileSync(this.config.roadmapPath, 'utf-8');
    const lines = roadmapContent.split('\n');

    let currentPhase = '';
    let currentPriority: RoadmapAnnotation['priority'] = 'MEDIUM';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract phase information
      if (line.startsWith('## ') && line.includes('Phase')) {
        currentPhase = this.extractPhase(line);
      }

      // Extract priority from context
      if (line.includes('Priority') && line.includes('**')) {
        currentPriority = this.extractPriority(line);
      }

      // Parse CLI commands with RASP annotations
      if (line.includes('```bash') && i + 1 < lines.length) {
        const commands = this.parseCommandBlock(lines, i + 1);
        if (commands.length > 0) {
          this.annotations.set(`${currentPhase}-commands`, {
            phase: currentPhase,
            priority: currentPriority,
            status: 'planned',
            commands
          });
        }
      }

      // Parse task lists with status indicators
      if (line.match(/^- \[[ x]\]/)) {
        const task = this.parseTask(line);
        if (task) {
          const key = `${currentPhase}-${task.name}`;
          this.annotations.set(key, {
            phase: currentPhase,
            priority: currentPriority,
            status: task.status,
            endpoints: task.endpoints,
            schemas: task.schemas
          });
        }
      }
    }

    return Array.from(this.annotations.values());
  }

  /**
   * Generate OpenAPI 3.1 specification from roadmap annotations
   */
  public generateOpenAPI(): OpenAPIV3_1.Document {
    const annotations = this.parseRoadmap();

    const spec: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: 'OSSA agent specification generated from roadmap annotations'
      },
      paths: {},
      components: {
        schemas: {}
      }
    };

    // Generate paths from command annotations
    annotations.forEach((annotation) => {
      if (annotation.commands) {
        this.addCommandPaths(spec, annotation);
      }
      if (annotation.endpoints) {
        this.addEndpointPaths(spec, annotation);
      }
      if (annotation.schemas) {
        this.addSchemas(spec, annotation);
      }
    });

    return spec;
  }

  /**
   * Write generated specification to file
   */
  public writeSpecification(spec: OpenAPIV3_1.Document): void {
    const outputPath = this.config.outputPath || 'roadmap-spec.yml';
    const yamlContent = this.specToYaml(spec);
    fs.writeFileSync(outputPath, yamlContent);
  }

  private extractPhase(line: string): string {
    const match = line.match(/Phase (\d+):\s*(.+?)(?:\s*\(|$)/);
    return match ? `phase-${match[1]}` : 'unknown-phase';
  }

  private extractPriority(line: string): RoadmapAnnotation['priority'] {
    if (line.includes('CRITICAL')) return 'CRITICAL';
    if (line.includes('HIGH')) return 'HIGH';
    if (line.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private parseCommandBlock(lines: string[], startIndex: number): string[] {
    const commands: string[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '```') break;
      if (line.startsWith('ossa ') || line.startsWith('opcua-') || line.startsWith('uadp-')) {
        commands.push(line);
      }
    }
    return commands;
  }

  private parseTask(line: string): {
    name: string;
    status: RoadmapAnnotation['status'];
    endpoints?: string[];
    schemas?: string[];
  } | null {
    const completed = line.includes('[x]');
    const match = line.match(/- \[[ x]\]\s+\*\*(.+?)\*\*/);

    if (!match) return null;

    const name = match[1].toLowerCase().replace(/\s+/g, '-');
    const status: RoadmapAnnotation['status'] = completed ? 'complete' : 'planned';

    return { name, status };
  }

  private addCommandPaths(spec: OpenAPIV3_1.Document, annotation: RoadmapAnnotation): void {
    annotation.commands?.forEach((command) => {
      const pathKey = this.commandToPath(command);
      if (pathKey && spec.paths && !spec.paths[pathKey]) {
        spec.paths![pathKey] = {
          post: {
            summary: `Execute ${command}`,
            tags: [annotation.phase],
            operationId: this.commandToOperationId(command),
            requestBody: {
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            },
            responses: {
              '200': {
                description: 'Command executed successfully',
                content: {
                  'application/json': {
                    schema: { type: 'object' }
                  }
                }
              }
            }
          }
        };
      }
    });
  }

  private addEndpointPaths(spec: OpenAPIV3_1.Document, annotation: RoadmapAnnotation): void {
    // Implementation for endpoint paths would go here
    // This is a stub for the core functionality
  }

  private addSchemas(spec: OpenAPIV3_1.Document, annotation: RoadmapAnnotation): void {
    // Implementation for schema generation would go here
    // This is a stub for the core functionality
  }

  private commandToPath(command: string): string {
    const parts = command.split(' ').filter((p) => !p.startsWith('-'));
    if (parts.length < 2) return '';

    return `/api/v1/${parts[1].replace(/-/g, '/')}`;
  }

  private commandToOperationId(command: string): string {
    return command
      .split(' ')
      .slice(0, 2)
      .join('_')
      .replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private specToYaml(spec: OpenAPIV3_1.Document): string {
    // Simple YAML serialization - in production, use a proper YAML library
    return JSON.stringify(spec, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/\{$/gm, '')
      .replace(/\}$/gm, '')
      .replace(/\[$/gm, '')
      .replace(/\]$/gm, '');
  }
}

/**
 * Factory function to create RASP parser with default OSSA configuration
 */
export function createRaspParser(roadmapPath: string): RoadmapSpecificationParser {
  return new RoadmapSpecificationParser({
    roadmapPath,
    version: '0.1.9',
    title: 'OSSA Roadmap-Generated Specification'
  });
}

/**
 * Quick parse utility for CLI usage
 */
export function parseRoadmapToSpec(roadmapPath: string, outputPath?: string): OpenAPIV3_1.Document {
  const parser = createRaspParser(roadmapPath);
  const spec = parser.generateOpenAPI();

  if (outputPath) {
    parser.writeSpecification(spec);
  }

  return spec;
}
