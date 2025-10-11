/**
 * Linear-OSSA Integration Bridge
 * Converts between OSSA roadmaps and Linear issues/projects
 */

import { OSSAAgent } from '@ossa/specification';

export interface OSSARoadmap {
  ossa: '1.0';
  kind: 'Roadmap';
  metadata: {
    name: string;
    version: string;
    description?: string;
    owner?: string;
  };
  spec: {
    initiatives: Initiative[];
    milestones?: Milestone[];
    linearIntegration?: LinearConfig;
  };
}

export interface Initiative {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  startDate?: string;
  endDate?: string;
  capabilities?: string[];
  agents?: string[];
  tasks?: Task[];
  labels?: string[];
  linearIssueId?: string;
}

export interface Task {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  assignee?: string;
  estimate?: string;
  completed?: boolean;
}

export interface Milestone {
  name: string;
  date: string;
  description?: string;
  initiatives?: string[];
  deliverables?: string[];
}

export interface LinearConfig {
  enabled: boolean;
  projectId?: string;
  teamId?: string;
  cycleId?: string;
  syncDirection?: 'push' | 'pull' | 'bidirectional';
  labelMapping?: Record<string, string>;
  statusMapping?: Record<string, string>;
}

export interface LinearIssue {
  id?: string;
  title: string;
  description?: string;
  state: string;
  priority: number;
  assigneeId?: string;
  labelIds?: string[];
  projectId?: string;
  teamId?: string;
  cycleId?: string;
  dueDate?: string;
  estimate?: number;
  parentId?: string;
}

export interface LinearProject {
  id?: string;
  name: string;
  description?: string;
  state: string;
  teamId: string;
  leadId?: string;
  targetDate?: string;
  issues: LinearIssue[];
}

export class LinearOSSAIntegration {
  private statusMapping: Record<string, string> = {
    'planned': 'Backlog',
    'in_progress': 'In Progress',
    'blocked': 'Todo',
    'completed': 'Done',
    'cancelled': 'Cancelled'
  };

  private priorityMapping: Record<string, number> = {
    'critical': 1,
    'high': 2,
    'medium': 3,
    'low': 4
  };

  constructor(private config?: LinearConfig) {
    if (config?.statusMapping) {
      this.statusMapping = { ...this.statusMapping, ...config.statusMapping };
    }
  }

  /**
   * Convert OSSA Roadmap to Linear Project
   */
  async convertRoadmapToLinear(roadmap: OSSARoadmap): Promise<LinearProject> {
    const project: LinearProject = {
      name: roadmap.metadata.name,
      description: roadmap.metadata.description ||
        `OSSA Roadmap v${roadmap.metadata.version}`,
      state: 'started',
      teamId: this.config?.teamId || '',
      issues: []
    };

    // Convert each initiative to Linear issues
    for (const initiative of roadmap.spec.initiatives) {
      const issue = await this.convertInitiativeToIssue(initiative, roadmap);
      project.issues.push(issue);

      // Convert sub-tasks to child issues
      if (initiative.tasks) {
        for (const task of initiative.tasks) {
          const childIssue = this.convertTaskToIssue(task, initiative, issue.id);
          project.issues.push(childIssue);
        }
      }
    }

    // Add milestone issues if configured
    if (roadmap.spec.milestones) {
      for (const milestone of roadmap.spec.milestones) {
        const milestoneIssue = this.convertMilestoneToIssue(milestone);
        project.issues.push(milestoneIssue);
      }
    }

    return project;
  }

  /**
   * Convert Linear Project back to OSSA Roadmap
   */
  async convertLinearToRoadmap(
    project: LinearProject,
    existingRoadmap?: OSSARoadmap
  ): Promise<OSSARoadmap> {
    const roadmap: OSSARoadmap = existingRoadmap || {
      ossa: '1.0',
      kind: 'Roadmap',
      metadata: {
        name: project.name,
        version: '1.0',
        description: project.description
      },
      spec: {
        initiatives: []
      }
    };

    // Group issues by parent
    const parentIssues = project.issues.filter(i => !i.parentId);
    const childIssues = project.issues.filter(i => i.parentId);

    // Convert parent issues to initiatives
    for (const issue of parentIssues) {
      const initiative = this.convertIssueToInitiative(issue);

      // Add child issues as tasks
      const tasks = childIssues
        .filter(child => child.parentId === issue.id)
        .map(child => this.convertIssueToTask(child));

      if (tasks.length > 0) {
        initiative.tasks = tasks;
      }

      roadmap.spec.initiatives.push(initiative);
    }

    return roadmap;
  }

