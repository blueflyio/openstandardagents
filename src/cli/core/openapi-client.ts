/**
 * OpenAPI Client - HTTP wrapper for REST operations
 * Provides type-safe HTTP methods for OpenAPI endpoints
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface OpenAPIClientConfig {
  baseURL: string;
  apiVersion?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class OpenAPIClient {
  private client: AxiosInstance;

  constructor(config: OpenAPIClientConfig) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/api/${config.apiVersion || 'v1'}`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
  }

  async get<T = any>(path: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
    const response = await this.client.get(path, config);
    return { data: response.data };
  }

  async post<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> {
    const response = await this.client.post(path, data, config);
    return { data: response.data };
  }

  async put<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> {
    const response = await this.client.put(path, data, config);
    return { data: response.data };
  }

  async delete<T = any>(path: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
    const response = await this.client.delete(path, config);
    return { data: response.data };
  }

  async patch<T = any>(path: string, data?: any, config?: AxiosRequestConfig): Promise<{ data: T }> {
    const response = await this.client.patch(path, data, config);
    return { data: response.data };
  }
}
