/**
 * Base CRUD Service
 * DRY: Reusable CRUD operations for all release automation entities
 */

import { z } from 'zod';

/**
 * Generic CRUD operations interface
 */
export interface ICrudService<T, CreateInput, UpdateInput, FilterInput> {
  /**
   * Create a new entity
   */
  create(input: CreateInput): Promise<T>;

  /**
   * Read entity by ID
   */
  read(id: string | number): Promise<T | null>;

  /**
   * Update entity
   */
  update(id: string | number, input: UpdateInput): Promise<T>;

  /**
   * Delete entity
   */
  delete(id: string | number): Promise<void>;

  /**
   * List entities with filtering and pagination
   */
  list(filters?: FilterInput): Promise<{
    items: T[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }>;
}

/**
 * Base CRUD Service Implementation
 * DRY: Provides common CRUD operations
 */
export abstract class BaseCrudService<T, CreateInput, UpdateInput, FilterInput>
  implements ICrudService<T, CreateInput, UpdateInput, FilterInput>
{
  protected abstract createSchema: z.ZodSchema<CreateInput>;
  protected abstract updateSchema: z.ZodSchema<UpdateInput> | z.ZodNever;
  protected abstract filterSchema: z.ZodSchema<FilterInput>;
  protected abstract entitySchema: z.ZodSchema<T>;

  /**
   * Validate and parse input using Zod
   */
  protected validateCreate(input: unknown): CreateInput {
    return this.createSchema.parse(input);
  }

  protected validateUpdate(input: unknown): UpdateInput {
    return this.updateSchema.parse(input);
  }

  protected validateFilter(input: unknown): FilterInput {
    return this.filterSchema.parse(input || {});
  }

  protected validateEntity(entity: unknown): T {
    return this.entitySchema.parse(entity);
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  abstract create(input: CreateInput): Promise<T>;
  abstract read(id: string | number): Promise<T | null>;
  abstract update(id: string | number, input: UpdateInput): Promise<T>;
  abstract delete(id: string | number): Promise<void>;
  abstract list(filters?: FilterInput): Promise<{
    items: T[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  }>;

  /**
   * Helper: Calculate pagination metadata
   */
  protected calculatePagination(
    total: number,
    page: number,
    perPage: number
  ): {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  } {
    return {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /**
   * Helper: Validate ID format
   */
  protected validateId(id: string | number): void {
    if (typeof id === 'string' && id.length === 0) {
      throw new Error('ID cannot be empty');
    }
    if (typeof id === 'number' && id <= 0) {
      throw new Error('ID must be positive');
    }
  }

  /**
   * Helper: Handle not found errors
   */
  protected throwNotFound(resource: string, id: string | number): never {
    throw new Error(`${resource} with ID ${id} not found`);
  }

  /**
   * Helper: Handle validation errors
   */
  protected handleValidationError(error: unknown): never {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      throw new Error(
        `Validation failed: ${details.map((d) => d.message).join(', ')}`
      );
    }
    throw error;
  }
}
