import type { OpenAPIV3_1 } from 'openapi-types';

type OpenAPIObject = OpenAPIV3_1.Document;

/**
 * D3DataService - D3.js Compatible Data Preparation
 *
 * Prepares data in formats optimized for D3.js visualizations:
 * - Force-directed graphs
 * - Hierarchical layouts (tree, cluster, pack, partition)
 * - Network diagrams
 * - Sankey diagrams
 * - Chord diagrams
 *
 * SOLID Principles:
 * - Single Responsibility: D3 data transformation only
 * - Open/Closed: Extensible for new D3 layout types
 * - Interface Segregation: Separate methods for each layout
 */

export interface D3Node {
  id: string;
  name: string;
  type: string;
  group?: number;
  value?: number;
  x?: number;
  y?: number;
  metadata?: any;
}

export interface D3Link {
  source: string;
  target: string;
  value?: number;
  type?: string;
  label?: string;
}

export interface D3ForceGraphData {
  nodes: D3Node[];
  links: D3Link[];
}

export interface D3HierarchyNode {
  name: string;
  value?: number;
  children?: D3HierarchyNode[];
  metadata?: any;
}

export interface D3SankeyData {
  nodes: Array<{ id: string; name: string }>;
  links: Array<{ source: number; target: number; value: number }>;
}

export interface D3ChordData {
  names: string[];
  matrix: number[][];
}

/**
 * Service for preparing D3.js compatible data structures
 */
