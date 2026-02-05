/**
 * Governance Client Service
 *
 * HTTP client for communicating with governance provider (compliance-engine).
 * Implements retry logic, error handling, and response parsing.
 */

import type {
  GovernanceConfig,
  ComplianceResult,
  AuthorizationRequest,
  AuthorizationResult,
  QualityGateRequest,
  QualityGateResult,
} from '../interfaces/governance-provider.interface.js';

export interface GovernanceClientConfig {
  providerUrl?: string;
  timeout?: number;
  retries?: number;
}

export class GovernanceClient {
  private providerUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config?: GovernanceClientConfig) {
    // Read from environment (loaded from ai_assets.json)
    this.providerUrl = config?.providerUrl || process.env.COMPLIANCE_ENGINE_URL || '';
    if (!this.providerUrl) {
      throw new Error('COMPLIANCE_ENGINE_URL environment variable must be set (from ai_assets.json)');
    }
    this.timeout = config?.timeout || parseInt(process.env.GOVERNANCE_PROVIDER_TIMEOUT || '30000', 10);
    this.retries = config?.retries || 3;
  }

  /**
   * Check compliance with governance requirements
   */
  async checkCompliance(config: GovernanceConfig): Promise<ComplianceResult> {
    try {
      const response = await this.fetchWithRetry('/v1/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Compliance check failed: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Compliance check failed:', error.message);
      throw new Error(`Compliance check failed: ${error.message}`);
    }
  }

  /**
   * Authorize agent action
   */
  async authorize(request: AuthorizationRequest): Promise<AuthorizationResult> {
    try {
      const response = await this.fetchWithRetry('/v1/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Authorization failed: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Authorization failed:', error.message);
      throw new Error(`Authorization failed: ${error.message}`);
    }
  }

  /**
   * Evaluate quality gate
   */
  async evaluateQualityGate(request: QualityGateRequest): Promise<QualityGateResult> {
    try {
      const response = await this.fetchWithRetry('/v1/quality-gate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Quality gate evaluation failed: ${error.error || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Quality gate evaluation failed:', error.message);
      throw new Error(`Quality gate evaluation failed: ${error.message}`);
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    path: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    const url = `${this.providerUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (attempt < this.retries) {
        console.warn(`Request failed, retrying (${attempt}/${this.retries})...`);
        await this.delay(1000 * attempt);
        return this.fetchWithRetry(path, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
