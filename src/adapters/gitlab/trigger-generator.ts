/**
 * GitLab Duo Trigger Generator
 * Generates trigger configurations for GitLab Duo agents
 *
 * Supports 7 trigger types:
 * - mention: @agent mentions in issues/MRs
 * - assign: Issue/MR assignment
 * - assign_reviewer: MR reviewer assignment
 * - schedule: Cron-based triggers
 * - pipeline: CI/CD pipeline triggers
 * - webhook: External webhook triggers
 * - file_pattern: File change pattern triggers
 */

import type { OssaAgent } from '../../types/index.js';
import YAML from 'yaml';

export type TriggerType =
  | 'mention'
  | 'assign'
  | 'assign_reviewer'
  | 'schedule'
  | 'pipeline'
  | 'webhook'
  | 'file_pattern';

export interface MentionTrigger {
  type: 'mention';
  patterns: string[];
  contexts: ('issue' | 'merge_request' | 'comment')[];
  permissions?: {
    allowed_users?: string[];
    allowed_groups?: string[];
    min_role?: 'guest' | 'reporter' | 'developer' | 'maintainer' | 'owner';
  };
}

export interface AssignTrigger {
  type: 'assign';
  contexts: ('issue' | 'merge_request')[];
  conditions?: {
    labels?: string[];
    milestone?: string;
    project_path?: string;
  };
}

export interface AssignReviewerTrigger {
  type: 'assign_reviewer';
  conditions?: {
    draft?: boolean;
    labels?: string[];
    target_branch?: string;
  };
}

export interface ScheduleTrigger {
  type: 'schedule';
  cron: string;
  timezone?: string;
  conditions?: {
    branch?: string;
    only_if_changed?: boolean;
  };
}

export interface PipelineTrigger {
  type: 'pipeline';
  stages: string[];
  on_status?: ('success' | 'failed' | 'manual')[];
  conditions?: {
    branch?: string;
    tags?: string[];
  };
}

export interface WebhookTrigger {
  type: 'webhook';
  url_path: string;
  methods: ('GET' | 'POST' | 'PUT')[];
  authentication?: {
    type: 'token' | 'oauth' | 'none';
    token_env?: string;
  };
  payload_validation?: {
    required_fields?: string[];
    json_schema?: Record<string, unknown>;
  };
}

export interface FilePatternTrigger {
  type: 'file_pattern';
  patterns: string[];
  events: ('created' | 'modified' | 'deleted')[];
  conditions?: {
    branch?: string;
    exclude_patterns?: string[];
  };
}

export type TriggerConfig =
  | MentionTrigger
  | AssignTrigger
  | AssignReviewerTrigger
  | ScheduleTrigger
  | PipelineTrigger
  | WebhookTrigger
  | FilePatternTrigger;

