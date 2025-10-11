import type { OpenAPIV3_1 } from 'openapi-types';

type OpenAPIObject = OpenAPIV3_1.Document;
import { MermaidService, type DiagramOptions, type AgentNode, type AgentRelationship } from './MermaidService.js';
import { GraphvizService, type GraphvizOptions, type GraphNode, type GraphEdge } from './GraphvizService.js';
import { D3DataService, type D3ForceGraphData, type D3HierarchyNode } from './D3DataService.js';
import * as yaml from 'yaml';
import * as fs from 'fs/promises';

/**
 * VisualizationService - Unified Visualization Orchestrator
 *
 * Facade pattern providing a single interface to all visualization services.
 * Implements dependency injection for SOLID compliance.
 *
 * Responsibilities:
 * - Coordinate between Mermaid, Graphviz, and D3 services
 * - Load and parse OpenAPI specifications
 * - Provide high-level visualization generation methods
 * - Handle file I/O and format conversions
 */

export type VisualizationType =
  | 'mermaid-flowchart'
  | 'mermaid-class'
  | 'mermaid-sequence'
  | 'mermaid-state'
  | 'mermaid-erd'
  | 'mermaid-architecture'
  | 'graphviz-digraph'
  | 'graphviz-cluster'
  | 'graphviz-dependency'
  | 'graphviz-execution'
  | 'graphviz-capability'
  | 'graphviz-communication'
  | 'd3-force'
  | 'd3-hierarchy'
  | 'd3-sankey'
  | 'd3-chord'
  | 'd3-network'
  | 'd3-matrix';

export interface VisualizationRequest {
  type: VisualizationType;
  specPath?: string;
  spec?: OpenAPIObject;
  options?: DiagramOptions | GraphvizOptions;
  workflow?: string[];
  agents?: AgentNode[] | GraphNode[];
  relationships?: AgentRelationship[] | GraphEdge[];
  outputFormat?: 'text' | 'json' | 'svg' | 'png';
}

export interface VisualizationResult {
  type: VisualizationType;
  format: string;
  content: string | object;
  metadata: {
    generatedAt: string;
    specSource?: string;
    nodeCount?: number;
    edgeCount?: number;
  };
}

/**
 * Main orchestrator service
 */
export class VisualizationService {
  private mermaid: MermaidService;
  private graphviz: GraphvizService;
  private d3: D3DataService;

  constructor(mermaidService?: MermaidService, graphvizService?: GraphvizService, d3Service?: D3DataService) {
    // Dependency injection with defaults
    this.mermaid = mermaidService || new MermaidService();
    this.graphviz = graphvizService || new GraphvizService();
    this.d3 = d3Service || new D3DataService();
  }

  /**
   * Generate visualization from request
   */
  async generate(request: VisualizationRequest): Promise<VisualizationResult> {
    // Load spec if path provided
    const spec = request.spec || (request.specPath ? await this.loadSpec(request.specPath) : null);

    if (!spec && this.requiresSpec(request.type)) {
      throw new Error(`Specification required for visualization type: ${request.type}`);
    }

    // Route to appropriate service
    let content: string | object;
    let format = request.outputFormat || 'text';

    if (request.type.startsWith('mermaid-')) {
      content = await this.generateMermaid(request, spec);
      format = 'text';
    } else if (request.type.startsWith('graphviz-')) {
      content = await this.generateGraphviz(request, spec);
      format = 'text';
    } else if (request.type.startsWith('d3-')) {
      content = await this.generateD3(request, spec);
      format = 'json';
    } else {
      throw new Error(`Unknown visualization type: ${request.type}`);
    }

    return {
      type: request.type,
      format,
      content,
      metadata: {
        generatedAt: new Date().toISOString(),
        specSource: request.specPath,
        ...this.extractMetadata(content)
      }
    };
  }

  /**
   * Generate multiple visualizations in batch
   */
  async generateBatch(requests: VisualizationRequest[]): Promise<VisualizationResult[]> {
    return Promise.all(requests.map((req) => this.generate(req)));
  }

  /**
   * Generate complete visualization suite for a specification
   */
  async generateSuite(specPath: string): Promise<Map<string, VisualizationResult>> {
    const spec = await this.loadSpec(specPath);
    const suite = new Map<string, VisualizationResult>();

    // Generate all visualization types
    const types: VisualizationType[] = [
      'mermaid-flowchart',
      'mermaid-class',
      'mermaid-architecture',
      'graphviz-cluster',
      'graphviz-dependency',
      'd3-force',
      'd3-hierarchy'
    ];

    for (const type of types) {
      try {
        const result = await this.generate({ type, spec });
        suite.set(type, result);
      } catch (error) {
        console.warn(`Failed to generate ${type}:`, error);
      }
    }

    return suite;
  }

  /**
   * Export visualization to file
   */
  async exportToFile(result: VisualizationResult, outputPath: string): Promise<void> {
    const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);

