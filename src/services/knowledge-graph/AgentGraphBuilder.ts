import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { execSync } from 'child_process';

/**
 * Agent Knowledge Graph Builder with OpenTelemetry Tracing
 * Builds graph from 138+ agents with full Phoenix observability
 */

interface AgentNode {
  id: string;
  name: string;
  type: 'orchestrator' | 'worker' | 'monitor' | 'integrator' | 'governor' | 'critic';
  capabilities: string[];
  domains: string[];
  dependencies: string[];
  path: string;
}

interface GraphRelationship {
  source: string;
  target: string;
  type: 'depends_on' | 'communicates_with' | 'coordinates' | 'monitors';
  weight: number;
}

interface KnowledgeGraph {
  nodes: AgentNode[];
  relationships: GraphRelationship[];
  clusters: Map<string, AgentNode[]>;
  stats: {
    totalAgents: number;
    byType: Record<string, number>;
    byDomain: Record<string, number>;
    avgDependencies: number;
  };
}

export class AgentGraphBuilder {
  private tracer = trace.getTracer('knowledge-graph-builder');
  private agents: AgentNode[] = [];
  private relationships: GraphRelationship[] = [];

  /**
   * Load all agents from filesystem with tracing
   */
  async loadAgents(basePaths: string[]): Promise<void> {
    const span = this.tracer.startSpan('load_all_agents');

    try {
      for (const basePath of basePaths) {
        await this.loadAgentsFromPath(basePath);
      }

      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttribute('total_agents', this.agents.length);
      console.log(`✅ Loaded ${this.agents.length} agents into memory`);
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      span.end();
    }
  }

  private async loadAgentsFromPath(basePath: string): Promise<void> {
    const span = this.tracer.startSpan('load_agents_from_path', {
      attributes: { path: basePath }
    });

    try {
      // Recursively find all YAML files
      const agentFilesStr = execSync(`find "${basePath}" -name "*.yml" -o -name "*.yaml"`, {
        encoding: 'utf-8'
      });

      const agentFiles = agentFilesStr.trim().split('\n').filter(Boolean);

      for (const agentPath of agentFiles) {
        const agent = await this.loadAgent(agentPath);
        if (agent) {
          this.agents.push(agent);
        }
      }

      span.setAttribute('agents_loaded', agentFiles.length);
    } finally {
      span.end();
    }
  }

  private async loadAgent(path: string): Promise<AgentNode | null> {
    const span = this.tracer.startSpan('load_single_agent', {
      attributes: { agent_path: path }
    });

    try {
      const content = readFileSync(path, 'utf-8');
      const spec = parseYaml(content);

      // Handle OpenAPI agent specs
      const agentName =
        spec.info?.title?.replace(' API', '') || spec['x-agent-id'] || path.split('/').pop()?.replace('.yml', '');

      if (!agentName) {
        return null;
      }

      const agent: AgentNode = {
        id: agentName,
        name: agentName,
        type: spec['x-agent-type'] || this.inferType(agentName),
        capabilities: spec['x-capabilities'] || [],
        domains: spec['x-domains'] || this.inferDomains(spec),
        dependencies: Array.isArray(spec['x-dependencies']) ? spec['x-dependencies'] : [],
        path
      };

      span.setAttribute('agent_id', agent.id);
      span.setAttribute('agent_type', agent.type);

      return agent;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      return null;
    } finally {
      span.end();
    }
  }

  private inferType(name: string): AgentNode['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('orchestr') || lowerName.includes('coordinator')) return 'orchestrator';
    if (lowerName.includes('monitor') || lowerName.includes('watch')) return 'monitor';
    if (lowerName.includes('integrat') || lowerName.includes('connect')) return 'integrator';
    if (lowerName.includes('critic') || lowerName.includes('review')) return 'critic';
    if (lowerName.includes('govern') || lowerName.includes('policy')) return 'governor';
    return 'worker';
  }

  private inferDomains(spec: any): string[] {
    const domains: string[] = [];
    const paths = spec.paths || {};

    if (paths['/health']) domains.push('monitoring');
    if (paths['/execute']) domains.push('execution');
    if (paths['/train'] || paths['/learn']) domains.push('learning');
    if (paths['/validate']) domains.push('validation');
    if (paths['/deploy']) domains.push('deployment');

    return domains.length > 0 ? domains : ['general'];
  }

  /**
   * Build relationships between agents with tracing
   */
  async buildRelationships(): Promise<void> {
    const span = this.tracer.startSpan('build_relationships');

    try {
      // Dependency relationships
      await this.buildDependencyRelationships();

      // Domain-based relationships
      await this.buildDomainRelationships();

      // Type-based coordination relationships
      await this.buildCoordinationRelationships();

      span.setAttribute('total_relationships', this.relationships.length);
      console.log(`✅ Built ${this.relationships.length} relationships`);
    } finally {
      span.end();
    }
  }

  private async buildDependencyRelationships(): Promise<void> {
    const span = this.tracer.startSpan('build_dependency_relationships');

    try {
      for (const agent of this.agents) {
        for (const dep of agent.dependencies) {
          const target = this.agents.find((a) => a.id === dep);
          if (target) {
            this.relationships.push({
              source: agent.id,
              target: target.id,
              type: 'depends_on',
              weight: 1.0
            });
          }
        }
      }

      span.setAttribute('dependency_links', this.relationships.length);
    } finally {
      span.end();
    }
  }

