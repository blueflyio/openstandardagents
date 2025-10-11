/**
 * OSSA-BuildKit Roadmap Bridge
 * Connects OSSA specification with BuildKit's roadmap parser
 */

import { RoadmapParser, ParsedRoadmap as BuildKitRoadmap } from '@bluefly/agent-build-kit';
import { OSSAValidator } from '@ossa/validator';
import { AgentManifest, WorkflowSpec } from '@ossa/specification';
import { LinearClient } from '@linear/sdk';

export interface OSSARoadmap {
  apiVersion: string;
  kind: 'Roadmap';
  metadata: {
    name: string;
    namespace?: string;
    version?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    initiatives: RoadmapItem[];
    milestones: RoadmapItem[];
    projects: RoadmapItem[];
    dependencies?: Dependency[];
    integrations?: {
      linear?: LinearIntegration;
      gitlab?: GitLabIntegration;
    };
  };
}

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  type: 'initiative' | 'milestone' | 'project' | 'epic' | 'task';
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  targetDate?: Date;
  startDate?: Date;
  assignees?: string[];
  tags?: string[];
  dependencies?: string[];
  linearId?: string;
  gitlabId?: string;
  children?: RoadmapItem[];
}

export interface Dependency {
  from: string;
  to: string;
  type: 'blocks' | 'requires' | 'relates-to';
  status: 'active' | 'resolved';
}

export interface LinearIntegration {
  teamId: string;
  projectId?: string;
  lastSync?: Date;
  mappings?: Array<{ roadmapId: string; linearId: string }>;
}

export interface GitLabIntegration {
  projectId: string;
  milestoneId?: string;
  lastSync?: Date;
  mappings?: Array<{ roadmapId: string; gitlabId: string }>;
}

export class OSSARoadmapBridge {
  private parser: RoadmapParser;
  private validator: OSSAValidator;
  private linearClient?: LinearClient;

  constructor(options: {
    linearApiKey?: string;
    gitlabToken?: string;
    validateSchema?: boolean;
  } = {}) {
    this.parser = new RoadmapParser({
      validateDates: true,
      parseTags: true,
      parseMetadata: true,
      parseVersionMilestones: true,
      parseDependencies: true
    });

    this.validator = new OSSAValidator();

    if (options.linearApiKey) {
      this.linearClient = new LinearClient({ apiKey: options.linearApiKey });
    }
  }

  /**
   * Parse a roadmap file and convert to OSSA format
   */
  async parseRoadmap(filePath: string): Promise<OSSARoadmap> {
    // Use BuildKit parser
    const buildkitRoadmap = await this.parser.parseRoadmapFile(filePath);

    // Transform to OSSA format
    const ossaRoadmap = this.transformToOSSA(buildkitRoadmap);

    // Validate against OSSA schema
    const validation = await this.validateRoadmap(ossaRoadmap);
    if (!validation.valid) {
      throw new Error(`Roadmap validation failed: ${JSON.stringify(validation.errors)}`);
    }

    return ossaRoadmap;
  }

  /**
   * Transform BuildKit roadmap to OSSA format
   */
  private transformToOSSA(buildkit: BuildKitRoadmap): OSSARoadmap {
    return {
      apiVersion: '@bluefly/ossa/v0.1.9',
      kind: 'Roadmap',
      metadata: {
        name: buildkit.title.toLowerCase().replace(/\s+/g, '-'),
        version: buildkit.version,
        labels: {
          'ossa.ai/type': 'roadmap',
          'ossa.ai/source': 'buildkit-parser'
        },
        annotations: {
          'ossa.ai/parsed-at': new Date().toISOString(),
          'ossa.ai/parser-version': '0.1.9'
        }
      },
      spec: {
        initiatives: this.transformItems(buildkit.initiatives),
        milestones: this.transformItems(buildkit.milestones),
        projects: this.transformItems(buildkit.projects),
        dependencies: this.extractDependencies(buildkit)
      }
    };
  }

  /**
   * Transform BuildKit items to OSSA format
   */
  private transformItems(items: any[]): RoadmapItem[] {
    return items.map((item, index) => ({
      id: `${item.type}-${index}-${item.title.toLowerCase().replace(/\s+/g, '-')}`,
      title: item.title,
      description: item.description,
      type: item.type,
      status: item.status,
      priority: this.mapPriority(item.priority),
      targetDate: item.targetDate,
      startDate: item.startDate,
      assignees: item.assignees,
      tags: item.tags,
      dependencies: item.dependencies,
      linearId: item.linearId,
      children: item.children ? this.transformItems(item.children) : undefined
    }));
  }

