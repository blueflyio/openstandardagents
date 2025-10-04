import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { OpenAPIV3_1 } from 'openapi-types';

type OpenAPIObject = OpenAPIV3_1.Document;

/**
 * MermaidService - OpenAPI to Mermaid Diagram Generator
 *
 * Generates Mermaid diagrams from OpenAPI 3.1 specifications following SOLID principles:
 * - Single Responsibility: Focus on Mermaid generation only
 * - Open/Closed: Extensible for new diagram types
 * - Liskov Substitution: Implements DiagramGenerator interface
 * - Interface Segregation: Specific methods for each diagram type
 * - Dependency Inversion: Depends on abstractions (OpenAPI types)
 */

export interface DiagramOptions {
  title?: string;
  orientation?: 'TB' | 'LR' | 'BT' | 'RL';
  showMetadata?: boolean;
  includeSchemas?: boolean;
}

export interface AgentNode {
  id: string;
  name: string;
  type: string;
  capabilities?: string[];
}

export interface AgentRelationship {
  from: string;
  to: string;
  type: 'invokes' | 'depends' | 'observes' | 'governs';
  label?: string;
}

/**
 * Main service class for generating Mermaid diagrams
 */
export class MermaidService {
  /**
   * Generate flowchart diagram from OpenAPI specification
   */
  async generateFlowchart(spec: OpenAPIObject, options: DiagramOptions = {}): Promise<string> {
    const { orientation = 'TB', title = 'Agent Flow' } = options;

    let diagram = `flowchart ${orientation}\n`;
    if (title) {
      diagram += `  title["${title}"]\n`;
    }

    // Extract agents from paths
    const agents = this.extractAgentsFromPaths(spec);

    // Generate nodes
    for (const agent of agents) {
      const shape = this.getNodeShape(agent.type);
      diagram += `  ${agent.id}${shape}${agent.name}${shape}\n`;
    }

    // Generate relationships
    const relationships = this.extractRelationships(spec, agents);
    for (const rel of relationships) {
      const arrow = this.getArrowType(rel.type);
      const label = rel.label ? `|${rel.label}|` : '';
      diagram += `  ${rel.from} ${arrow}${label} ${rel.to}\n`;
    }

    return diagram;
  }

  /**
   * Generate class diagram showing agent hierarchy
   */
  async generateClassDiagram(spec: OpenAPIObject): Promise<string> {
    let diagram = 'classDiagram\n';

    const schemas = spec.components?.schemas || {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (this.isAgentSchema(schema)) {
        diagram += this.generateClassNode(name, schema);

        // Add inheritance relationships
        const parent = this.getParentSchema(schema);
        if (parent) {
          diagram += `  ${parent} <|-- ${name}\n`;
        }
      }
    }

    return diagram;
  }

  /**
   * Generate sequence diagram for agent interactions
   */
  async generateSequenceDiagram(spec: OpenAPIObject, workflow: string[]): Promise<string> {
    let diagram = 'sequenceDiagram\n';
    diagram += '  autonumber\n';

    for (let i = 0; i < workflow.length - 1; i++) {
      const from = workflow[i];
      const to = workflow[i + 1];
      const operation = this.findOperation(spec, from, to);
      const label = operation?.summary || 'execute';

      diagram += `  ${from}->>+${to}: ${label}\n`;
      diagram += `  ${to}-->>-${from}: result\n`;
    }

    return diagram;
  }

  /**
   * Generate state diagram for agent lifecycle
   */
  async generateStateDiagram(): Promise<string> {
    return `stateDiagram-v2
  [*] --> Registered
  Registered --> Discovering: discover
  Discovering --> Ready: capabilities_found
  Ready --> Executing: task_assigned
  Executing --> Monitoring: task_started
  Monitoring --> Evaluating: task_completed
  Evaluating --> Ready: approved
  Evaluating --> Blocked: rejected
  Blocked --> Ready: fixed
  Ready --> Deregistered: shutdown
  Deregistered --> [*]
`;
  }

  /**
   * Generate entity relationship diagram (ERD)
   */
  async generateERD(spec: OpenAPIObject): Promise<string> {
    let diagram = 'erDiagram\n';

    const schemas = spec.components?.schemas || {};

    for (const [entityName, schema] of Object.entries(schemas)) {
      if (schema && typeof schema === 'object' && 'properties' in schema) {
        diagram += `  ${entityName} {\n`;

        const properties = schema.properties || {};
        for (const [propName, propSchema] of Object.entries(properties)) {
          if (propSchema && typeof propSchema === 'object') {
            const type = 'type' in propSchema ? (propSchema.type as string) : 'object';
            const required = schema.required?.includes(propName) ? 'PK' : '';
            diagram += `    ${type} ${propName} ${required}\n`;
          }
        }

        diagram += '  }\n';
      }
    }

    // Add relationships
    const relationships = this.extractSchemaRelationships(schemas);
    for (const rel of relationships) {
      diagram += `  ${rel.from} ${rel.cardinality} ${rel.to} : "${rel.label}"\n`;
    }

    return diagram;
  }

