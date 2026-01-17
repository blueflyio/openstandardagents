/**
 * Tag CRUD Service
 * Implements full CRUD operations for Git tags
 */

import { Gitlab } from '@gitbeaker/rest';
import {
  TagSchema,
  CreateTagRequestSchema,
  type Tag,
  type CreateTagRequest,
} from './schemas/release.schema.js';
import { BaseCrudService } from './base-crud.service.js';
import { z } from 'zod';

/**
 * Tag Filter Input
 */
const TagFilterSchema = z.object({
  version: z.string().optional(),
  type: z.enum(['dev', 'rc', 'release', 'all']).default('all'),
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().min(1).max(100).default(20),
});

type TagFilter = z.infer<typeof TagFilterSchema>;

/**
 * Tag Service - CRUD operations
 */
export class TagService extends BaseCrudService<
  Tag,
  CreateTagRequest,
  never, // Tags are immutable - no update
  TagFilter
> {
  protected createSchema = CreateTagRequestSchema;
  protected updateSchema = z.never(); // Tags cannot be updated
  protected filterSchema = TagFilterSchema;
  protected entitySchema = TagSchema;

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
   * Create a new tag
   */
  async create(input: CreateTagRequest): Promise<Tag> {
    try {
      const validated = this.validateCreate(input);

      // Check if tag already exists
      const existing = await this.read(validated.name);
      if (existing) {
        throw new Error(`Tag ${validated.name} already exists`);
      }

      // Create tag via GitLab API
      const tag = await this.gitlab.Tags.create(
        this.projectId,
        validated.name,
        validated.ref,
        {
          message: validated.message || `Tag ${validated.name}`,
        }
      );

      const result: Tag = {
        name: tag.name,
        type: this.determineTagType(tag.name),
        version: this.extractVersion(tag.name),
        commitSha: tag.commit?.id || '',
        message: tag.message || '',
        createdAt: new Date().toISOString(),
        ref: validated.ref,
      };

      return this.validateEntity(result);
    } catch (error) {
      this.handleValidationError(error);
      throw error;
    }
  }

  /**
   * Read tag by name
   */
  async read(id: string | number): Promise<Tag | null> {
    this.validateId(id);

    try {
      const tagName = String(id);
      const tags = await this.gitlab.Tags.all(this.projectId, {
        search: tagName,
      });

      const tag = tags.find((t) => t.name === tagName);
      if (!tag) {
        return null;
      }

      const result: Tag = {
        name: tag.name,
        type: this.determineTagType(tag.name),
        version: this.extractVersion(tag.name),
        commitSha: tag.commit?.id || '',
        message: tag.message || '',
        createdAt:
          (tag as { createdAt?: string }).createdAt || new Date().toISOString(),
        ref: (tag as { target?: string }).target || 'unknown',
      };

      return this.validateEntity(result);
    } catch {
      return null;
    }
  }

  /**
   * Update tag - NOT SUPPORTED (tags are immutable)
   */
  async update(): Promise<Tag> {
    throw new Error('Tags are immutable and cannot be updated');
  }

  /**
   * Delete tag
   */
  async delete(id: string | number): Promise<void> {
    this.validateId(id);

    const existing = await this.read(id);
    if (!existing) {
      this.throwNotFound('Tag', id);
    }

    await this.gitlab.Tags.remove(this.projectId, String(id));
  }

  /**
   * List tags with filtering and pagination
   */
  async list(filters?: TagFilter): Promise<{
    items: Tag[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }> {
    const validatedFilters = this.validateFilter(filters || {});

    try {
      const tags = await this.gitlab.Tags.all(this.projectId, {
        perPage: 100,
        search: validatedFilters.version,
      });

      const items = tags
        .map((tag) => ({
          name: tag.name,
          type: this.determineTagType(tag.name),
          version: this.extractVersion(tag.name),
          commitSha: tag.commit?.id || '',
          message: tag.message || '',
          createdAt: tag.createdAt || new Date().toISOString(),
          ref: tag.target || 'unknown',
        }))
        .filter((tag) => {
          if (validatedFilters.type !== 'all') {
            return tag.type === validatedFilters.type;
          }
          if (validatedFilters.version) {
            return tag.version.includes(validatedFilters.version);
          }
          return true;
        })
        .map((tag) => this.validateEntity(tag));

      // Sort by version (newest first)
      items.sort((a, b) => {
        return b.version.localeCompare(a.version, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });

      // Paginate
      const total = items.length;
      const page = validatedFilters.page;
      const perPage = validatedFilters.perPage;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginated = items.slice(start, end);

      return {
        items: paginated,
        pagination: this.calculatePagination(total, page, perPage),
      };
    } catch (error) {
      throw new Error(`Failed to list tags: ${error}`);
    }
  }

  /**
   * Helper: Determine tag type from name
   */
  private determineTagType(tagName: string): 'dev' | 'rc' | 'release' {
    if (tagName.includes('-dev.')) return 'dev';
    if (tagName.includes('-rc.')) return 'rc';
    return 'release';
  }

  /**
   * Helper: Extract version from tag name
   */
  private extractVersion(tagName: string): string {
    return tagName
      .replace(/^v/, '')
      .replace(/-dev\.[0-9]+$/, '')
      .replace(/-rc\.[0-9]+$/, '');
  }
}