export interface TriggerManifest {
  version: 'v1';
  agent_name: string;
  triggers: TriggerConfig[];
  metadata?: {
    description?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export class GitLabDuoTriggerGenerator {
  /**
   * Generate all trigger configurations based on OSSA manifest
   */
  generate(manifest: OssaAgent): TriggerManifest {
    const agentName = this.sanitizeName(manifest.metadata?.name || 'agent');
    const triggers: TriggerConfig[] = [];

    // Analyze OSSA manifest to determine appropriate triggers
    const spec = manifest.spec as Record<string, unknown>;
    const autonomy = spec.autonomy as
      | {
          level?: string;
          triggers?: string[];
        }
      | undefined;

    // Default: Always include mention trigger for interactive agents
    if (autonomy?.level !== 'fully-autonomous') {
      triggers.push(this.generateMentionTrigger(manifest));
    }

    // Parse explicit triggers from OSSA
    const ossaTriggers = autonomy?.triggers || [];
    for (const triggerType of ossaTriggers) {
      const trigger = this.generateTriggerFromType(manifest, triggerType);
      if (trigger) {
        triggers.push(trigger);
      }
    }

    // If autonomous and no triggers specified, add schedule
    if (autonomy?.level === 'fully-autonomous' && triggers.length === 0) {
      triggers.push(this.generateScheduleTrigger(manifest));
    }

    return {
      version: 'v1',
      agent_name: agentName,
      triggers,
      metadata: {
        description: `Triggers for ${manifest.metadata?.name || 'agent'}`,
        created_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate YAML string for triggers
   */
  generateYAML(manifest: OssaAgent): string {
    const triggerManifest = this.generate(manifest);
    return YAML.stringify(triggerManifest, {
      indent: 2,
      lineWidth: 0,
    });
  }

  /**
   * Generate individual trigger files (one YAML per trigger type)
   */
  generateTriggerFiles(manifest: OssaAgent): Map<string, string> {
    const triggerManifest = this.generate(manifest);
    const files = new Map<string, string>();

    for (const trigger of triggerManifest.triggers) {
      const fileName = `${trigger.type}.yaml`;
      const content = YAML.stringify(
        {
          version: 'v1',
          agent_name: triggerManifest.agent_name,
          trigger,
        },
        { indent: 2, lineWidth: 0 }
      );
      files.set(fileName, content);
    }

    return files;
  }

  /**
   * Generate trigger from type string
   */
  private generateTriggerFromType(manifest: OssaAgent, type: string): TriggerConfig | null {
    const normalized = type.toLowerCase().replace(/[_-]/g, '');

    switch (normalized) {
      case 'mention':
        return this.generateMentionTrigger(manifest);
      case 'assign':
      case 'assignment':
        return this.generateAssignTrigger(manifest);
      case 'assignreviewer':
      case 'reviewer':
        return this.generateAssignReviewerTrigger(manifest);
      case 'schedule':
      case 'cron':
        return this.generateScheduleTrigger(manifest);
      case 'pipeline':
      case 'ci':
      case 'cicd':
        return this.generatePipelineTrigger(manifest);
      case 'webhook':
      case 'http':
        return this.generateWebhookTrigger(manifest);
      case 'filepattern':
      case 'file':
        return this.generateFilePatternTrigger(manifest);
      default:
        return null;
    }
  }

  /**
   * Generate mention trigger (@agent mentions)
   */
  private generateMentionTrigger(manifest: OssaAgent): MentionTrigger {
    const agentName = manifest.metadata?.name || 'agent';

    return {
      type: 'mention',
      patterns: [`@${this.sanitizeName(agentName)}`, `@agent-${this.sanitizeName(agentName)}`],
      contexts: ['issue', 'merge_request', 'comment'],
      permissions: {
        min_role: 'reporter',
      },
    };
  }

  /**
   * Generate assign trigger (assigned to issue/MR)
   */
  private generateAssignTrigger(manifest: OssaAgent): AssignTrigger {
    const spec = manifest.spec as Record<string, unknown>;
    const automation = spec.automation as
      | {
          labels?: string[];
          milestone?: string;
        }
      | undefined;

    return {
      type: 'assign',
      contexts: ['issue', 'merge_request'],
      conditions: {
        labels: automation?.labels,
        milestone: automation?.milestone,
      },
    };
  }

  /**
   * Generate assign reviewer trigger (MR reviewer assignment)
   */
  private generateAssignReviewerTrigger(manifest: OssaAgent): AssignReviewerTrigger {
    const spec = manifest.spec as Record<string, unknown>;
    const automation = spec.automation as
      | {
          draft?: boolean;
          labels?: string[];
          targetBranch?: string;
        }
      | undefined;

    return {
      type: 'assign_reviewer',
      conditions: {
        draft: automation?.draft,
        labels: automation?.labels,
        target_branch: automation?.targetBranch || 'main',
      },
    };
  }

  /**
   * Generate schedule trigger (cron-based)
   */
  private generateScheduleTrigger(manifest: OssaAgent): ScheduleTrigger {
    const spec = manifest.spec as Record<string, unknown>;
    const automation = spec.automation as
      | {
          schedule?: string;
          timezone?: string;
          branch?: string;
        }
      | undefined;

    return {
      type: 'schedule',
      cron: automation?.schedule || '0 0 * * *', // Daily at midnight
      timezone: automation?.timezone || 'UTC',
      conditions: {
        branch: automation?.branch || 'main',
        only_if_changed: true,
      },
    };
  }

  /**
   * Generate pipeline trigger (CI/CD triggers)
   */
  private generatePipelineTrigger(manifest: OssaAgent): PipelineTrigger {
    const spec = manifest.spec as Record<string, unknown>;
    const automation = spec.automation as
      | {
          stages?: string[];
          onStatus?: string[];
          branch?: string;
        }
      | undefined;

    return {
      type: 'pipeline',
      stages: automation?.stages || ['test', 'deploy'],
      on_status: (automation?.onStatus as ('success' | 'failed' | 'manual')[]) || ['success'],
      conditions: {
        branch: automation?.branch || 'main',
      },
    };
  }

  /**
   * Generate webhook trigger (external webhooks)
   */
  private generateWebhookTrigger(manifest: OssaAgent): WebhookTrigger {
    const agentName = this.sanitizeName(manifest.metadata?.name || 'agent');

    return {
      type: 'webhook',
      url_path: `/webhooks/${agentName}`,
      methods: ['POST'],
      authentication: {
        type: 'token',
        token_env: 'WEBHOOK_TOKEN',
      },
      payload_validation: {
        required_fields: ['event', 'data'],
      },
    };
  }

  /**
   * Generate file pattern trigger (file change triggers)
   */
  private generateFilePatternTrigger(manifest: OssaAgent): FilePatternTrigger {
    const spec = manifest.spec as Record<string, unknown>;
    const automation = spec.automation as
      | {
          filePatterns?: string[];
          events?: string[];
          branch?: string;
        }
      | undefined;

    return {
      type: 'file_pattern',
      patterns: automation?.filePatterns || ['**/*.ts', '**/*.js'],
      events: (automation?.events as ('created' | 'modified' | 'deleted')[]) || [
        'created',
        'modified',
      ],
      conditions: {
        branch: automation?.branch || 'main',
        exclude_patterns: ['node_modules/**', 'dist/**'],
      },
    };
  }

  /**
   * Sanitize name for use in triggers
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
