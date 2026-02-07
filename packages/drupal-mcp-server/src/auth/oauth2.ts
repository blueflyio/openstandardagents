/**
 * OAuth2 Authentication for Drupal
 * Implements OAuth2 client credentials and password grant flows
 */

import axios, { AxiosInstance } from 'axios';
import { AuthConfig } from '../types/drupal.js';

export interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export class OAuth2Auth {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private username?: string;
  private password?: string;
  private token: OAuth2Token | null = null;
  private tokenExpiry: number = 0;

  constructor(config: AuthConfig) {
    if (config.type !== 'oauth2') {
      throw new Error('Invalid auth type for OAuth2');
    }

    this.baseUrl = config.baseUrl;
    this.clientId = config.credentials.clientId!;
    this.clientSecret = config.credentials.clientSecret!;
    this.username = config.credentials.username;
    this.password = config.credentials.password;
  }

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token.access_token;
    }

    await this.refreshToken();
    return this.token!.access_token;
  }

  private async refreshToken(): Promise<void> {
    const tokenUrl = `${this.baseUrl}/oauth/token`;

    let data: Record<string, string>;

    if (this.username && this.password) {
      // Password grant
      data = {
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password,
      };
    } else {
      // Client credentials grant
      data = {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      };
    }

    try {
      const response = await axios.post<OAuth2Token>(tokenUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.token = response.data;
      this.tokenExpiry = Date.now() + (this.token.expires_in * 1000) - 60000; // 1 minute buffer
    } catch (error: any) {
      throw new Error(`OAuth2 authentication failed: ${error.message}`);
    }
  }

  async applyAuth(axiosInstance: AxiosInstance): Promise<void> {
    const token = await this.getToken();
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}