export class D3DataService {
  /**
   * Generate force-directed graph data
   * Perfect for agent relationship visualization
   */
  async generateForceGraph(spec: OpenAPIObject): Promise<D3ForceGraphData> {
    const nodes = await this.extractNodes(spec);
    const links = await this.extractLinks(spec);

    // Assign groups based on agent type
    const typeMap = this.createTypeMap(nodes);

    const d3Nodes: D3Node[] = nodes.map((node, index) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      group: typeMap.get(node.type) || 0,
      value: this.calculateNodeValue(node),
      metadata: node.metadata
    }));

    const d3Links: D3Link[] = links.map((link) => ({
      source: link.from,
      target: link.to,
      value: link.weight || 1,
      type: link.type,
      label: link.label
    }));

    return { nodes: d3Nodes, links: d3Links };
  }

  /**
   * Generate hierarchical tree data
   * Perfect for agent taxonomy visualization
   */
  async generateHierarchy(spec: OpenAPIObject): Promise<D3HierarchyNode> {
    const root: D3HierarchyNode = {
      name: 'OSSA Agents',
      children: []
    };

    // Group agents by type
    const schemas = spec.components?.schemas || {};
    const agentGroups = new Map<string, any[]>();

    for (const [name, schema] of Object.entries(schemas)) {
      if (this.isAgentSchema(schema)) {
        const type = this.getAgentType(schema);

        if (!agentGroups.has(type)) {
          agentGroups.set(type, []);
        }

        agentGroups.get(type)?.push({
          name,
          schema,
          value: this.calculateSchemaComplexity(schema)
        });
      }
    }

    // Build hierarchy
    for (const [type, agents] of agentGroups.entries()) {
      const typeNode: D3HierarchyNode = {
        name: type,
        children: agents.map((agent) => ({
          name: agent.name,
          value: agent.value,
          metadata: agent.schema
        }))
      };

      root.children?.push(typeNode);
    }

    return root;
  }

  /**
   * Generate circular pack layout data
   * Perfect for showing relative agent sizes/complexity
   */
  async generateCirclePack(spec: OpenAPIObject): Promise<D3HierarchyNode> {
    // Similar to hierarchy but optimized for circle packing
    return this.generateHierarchy(spec);
  }

  /**
   * Generate treemap data
   * Perfect for showing proportions and nesting
   */
  async generateTreemap(spec: OpenAPIObject): Promise<D3HierarchyNode> {
    const hierarchy = await this.generateHierarchy(spec);

    // Calculate values for proper sizing
    this.calculateHierarchyValues(hierarchy);

    return hierarchy;
  }

  /**
   * Generate Sankey diagram data
   * Perfect for showing data/message flow between agents
   */
  async generateSankey(flows: Array<{ from: string; to: string; volume: number }>): Promise<D3SankeyData> {
    // Extract unique nodes
    const nodeSet = new Set<string>();
    flows.forEach((flow) => {
      nodeSet.add(flow.from);
      nodeSet.add(flow.to);
    });

    const nodes = Array.from(nodeSet).map((name, index) => ({
      id: name,
      name
    }));

    // Create node index map
    const nodeIndex = new Map<string, number>();
    nodes.forEach((node, index) => {
      nodeIndex.set(node.id, index);
    });

    // Convert flows to links
    const links = flows.map((flow) => ({
      source: nodeIndex.get(flow.from) || 0,
      target: nodeIndex.get(flow.to) || 0,
      value: flow.volume
    }));

    return { nodes, links };
  }

  /**
   * Generate chord diagram data
   * Perfect for showing bidirectional relationships
   */
  async generateChord(interactions: Array<{ agent1: string; agent2: string; count: number }>): Promise<D3ChordData> {
    // Extract unique agents
    const agentSet = new Set<string>();
    interactions.forEach((int) => {
      agentSet.add(int.agent1);
      agentSet.add(int.agent2);
    });

    const names = Array.from(agentSet);
    const size = names.length;

    // Create index map
    const agentIndex = new Map<string, number>();
    names.forEach((name, index) => {
      agentIndex.set(name, index);
    });

    // Initialize matrix
    const matrix: number[][] = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0));

    // Fill matrix
    interactions.forEach((int) => {
      const i = agentIndex.get(int.agent1);
      const j = agentIndex.get(int.agent2);

      if (i !== undefined && j !== undefined) {
        matrix[i][j] = int.count;
        matrix[j][i] = int.count; // Symmetric
      }
    });

    return { names, matrix };
  }

  /**
   * Generate network topology data
   * Perfect for showing infrastructure layout
   */
  async generateNetworkTopology(spec: OpenAPIObject): Promise<{
    nodes: D3Node[];
    links: D3Link[];
    layers: Map<number, string[]>;
  }> {
    const forceData = await this.generateForceGraph(spec);

    // Assign layers based on agent type hierarchy
    const layers = new Map<number, string[]>();

    // Layer 0: Orchestrators
    // Layer 1: Workers and Critics
    // Layer 2: Monitors and Governors

    forceData.nodes.forEach((node) => {
      const layer = this.getAgentLayer(node.type);

      if (!layers.has(layer)) {
        layers.set(layer, []);
      }

      layers.get(layer)?.push(node.id);
    });

    return {
      ...forceData,
      layers
    };
  }

  /**
   * Generate sunburst data
   * Perfect for hierarchical proportion visualization
   */
  async generateSunburst(spec: OpenAPIObject): Promise<D3HierarchyNode> {
    return this.generateHierarchy(spec);
  }

  /**
   * Generate matrix visualization data
   * Perfect for showing agent interaction patterns
   */
  async generateMatrix(spec: OpenAPIObject): Promise<{
    nodes: string[];
    matrix: number[][];
    metadata: Map<string, any>;
  }> {
    const nodes = await this.extractNodes(spec);
    const links = await this.extractLinks(spec);

    const nodeNames = nodes.map((n) => n.name);
    const size = nodeNames.length;

    // Create index map
    const nodeIndex = new Map<string, number>();
    nodeNames.forEach((name, index) => {
      nodeIndex.set(name, index);
    });

    // Initialize matrix
    const matrix: number[][] = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0));

    // Fill matrix based on links
    links.forEach((link) => {
      const sourceIdx = nodeIndex.get(link.from);
      const targetIdx = nodeIndex.get(link.to);

      if (sourceIdx !== undefined && targetIdx !== undefined) {
        matrix[sourceIdx][targetIdx] = link.weight || 1;
      }
    });

    // Create metadata map
    const metadata = new Map<string, any>();
    nodes.forEach((node) => {
      metadata.set(node.name, node.metadata);
    });

    return { nodes: nodeNames, matrix, metadata };
  }

  /**
   * Generate time-series data for agent activity
   */
  generateTimeSeries(
    agentId: string,
    events: Array<{ timestamp: number; value: number; type: string }>
  ): Array<{ date: Date; value: number; type: string }> {
    return events.map((event) => ({
      date: new Date(event.timestamp),
      value: event.value,
      type: event.type
    }));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async extractNodes(spec: OpenAPIObject): Promise<any[]> {
    const nodes: any[] = [];
    const schemas = spec.components?.schemas || {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (this.isAgentSchema(schema)) {
        nodes.push({
          id: this.sanitizeId(name),
          name,
          type: this.getAgentType(schema),
          metadata: schema
        });
      }
    }

    return nodes;
  }

  private async extractLinks(spec: OpenAPIObject): Promise<any[]> {
    const links: any[] = [];
    const schemas = spec.components?.schemas || {};

    for (const [name, schema] of Object.entries(schemas)) {
      if (!schema || typeof schema !== 'object') continue;

      // Extract from allOf (inheritance)
      if ('allOf' in schema && Array.isArray(schema.allOf)) {
        for (const item of schema.allOf) {
          if (item && typeof item === 'object' && '$ref' in item) {
            const refName = this.extractRefName(item.$ref);
            links.push({
              from: this.sanitizeId(name),
              to: this.sanitizeId(refName),
              type: 'extends',
              weight: 2
            });
          }
        }
      }

      // Extract from properties (composition)
      if ('properties' in schema && schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (propSchema && typeof propSchema === 'object' && '$ref' in propSchema) {
            const refName = this.extractRefName(propSchema.$ref);
            links.push({
              from: this.sanitizeId(name),
              to: this.sanitizeId(refName),
              type: 'uses',
              label: propName,
              weight: 1
            });
          }
        }
      }
    }

    return links;
  }

  private createTypeMap(nodes: any[]): Map<string, number> {
    const types = [...new Set(nodes.map((n) => n.type))];
    const typeMap = new Map<string, number>();

    types.forEach((type, index) => {
      typeMap.set(type, index);
    });

    return typeMap;
  }

  private calculateNodeValue(node: any): number {
    // Calculate based on capabilities, connections, etc.
    let value = 10; // Base value

    if (node.metadata?.properties) {
      value += Object.keys(node.metadata.properties).length * 2;
    }

    if (node.metadata?.required) {
      value += node.metadata.required.length * 3;
    }

    return value;
  }

  private calculateSchemaComplexity(schema: any): number {
    if (!schema || typeof schema !== 'object') return 1;

    let complexity = 1;

    if (schema.properties) {
      complexity += Object.keys(schema.properties).length;
    }

    if (schema.required) {
      complexity += schema.required.length;
    }

    if (schema.allOf) {
      complexity += schema.allOf.length * 2;
    }

    return complexity;
  }

  private calculateHierarchyValues(node: D3HierarchyNode): number {
    if (!node.children || node.children.length === 0) {
      return node.value || 1;
    }

    let total = 0;
    for (const child of node.children) {
      total += this.calculateHierarchyValues(child);
    }

    node.value = total;
    return total;
  }

  private isAgentSchema(schema: any): boolean {
    if (!schema || typeof schema !== 'object') return false;

    return 'properties' in schema && (schema.properties?.type || schema.properties?.capabilities);
  }

  private getAgentType(schema: any): string {
    if (schema?.properties?.type && typeof schema.properties.type === 'object') {
      if ('enum' in schema.properties.type && Array.isArray(schema.properties.type.enum)) {
        return schema.properties.type.enum[0] || 'worker';
      }
    }
    return 'worker';
  }

  private getAgentLayer(type: string): number {
    const layers: Record<string, number> = {
      orchestrator: 0,
      worker: 1,
      critic: 1,
      monitor: 2,
      governor: 2,
      judge: 2
    };

    return layers[type.toLowerCase()] || 1;
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

export default D3DataService;