  /**
   * Sync OSSA Agent capabilities with Linear labels
   */
  async syncAgentCapabilitiesToLabels(
    agent: OSSAAgent,
    existingLabels: string[]
  ): Promise<string[]> {
    const newLabels: string[] = [];

    for (const capability of agent.capabilities) {
      const labelName = this.mapCapabilityToLabel(capability);
      if (!existingLabels.includes(labelName)) {
        newLabels.push(labelName);
      }
    }

    // Add conformance level as label
    if (agent.agent.conformance) {
      const conformanceLabel = `conformance:${agent.agent.conformance}`;
      if (!existingLabels.includes(conformanceLabel)) {
        newLabels.push(conformanceLabel);
      }
    }

    // Add agent type labels
    if (agent.agent.tags) {
      for (const tag of agent.agent.tags) {
        const tagLabel = `tag:${tag}`;
        if (!existingLabels.includes(tagLabel)) {
          newLabels.push(tagLabel);
        }
      }
    }

    return newLabels;
  }

  /**
   * Generate Linear issues from agent validation results
   */
  async createValidationIssues(
    agent: OSSAAgent,
    validationErrors: any[]
  ): Promise<LinearIssue[]> {
    const issues: LinearIssue[] = [];

    // Group errors by type
    const errorGroups = this.groupValidationErrors(validationErrors);

    for (const [errorType, errors] of Object.entries(errorGroups)) {
      const issue: LinearIssue = {
        title: `[OSSA] Fix ${errorType} validation errors for ${agent.agent.name}`,
        description: this.formatValidationErrors(errors as any[]),
        state: 'Todo',
        priority: this.getErrorPriority(errorType),
        labelIds: ['ossa-validation', `agent:${agent.agent.name}`]
      };

      issues.push(issue);
    }

    return issues;
  }

  // Private helper methods
  private async convertInitiativeToIssue(
    initiative: Initiative,
    roadmap: OSSARoadmap
  ): Promise<LinearIssue> {
    const issue: LinearIssue = {
      id: initiative.linearIssueId,
      title: `[${initiative.id}] ${initiative.title}`,
      description: this.formatInitiativeDescription(initiative, roadmap),
      state: this.mapStatus(initiative.status),
      priority: this.mapPriority(initiative.priority),
      dueDate: initiative.endDate,
      projectId: this.config?.projectId,
      teamId: this.config?.teamId,
      cycleId: this.config?.cycleId
    };

    // Map labels
    if (initiative.labels) {
      issue.labelIds = this.mapLabels(initiative.labels);
    }

    // Add capability labels
    if (initiative.capabilities) {
      const capLabels = initiative.capabilities.map(c => `capability:${c}`);
      issue.labelIds = [...(issue.labelIds || []), ...capLabels];
    }

    // Add agent labels
    if (initiative.agents) {
      const agentLabels = initiative.agents.map(a => `agent:${a}`);
      issue.labelIds = [...(issue.labelIds || []), ...agentLabels];
    }

    return issue;
  }

  private convertTaskToIssue(
    task: Task,
    initiative: Initiative,
    parentId?: string
  ): LinearIssue {
    return {
      title: task.title,
      description: task.description,
      state: this.mapTaskStatus(task.status),
      priority: this.mapPriority(initiative.priority),
      parentId: parentId,
      estimate: this.parseEstimate(task.estimate),
      teamId: this.config?.teamId
    };
  }

  private convertMilestoneToIssue(milestone: Milestone): LinearIssue {
    return {
      title: `[Milestone] ${milestone.name}`,
      description: this.formatMilestoneDescription(milestone),
      state: new Date(milestone.date) > new Date() ? 'Todo' : 'Done',
      priority: 2, // High priority for milestones
      dueDate: milestone.date,
      labelIds: ['milestone'],
      teamId: this.config?.teamId
    };
  }

  private convertIssueToInitiative(issue: LinearIssue): Initiative {
    // Parse ID from title if present
    const idMatch = issue.title.match(/\[([A-Z]+-\d+)\]/);
    const id = idMatch ? idMatch[1] : `LINEAR-${issue.id}`;

    return {
      id,
      title: issue.title.replace(/\[[A-Z]+-\d+\]\s*/, ''),
      description: issue.description,
      status: this.reverseMapStatus(issue.state),
      priority: this.reverseMapPriority(issue.priority),
      endDate: issue.dueDate,
      linearIssueId: issue.id,
      labels: this.extractLabels(issue.labelIds || [])
    };
  }

  private convertIssueToTask(issue: LinearIssue): Task {
    return {
      title: issue.title,
      description: issue.description,
      status: this.reverseMapTaskStatus(issue.state),
      estimate: issue.estimate ? `${issue.estimate}h` : undefined
    };
  }

