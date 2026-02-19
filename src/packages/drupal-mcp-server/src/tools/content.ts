/**
 * Content Management Tools (5 tools)
 * CRUD operations for Drupal nodes
 */

import { DrupalClient } from '../client/drupal-client.js';
import {
  NodeCreateInput,
  NodeUpdateInput,
  DrupalNode,
  DrupalResponse,
} from '../types/drupal.js';

export class ContentTools {
  constructor(private client: DrupalClient) {}

  /**
   * Create a new Drupal node
   */
  async createNode(input: NodeCreateInput): Promise<DrupalNode> {
    const nodeData: any = {
      type: [{ target_id: input.type }],
      title: [{ value: input.title }],
      status: [{ value: input.status ?? true }],
    };

    if (input.body) {
      nodeData.body = [{ value: input.body, format: 'basic_html' }];
    }

    if (input.uid) {
      nodeData.uid = [{ target_id: input.uid }];
    }

    // Add any additional fields
    Object.entries(input).forEach(([key, value]) => {
      if (!['type', 'title', 'body', 'status', 'uid'].includes(key)) {
        nodeData[key] = Array.isArray(value) ? value : [{ value }];
      }
    });

    const response = await this.client.post<DrupalResponse<DrupalNode>>(
      '/node',
      nodeData
    );

    return response.data;
  }

  /**
   * Update an existing Drupal node
   */
  async updateNode(input: NodeUpdateInput): Promise<DrupalNode> {
    const nodeData: any = {};

    if (input.title) {
      nodeData.title = [{ value: input.title }];
    }

    if (input.body !== undefined) {
      nodeData.body = [{ value: input.body, format: 'basic_html' }];
    }

    if (input.status !== undefined) {
      nodeData.status = [{ value: input.status }];
    }

    // Add any additional fields
    Object.entries(input).forEach(([key, value]) => {
      if (!['nid', 'title', 'body', 'status'].includes(key)) {
        nodeData[key] = Array.isArray(value) ? value : [{ value }];
      }
    });

    const response = await this.client.patch<DrupalResponse<DrupalNode>>(
      `/node/${input.nid}`,
      nodeData
    );

    return response.data;
  }

  /**
   * Delete a Drupal node
   */
  async deleteNode(nid: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.delete(`/node/${nid}`);
      return { success: true, message: `Node ${nid} deleted successfully` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get a Drupal node by ID
   */
  async getNode(nid: string): Promise<DrupalNode> {
    const response = await this.client.get<DrupalResponse<DrupalNode>>(
      `/node/${nid}`
    );
    return response.data;
  }

  /**
   * Search Drupal content
   */
  async searchContent(params: {
    type?: string;
    title?: string;
    status?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<DrupalNode[]> {
    const queryParams = this.client.buildJsonApiQuery({
      filter: {
        ...(params.type && { 'type.target_id': params.type }),
        ...(params.title && { 'title': params.title }),
        ...(params.status !== undefined && { 'status': params.status }),
      },
      page: {
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    });

    const response = await this.client.jsonApiGet<DrupalNode[]>('node', undefined, queryParams);
    return response.data;
  }
}

// Tool definitions for MCP
export const contentToolDefinitions = [
  {
    name: 'drupal_create_node',
    description: 'Create a new Drupal node (content)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Content type machine name (e.g., article, page)',
        },
        title: {
          type: 'string',
          description: 'Node title',
        },
        body: {
          type: 'string',
          description: 'Node body content (HTML allowed)',
        },
        status: {
          type: 'boolean',
          description: 'Published status (true = published, false = unpublished)',
          default: true,
        },
        uid: {
          type: 'string',
          description: 'User ID of the author',
        },
      },
      required: ['type', 'title'],
    },
  },
  {
    name: 'drupal_update_node',
    description: 'Update an existing Drupal node',
    inputSchema: {
      type: 'object',
      properties: {
        nid: {
          type: 'string',
          description: 'Node ID to update',
        },
        title: {
          type: 'string',
          description: 'New node title',
        },
        body: {
          type: 'string',
          description: 'New node body content',
        },
        status: {
          type: 'boolean',
          description: 'Published status',
        },
      },
      required: ['nid'],
    },
  },
  {
    name: 'drupal_delete_node',
    description: 'Delete a Drupal node',
    inputSchema: {
      type: 'object',
      properties: {
        nid: {
          type: 'string',
          description: 'Node ID to delete',
        },
      },
      required: ['nid'],
    },
  },
  {
    name: 'drupal_get_node',
    description: 'Get a Drupal node by ID',
    inputSchema: {
      type: 'object',
      properties: {
        nid: {
          type: 'string',
          description: 'Node ID to retrieve',
        },
      },
      required: ['nid'],
    },
  },
  {
    name: 'drupal_search_content',
    description: 'Search for Drupal content with filters',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by content type',
        },
        title: {
          type: 'string',
          description: 'Filter by title (partial match)',
        },
        status: {
          type: 'boolean',
          description: 'Filter by published status',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip',
          default: 0,
        },
      },
    },
  },
];
