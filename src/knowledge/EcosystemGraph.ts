import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

/**
 * Ecosystem Knowledge Graph for cross-project dependencies and relationships
 */
export interface ProjectNode {
  id: string;
  name: string;
  type: 'npm' | 'drupal' | 'model' | 'infrastructure';
  version: string;
  path: string;
  dependencies: string[];
  devDependencies?: string[];
  peerDependencies?: string[];
  apis?: APIEndpoint[];
  capabilities?: string[];
  metadata?: Record<string, any>;
}

export interface APIEndpoint {
  path: string;
  method: string;
  description?: string;
  parameters?: Record<string, any>;
  responses?: Record<string, any>;
}

export interface ProjectRelationship {
  from: string;
  to: string;
  type: 'DEPENDS_ON' | 'INTEGRATES_WITH' | 'EXTENDS' | 'REPLACES' | 'COMPLEMENTS';
  version?: string;
  strength?: number;
  metadata?: Record<string, any>;
}

export interface DependencyInsight {
  type: 'circular' | 'outdated' | 'missing' | 'unused' | 'vulnerability';
  severity: 'critical' | 'warning' | 'info';
  projects: string[];
  message: string;
  recommendation?: string;
}

export interface ImpactAnalysis {
  directImpact: string[];
  transitiveImpact: string[];
  riskLevel: 'high' | 'medium' | 'low';
  affectedAPIs: APIEndpoint[];
  breakingChanges: boolean;
}

export class EcosystemGraph extends EventEmitter {
  private nodes: Map<string, ProjectNode> = new Map();
  private relationships: Map<string, ProjectRelationship[]> = new Map();
  private complianceData: any;
  private basePath: string;

  constructor(basePath = '/Users/flux423/Sites/LLM') {
    super();
    this.basePath = basePath;
    this.loadComplianceData();
  }

  /**
   * Load ecosystem compliance data
   */
  private loadComplianceData(): void {
    const compliancePath = path.join(this.basePath, 'OSSA/ecosystem-compliance.json');
    try {
      const data = fs.readFileSync(compliancePath, 'utf-8');
      this.complianceData = JSON.parse(data);
      this.emit('complianceLoaded', this.complianceData);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      this.complianceData = { drupal_to_npm_mappings: {}, projects: {} };
    }
  }

  /**
   * Scan and index all projects in the ecosystem
   */
  async scanEcosystem(): Promise<void> {
    const projectDirs = [
      'common_npm',
      'models',
      'all_drupal_custom/modules',
      'OSSA',
      'agent_buildkit',
    ];

    for (const dir of projectDirs) {
      const fullPath = path.join(this.basePath, dir);
      await this.scanDirectory(fullPath, dir.includes('drupal') ? 'drupal' : 'npm');
    }

    this.buildRelationships();
    this.emit('scanComplete', {
      projects: this.nodes.size,
      relationships: this.getRelationshipCount(),
    });
  }

