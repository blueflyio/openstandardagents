/**
 * Cache Operation Tools (2 tools)
 * Clear and rebuild Drupal caches
 */

import { DrupalClient } from '../client/drupal-client.js';
import { CacheClearInput, CacheRebuildInput } from '../types/drupal.js';

export class CacheTools {
  constructor(private client: DrupalClient) {}

  /**
   * Clear Drupal caches
   */
  async clearCache(input: CacheClearInput = {}): Promise<{ success: boolean; message: string }> {
    try {
      const params: Record<string, any> = {};

      if (input.cid) {
        params.cid = input.cid;
      }

      if (input.bin) {
        params.bin = input.bin;
      }

      if (input.tags && input.tags.length > 0) {
        params.tags = input.tags.join(',');
      }

      await this.client.post('/system/cache/clear', params);

      return {
        success: true,
        message: 'Cache cleared successfully',
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Rebuild Drupal caches
   */
  async rebuildCache(
    input: CacheRebuildInput = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      const params: Record<string, any> = {
        rebuild_theme_registry: input.rebuild_theme_registry ?? true,
        rebuild_menu: input.rebuild_menu ?? true,
        rebuild_node_access: input.rebuild_node_access ?? false,
      };

      await this.client.post('/system/cache/rebuild', params);

      return {
        success: true,
        message: 'Cache rebuilt successfully',
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

// Tool definitions for MCP
export const cacheToolDefinitions = [
  {
    name: 'drupal_clear_cache',
    description: 'Clear Drupal caches (optionally by bin, cid, or tags)',
    inputSchema: {
      type: 'object',
      properties: {
        cid: {
          type: 'string',
          description: 'Cache ID to clear (optional, clears all if not specified)',
        },
        bin: {
          type: 'string',
          description: 'Cache bin to clear (e.g., render, data, bootstrap)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Cache tags to invalidate',
        },
      },
    },
  },
  {
    name: 'drupal_rebuild_cache',
    description: 'Rebuild Drupal caches completely',
    inputSchema: {
      type: 'object',
      properties: {
        rebuild_theme_registry: {
          type: 'boolean',
          description: 'Rebuild theme registry',
          default: true,
        },
        rebuild_menu: {
          type: 'boolean',
          description: 'Rebuild menu cache',
          default: true,
        },
        rebuild_node_access: {
          type: 'boolean',
          description: 'Rebuild node access permissions',
          default: false,
        },
      },
    },
  },
];