  /**
   * Extract dependencies from BuildKit roadmap
   */
  private extractDependencies(buildkit: BuildKitRoadmap): Dependency[] {
    const dependencies: Dependency[] = [];
    const allItems = [...buildkit.initiatives, ...buildkit.milestones, ...buildkit.projects];

    for (const item of allItems) {
      if (item.dependencies && item.dependencies.length > 0) {
        for (const dep of item.dependencies) {
          dependencies.push({
            from: item.title,
            to: dep,
            type: 'requires',
            status: 'active'
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Map BuildKit priority to OSSA priority
   */
  private mapPriority(priority: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (priority) {
      case 'urgent':
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
      case 'normal':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Validate roadmap against OSSA schema
   */
  async validateRoadmap(roadmap: OSSARoadmap): Promise<{ valid: boolean; errors: any[] }> {
    // For now, basic validation
    const errors: any[] = [];

    if (!roadmap.apiVersion || roadmap.apiVersion !== '@bluefly/ossa/v0.1.9') {
      errors.push({ field: 'apiVersion', message: 'Invalid or missing API version' });
    }

    if (!roadmap.kind || roadmap.kind !== 'Roadmap') {
      errors.push({ field: 'kind', message: 'Kind must be "Roadmap"' });
    }

    if (!roadmap.metadata?.name) {
      errors.push({ field: 'metadata.name', message: 'Name is required' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sync roadmap to Linear
   */
  async syncToLinear(roadmap: OSSARoadmap, teamId: string): Promise<{
    created: number;
    updated: number;
    errors: any[];
  }> {
    if (!this.linearClient) {
      throw new Error('Linear client not initialized. Provide API key in constructor.');
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as any[]
    };

    // Create initiatives as Linear projects
    for (const initiative of roadmap.spec.initiatives) {
      try {
        if (initiative.linearId) {
          // Update existing
          await this.linearClient.updateProject(initiative.linearId, {
            name: initiative.title,
            description: initiative.description
          });
          results.updated++;
        } else {
          // Create new
          const project = await this.linearClient.createProject({
            name: initiative.title,
            description: initiative.description,
            teamIds: [teamId],
            targetDate: initiative.targetDate?.toISOString()
          });
          initiative.linearId = project.id;
          results.created++;
        }
      } catch (error) {
        results.errors.push({ item: initiative.title, error });
      }
    }

    // Create milestones
    for (const milestone of roadmap.spec.milestones) {
      try {
        if (!milestone.linearId) {
          const linearMilestone = await this.linearClient.createMilestone({
            name: milestone.title,
            description: milestone.description,
            targetDate: milestone.targetDate?.toISOString()
          });
          milestone.linearId = linearMilestone.id;
          results.created++;
        } else {
          results.updated++;
        }
      } catch (error) {
        results.errors.push({ item: milestone.title, error });
      }
    }

    // Create projects as issues
    for (const project of roadmap.spec.projects) {
      try {
        if (!project.linearId) {
          const issue = await this.linearClient.createIssue({
            title: project.title,
            description: project.description,
            teamId,
            priority: this.mapPriorityToLinearValue(project.priority),
            dueDate: project.targetDate?.toISOString()
          });
          project.linearId = issue.id;
          results.created++;
        } else {
          results.updated++;
        }
      } catch (error) {
        results.errors.push({ item: project.title, error });
      }
    }

    // Update roadmap with Linear IDs
    roadmap.spec.integrations = roadmap.spec.integrations || {};
    roadmap.spec.integrations.linear = {
      teamId,
      lastSync: new Date(),
      mappings: [
        ...roadmap.spec.initiatives.map(i => ({ roadmapId: i.id, linearId: i.linearId! })),
        ...roadmap.spec.milestones.map(m => ({ roadmapId: m.id, linearId: m.linearId! })),
        ...roadmap.spec.projects.map(p => ({ roadmapId: p.id, linearId: p.linearId! }))
      ].filter(m => m.linearId)
    };

    return results;
  }

  /**
   * Map OSSA priority to Linear numeric value
   */
  private mapPriorityToLinearValue(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  /**
   * Aggregate multiple roadmaps
   */
  async aggregateRoadmaps(roadmaps: OSSARoadmap[]): Promise<OSSARoadmap> {
    const aggregated: OSSARoadmap = {
      apiVersion: '@bluefly/ossa/v0.1.9',
      kind: 'Roadmap',
      metadata: {
        name: 'aggregated-roadmap',
        labels: {
          'ossa.ai/type': 'aggregated',
          'ossa.ai/source-count': roadmaps.length.toString()
        },
        annotations: {
          'ossa.ai/aggregated-at': new Date().toISOString(),
          'ossa.ai/sources': roadmaps.map(r => r.metadata.name).join(',')
        }
      },
      spec: {
        initiatives: [],
        milestones: [],
        projects: [],
        dependencies: []
      }
    };

    // Merge all roadmaps
    for (const roadmap of roadmaps) {
      aggregated.spec.initiatives.push(...roadmap.spec.initiatives);
      aggregated.spec.milestones.push(...roadmap.spec.milestones);
      aggregated.spec.projects.push(...roadmap.spec.projects);
      aggregated.spec.dependencies?.push(...(roadmap.spec.dependencies || []));
    }

    // Deduplicate by title
    aggregated.spec.initiatives = this.deduplicateItems(aggregated.spec.initiatives);
    aggregated.spec.milestones = this.deduplicateItems(aggregated.spec.milestones);
    aggregated.spec.projects = this.deduplicateItems(aggregated.spec.projects);

    return aggregated;
  }

  /**
   * Deduplicate roadmap items by title
   */
  private deduplicateItems(items: RoadmapItem[]): RoadmapItem[] {
    const seen = new Map<string, RoadmapItem>();

    for (const item of items) {
      const key = item.title.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        // Merge metadata
        const existing = seen.get(key)!;
        existing.tags = [...new Set([...(existing.tags || []), ...(item.tags || [])])];
        existing.assignees = [...new Set([...(existing.assignees || []), ...(item.assignees || [])])];
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Export roadmap to various formats
   */
  async exportRoadmap(roadmap: OSSARoadmap, format: 'markdown' | 'json' | 'yaml' | 'dita'): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.exportToMarkdown(roadmap);
      case 'json':
        return JSON.stringify(roadmap, null, 2);
      case 'yaml':
        const yaml = await import('js-yaml');
        return yaml.dump(roadmap);
      case 'dita':
        return this.exportToDITA(roadmap);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export roadmap to Markdown
   */
  private exportToMarkdown(roadmap: OSSARoadmap): string {
    let markdown = `# ${roadmap.metadata.name}\n\n`;

    if (roadmap.metadata.version) {
      markdown += `**Version:** ${roadmap.metadata.version}\n\n`;
    }

    markdown += `## Initiatives\n\n`;
    for (const initiative of roadmap.spec.initiatives) {
      markdown += `### ${initiative.title}\n`;
      if (initiative.description) markdown += `${initiative.description}\n`;
      markdown += `- **Status:** ${initiative.status}\n`;
      markdown += `- **Priority:** ${initiative.priority}\n`;
      if (initiative.targetDate) {
        markdown += `- **Target Date:** ${initiative.targetDate}\n`;
      }
      markdown += '\n';
    }

    markdown += `## Milestones\n\n`;
    for (const milestone of roadmap.spec.milestones) {
      markdown += `### ${milestone.title}\n`;
      if (milestone.description) markdown += `${milestone.description}\n`;
      markdown += `- **Status:** ${milestone.status}\n`;
      if (milestone.targetDate) {
        markdown += `- **Target Date:** ${milestone.targetDate}\n`;
      }
      markdown += '\n';
    }

    markdown += `## Projects\n\n`;
    for (const project of roadmap.spec.projects) {
      markdown += `### ${project.title}\n`;
      if (project.description) markdown += `${project.description}\n`;
      markdown += `- **Status:** ${project.status}\n`;
      markdown += `- **Priority:** ${project.priority}\n`;
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * Export roadmap to DITA
   */
  private exportToDITA(roadmap: OSSARoadmap): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map title="${roadmap.metadata.name}">
  <topicmeta>
    <shortdesc>Roadmap version ${roadmap.metadata.version || '1.0.0'}</shortdesc>
  </topicmeta>
  ${roadmap.spec.initiatives.map(i => `
  <topicref href="initiatives/${i.id}.dita" format="dita">
    <topicmeta>
      <navtitle>${i.title}</navtitle>
    </topicmeta>
  </topicref>`).join('')}
</map>`;
  }
}

// Export everything
export { RoadmapParser } from '@bluefly/agent-build-kit';
export { OSSAValidator } from '@ossa/validator';