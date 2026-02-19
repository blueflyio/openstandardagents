/**
 * JWT Authentication for Drupal
 * Simple JWT token authentication
 */

import { AxiosInstance } from 'axios';
import { AuthConfig } from '../types/drupal.js';

export class JWTAuth {
  private token: string;

  constructor(config: AuthConfig) {
    if (config.type !== 'jwt') {
      throw new Error('Invalid auth type for JWT');
    }

    if (!config.credentials.token) {
      throw new Error('JWT token is required');
    }

    this.token = config.credentials.token;
  }

  async applyAuth(axiosInstance: AxiosInstance): Promise<void> {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
  }
}