  // Status mapping helpers
  private mapStatus(status?: string): string {
    if (!status) return 'Backlog';
    return this.statusMapping[status] || 'Todo';
  }

  private reverseMapStatus(linearState: string): Initiative['status'] {
    const reverseMap: Record<string, Initiative['status']> = {
      'Backlog': 'planned',
      'Todo': 'blocked',
      'In Progress': 'in_progress',
      'Done': 'completed',
      'Cancelled': 'cancelled'
    };
    return reverseMap[linearState] || 'planned';
  }

  private mapTaskStatus(status: string): string {
    const mapping: Record<string, string> = {
      'todo': 'Todo',
      'in_progress': 'In Progress',
      'done': 'Done'
    };
    return mapping[status] || 'Todo';
  }

  private reverseMapTaskStatus(linearState: string): Task['status'] {
    const reverseMap: Record<string, Task['status']> = {
      'Todo': 'todo',
      'In Progress': 'in_progress',
      'Done': 'done'
    };
    return reverseMap[linearState] || 'todo';
  }

  private mapPriority(priority?: string): number {
    if (!priority) return 3;
    return this.priorityMapping[priority] || 3;
  }

  private reverseMapPriority(priority: number): Initiative['priority'] {
    const reverseMap: Record<number, Initiative['priority']> = {
      1: 'critical',
      2: 'high',
      3: 'medium',
      4: 'low'
    };
    return reverseMap[priority] || 'medium';
  }

  private mapLabels(labels: string[]): string[] {
    if (!this.config?.labelMapping) return labels;

    return labels.map(label =>
      this.config!.labelMapping![label] || label
    );
  }

  private extractLabels(labelIds: string[]): string[] {
    // Filter out system labels
    return labelIds.filter(label =>
      !label.startsWith('capability:') &&
      !label.startsWith('agent:') &&
      label !== 'milestone'
    );
  }

  private mapCapabilityToLabel(capability: string): string {
    return `capability:${capability.replace(/_/g, '-')}`;
  }

  private parseEstimate(estimate?: string): number | undefined {
    if (!estimate) return undefined;

    const match = estimate.match(/^(\d+)([hdw])$/);
    if (!match) return undefined;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h': return value;
      case 'd': return value * 8;
      case 'w': return value * 40;
      default: return value;
    }
  }

  private formatInitiativeDescription(
    initiative: Initiative,
    roadmap: OSSARoadmap
  ): string {
    const parts = [];

    if (initiative.description) {
      parts.push(initiative.description);
      parts.push('');
    }

    parts.push('## OSSA Roadmap Details');
    parts.push(`- **Roadmap**: ${roadmap.metadata.name} v${roadmap.metadata.version}`);
    parts.push(`- **Initiative ID**: ${initiative.id}`);

    if (initiative.capabilities?.length) {
      parts.push(`- **Capabilities**: ${initiative.capabilities.join(', ')}`);
    }

    if (initiative.agents?.length) {
      parts.push(`- **Agents**: ${initiative.agents.join(', ')}`);
    }

    if (initiative.startDate) {
      parts.push(`- **Start Date**: ${initiative.startDate}`);
    }

    if (initiative.endDate) {
      parts.push(`- **End Date**: ${initiative.endDate}`);
    }

    parts.push('');
    parts.push('_Generated by OSSA-Linear Bridge_');

    return parts.join('\n');
  }

  private formatMilestoneDescription(milestone: Milestone): string {
    const parts = [];

    if (milestone.description) {
      parts.push(milestone.description);
      parts.push('');
    }

    if (milestone.deliverables?.length) {
      parts.push('## Deliverables');
      for (const deliverable of milestone.deliverables) {
        parts.push(`- ${deliverable}`);
      }
      parts.push('');
    }

    if (milestone.initiatives?.length) {
      parts.push('## Related Initiatives');
      for (const initiative of milestone.initiatives) {
        parts.push(`- ${initiative}`);
      }
    }

    return parts.join('\n');
  }

  private groupValidationErrors(errors: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const error of errors) {
      const type = error.source || 'general';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(error);
    }

    return groups;
  }

  private formatValidationErrors(errors: any[]): string {
    const parts = ['## Validation Errors'];

    for (const error of errors) {
      parts.push(`- **${error.path}**: ${error.message}`);
    }

    parts.push('');
    parts.push('Please fix these errors to achieve OSSA compliance.');

    return parts.join('\n');
  }

  private getErrorPriority(errorType: string): number {
    const priorities: Record<string, number> = {
      'error': 1,
      'cross-validation': 2,
      'agent': 2,
      'openapi': 2,
      'warning': 3,
      'general': 3
    };
    return priorities[errorType] || 3;
  }
}