/**
 * Merge Request CRUD Service
 * Implements full CRUD operations for merge requests
 */

import { Gitlab } from '@gitbeaker/rest';
import {
  MergeRequestSchema,
  CreateMergeRequestRequestSchema,
  UpdateMergeRequestRequestSchema,
  type MergeRequest,
  type CreateMergeRequestRequest,
  type UpdateMergeRequestRequest,
} from './schemas/release.schema.js';
import { BaseCrudService } from './base-crud.service.js';
import { z } from 'zod';

/**
 * Merge Request Filter Input
 */
const MergeRequestFilterSchema = z.object({
  state: z.enum(['opened', 'closed', 'merged', 'locked']).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().min(1).max(100).default(20),
});

type MergeRequestFilter = z.infer<typeof MergeRequestFilterSchema>;

/**
 * Merge Request Service - CRUD operations
 */
export class MergeRequestService extends BaseCrudService<
  MergeRequest,
  CreateMergeRequestRequest,
  UpdateMergeRequestRequest,
  MergeRequestFilter
> {
  protected createSchema = CreateMergeRequestRequestSchema;
  protected updateSchema = UpdateMergeRequestRequestSchema;
  protected filterSchema = MergeRequestFilterSchema;
  protected entitySchema = MergeRequestSchema;

  private gitlab: InstanceType<typeof Gitlab>;
  private projectId: string | number;

  constructor(gitlabToken: string, projectId: string | number = process.env.CI_PROJECT_ID || '') {
    super();
    this.gitlab = new Gitlab({ token: gitlabToken });
    this.projectId = projectId;
  }

  /**
   * Create a new merge request
   */
  async create(input: CreateMergeRequestRequest): Promise<MergeRequest> {
    try {
      const validated = this.validateCreate(input);

      const mr = await this.gitlab.MergeRequests.create(
        this.projectId,
        validated.sourceBranch,
        validated.targetBranch,
        validated.title,
        {
          description: validated.description,
          labels: validated.labels.join(','),
          milestoneId: validated.milestoneId,
        }
      );

      const approvals = await this.getApprovals(mr.iid);

      const result: MergeRequest = {
        id: mr.iid,
        title: String(mr.title),
        description: String(mr.description || ''),
        sourceBranch: String(mr.sourceBranch),
        targetBranch: String(mr.targetBranch),
        state: mr.state as MergeRequest['state'],
        mergeStatus: mr.mergeStatus as MergeRequest['mergeStatus'],
        createdAt: String(mr.createdAt),
        updatedAt: String(mr.updatedAt),
        mergedAt: mr.mergedAt ? String(mr.mergedAt) : null,
        labels: Array.isArray(mr.labels)
          ? mr.labels.map((l: unknown) => (typeof l === 'string' ? l : String(l)))
          : [],
        approvals,
      };

      return this.validateEntity(result);
    } catch (error) {
      this.handleValidationError(error);
      throw error;
    }
  }

  /**
   * Read merge request by ID
   */
  async read(id: string | number): Promise<MergeRequest | null> {
    this.validateId(id);

    try {
      const mr = await this.gitlab.MergeRequests.show(this.projectId, Number(id));

      const approvals = await this.getApprovals(mr.iid);

      const result: MergeRequest = {
        id: mr.iid,
        title: String(mr.title),
        description: String(mr.description || ''),
        sourceBranch: String(mr.sourceBranch),
        targetBranch: String(mr.targetBranch),
        state: mr.state as MergeRequest['state'],
        mergeStatus: mr.mergeStatus as MergeRequest['mergeStatus'],
        createdAt: String(mr.createdAt),
        updatedAt: String(mr.updatedAt),
        mergedAt: mr.mergedAt ? String(mr.mergedAt) : null,
        labels: Array.isArray(mr.labels)
          ? mr.labels.map((l: unknown) => (typeof l === 'string' ? l : String(l)))
          : [],
        approvals,
      };

      return this.validateEntity(result);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response: { status: number } }).response.status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update merge request
   */
  async update(id: string | number, input: UpdateMergeRequestRequest): Promise<MergeRequest> {
    this.validateId(id);
    const validated = this.validateUpdate(input);

    const existing = await this.read(id);
    if (!existing) {
      this.throwNotFound('MergeRequest', id);
    }

    const updated = await this.gitlab.MergeRequests.edit(this.projectId, Number(id), {
      title: validated.title,
      description: validated.description,
      stateEvent: validated.state,
      labels: validated.labels?.join(','),
    });

    const approvals = await this.getApprovals(updated.iid);

    const result: MergeRequest = {
      id: updated.iid,
      title: String(updated.title),
      description: String(updated.description || ''),
      sourceBranch: String(updated.sourceBranch),
      targetBranch: String(updated.targetBranch),
      state: updated.state as MergeRequest['state'],
      mergeStatus: updated.mergeStatus as string as MergeRequest['mergeStatus'],
      createdAt: String(updated.createdAt),
      updatedAt: String(updated.updatedAt),
      mergedAt: updated.mergedAt ? String(updated.mergedAt) : null,
      labels: Array.isArray(updated.labels)
        ? updated.labels.map((l: unknown) => (typeof l === 'string' ? l : String(l)))
        : [],
      approvals,
    };

    return this.validateEntity(result);
  }

  /**
   * Delete merge request
   */
  async delete(id: string | number): Promise<void> {
    this.validateId(id);

    const existing = await this.read(id);
    if (!existing) {
      this.throwNotFound('MergeRequest', id);
    }

    await this.gitlab.MergeRequests.remove(this.projectId, Number(id));
  }

  /**
   * List merge requests with filtering and pagination
   */
  async list(filters?: MergeRequestFilter): Promise<{
    items: MergeRequest[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }> {
    const validatedFilters = this.validateFilter(filters || {});

    try {
      const mrs = await this.gitlab.MergeRequests.all({
        projectId: this.projectId,
        state: validatedFilters.state,
        perPage: validatedFilters.perPage,
        page: validatedFilters.page,
      });

      const items = await Promise.all(
        mrs.map(async (mr) => {
          const approvals = await this.getApprovals(mr.iid);
          return this.validateEntity({
            id: mr.iid,
            title: String(mr.title),
            description: String(mr.description || ''),
            sourceBranch: String(mr.sourceBranch),
            targetBranch: String(mr.targetBranch),
            state: mr.state as MergeRequest['state'],
            mergeStatus: mr.mergeStatus as string as MergeRequest['mergeStatus'],
            createdAt: String(mr.createdAt),
            updatedAt: String(mr.updatedAt),
            mergedAt: mr.mergedAt ? String(mr.mergedAt) : null,
            labels: Array.isArray(mr.labels)
              ? mr.labels.map((l: unknown) => (typeof l === 'string' ? l : String(l)))
              : [],
            approvals,
          });
        })
      );

      // Note: GitLab API doesn't always return total
      const total =
        items.length >= validatedFilters.perPage
          ? items.length + validatedFilters.perPage
          : items.length;

      return {
        items,
        pagination: this.calculatePagination(
          total,
          validatedFilters.page,
          validatedFilters.perPage
        ),
      };
    } catch (error) {
      throw new Error(`Failed to list merge requests: ${error}`);
    }
  }

  /**
   * Helper: Get merge request approvals
   */
  private async getApprovals(mrId: number): Promise<{
    required: number;
    received: number;
  }> {
    try {
      const mr = await this.gitlab.MergeRequests.show(this.projectId, mrId);
      // GitLab API may include approval info in MR object
      const approvalsRequired = (mr as { approvalsRequired?: number }).approvalsRequired || 0;
      const approvalsLeft = (mr as { approvalsLeft?: number }).approvalsLeft || 0;

      return {
        required: approvalsRequired,
        received: approvalsRequired - approvalsLeft,
      };
    } catch {
      return { required: 0, received: 0 };
    }
  }
}
