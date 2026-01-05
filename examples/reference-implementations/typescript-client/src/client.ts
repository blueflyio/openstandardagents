/**
 * OSSA API Client
 *
 * Main client for interacting with the OSSA registry and core API.
 * Provides authentication, request handling, and error management.
 */

export interface OSSAClientConfig {
  baseUrl?: string;
  apiKey?: string;
  bearerToken?: string;
  timeout?: number;
  retries?: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export interface APIError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  retry_after?: number;
}

export class OSSAClient {
  private baseUrl: string;
  private apiKey?: string;
  private bearerToken?: string;
  private timeout: number;
  private retries: number;

  constructor(config: OSSAClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://registry.openstandardagents.org/api/v1';
    this.apiKey = config.apiKey;
    this.bearerToken = config.bearerToken;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options.headers);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(this.timeout),
        });

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          if (attempt < this.retries) {
            await this.sleep(retryAfter * 1000);
            continue;
          }
        }

        if (!response.ok) {
          const error = await response.json() as APIError;
          throw new OSSAAPIError(
            error.message || `HTTP ${response.status}`,
            response.status,
            error
          );
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return undefined as T;
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof OSSAAPIError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Exponential backoff for retries
        if (attempt < this.retries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error class for OSSA API errors
 */
export class OSSAAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiError: APIError
  ) {
    super(message);
    this.name = 'OSSAAPIError';
  }
}
