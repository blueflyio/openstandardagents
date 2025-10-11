import type { OpenAPIV3_1 } from 'openapi-types';

type OpenAPIObject = OpenAPIV3_1.Document;

/**
 * GraphvizService - DOT Format Graph Generator
 *
 * Generates Graphviz DOT format graphs for agent relationships and dependencies.
 * More powerful than Mermaid for complex layouts and advanced styling.
 *
 * SOLID Principles:
 * - Single Responsibility: DOT graph generation
 * - Open/Closed: Extensible graph types and styles
 * - Dependency Inversion: Uses abstract OpenAPI types
 */

export interface GraphvizOptions {
  rankdir?: 'TB' | 'LR' | 'BT' | 'RL';
  layout?: 'dot' | 'neato' | 'fdp' | 'sfdp' | 'circo' | 'twopi';
  style?: 'minimal' | 'detailed' | 'colorful' | 'hierarchical';
  cluster?: boolean;
  showAttributes?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  attributes?: Record<string, string>;
  metadata?: any;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  type?: string;
  weight?: number;
}

/**
 * Service for generating DOT format graphs
 */
export class GraphvizService {
  /**
   * Generate directed graph (digraph) from OpenAPI spec
   */
  async generateDigraph(spec: OpenAPIObject, options: GraphvizOptions = {}): Promise<string> {
    const { rankdir = 'TB', layout = 'dot', style = 'detailed' } = options;

    let dot = `digraph OSSA {\n`;
    dot += `  rankdir=${rankdir};\n`;
    dot += `  layout=${layout};\n`;
    dot += this.getGraphAttributes(style);

    // Extract and add nodes
    const nodes = await this.extractNodes(spec);
    for (const node of nodes) {
      dot += this.generateNodeDOT(node, style);
    }

    // Extract and add edges
    const edges = await this.extractEdges(spec);
    for (const edge of edges) {
      dot += this.generateEdgeDOT(edge, style);
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate clustered graph grouping agents by type
   */
  async generateClusteredGraph(nodes: GraphNode[], edges: GraphEdge[], options: GraphvizOptions = {}): Promise<string> {
    const { rankdir = 'LR', style = 'colorful' } = options;

    let dot = `digraph OSSA_Clustered {\n`;
    dot += `  rankdir=${rankdir};\n`;
    dot += `  compound=true;\n`;
    dot += this.getGraphAttributes(style);

    // Group nodes by type
    const clusters = this.groupNodesByType(nodes);

    for (const [type, typeNodes] of Object.entries(clusters)) {
      dot += `\n  subgraph cluster_${type} {\n`;
      dot += `    label="${type.toUpperCase()} AGENTS";\n`;
      dot += this.getClusterStyle(type);

      for (const node of typeNodes) {
        dot += `    ${this.generateNodeDOT(node, style)}`;
      }

      dot += '  }\n';
    }

    // Add edges
    dot += '\n';
    for (const edge of edges) {
      dot += this.generateEdgeDOT(edge, style);
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate dependency graph showing agent dependencies
   */
  async generateDependencyGraph(spec: OpenAPIObject): Promise<string> {
    let dot = `digraph Dependencies {\n`;
    dot += '  rankdir=BT;\n';
    dot += '  node [shape=box, style=filled, fillcolor=lightblue];\n';

    const dependencies = this.extractDependencies(spec);

    for (const dep of dependencies) {
      dot += `  "${dep.agent}" -> "${dep.dependency}" [label="${dep.type}"];\n`;
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate execution flow graph
   */
  async generateExecutionFlow(workflow: string[], options: GraphvizOptions = {}): Promise<string> {
    let dot = `digraph ExecutionFlow {\n`;
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=ellipse, style=filled];\n';

    for (let i = 0; i < workflow.length; i++) {
      const step = workflow[i];
      const color = this.getFlowColor(i, workflow.length);
      dot += `  step_${i} [label="${step}", fillcolor="${color}"];\n`;

      if (i > 0) {
        dot += `  step_${i - 1} -> step_${i};\n`;
      }
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate capability map showing agent capabilities
   */
  async generateCapabilityMap(agents: GraphNode[], capabilities: Map<string, string[]>): Promise<string> {
    let dot = `digraph CapabilityMap {\n`;
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n';

    // Capability nodes (left side)
    const allCaps = new Set<string>();
    for (const caps of capabilities.values()) {
      caps.forEach((cap) => allCaps.add(cap));
    }

    dot += '  subgraph cluster_capabilities {\n';
    dot += '    label="Capabilities";\n';
    dot += '    style=filled;\n';
    dot += '    fillcolor=lightyellow;\n';

    for (const cap of allCaps) {
      dot += `    cap_${this.sanitizeId(cap)} [label="${cap}", shape=diamond];\n`;
    }

    dot += '  }\n';

    // Agent nodes (right side)
    dot += '  subgraph cluster_agents {\n';
    dot += '    label="Agents";\n';
    dot += '    style=filled;\n';
    dot += '    fillcolor=lightblue;\n';

    for (const agent of agents) {
      dot += `    ${agent.id} [label="${agent.label}"];\n`;
    }

    dot += '  }\n';

    // Connect agents to capabilities
    for (const [agentId, caps] of capabilities.entries()) {
      for (const cap of caps) {
        dot += `  cap_${this.sanitizeId(cap)} -> ${agentId} [style=dashed];\n`;
      }
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Generate communication graph showing message flows
   */
  async generateCommunicationGraph(messages: Array<{ from: string; to: string; protocol: string }>): Promise<string> {
    let dot = `digraph Communication {\n`;
    dot += '  rankdir=LR;\n';
    dot += '  edge [fontsize=10];\n';

    const protocols = new Set(messages.map((m) => m.protocol));

    for (const msg of messages) {
      const color = this.getProtocolColor(msg.protocol);
      dot += `  "${msg.from}" -> "${msg.to}" [label="${msg.protocol}", color="${color}"];\n`;
    }

    // Add legend
    dot += '\n  subgraph cluster_legend {\n';
    dot += '    label="Protocols";\n';
    dot += '    style=filled;\n';
    dot += '    fillcolor=lightgray;\n';

    for (const protocol of protocols) {
      const color = this.getProtocolColor(protocol);
      dot += `    ${protocol} [shape=plaintext, fontcolor="${color}"];\n`;
    }

    dot += '  }\n';
    dot += '}\n';

    return dot;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async extractNodes(spec: OpenAPIObject): Promise<GraphNode[]> {
    const nodes: GraphNode[] = [];
    const schemas = spec.components?.schemas || {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (schema && typeof schema === 'object' && this.isAgentSchema(schema)) {
        nodes.push({
          id: this.sanitizeId(name),
          label: name,
          type: this.getSchemaType(schema),
          attributes: this.extractAttributes(schema),
          metadata: schema
        });
      }
    }

    return nodes;
  }

  private async extractEdges(spec: OpenAPIObject): Promise<GraphEdge[]> {
    const edges: GraphEdge[] = [];

    // Extract from schema relationships ($ref, allOf, oneOf)
    const schemas = spec.components?.schemas || {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (!schema || typeof schema !== 'object') continue;

      // Handle allOf (inheritance)
      if ('allOf' in schema && Array.isArray(schema.allOf)) {
        for (const item of schema.allOf) {
          if (item && typeof item === 'object' && '$ref' in item) {
            const refName = this.extractRefName(item.$ref);
            edges.push({
              from: this.sanitizeId(name),
              to: this.sanitizeId(refName),
              type: 'extends',
              label: 'extends'
            });
          }
        }
      }

      // Handle property references
      if ('properties' in schema && schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (propSchema && typeof propSchema === 'object' && '$ref' in propSchema) {
            const refName = this.extractRefName(propSchema.$ref);
            edges.push({
              from: this.sanitizeId(name),
              to: this.sanitizeId(refName),
              type: 'uses',
              label: propName
            });
          }
        }
      }
    }

    return edges;
  }

  private generateNodeDOT(node: GraphNode, style: string): string {
    const attrs = this.getNodeAttributes(node, style);
    return `  ${node.id} [${attrs}];\n`;
  }

  private generateEdgeDOT(edge: GraphEdge, style: string): string {
    const attrs = this.getEdgeAttributes(edge, style);
    const label = edge.label ? `, label="${edge.label}"` : '';
    return `  ${edge.from} -> ${edge.to} [${attrs}${label}];\n`;
  }

  private getGraphAttributes(style: string): string {
    const styles: Record<string, string> = {
      minimal: '  node [shape=box];\n',
      detailed: `  node [shape=box, style="rounded,filled", fontname="Arial"];\n  edge [fontname="Arial", fontsize=10];\n`,
      colorful: `  node [style="rounded,filled,bold", fontname="Arial", fontsize=12];\n  edge [penwidth=2, fontname="Arial"];\n`,
      hierarchical: `  node [shape=box, style=filled];\n  edge [arrowsize=0.8];\n`
    };

    return styles[style] || styles.detailed;
  }

  private getNodeAttributes(node: GraphNode, style: string): string {
    const color = this.getTypeColor(node.type);

    if (style === 'minimal') {
      return `label="${node.label}"`;
    }

    if (style === 'colorful') {
      return `label="${node.label}", fillcolor="${color}", fontcolor="white", penwidth=2`;
    }

    return `label="${node.label}", fillcolor="${color}"`;
  }

  private getEdgeAttributes(edge: GraphEdge, style: string): string {
    const color = edge.type === 'extends' ? 'blue' : 'black';
    const arrowStyle = edge.type === 'extends' ? 'empty' : 'normal';

    if (style === 'minimal') {
      return `color="${color}"`;
    }

    return `color="${color}", arrowhead="${arrowStyle}", penwidth=1.5`;
  }

  private getClusterStyle(type: string): string {
    const colors: Record<string, string> = {
      worker: 'lightblue',
      orchestrator: 'lightgreen',
      critic: 'lightyellow',
      judge: 'lightpink',
      governor: 'lightcoral',
      monitor: 'lightcyan'
    };

    const color = colors[type.toLowerCase()] || 'lightgray';

    return `    style=filled;\n    fillcolor=${color};\n    fontsize=14;\n    fontname="Arial Bold";\n`;
  }

  private getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      worker: '#3498db',
      orchestrator: '#2ecc71',
      critic: '#f39c12',
      judge: '#e74c3c',
      governor: '#9b59b6',
      monitor: '#1abc9c',
      default: '#95a5a6'
    };

    return colors[type.toLowerCase()] || colors.default;
  }

  private getProtocolColor(protocol: string): string {
    const colors: Record<string, string> = {
      HTTP: 'blue',
      GRPC: 'green',
      KAFKA: 'orange',
      MQTT: 'purple',
      WEBSOCKET: 'red'
    };

    return colors[protocol.toUpperCase()] || 'black';
  }

  private getFlowColor(index: number, total: number): string {
    const hue = (index / total) * 360;
    return `"hsl(${hue}, 70%, 70%)"`;
  }

  private groupNodesByType(nodes: GraphNode[]): Record<string, GraphNode[]> {
    const groups: Record<string, GraphNode[]> = {};

    for (const node of nodes) {
      if (!groups[node.type]) {
        groups[node.type] = [];
      }
      groups[node.type].push(node);
    }

    return groups;
  }

  private extractDependencies(spec: OpenAPIObject): Array<{
    agent: string;
    dependency: string;
    type: string;
  }> {
    // Simplified: parse dependencies from spec
    return [];
  }

  private isAgentSchema(schema: any): boolean {
    return 'properties' in schema && (schema.properties?.type || schema.properties?.capabilities);
  }

  private getSchemaType(schema: any): string {
    if (schema.properties?.type && typeof schema.properties.type === 'object') {
      if ('enum' in schema.properties.type && Array.isArray(schema.properties.type.enum)) {
        return schema.properties.type.enum[0] || 'worker';
      }
    }
    return 'worker';
  }

  private extractAttributes(schema: any): Record<string, string> {
    const attrs: Record<string, string> = {};

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        if (value && typeof value === 'object' && 'type' in value) {
          attrs[key] = String(value.type);
        }
      }
    }

    return attrs;
  }

  private extractRefName(ref: any): string {
    if (typeof ref === 'string') {
      return ref.split('/').pop() || ref;
    }
    return 'unknown';
  }

  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}

export default GraphvizService;