  /**
   * Generate architecture diagram (C4 model style)
   */
  async generateArchitectureDiagram(agents: AgentNode[], relationships: AgentRelationship[]): Promise<string> {
    let diagram = 'graph TB\n';
    diagram += '  subgraph "OSSA Agent Ecosystem"\n';

    // Group by agent type
    const groups = this.groupByType(agents);

    for (const [type, typeAgents] of Object.entries(groups)) {
      diagram += `    subgraph "${type}s"\n`;
      for (const agent of typeAgents) {
        diagram += `      ${agent.id}["${agent.name}"]\n`;
      }
      diagram += '    end\n';
    }

    diagram += '  end\n\n';

    // Add relationships
    for (const rel of relationships) {
      diagram += `  ${rel.from} --> ${rel.to}\n`;
    }

    return diagram;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractAgentsFromPaths(spec: OpenAPIObject): AgentNode[] {
    const agents: AgentNode[] = [];
    const paths = spec.paths || {};

    for (const [pathStr, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      const agentMatch = pathStr.match(/\/agents\/([^\/]+)/);
      if (agentMatch) {
        const agentId = agentMatch[1];
        const agentType = this.inferAgentType(pathStr);

        agents.push({
          id: agentId.replace(/-/g, '_'),
          name: agentId,
          type: agentType
        });
      }
    }

    return agents;
  }

  private extractRelationships(spec: OpenAPIObject, agents: AgentNode[]): AgentRelationship[] {
    const relationships: AgentRelationship[] = [];

    // Extract from OpenAPI callbacks and links
    const paths = spec.paths || {};
    for (const pathItem of Object.values(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const operation of Object.values(pathItem)) {
        if (!operation || typeof operation !== 'object') continue;

        if ('callbacks' in operation) {
          // Parse callback relationships
          // Simplified for brevity
        }
      }
    }

    return relationships;
  }

  private getNodeShape(agentType: string): string {
    const shapes: Record<string, string> = {
      worker: '[',
      orchestrator: '([',
      critic: '{',
      judge: '{{',
      governor: '[[',
      monitor: '[('
    };

    const close: Record<string, string> = {
      worker: ']',
      orchestrator: '])',
      critic: '}',
      judge: '}}',
      governor: ']]',
      monitor: ')]'
    };

    return shapes[agentType] || '[';
  }

  private getArrowType(relType: string): string {
    const arrows: Record<string, string> = {
      invokes: '-->',
      depends: '-.->',
      observes: '==>',
      governs: '--o'
    };

    return arrows[relType] || '-->';
  }

  private isAgentSchema(schema: any): boolean {
    if (!schema || typeof schema !== 'object') return false;

    return 'properties' in schema && (schema.properties?.type || schema.properties?.capabilities);
  }

  private generateClassNode(name: string, schema: any): string {
    let node = `  class ${name} {\n`;

    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propSchema && typeof propSchema === 'object' && 'type' in propSchema) {
          node += `    +${propSchema.type} ${propName}\n`;
        }
      }
    }

    node += '  }\n';
    return node;
  }

  private getParentSchema(schema: any): string | null {
    if (schema.allOf) {
      const ref = schema.allOf[0]?.$ref;
      if (ref) {
        return ref.split('/').pop() || null;
      }
    }
    return null;
  }

  private findOperation(spec: OpenAPIObject, from: string, to: string): any {
    // Simplified: should search paths for operations between agents
    return null;
  }

  private inferAgentType(pathStr: string): string {
    if (pathStr.includes('worker')) return 'worker';
    if (pathStr.includes('orchestrator')) return 'orchestrator';
    if (pathStr.includes('critic')) return 'critic';
    if (pathStr.includes('judge')) return 'judge';
    if (pathStr.includes('governor')) return 'governor';
    if (pathStr.includes('monitor')) return 'monitor';
    return 'worker';
  }

  private extractSchemaRelationships(schemas: any): any[] {
    // Simplified: extract $ref relationships
    return [];
  }

  private groupByType(agents: AgentNode[]): Record<string, AgentNode[]> {
    const groups: Record<string, AgentNode[]> = {};

    for (const agent of agents) {
      if (!groups[agent.type]) {
        groups[agent.type] = [];
      }
      groups[agent.type].push(agent);
    }

    return groups;
  }
}

export default MermaidService;
