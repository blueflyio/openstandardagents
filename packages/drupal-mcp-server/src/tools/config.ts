/**
 * Configuration Management Tools (2 tools)
 * Get and set Drupal configuration
 */

import { DrupalClient } from '../client/drupal-client.js';
import { ConfigGetInput, ConfigSetInput, DrupalConfig } from '../types/drupal.js';

export class ConfigTools {
  constructor(private client: DrupalClient) {}

  /**
   * Get Drupal configuration
   */
  async getConfig(input: ConfigGetInput): Promise<DrupalConfig> {
    const response = await this.client.get<DrupalConfig>(`/config/${input.name}`);
    return response;
  }

  /**
   * Set Drupal configuration
   */
  async setConfig(input: ConfigSetInput): Promise<DrupalConfig> {
    const response = await this.client.patch<DrupalConfig>(`/config/${input.name}`, input.data);
    return response;
  }
}

// Tool definitions for MCP
export const configToolDefinitions = [
  {
    name: 'drupal_get_config',
    description: 'Get Drupal configuration object',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Configuration name (e.g., system.site, user.settings)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'drupal_set_config',
    description: 'Set Drupal configuration values',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Configuration name',
        },
        data: {
          type: 'object',
          description: 'Configuration data to set',
        },
      },
      required: ['name', 'data'],
    },
  },
];
