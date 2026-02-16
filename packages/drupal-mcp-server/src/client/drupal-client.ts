/**
 * Drupal API Client
 * Handles REST and JSON:API requests with authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthConfig, DrupalError, DrupalResponse } from '../types/drupal.js';
import { OAuth2Auth } from '../auth/oauth2.js';
import { ApiKeyAuth } from '../auth/api-key.js';
import { JWTAuth } from '../auth/jwt.js';

export class DrupalClient {
  private axiosInstance: AxiosInstance;
  private auth: OAuth2Auth | ApiKeyAuth | JWTAuth;
  private baseUrl: string;

  constructor(config: AuthConfig) {
    this.baseUrl = config.baseUrl;

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Initialize authentication
    switch (config.type) {
      case 'oauth2':
        this.auth = new OAuth2Auth(config);
        break;
      case 'api-key':
        this.auth = new ApiKeyAuth(config);
        break;
      case 'jwt':
        this.auth = new JWTAuth(config);
        break;
      default:
        throw new Error(`Unsupported auth type: ${config.type}`);
    }

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.errors) {
          const drupalError: DrupalError = error.response.data.errors[0];
          throw new Error(`Drupal API Error: ${drupalError.title} - ${drupalError.detail}`);
        }
        throw error;
      }
    );
  }

  private async ensureAuth(): Promise<void> {
    await this.auth.applyAuth(this.axiosInstance);
  }

  async get<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const response: AxiosResponse<T> = await this.axiosInstance.get(path, config);
    return response.data;
  }

  async post<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const response: AxiosResponse<T> = await this.axiosInstance.post(path, data, config);
    return response.data;
  }

  async patch<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const response: AxiosResponse<T> = await this.axiosInstance.patch(path, data, config);
    return response.data;
  }

  async put<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const response: AxiosResponse<T> = await this.axiosInstance.put(path, data, config);
    return response.data;
  }

  async delete<T = any>(path: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureAuth();
    const response: AxiosResponse<T> = await this.axiosInstance.delete(path, config);
    return response.data;
  }

  // JSON:API specific methods
  async jsonApiGet<T = any>(resourceType: string, id?: string, params?: Record<string, any>): Promise<DrupalResponse<T>> {
    const path = id ? `/jsonapi/${resourceType}/${id}` : `/jsonapi/${resourceType}`;
    return this.get<DrupalResponse<T>>(path, { params });
  }

  async jsonApiPost<T = any>(resourceType: string, data: any): Promise<DrupalResponse<T>> {
    return this.post<DrupalResponse<T>>(`/jsonapi/${resourceType}`, {
      data: {
        type: resourceType,
        attributes: data,
      },
    });
  }

  async jsonApiPatch<T = any>(resourceType: string, id: string, data: any): Promise<DrupalResponse<T>> {
    return this.patch<DrupalResponse<T>>(`/jsonapi/${resourceType}/${id}`, {
      data: {
        type: resourceType,
        id,
        attributes: data,
      },
    });
  }

  async jsonApiDelete(resourceType: string, id: string): Promise<void> {
    await this.delete(`/jsonapi/${resourceType}/${id}`);
  }

  // Helper to build query strings for JSON:API
  buildJsonApiQuery(params: {
    filter?: Record<string, any>;
    sort?: Record<string, 'ASC' | 'DESC'>;
    page?: { limit?: number; offset?: number };
    include?: string[];
  }): Record<string, any> {
    const query: Record<string, any> = {};

    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        query[`filter[${key}]`] = value;
      });
    }

    if (params.sort) {
      const sortString = Object.entries(params.sort)
        .map(([field, direction]) => (direction === 'DESC' ? `-${field}` : field))
        .join(',');
      query.sort = sortString;
    }

    if (params.page) {
      if (params.page.limit) query['page[limit]'] = params.page.limit;
      if (params.page.offset) query['page[offset]'] = params.page.offset;
    }

    if (params.include) {
      query.include = params.include.join(',');
    }

    return query;
  }
}