  /**
   * Scan a directory for projects
   */
  private async scanDirectory(dirPath: string, defaultType: string): Promise<void> {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = path.join(dirPath, entry.name);
      const packageJsonPath = path.join(projectPath, 'package.json');
      const composerJsonPath = path.join(projectPath, 'composer.json');

      let projectData: ProjectNode | null = null;

      if (fs.existsSync(packageJsonPath)) {
        projectData = this.parseNpmProject(projectPath, packageJsonPath);
      } else if (fs.existsSync(composerJsonPath)) {
        projectData = this.parseDrupalProject(projectPath, composerJsonPath);
      } else if (entry.name.includes('model')) {
        projectData = this.parseModelProject(projectPath);
      }

      if (projectData) {
        this.nodes.set(projectData.id, projectData);
        this.emit('projectIndexed', projectData);
      }
    }
  }

  /**
   * Parse NPM project
   */
  private parseNpmProject(projectPath: string, packageJsonPath: string): ProjectNode {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    return {
      id: packageJson.name || path.basename(projectPath),
      name: packageJson.name || path.basename(projectPath),
      type: 'npm',
      version: packageJson.version || '0.0.0',
      path: projectPath,
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
      peerDependencies: Object.keys(packageJson.peerDependencies || {}),
      capabilities: this.extractCapabilities(packageJson),
      apis: this.extractAPIs(projectPath),
      metadata: {
        description: packageJson.description,
        keywords: packageJson.keywords,
        scripts: Object.keys(packageJson.scripts || {}),
      },
    };
  }

  /**
   * Parse Drupal project
   */
  private parseDrupalProject(projectPath: string, composerJsonPath: string): ProjectNode {
    const composerJson = JSON.parse(fs.readFileSync(composerJsonPath, 'utf-8'));
    const infoPath = path.join(projectPath, `${path.basename(projectPath)}.info.yml`);

    let drupalInfo: any = {};
    if (fs.existsSync(infoPath)) {
      // Simple YAML parsing (would use proper YAML parser in production)
      const infoContent = fs.readFileSync(infoPath, 'utf-8');
      drupalInfo.name = infoContent.match(/name:\s*(.+)/)?.[1] || '';
      drupalInfo.type = infoContent.match(/type:\s*(.+)/)?.[1] || 'module';
    }

    return {
      id: `drupal/${path.basename(projectPath)}`,
      name: drupalInfo.name || path.basename(projectPath),
      type: 'drupal',
      version: composerJson.version || '1.0.0',
      path: projectPath,
      dependencies: Object.keys(composerJson.require || {}),
      capabilities: this.extractDrupalCapabilities(projectPath),
      apis: this.extractAPIs(projectPath),
      metadata: {
        drupalType: drupalInfo.type,
        description: composerJson.description,
      },
    };
  }

  /**
   * Parse model project
   */
  private parseModelProject(projectPath: string): ProjectNode {
    const modelName = path.basename(projectPath);

    return {
      id: `model/${modelName}`,
      name: modelName,
      type: 'model',
      version: '1.0.0',
      path: projectPath,
      dependencies: [],
      capabilities: ['inference', 'training', 'evaluation'],
      apis: this.extractAPIs(projectPath),
      metadata: {
        framework: this.detectMLFramework(projectPath),
      },
    };
  }

  /**
   * Extract capabilities from package.json
   */
  private extractCapabilities(packageJson: any): string[] {
    const capabilities: string[] = [];

    // Check for specific patterns in dependencies and scripts
    if (packageJson.dependencies?.['@qdrant/js-client-rest']) {
      capabilities.push('vector-search');
    }
    if (packageJson.dependencies?.['neo4j-driver']) {
      capabilities.push('graph-database');
    }
    if (packageJson.scripts?.['test']) {
      capabilities.push('testing');
    }
    if (packageJson.scripts?.['build']) {
      capabilities.push('build-system');
    }

    return capabilities;
  }

  /**
   * Extract Drupal capabilities
   */
  private extractDrupalCapabilities(projectPath: string): string[] {
    const capabilities: string[] = [];
    const servicesPath = path.join(projectPath, `${path.basename(projectPath)}.services.yml`);

    if (fs.existsSync(servicesPath)) {
      capabilities.push('services');
    }

    // Check for specific Drupal patterns
    if (fs.existsSync(path.join(projectPath, 'src/Controller'))) {
      capabilities.push('controllers');
    }
    if (fs.existsSync(path.join(projectPath, 'src/Plugin'))) {
      capabilities.push('plugins');
    }
    if (fs.existsSync(path.join(projectPath, 'config/install'))) {
      capabilities.push('configuration');
    }

    return capabilities;
  }

  /**
   * Extract APIs from project
   */
  private extractAPIs(projectPath: string): APIEndpoint[] {
    const apis: APIEndpoint[] = [];

    // Check for OpenAPI spec
    const openApiPaths = ['openapi.yaml', 'openapi.yml', 'openapi.json'];
    for (const apiPath of openApiPaths) {
      const fullPath = path.join(projectPath, apiPath);
      if (fs.existsSync(fullPath)) {
        // Parse OpenAPI spec (simplified)
        apis.push({
          path: '/api',
          method: 'GET',
          description: 'API documented in OpenAPI spec',
        });
        break;
      }
    }

    return apis;
  }

  /**
   * Detect ML framework
   */
  private detectMLFramework(projectPath: string): string {
    if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
      const requirements = fs.readFileSync(
        path.join(projectPath, 'requirements.txt'),
        'utf-8'
      );
      if (requirements.includes('torch')) return 'pytorch';
      if (requirements.includes('tensorflow')) return 'tensorflow';
      if (requirements.includes('scikit-learn')) return 'scikit-learn';
    }
    return 'unknown';
  }

  /**
   * Build relationships between projects
   */
  private buildRelationships(): void {
    // Build dependency relationships
    for (const [projectId, project] of this.nodes) {
      for (const dep of project.dependencies) {
        // Find matching project
        const depProject = this.findProjectByName(dep);
        if (depProject) {
          this.addRelationship({
            from: projectId,
            to: depProject.id,
            type: 'DEPENDS_ON',
            version: dep,
          });
        }
      }

      // Check Drupal to NPM mappings
      if (this.complianceData.drupal_to_npm_mappings) {
        const mapping = this.complianceData.drupal_to_npm_mappings[project.name];
        if (mapping) {
          const npmProject = this.findProjectByName(mapping);
          if (npmProject) {
            this.addRelationship({
              from: projectId,
              to: npmProject.id,
              type: 'INTEGRATES_WITH',
              strength: 1.0,
            });
          }
        }
      }
    }
  }

  /**
   * Add relationship
   */
  private addRelationship(relationship: ProjectRelationship): void {
    if (!this.relationships.has(relationship.from)) {
      this.relationships.set(relationship.from, []);
    }
    this.relationships.get(relationship.from)!.push(relationship);
  }

  /**
   * Find project by name
   */
  private findProjectByName(name: string): ProjectNode | null {
    for (const project of this.nodes.values()) {
      if (project.name === name || project.id === name) {
        return project;
      }
    }
    return null;
  }

  /**
   * Get relationship count
   */
  private getRelationshipCount(): number {
    let count = 0;
    for (const rels of this.relationships.values()) {
      count += rels.length;
    }
    return count;
  }

  /**
   * Analyze dependencies for issues
   */
  analyzeDependencies(): DependencyInsight[] {
    const insights: DependencyInsight[] = [];

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCircular = (nodeId: string, path: string[] = []): void => {
      if (recursionStack.has(nodeId)) {
        insights.push({
          type: 'circular',
          severity: 'critical',
          projects: [...path, nodeId],
          message: `Circular dependency detected: ${path.join(' → ')} → ${nodeId}`,
          recommendation: 'Refactor to remove circular dependency',
        });
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const rels = this.relationships.get(nodeId) || [];
      for (const rel of rels) {
        if (rel.type === 'DEPENDS_ON') {
          checkCircular(rel.to, [...path, nodeId]);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        checkCircular(nodeId);
      }
    }

    // Check for unused dependencies
    for (const [projectId, project] of this.nodes) {
      const declaredDeps = new Set(project.dependencies);
      const usedDeps = new Set<string>();

      // Simplified check - in reality would analyze code usage
      const rels = this.relationships.get(projectId) || [];
      for (const rel of rels) {
        if (rel.type === 'DEPENDS_ON') {
          usedDeps.add(rel.to);
        }
      }

      for (const dep of declaredDeps) {
        if (!usedDeps.has(dep) && this.findProjectByName(dep)) {
          insights.push({
            type: 'unused',
            severity: 'info',
            projects: [projectId],
            message: `Potentially unused dependency: ${dep}`,
            recommendation: 'Review and remove if unused',
          });
        }
      }
    }

    return insights;
  }

  /**
   * Analyze impact of changes
   */
  analyzeImpact(projectId: string, changeType: 'major' | 'minor' | 'patch'): ImpactAnalysis {
    const directImpact: string[] = [];
    const transitiveImpact: string[] = [];
    const affectedAPIs: APIEndpoint[] = [];

    // Find direct dependents
    for (const [otherId, rels] of this.relationships) {
      for (const rel of rels) {
        if (rel.to === projectId && rel.type === 'DEPENDS_ON') {
          directImpact.push(otherId);
        }
      }
    }

    // Find transitive dependents
    const visited = new Set<string>();
    const queue = [...directImpact];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      for (const [otherId, rels] of this.relationships) {
        for (const rel of rels) {
          if (rel.to === current && rel.type === 'DEPENDS_ON' && !directImpact.includes(otherId)) {
            transitiveImpact.push(otherId);
            queue.push(otherId);
          }
        }
      }
    }

    // Determine risk level
    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    if (changeType === 'major' || directImpact.length > 5) {
      riskLevel = 'high';
    } else if (changeType === 'minor' || directImpact.length > 2) {
      riskLevel = 'medium';
    }

    return {
      directImpact,
      transitiveImpact,
      riskLevel,
      affectedAPIs,
      breakingChanges: changeType === 'major',
    };
  }

  /**
   * Generate visualization data
   */
  generateVisualizationData(): {
    nodes: Array<{ id: string; label: string; group: string; size: number }>;
    edges: Array<{ from: string; to: string; label: string; weight: number }>;
  } {
    const nodes = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      label: node.name,
      group: node.type,
      size: node.dependencies.length + 10,
    }));

    const edges: Array<{ from: string; to: string; label: string; weight: number }> = [];

    for (const [from, rels] of this.relationships) {
      for (const rel of rels) {
        edges.push({
          from,
          to: rel.to,
          label: rel.type,
          weight: rel.strength || 1,
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Export to GraphML format
   */
  exportToGraphML(): string {
    let graphml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    graphml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    graphml += '  <graph id="G" edgedefault="directed">\n';

    // Add nodes
    for (const node of this.nodes.values()) {
      graphml += `    <node id="${node.id}">\n`;
      graphml += `      <data key="name">${node.name}</data>\n`;
      graphml += `      <data key="type">${node.type}</data>\n`;
      graphml += `      <data key="version">${node.version}</data>\n`;
      graphml += '    </node>\n';
    }

    // Add edges
    let edgeId = 0;
    for (const [from, rels] of this.relationships) {
      for (const rel of rels) {
        graphml += `    <edge id="e${edgeId++}" source="${from}" target="${rel.to}">\n`;
        graphml += `      <data key="type">${rel.type}</data>\n`;
        graphml += '    </edge>\n';
      }
    }

    graphml += '  </graph>\n';
    graphml += '</graphml>\n';

    return graphml;
  }

  /**
   * Get project details
   */
  getProject(projectId: string): ProjectNode | null {
    return this.nodes.get(projectId) || null;
  }

  /**
   * Get project relationships
   */
  getProjectRelationships(projectId: string): ProjectRelationship[] {
    return this.relationships.get(projectId) || [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalProjects: number;
    totalRelationships: number;
    projectsByType: Record<string, number>;
    avgDependencies: number;
  } {
    const projectsByType: Record<string, number> = {};
    let totalDeps = 0;

    for (const project of this.nodes.values()) {
      projectsByType[project.type] = (projectsByType[project.type] || 0) + 1;
      totalDeps += project.dependencies.length;
    }

    return {
      totalProjects: this.nodes.size,
      totalRelationships: this.getRelationshipCount(),
      projectsByType,
      avgDependencies: this.nodes.size > 0 ? totalDeps / this.nodes.size : 0,
    };
  }
}