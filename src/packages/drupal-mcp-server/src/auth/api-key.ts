/**
 * API Key Authentication for Drupal
 * Simple API key authentication via custom header
 */

import { AxiosInstance } from 'axios';
import { AuthConfig } from '../types/drupal.js';

export class ApiKeyAuth {
  private apiKey: string;
  private headerName: string;

  constructor(config: AuthConfig, headerName: string = 'X-API-Key') {
    if (config.type !== 'api-key') {
      throw new Error('Invalid auth type for API Key');
    }

    if (!config.credentials.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.credentials.apiKey;
    this.headerName = headerName;
  }

  async applyAuth(axiosInstance: AxiosInstance): Promise<void> {
    axiosInstance.defaults.headers.common[this.headerName] = this.apiKey;
  }
}
