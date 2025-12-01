/**
 * Release CRUD Service
 * Implements full CRUD operations for releases
 */

import { Gitlab } from '@gitbeaker/rest';
import {
  ReleaseSchema,
  CreateReleaseRequestSchema,
  UpdateReleaseRequestSchema,
  type Release,
  type CreateReleaseRequest,
  type UpdateReleaseRequest,
} from './schemas/release.schema.js';
import { BaseCrudService } from './base-crud.service.js';
import { z } from 'zod';

/**
 * Release Filter Input
 */
const ReleaseFilterSchema = z.object({
  version: z.string().optional(),
  state: z.enum(['draft', 'dev', 'rc', 'released', 'deprecated']).optional(),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().min(1).max(100).default(20),
});

type ReleaseFilter = z.infer<typeof ReleaseFilterSchema>;

/**
 * Release Service - CRUD operations
 */
export class ReleaseService extends BaseCrudService<
  Release,
  CreateReleaseRequest,
  UpdateReleaseRequest,
  ReleaseFilter
> {
  protected createSchema = CreateReleaseRequestSchema;
  protected updateSchema = UpdateReleaseRequestSchema;
  protected filterSchema = ReleaseFilterSchema;
  protected entitySchema = ReleaseSchema;

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
   * Create a new release
   */
  async create(input: CreateReleaseRequest): Promise<Release> {
    try {
      const validated = this.validateCreate(input);

      // Check if release already exists
      const existing = await this.findByVersion(validated.version);
      if (existing) {
        throw new Error(`Release ${validated.version} already exists`);
      }

      // Create release entity
      const release: Release = {
        id: validated.version,
        version: validated.version.replace(/^v/, ''),
        state: 'draft',
        milestoneId: validated.milestoneId,
        tags: [],
        mergeRequestId: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        releasedAt: null,
        metadata: validated.metadata || {},
      };

      return this.validateEntity(release);
    } catch (error) {
      this.handleValidationError(error);
      throw error;
    }
  }

  /**
   * Read release by ID (version)
   */
  async read(id: string | number): Promise<Release | null> {
    this.validateId(id);

    try {
      // Try to find by version
      const version = String(id).replace(/^v/, '');
      const release = await this.findByVersion(version);
      return release;
    } catch {
      return null;
    }
  }

  /**
   * Update release
   */
  async update(
    id: string | number,
    input: UpdateReleaseRequest
  ): Promise<Release> {
    this.validateId(id);
    const validated = this.validateUpdate(input);

    const existing = await this.read(id);
    if (!existing) {
      this.throwNotFound('Release', id);
    }

    const updated: Release = {
      ...existing,
      ...validated,
      updatedAt: new Date().toISOString(),
      releasedAt:
        validated.state === 'released'
          ? new Date().toISOString()
          : existing.releasedAt,
    };

    return this.validateEntity(updated);
  }

  /**
   * Delete release
   */
  async delete(id: string | number): Promise<void> {
    this.validateId(id);

    const existing = await this.read(id);
    if (!existing) {
      this.throwNotFound('Release', id);
    }

    if (existing.state === 'released') {
      throw new Error('Cannot delete a released version. Deprecate instead.');
    }

    // In a real implementation, you would delete from storage here
    // For now, we just validate the operation
  }

  /**
   * List releases with filtering and pagination
   */
  async list(filters?: ReleaseFilter): Promise<{
    items: Release[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }> {
    const validatedFilters = this.validateFilter(filters || {});

    try {
      // Get all tags from GitLab
      const tags = await this.gitlab.Tags.all(this.projectId, {
        perPage: 100,
      });

      // Filter and map to releases
      const releases: Release[] = tags
        .map((tag) => this.tagToRelease(tag))
        .filter((release) => {
          if (validatedFilters.version) {
            return release.version.includes(validatedFilters.version);
          }
          if (validatedFilters.state) {
            return release.state === validatedFilters.state;
          }
          return true;
        });

      // Sort by version (newest first)
      releases.sort((a, b) => {
        return b.version.localeCompare(a.version, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });

      // Paginate
      const total = releases.length;
      const page = validatedFilters.page;
      const perPage = validatedFilters.perPage;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginated = releases.slice(start, end);

      return {
        items: paginated.map((r) => this.validateEntity(r)),
        pagination: this.calculatePagination(total, page, perPage),
      };
    } catch (error) {
      throw new Error(`Failed to list releases: ${error}`);
    }
  }

  /**
   * Helper: Find release by version
   */
  private async findByVersion(version: string): Promise<Release | null> {
    try {
      const tags = await this.gitlab.Tags.all(this.projectId, {
        search: version,
      });

      const matchingTag = tags.find(
        (tag) => tag.name.includes(version) || tag.name === `v${version}`
      );

      if (matchingTag) {
        return this.tagToRelease(matchingTag);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper: Convert GitLab tag to Release entity
   */
  private tagToRelease(tag: {
    name: string;
    commit?: { id: string };
    message?: string;
  }): Release {
    const version = tag.name.replace(/^v/, '');
    const state = this.determineReleaseState(tag.name);

    return {
      id: tag.name,
      version,
      state,
      tags: [tag.name],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      releasedAt: state === 'released' ? new Date().toISOString() : null,
      metadata: {},
    };
  }

  /**
   * Helper: Determine release state from tag name
   */
  private determineReleaseState(tagName: string): Release['state'] {
    if (tagName.includes('-dev.')) return 'dev';
    if (tagName.includes('-rc.')) return 'rc';
    if (tagName.match(/^v?[0-9]+\.[0-9]+\.[0-9]+$/)) return 'released';
    return 'draft';
  }
}