    await fs.writeFile(outputPath, content, 'utf-8');
  }

  /**
   * Export suite to directory
   */
  async exportSuite(suite: Map<string, VisualizationResult>, outputDir: string): Promise<void> {
    // Create directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Export each visualization
    for (const [type, result] of suite.entries()) {
      const ext = result.format === 'json' ? 'json' : 'txt';
      const filename = `${type}.${ext}`;
      const filepath = `${outputDir}/${filename}`;

      await this.exportToFile(result, filepath);
    }

    // Create index file
    const index = {
      generatedAt: new Date().toISOString(),
      visualizations: Array.from(suite.keys()),
      metadata: Object.fromEntries(Array.from(suite.entries()).map(([type, result]) => [type, result.metadata]))
    };

    await fs.writeFile(`${outputDir}/index.json`, JSON.stringify(index, null, 2), 'utf-8');
  }

  // ============================================================================
  // Private Mermaid Generators
  // ============================================================================

  private async generateMermaid(request: VisualizationRequest, spec: OpenAPIObject | null): Promise<string> {
    const opts = (request.options as DiagramOptions) || {};

    switch (request.type) {
      case 'mermaid-flowchart':
        if (!spec) throw new Error('Spec required');
        return this.mermaid.generateFlowchart(spec, opts);

      case 'mermaid-class':
        if (!spec) throw new Error('Spec required');
        return this.mermaid.generateClassDiagram(spec);

      case 'mermaid-sequence':
        if (!spec || !request.workflow) throw new Error('Spec and workflow required');
        return this.mermaid.generateSequenceDiagram(spec, request.workflow);

      case 'mermaid-state':
        return this.mermaid.generateStateDiagram();

      case 'mermaid-erd':
        if (!spec) throw new Error('Spec required');
        return this.mermaid.generateERD(spec);

      case 'mermaid-architecture':
        if (!request.agents || !request.relationships) {
          throw new Error('Agents and relationships required');
        }
        return this.mermaid.generateArchitectureDiagram(
          request.agents as AgentNode[],
          request.relationships as AgentRelationship[]
        );

      default:
        throw new Error(`Unknown Mermaid type: ${request.type}`);
    }
  }

  // ============================================================================
  // Private Graphviz Generators
  // ============================================================================

  private async generateGraphviz(request: VisualizationRequest, spec: OpenAPIObject | null): Promise<string> {
    const opts = (request.options as GraphvizOptions) || {};

    switch (request.type) {
      case 'graphviz-digraph':
        if (!spec) throw new Error('Spec required');
        return this.graphviz.generateDigraph(spec, opts);

      case 'graphviz-cluster':
        if (!request.agents || !request.relationships) {
          throw new Error('Agents and relationships required');
        }
        return this.graphviz.generateClusteredGraph(
          request.agents as GraphNode[],
          request.relationships as GraphEdge[],
          opts
        );

      case 'graphviz-dependency':
        if (!spec) throw new Error('Spec required');
        return this.graphviz.generateDependencyGraph(spec);

      case 'graphviz-execution':
        if (!request.workflow) throw new Error('Workflow required');
        return this.graphviz.generateExecutionFlow(request.workflow, opts);

      default:
        throw new Error(`Unknown Graphviz type: ${request.type}`);
    }
  }

  // ============================================================================
  // Private D3 Generators
  // ============================================================================

  private async generateD3(request: VisualizationRequest, spec: OpenAPIObject | null): Promise<object> {
    switch (request.type) {
      case 'd3-force':
        if (!spec) throw new Error('Spec required');
        return this.d3.generateForceGraph(spec);

      case 'd3-hierarchy':
        if (!spec) throw new Error('Spec required');
        return this.d3.generateHierarchy(spec);

      case 'd3-network':
        if (!spec) throw new Error('Spec required');
        return this.d3.generateNetworkTopology(spec);

      case 'd3-matrix':
        if (!spec) throw new Error('Spec required');
        return this.d3.generateMatrix(spec);

      default:
        throw new Error(`Unknown D3 type: ${request.type}`);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async loadSpec(specPath: string): Promise<OpenAPIObject> {
    const content = await fs.readFile(specPath, 'utf-8');

    if (specPath.endsWith('.json')) {
      return JSON.parse(content);
    } else if (specPath.endsWith('.yml') || specPath.endsWith('.yaml')) {
      return yaml.parse(content);
    } else {
      throw new Error(`Unsupported spec format: ${specPath}`);
    }
  }

  private requiresSpec(type: VisualizationType): boolean {
    const noSpecTypes: VisualizationType[] = ['mermaid-state'];
    return !noSpecTypes.includes(type);
  }

  private extractMetadata(content: string | object): {
    nodeCount?: number;
    edgeCount?: number;
  } {
    if (typeof content === 'object') {
      const data = content as any;

      return {
        nodeCount: data.nodes?.length,
        edgeCount: data.links?.length || data.edges?.length
      };
    }

    // Count nodes/edges in text diagrams (simplified)
    const nodeMatch = content.match(/\n\s+\w+[\[\({]/g);
    const edgeMatch = content.match(/--[>o]/g);

    return {
      nodeCount: nodeMatch?.length,
      edgeCount: edgeMatch?.length
    };
  }
}

export default VisualizationService;