  private async buildDomainRelationships(): Promise<void> {
    const span = this.tracer.startSpan('build_domain_relationships');

    try {
      const domainMap = new Map<string, AgentNode[]>();

      // Group agents by domain
      for (const agent of this.agents) {
        for (const domain of agent.domains) {
          if (!domainMap.has(domain)) {
            domainMap.set(domain, []);
          }
          domainMap.get(domain)!.push(agent);
        }
      }

      // Create relationships between agents in same domain
      for (const [domain, agents] of domainMap) {
        for (let i = 0; i < agents.length; i++) {
          for (let j = i + 1; j < agents.length; j++) {
            this.relationships.push({
              source: agents[i].id,
              target: agents[j].id,
              type: 'communicates_with',
              weight: 0.5
            });
          }
        }
      }

      span.setAttribute('domain_groups', domainMap.size);
    } finally {
      span.end();
    }
  }

  private async buildCoordinationRelationships(): Promise<void> {
    const span = this.tracer.startSpan('build_coordination_relationships');

    try {
      const orchestrators = this.agents.filter((a) => a.type === 'orchestrator');
      const workers = this.agents.filter((a) => a.type === 'worker');

      for (const orchestrator of orchestrators) {
        for (const worker of workers) {
          // Orchestrators coordinate workers in overlapping domains
          const sharedDomains = orchestrator.domains.filter((d) => worker.domains.includes(d));
          if (sharedDomains.length > 0) {
            this.relationships.push({
              source: orchestrator.id,
              target: worker.id,
              type: 'coordinates',
              weight: sharedDomains.length * 0.3
            });
          }
        }
      }

      span.setAttribute('coordination_links', this.relationships.filter((r) => r.type === 'coordinates').length);
    } finally {
      span.end();
    }
  }

  /**
   * Generate complete knowledge graph with stats
   */
  async buildGraph(): Promise<KnowledgeGraph> {
    const span = this.tracer.startSpan('build_complete_graph');

    try {
      // Build clusters
      const clusters = this.clusterByType();

      // Calculate stats
      const stats = this.calculateStats();

      const graph: KnowledgeGraph = {
        nodes: this.agents,
        relationships: this.relationships,
        clusters,
        stats
      };

      span.setAttribute('total_nodes', graph.nodes.length);
      span.setAttribute('total_edges', graph.relationships.length);
      span.setAttribute('total_clusters', graph.clusters.size);

      return graph;
    } finally {
      span.end();
    }
  }

  private clusterByType(): Map<string, AgentNode[]> {
    const clusters = new Map<string, AgentNode[]>();

    for (const agent of this.agents) {
      if (!clusters.has(agent.type)) {
        clusters.set(agent.type, []);
      }
      clusters.get(agent.type)!.push(agent);
    }

    return clusters;
  }

  private calculateStats() {
    const byType: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    let totalDeps = 0;

    for (const agent of this.agents) {
      byType[agent.type] = (byType[agent.type] || 0) + 1;
      totalDeps += agent.dependencies.length;

      for (const domain of agent.domains) {
        byDomain[domain] = (byDomain[domain] || 0) + 1;
      }
    }

    return {
      totalAgents: this.agents.length,
      byType,
      byDomain,
      avgDependencies: this.agents.length > 0 ? totalDeps / this.agents.length : 0
    };
  }

  /**
   * Export graph in various formats
   */
  async exportGraph(graph: KnowledgeGraph): Promise<{
    json: string;
    graphml: string;
    cytoscape: string;
  }> {
    const span = this.tracer.startSpan('export_graph_formats');

    try {
      const json = JSON.stringify(graph, null, 2);
      const graphml = this.toGraphML(graph);
      const cytoscape = this.toCytoscape(graph);

      return { json, graphml, cytoscape };
    } finally {
      span.end();
    }
  }

  private toGraphML(graph: KnowledgeGraph): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    xml += '  <graph id="AgentKnowledgeGraph" edgedefault="directed">\n';

    // Nodes
    for (const node of graph.nodes) {
      xml += `    <node id="${node.id}">\n`;
      xml += `      <data key="type">${node.type}</data>\n`;
      xml += `      <data key="name">${node.name}</data>\n`;
      xml += `    </node>\n`;
    }

    // Edges
    for (const rel of graph.relationships) {
      xml += `    <edge source="${rel.source}" target="${rel.target}">\n`;
      xml += `      <data key="type">${rel.type}</data>\n`;
      xml += `      <data key="weight">${rel.weight}</data>\n`;
      xml += `    </edge>\n`;
    }

    xml += '  </graph>\n</graphml>';
    return xml;
  }

  private toCytoscape(graph: KnowledgeGraph): string {
    const elements = {
      nodes: graph.nodes.map((n) => ({
        data: { id: n.id, label: n.name, type: n.type }
      })),
      edges: graph.relationships.map((r) => ({
        data: {
          source: r.source,
          target: r.target,
          type: r.type,
          weight: r.weight
        }
      }))
    };

    return JSON.stringify(elements, null, 2);
  }
}
