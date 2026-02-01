/**
 * Agent Taxonomy Service
 * OSSA v0.3.6 - Full CRUD operations for agent classification and taxonomy
 */

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Zod schemas for runtime validation
export const TaxonomyCategoryTypeSchema = z.enum([
  'role',
  'domain',
  'capability',
  'runtime',
  'custom',
]);

export const TaxonomyCategoryInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: TaxonomyCategoryTypeSchema,
  level: z.number().int().min(1).max(5),
  parent_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

export const TaxonomyCategorySchema = TaxonomyCategoryInputSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const AgentClassificationSchema = z.object({
  agent_id: z.string(),
  classifications: z.array(
    z.object({
      category_id: z.string().uuid(),
      category_name: z.string(),
      confidence: z.number().min(0).max(1),
      reason: z.string().optional(),
    })
  ),
  confidence: z.number().min(0).max(1),
  suggested_categories: z.array(z.string()).optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  category_id: z.string().uuid(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        severity: z.enum(['error', 'warning', 'info']),
      })
    )
    .optional(),
  warnings: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
  recommendations: z.array(z.string()).optional(),
});

// TypeScript types (inferred from Zod schemas)
export type TaxonomyCategoryType = z.infer<typeof TaxonomyCategoryTypeSchema>;
export type TaxonomyCategoryInput = z.infer<typeof TaxonomyCategoryInputSchema>;
export type TaxonomyCategory = z.infer<typeof TaxonomyCategorySchema>;
export type AgentClassification = z.infer<typeof AgentClassificationSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * In-memory storage (replace with database in production)
 */
class TaxonomyStore {
  private categories: Map<string, TaxonomyCategory> = new Map();

