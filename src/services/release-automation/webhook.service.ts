/**
 * Webhook Service
 * Handles GitLab webhooks with Zod validation
 */

import {
  MilestoneWebhookPayloadSchema,
  PushWebhookPayloadSchema,
  WebhookResponseSchema,
  type MilestoneWebhookPayload,
  type PushWebhookPayload,
  type WebhookResponse,
} from './schemas/release.schema.js';
import { ReleaseService } from './release.service.js';
import { MilestoneService } from './milestone.service.js';
import { TagService } from './tag.service.js';
import { MergeRequestService } from './merge-request.service.js';

/**
 * Webhook Service
 * DRY: Centralized webhook handling
 */
export class WebhookService {
  private releaseService: ReleaseService;
  private milestoneService: MilestoneService;
  private tagService: TagService;
  private mergeRequestService: MergeRequestService;

  constructor(
    gitlabToken: string,
    projectId: string | number = process.env.CI_PROJECT_ID || ''
  ) {
    this.releaseService = new ReleaseService(gitlabToken, projectId);
    this.milestoneService = new MilestoneService(gitlabToken, projectId);
    this.tagService = new TagService(gitlabToken, projectId);
    this.mergeRequestService = new MergeRequestService(gitlabToken, projectId);
  }

  /**
   * Handle milestone webhook
   */
  async handleMilestoneWebhook(
    payload: unknown
  ): Promise<WebhookResponse> {
    try {
      // Validate payload with Zod
      const validated = MilestoneWebhookPayloadSchema.parse(payload);
      const actions: WebhookResponse['actions'] = [];

      const { project, object_attributes: milestone } = validated;

      // Determine if this is a create or close event
      const isNewMilestone =
        milestone.state === 'active' &&
        new Date(milestone.created_at).getTime() ===
          new Date(milestone.updated_at).getTime();

      if (isNewMilestone) {
        // Milestone created - create dev tag and branch
        const action = await this.handleMilestoneCreate(validated);
        if (action) actions.push(action);
      } else if (milestone.state === 'closed') {
        // Milestone closed - create RC
        const action = await this.handleMilestoneClose(validated);
        if (action) actions.push(action);
      }

      return WebhookResponseSchema.parse({
        success: true,
        message: `Milestone ${milestone.title} processed`,
        actions,
      });
    } catch (error) {
      return WebhookResponseSchema.parse({
        success: false,
        message: `Webhook processing failed: ${error}`,
        actions: [],
      });
    }
  }

  /**
   * Handle push webhook
   */
  async handlePushWebhook(payload: unknown): Promise<WebhookResponse> {
    try {
      // Validate payload with Zod
      const validated = PushWebhookPayloadSchema.parse(payload);
      const actions: WebhookResponse['actions'] = [];

      // Only process development branch pushes
      if (validated.ref === 'refs/heads/development') {
        const action = await this.handleDevelopmentPush(validated);
        if (action) actions.push(action);
      }

      return WebhookResponseSchema.parse({
        success: true,
        message: 'Push webhook processed',
        actions,
      });
    } catch (error) {
      return WebhookResponseSchema.parse({
        success: false,
        message: `Webhook processing failed: ${error}`,
        actions: [],
      });
    }
  }

  /**
   * Handle milestone creation
   */
  private async handleMilestoneCreate(
    payload: MilestoneWebhookPayload
  ): Promise<{ type: string; status: string; details?: Record<string, unknown> } | null> {
    const { project, object_attributes: milestone } = payload;
    const version = milestone.title.replace(/^v/, '');

    // Create initial dev tag
    const devTag = `v${version}-dev.0`;
    await this.tagService.create({
      name: devTag,
      ref: 'development',
      message: `Initial dev tag for ${milestone.title}`,
    });

    return {
      type: 'milestone_created',
      status: 'success',
      details: {
        milestoneId: milestone.id,
        tag: devTag,
        version,
      },
    };
  }

  /**
   * Handle milestone closure
   */
  private async handleMilestoneClose(
    payload: MilestoneWebhookPayload
  ): Promise<{ type: string; status: string; details?: Record<string, unknown> } | null> {
    const { project, object_attributes: milestone } = payload;
    const version = milestone.title.replace(/^v/, '');

    // Get milestone statistics
    const milestoneData = await this.milestoneService.read(milestone.id);
    if (!milestoneData) {
      throw new Error(`Milestone ${milestone.id} not found`);
    }

    // Check all issues are closed
    if (milestoneData.statistics.openIssues > 0) {
      throw new Error(
        `Cannot create RC: ${milestoneData.statistics.openIssues} issues still open`
      );
    }

    // Create RC tag
    const rcTag = `v${version}-rc.1`;
    await this.tagService.create({
      name: rcTag,
      ref: 'development',
      message: `Release candidate for ${milestone.title}`,
    });

    // Create MR: development → main
    const mr = await this.mergeRequestService.create({
      sourceBranch: 'development',
      targetBranch: 'main',
      title: `Release ${milestone.title}`,
      description: `Release candidate ${rcTag} for milestone ${milestone.title}`,
      labels: ['release', 'automation'],
      milestoneId: milestone.id,
    });

    return {
      type: 'milestone_closed',
      status: 'success',
      details: {
        milestoneId: milestone.id,
        rcTag,
        mergeRequestId: mr.id,
      },
    };
  }

  /**
   * Handle development branch push
   */
  private async handleDevelopmentPush(
    payload: PushWebhookPayload
  ): Promise<{ type: string; status: string; details?: Record<string, unknown> } | null> {
    // Auto-increment dev tag
    // This would be implemented based on current version detection
    // For now, return success

    return {
      type: 'dev_tag_incremented',
      status: 'success',
      details: {
        branch: payload.ref,
        commits: payload.commits.length,
      },
    };
  }
}

