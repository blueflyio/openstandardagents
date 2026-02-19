/**
 * Module Management Tools (3 tools)
 * List, enable, and disable Drupal modules
 */

import { DrupalClient } from '../client/drupal-client.js';
import {
  ModuleListInput,
  ModuleEnableInput,
  ModuleDisableInput,
  DrupalModule,
} from '../types/drupal.js';

export class ModuleTools {
  constructor(private client: DrupalClient) {}

  /**
   * List Drupal modules
   */
  async listModules(input: ModuleListInput = {}): Promise<DrupalModule[]> {
    const params: Record<string, any> = {};

    if (input.type) {
      params.type = input.type;
    }

    if (input.status !== undefined) {
      params.status = input.status;
    }

    const response = await this.client.get<DrupalModule[]>('/system/modules', { params });
    return response;
  }

  /**
   * Enable Drupal modules
   */
  async enableModule(input: ModuleEnableInput): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.post('/system/modules/enable', { modules: input.modules });
      return {
        success: true,
        message: `Modules enabled: ${input.modules.join(', ')}`,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Disable Drupal modules
   */
  async disableModule(input: ModuleDisableInput): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.post('/system/modules/disable', { modules: input.modules });
      return {
        success: true,
        message: `Modules disabled: ${input.modules.join(', ')}`,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

// Tool definitions for MCP
export const moduleToolDefinitions = [
  {
    name: 'drupal_list_modules',
    description: 'List Drupal modules and themes',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['module', 'theme'],
          description: 'Filter by type',
        },
        status: {
          type: 'boolean',
          description: 'Filter by enabled/disabled status',
        },
      },
    },
  },
  {
    name: 'drupal_enable_module',
    description: 'Enable Drupal modules',
    inputSchema: {
      type: 'object',
      properties: {
        modules: {
          type: 'array',
          items: { type: 'string' },
          description: 'Module machine names to enable',
        },
      },
      required: ['modules'],
    },
  },
  {
    name: 'drupal_disable_module',
    description: 'Disable Drupal modules',
    inputSchema: {
      type: 'object',
      properties: {
        modules: {
          type: 'array',
          items: { type: 'string' },
          description: 'Module machine names to disable',
        },
      },
      required: ['modules'],
    },
  },
];
