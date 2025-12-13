/**
 * Milestone CRUD Service
 * Implements full CRUD operations for milestones
 */

import { Gitlab } from '@gitbeaker/rest';
import {
  MilestoneSchema,
  CreateMilestoneRequestSchema,
  UpdateMilestoneRequestSchema,
  type Milestone,
  type CreateMilestoneRequest,
  type UpdateMilestoneRequest,
} from './schemas/release.schema.js';
import { BaseCrudService } from './base-crud.service.js';
import { z } from 'zod';

/**
 * Milestone Filter Input
 */
const MilestoneFilterSchema = z.object({
  state: z.enum(['active', 'closed']).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().min(1).max(100).default(20),
});

type MilestoneFilter = z.infer<typeof MilestoneFilterSchema>;

/**
 * Milestone Service - CRUD operations
 */
export class MilestoneService extends BaseCrudService<
  Milestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  MilestoneFilter
> {
  protected createSchema = CreateMilestoneRequestSchema;
  protected updateSchema = UpdateMilestoneRequestSchema;
  protected filterSchema = MilestoneFilterSchema;
  protected entitySchema = MilestoneSchema;

  private gitlab: InstanceType<typeof Gitlab>;
  private projectId: string | number;

  constructor(
    gitlabToken: string,
    projectId: string | number = process.env.CI_PROJECT_ID || ''
  ) {
    super();
    this.gitlab = new Gitlab({ token: gitlabToken });
    this.projectId = projectId;
  }

  /**
   * Create a new milestone
   */
  async create(input: CreateMilestoneRequest): Promise<Milestone> {
    try {
      const validated = this.validateCreate(input);

      const milestone = await this.gitlab.ProjectMilestones.create(
        this.projectId,
        validated.title,
        {
          description: validated.description,
          dueDate: validated.dueDate,
          startDate: validated.startDate,
        }
      );

      const statistics = await this.getMilestoneStatistics(milestone.id);

      const result: Milestone = {
        id: milestone.id,
        title: String(milestone.title),
        description: String(milestone.description || ''),
        state: milestone.state as 'active' | 'closed',
        dueDate: milestone.dueDate ? String(milestone.dueDate) : null,
        startDate: milestone.startDate ? String(milestone.startDate) : null,
        createdAt: String(milestone.createdAt),
        updatedAt: String(milestone.updatedAt),
        statistics,
      };

      return this.validateEntity(result);
    } catch (error) {
      this.handleValidationError(error);
      throw error;
    }
  }

  /**
   * Read milestone by ID
   */
  async read(id: string | number): Promise<Milestone | null> {
    this.validateId(id);

    try {
      const milestone = await this.gitlab.ProjectMilestones.show(
        this.projectId,
        Number(id)
      );

      const statistics = await this.getMilestoneStatistics(milestone.id);

      const result: Milestone = {
        id: milestone.id,
        title: String(milestone.title),
        description: String(milestone.description || ''),
        state: milestone.state as 'active' | 'closed',
        dueDate: milestone.dueDate ? String(milestone.dueDate) : null,
        startDate: milestone.startDate ? String(milestone.startDate) : null,
        createdAt: String(milestone.createdAt),
        updatedAt: String(milestone.updatedAt),
        statistics,
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
   * Update milestone
   */
  async update(
    id: string | number,
    input: UpdateMilestoneRequest
  ): Promise<Milestone> {
    this.validateId(id);
    const validated = this.validateUpdate(input);

    const existing = await this.read(id);
    if (!existing) {
      this.throwNotFound('Milestone', id);
    }

    const updateParams: {
      title?: string;
      description?: string;
      stateEvent?: 'close' | 'activate';
      dueDate?: string;
      startDate?: string;
    } = {};

    if (validated.title) updateParams.title = validated.title;
    if (validated.description) updateParams.description = validated.description;
    if (validated.state === 'closed') updateParams.stateEvent = 'close';
    if (validated.state === 'active') updateParams.stateEvent = 'activate';
    if (validated.dueDate) updateParams.dueDate = validated.dueDate;
    if (validated.startDate) updateParams.startDate = validated.startDate;

    const updated = await this.gitlab.ProjectMilestones.edit(
      this.projectId,
      Number(id),
      updateParams
    );

    const statistics = await this.getMilestoneStatistics(updated.id);

    const result: Milestone = {
      id: updated.id,
      title: String(updated.title),
      description: String(updated.description || ''),
      state: updated.state as 'active' | 'closed',
      dueDate: updated.dueDate ? String(updated.dueDate) : null,
      startDate: updated.startDate ? String(updated.startDate) : null,
      createdAt: String(updated.createdAt),
      updatedAt: String(updated.updatedAt),
      statistics,
    };

    return this.validateEntity(result);
  }

  /**
   * Delete milestone
   */
  async delete(id: string | number): Promise<void> {
    this.validateId(id);

    const existing = await this.read(id);
    if (!existing) {
      this.throwNotFound('Milestone', id);
    }

    await this.gitlab.ProjectMilestones.remove(this.projectId, Number(id));
  }

  /**
   * List milestones with filtering and pagination
   */
  async list(filters?: MilestoneFilter): Promise<{
    items: Milestone[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }> {
    const validatedFilters = this.validateFilter(filters || {});

    try {
      const milestones = await this.gitlab.ProjectMilestones.all(
        this.projectId,
        {
          state: validatedFilters.state,
          perPage: validatedFilters.perPage,
          page: validatedFilters.page,
        }
      );

      const items = await Promise.all(
        milestones.map(async (m) => {
          const statistics = await this.getMilestoneStatistics(m.id);
          return this.validateEntity({
            id: m.id,
            title: m.title,
            description: m.description || '',
            state: m.state as 'active' | 'closed',
            dueDate: m.dueDate || null,
            startDate: m.startDate || null,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            statistics,
          });
        })
      );

      // Note: GitLab API doesn't always return total, so we estimate
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
      throw new Error(`Failed to list milestones: ${error}`);
    }
  }

  /**
   * Helper: Get milestone statistics
   */
  private async getMilestoneStatistics(milestoneId: number): Promise<{
    totalIssues: number;
    closedIssues: number;
    openIssues: number;
    completionPercentage: number;
  }> {
    try {
      const milestone = await this.gitlab.ProjectMilestones.show(
        this.projectId,
        milestoneId
      );

      const totalIssues = (milestone.totalIssuesCount as number) || 0;
      const closedIssues = (milestone.closedIssuesCount as number) || 0;
      const openIssues = totalIssues - closedIssues;
      const completionPercentage =
        totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0;

      return {
        totalIssues: Number(totalIssues),
        closedIssues: Number(closedIssues),
        openIssues: Number(openIssues),
        completionPercentage: Math.round(completionPercentage * 100) / 100,
      };
    } catch {
      return {
        totalIssues: 0,
        closedIssues: 0,
        openIssues: 0,
        completionPercentage: 0,
      };
    }
  }
}