  constructor() {
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories(): void {
    // Role-based categories
    this.createCategory({
      name: 'Analyzer',
      description: 'Read-only analysis and reporting agents',
      type: 'role',
      level: 1,
      tags: ['tier_1_read', 'read-only', 'reporting'],
    });

    this.createCategory({
      name: 'Executor',
      description: 'Agents that execute tasks and make changes',
      type: 'role',
      level: 1,
      tags: ['tier_3_full', 'execution', 'automation'],
    });

    this.createCategory({
      name: 'Coordinator',
      description: 'Agents that orchestrate multi-agent workflows',
      type: 'role',
      level: 1,
      tags: ['tier_2_write_limited', 'orchestration', 'coordination'],
    });

    this.createCategory({
      name: 'Reviewer',
      description: 'Agents that review and approve changes',
      type: 'role',
      level: 1,
      tags: ['tier_4_policy', 'approval', 'governance'],
    });

    // Domain-based categories
    this.createCategory({
      name: 'DevOps Automation',
      description: 'CI/CD, deployment, and infrastructure automation',
      type: 'domain',
      level: 1,
      tags: ['devops', 'cicd', 'deployment'],
    });

    this.createCategory({
      name: 'Security Analysis',
      description: 'Security scanning, compliance, and vulnerability detection',
      type: 'domain',
      level: 1,
      tags: ['security', 'compliance', 'scanning'],
    });

    this.createCategory({
      name: 'Data Processing',
      description: 'Data transformation, ETL, and analytics',
      type: 'domain',
      level: 1,
      tags: ['data', 'etl', 'analytics'],
    });

    // Runtime categories
    this.createCategory({
      name: 'Kubernetes Native',
      description: 'Agents designed for Kubernetes environments',
      type: 'runtime',
      level: 1,
      tags: ['kubernetes', 'k8s', 'cloud-native'],
    });

    this.createCategory({
      name: 'Serverless',
      description: 'Function-as-a-Service compatible agents',
      type: 'runtime',
      level: 1,
      tags: ['serverless', 'lambda', 'functions'],
    });
  }

  createCategory(input: TaxonomyCategoryInput): TaxonomyCategory {
    const validated = TaxonomyCategoryInputSchema.parse(input);
    const now = new Date().toISOString();

    const category: TaxonomyCategory = {
      ...validated,
      id: uuidv4(),
      created_at: now,
      updated_at: now,
    };

    this.categories.set(category.id, category);
    return category;
  }

  getCategory(id: string): TaxonomyCategory | undefined {
    return this.categories.get(id);
  }

  listCategories(filters?: {
    type?: TaxonomyCategoryType;
    level?: number;
    parent_id?: string | null;
  }): TaxonomyCategory[] {
    let results = Array.from(this.categories.values());

    if (filters) {
      if (filters.type) {
        results = results.filter((c) => c.type === filters.type);
      }
      if (filters.level !== undefined) {
        results = results.filter((c) => c.level === filters.level);
      }
      if (filters.parent_id !== undefined) {
        results = results.filter((c) => c.parent_id === filters.parent_id);
      }
    }

    return results;
  }

  updateCategory(
    id: string,
    input: Partial<TaxonomyCategoryInput>
  ): TaxonomyCategory {
    const existing = this.categories.get(id);
    if (!existing) {
      throw new Error(`Category ${id} not found`);
    }

    const updated: TaxonomyCategory = {
      ...existing,
      ...input,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    const validated = TaxonomyCategorySchema.parse(updated);
    this.categories.set(id, validated);
    return validated;
  }

  deleteCategory(id: string): boolean {
    // Check for child categories
    const children = this.listCategories({ parent_id: id });
    if (children.length > 0) {
      throw new Error(
        `Cannot delete category ${id}: has ${children.length} child categories`
      );
    }

    return this.categories.delete(id);
  }

  getCategoryHierarchy(id: string): TaxonomyCategory[] {
    const category = this.getCategory(id);
    if (!category) return [];

    const hierarchy: TaxonomyCategory[] = [category];
    let current = category;

    while (current.parent_id) {
      const parent = this.getCategory(current.parent_id);
      if (!parent) break;
      hierarchy.unshift(parent);
      current = parent;
    }

    return hierarchy;
  }
}

/**
 * Taxonomy Service
 */
export class TaxonomyService {
  private store: TaxonomyStore;

  constructor() {
    this.store = new TaxonomyStore();
  }

  // CREATE
  createCategory(input: TaxonomyCategoryInput): TaxonomyCategory {
    return this.store.createCategory(input);
  }

  // READ
  getCategory(id: string): TaxonomyCategory {
    const category = this.store.getCategory(id);
    if (!category) {
      throw new Error(`Category ${id} not found`);
    }
    return category;
  }

  listCategories(filters?: {
    type?: TaxonomyCategoryType;
    level?: number;
    parent_id?: string | null;
  }): { categories: TaxonomyCategory[]; total: number } {
    const categories = this.store.listCategories(filters);
    return {
      categories,
      total: categories.length,
    };
  }

  getCategoryHierarchy(id: string): TaxonomyCategory[] {
    return this.store.getCategoryHierarchy(id);
  }

  // UPDATE
  updateCategory(
    id: string,
    input: Partial<TaxonomyCategoryInput>
  ): TaxonomyCategory {
    return this.store.updateCategory(id, input);
  }

  // DELETE
  deleteCategory(id: string): void {
    const deleted = this.store.deleteCategory(id);
    if (!deleted) {
      throw new Error(`Category ${id} not found`);
    }
  }

  // CLASSIFY
  classifyAgent(manifest: Record<string, unknown>): AgentClassification {
    const agentId = (manifest.id as string) || 'unknown';
    const capabilities = (manifest.capabilities as string[]) || [];
    const accessTier = (manifest.access_tier as string) || 'tier_1_read';

    const classifications: AgentClassification['classifications'] = [];
    let totalConfidence = 0;

    // Role classification based on access tier
    const roleCategories = this.store.listCategories({ type: 'role' });
    for (const category of roleCategories) {
      if (category.tags?.includes(accessTier)) {
        const confidence = 0.9;
        classifications.push({
          category_id: category.id,
          category_name: category.name,
          confidence,
          reason: `Agent access tier (${accessTier}) matches role category`,
        });
        totalConfidence += confidence;
      }
    }

    // Domain classification based on capabilities
    const domainCategories = this.store.listCategories({ type: 'domain' });
    for (const category of domainCategories) {
      const matchingTags =
        category.tags?.filter((tag) =>
          capabilities.some((cap) =>
            cap.toLowerCase().includes(tag.toLowerCase())
          )
        ) || [];

      if (matchingTags.length > 0) {
        const confidence = Math.min(matchingTags.length * 0.3, 0.9);
        classifications.push({
          category_id: category.id,
          category_name: category.name,
          confidence,
          reason: `Capabilities match domain tags: ${matchingTags.join(', ')}`,
        });
        totalConfidence += confidence;
      }
    }

    const avgConfidence =
      classifications.length > 0 ? totalConfidence / classifications.length : 0;

    return {
      agent_id: agentId,
      classifications,
      confidence: Math.min(avgConfidence, 1),
      suggested_categories: classifications.map((c) => c.category_name),
    };
  }

  // VALIDATE
  validateTaxonomy(
    categoryId: string,
    manifest: Record<string, unknown>
  ): ValidationResult {
    const category = this.store.getCategory(categoryId);

    if (!category) {
      return {
        valid: false,
        category_id: categoryId,
        errors: [
          {
            field: 'category_id',
            message: `Category ${categoryId} not found`,
            severity: 'error',
          },
        ],
      };
    }

    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const recommendations: string[] = [];

    // Validate access tier matches role category
    if (category.type === 'role') {
      const accessTier = (manifest.access_tier as string) || 'tier_1_read';
      const tierMatch = category.tags?.includes(accessTier);

      if (!tierMatch) {
        warnings?.push({
          field: 'access_tier',
          message: `Access tier ${accessTier} may not match role category ${category.name}`,
        });
        recommendations.push(
          `Consider ${category.tags?.find((t) => t.startsWith('tier_'))} access tier`
        );
      }
    }

    // Validate capabilities match domain category
    if (category.type === 'domain') {
      const capabilities = (manifest.capabilities as string[]) || [];
      const hasMatchingCap = capabilities.some((cap) =>
        category.tags?.some((tag) =>
          cap.toLowerCase().includes(tag.toLowerCase())
        )
      );

      if (!hasMatchingCap) {
        warnings?.push({
          field: 'capabilities',
          message: `No capabilities match domain category ${category.name}`,
        });
        recommendations.push(
          `Add capabilities related to: ${category.tags?.join(', ')}`
        );
      }
    }

    return {
      valid: (errors?.length || 0) === 0,
      category_id: categoryId,
      errors: errors && errors.length > 0 ? errors : undefined,
      warnings: warnings && warnings.length > 0 ? warnings : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }
}

// Singleton instance
export const taxonomyService = new TaxonomyService();
