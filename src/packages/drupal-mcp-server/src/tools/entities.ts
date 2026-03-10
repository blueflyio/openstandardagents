/**
 * Entity Operation Tools (4 tools)
 * Generic entity CRUD operations for any Drupal entity type
 */

import { DrupalClient } from '../client/drupal-client.js';
import { DrupalEntity, EntityQueryInput } from '../types/drupal.js';
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET, runToolAction } from './tool-helpers.js';

export class EntityTools {
  constructor(private client: DrupalClient) {}

  /**
   * Create any Drupal entity
   */
  async createEntity(input: {
    entity_type: string;
    bundle: string;
    attributes: Record<string, any>;
  }): Promise<DrupalEntity> {
    const resourceType = `${input.entity_type}--${input.bundle}`;
    const response = await this.client.jsonApiPost<DrupalEntity>(resourceType, input.attributes);
    return response.data;
  }

  /**
   * Update any Drupal entity
   */
  async updateEntity(input: {
    entity_type: string;
    bundle: string;
    id: string;
    attributes: Record<string, any>;
  }): Promise<DrupalEntity> {
    const resourceType = `${input.entity_type}--${input.bundle}`;
    const response = await this.client.jsonApiPatch<DrupalEntity>(
      resourceType,
      input.id,
      input.attributes
    );
    return response.data;
  }

  /**
   * Delete any Drupal entity
   */
  async deleteEntity(input: {
    entity_type: string;
    bundle: string;
    id: string;
  }): Promise<{ success: boolean; message: string }> {
    return runToolAction(async () => {
      const resourceType = `${input.entity_type}--${input.bundle}`;
      await this.client.jsonApiDelete(resourceType, input.id);
    }, `Entity ${input.id} deleted successfully`);
  }

  /**
   * Query Drupal entities with filters
   */
  async queryEntities(input: EntityQueryInput): Promise<DrupalEntity[]> {
    const resourceType = input.bundle ? `${input.entity_type}--${input.bundle}` : input.entity_type;

    const queryParams = this.client.buildJsonApiQuery({
      filter: input.filters,
      sort: input.sort,
      page: {
        limit: input.limit ?? DEFAULT_PAGE_LIMIT,
        offset: input.offset ?? DEFAULT_PAGE_OFFSET,
      },
    });

    const response = await this.client.jsonApiGet<DrupalEntity[]>(
      resourceType,
      undefined,
      queryParams
    );

    return response.data;
  }
}

// Tool definitions for MCP
export const entityToolDefinitions = [
  {
    name: 'drupal_create_entity',
    description: 'Create any Drupal entity (node, taxonomy term, media, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          description: 'Entity type (e.g., node, taxonomy_term, media)',
        },
        bundle: {
          type: 'string',
          description: 'Bundle/type (e.g., article, tags, image)',
        },
        attributes: {
          type: 'object',
          description: 'Entity attributes as key-value pairs',
        },
      },
      required: ['entity_type', 'bundle', 'attributes'],
    },
  },
  {
    name: 'drupal_update_entity',
    description: 'Update any Drupal entity',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          description: 'Entity type',
        },
        bundle: {
          type: 'string',
          description: 'Bundle/type',
        },
        id: {
          type: 'string',
          description: 'Entity ID (UUID)',
        },
        attributes: {
          type: 'object',
          description: 'Entity attributes to update',
        },
      },
      required: ['entity_type', 'bundle', 'id', 'attributes'],
    },
  },
  {
    name: 'drupal_delete_entity',
    description: 'Delete any Drupal entity',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          description: 'Entity type',
        },
        bundle: {
          type: 'string',
          description: 'Bundle/type',
        },
        id: {
          type: 'string',
          description: 'Entity ID (UUID)',
        },
      },
      required: ['entity_type', 'bundle', 'id'],
    },
  },
  {
    name: 'drupal_query_entities',
    description: 'Query Drupal entities with filters and sorting',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: {
          type: 'string',
          description: 'Entity type to query',
        },
        bundle: {
          type: 'string',
          description: 'Optional bundle filter',
        },
        filters: {
          type: 'object',
          description: 'Filter conditions as key-value pairs',
        },
        sort: {
          type: 'object',
          description: 'Sort fields with ASC/DESC direction',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: DEFAULT_PAGE_LIMIT,
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip',
          default: DEFAULT_PAGE_OFFSET,
        },
      },
      required: ['entity_type'],
    },
  },
];
