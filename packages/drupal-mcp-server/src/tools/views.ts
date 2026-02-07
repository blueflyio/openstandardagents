/**
 * Views Integration Tools (2 tools)
 * Execute and retrieve Drupal views
 */

import { DrupalClient } from '../client/drupal-client.js';
import { ViewExecuteInput } from '../types/drupal.js';

export class ViewsTools {
  constructor(private client: DrupalClient) {}

  /**
   * Execute a Drupal view
   */
  async executeView(input: ViewExecuteInput): Promise<any[]> {
    const displayId = input.display_id || 'default';
    const args = input.args ? `/${input.args.join('/')}` : '';
    const path = `/views/${input.view_id}/${displayId}${args}`;

    const params: Record<string, any> = {};

    if (input.page !== undefined) {
      params.page = input.page;
    }

    if (input.items_per_page !== undefined) {
      params.items_per_page = input.items_per_page;
    }

    if (input.filters) {
      Object.entries(input.filters).forEach(([key, value]) => {
        params[key] = value;
      });
    }

    const response = await this.client.get<any[]>(path, { params });
    return response;
  }

  /**
   * Get view results with full metadata
   */
  async getViewResults(input: ViewExecuteInput): Promise<{
    results: any[];
    pager?: {
      current_page: number;
      total_items: number;
      items_per_page: number;
      total_pages: number;
    };
  }> {
    const results = await this.executeView(input);

    // Views REST export includes pager info in headers
    // This is a simplified implementation
    return {
      results,
      pager: {
        current_page: input.page || 0,
        total_items: results.length,
        items_per_page: input.items_per_page || 10,
        total_pages: Math.ceil(results.length / (input.items_per_page || 10)),
      },
    };
  }
}

// Tool definitions for MCP
export const viewsToolDefinitions = [
  {
    name: 'drupal_execute_view',
    description: 'Execute a Drupal view and get results',
    inputSchema: {
      type: 'object',
      properties: {
        view_id: {
          type: 'string',
          description: 'View machine name',
        },
        display_id: {
          type: 'string',
          description: 'Display ID (default: "default")',
          default: 'default',
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Contextual filter arguments',
        },
        filters: {
          type: 'object',
          description: 'Exposed filter values',
        },
        page: {
          type: 'number',
          description: 'Page number (0-indexed)',
          default: 0,
        },
        items_per_page: {
          type: 'number',
          description: 'Items per page',
          default: 10,
        },
      },
      required: ['view_id'],
    },
  },
  {
    name: 'drupal_get_view_results',
    description: 'Get view results with pagination metadata',
    inputSchema: {
      type: 'object',
      properties: {
        view_id: {
          type: 'string',
          description: 'View machine name',
        },
        display_id: {
          type: 'string',
          description: 'Display ID',
          default: 'default',
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Contextual filter arguments',
        },
        filters: {
          type: 'object',
          description: 'Exposed filter values',
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 0,
        },
        items_per_page: {
          type: 'number',
          description: 'Items per page',
          default: 10,
        },
      },
      required: ['view_id'],
    },
  },
];
