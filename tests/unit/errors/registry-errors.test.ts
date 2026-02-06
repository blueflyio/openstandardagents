/**
 * Unit tests for Registry Error classes
 */

import { describe, it, expect } from '@jest/globals';
import { API_VERSION } from '../../../src/version.js';
import {
  RegistryError,
  AgentNotFoundError,
  RegistryUnavailableError,
} from '../../../src/errors';

describe('Registry Errors', () => {
  describe('RegistryError', () => {
    it('should create error with code OSSA-REG-001', () => {
      const error = new RegistryError('Registry error');
      expect(error.code).toBe('OSSA-REG-001');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Registry error');
    });

    it('should include registry context', () => {
      const details = {
        registryUrl: 'https://registry.openstandardagents.org',
        operation: 'search',
        query: 'drupal',
      };
      const error = new RegistryError('Search failed', details);

      expect(error.details).toEqual(details);
    });

    it('should be retryable (5xx)', () => {
      const error = new RegistryError('Registry error');
      expect(error.isRetryable()).toBe(true);
      expect(error.isClientError()).toBe(false);
    });
  });

  describe('AgentNotFoundError', () => {
    it('should create error with code OSSA-REG-002', () => {
      const error = new AgentNotFoundError('mycompany/my-agent');
      expect(error.code).toBe('OSSA-REG-002');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Agent "mycompany/my-agent" not found in registry');
    });

    it('should include agentId in details', () => {
      const error = new AgentNotFoundError('mycompany/my-agent');
      expect(error.details?.agentId).toBe('mycompany/my-agent');
    });

    it('should include additional context', () => {
      const error = new AgentNotFoundError('mycompany/my-agent', {
        registry: 'https://registry.openstandardagents.org',
        searchFilters: {
          domain: 'drupal',
          tier: 'worker',
        },
      });

      expect(error.details?.agentId).toBe('mycompany/my-agent');
      expect(error.details?.registry).toBe('https://registry.openstandardagents.org');
      expect(error.details?.searchFilters).toEqual({
        domain: 'drupal',
        tier: 'worker',
      });
    });

    it('should not be retryable (404)', () => {
      const error = new AgentNotFoundError('mycompany/my-agent');
      expect(error.isRetryable()).toBe(false);
      expect(error.isClientError()).toBe(true);
    });

    it('should handle namespace/name format', () => {
      const error = new AgentNotFoundError('namespace/agent-name');
      expect(error.message).toContain('namespace/agent-name');
    });

    it('should handle simple agent IDs', () => {
      const error = new AgentNotFoundError('my-agent');
      expect(error.message).toContain('my-agent');
    });
  });

  describe('RegistryUnavailableError', () => {
    const registryUrl = 'https://registry.openstandardagents.org';

    it('should create error with code OSSA-REG-003', () => {
      const error = new RegistryUnavailableError(registryUrl);
      expect(error.code).toBe('OSSA-REG-003');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe(`Registry at "${registryUrl}" is unavailable`);
    });

    it('should include registryUrl in details', () => {
      const error = new RegistryUnavailableError(registryUrl);
      expect(error.details?.registryUrl).toBe(registryUrl);
    });

    it('should include additional context', () => {
      const error = new RegistryUnavailableError(registryUrl, {
        statusCode: 503,
        retryAfter: 60,
        reason: 'Service maintenance',
      });

      expect(error.details?.registryUrl).toBe(registryUrl);
      expect(error.details?.statusCode).toBe(503);
      expect(error.details?.retryAfter).toBe(60);
      expect(error.details?.reason).toBe('Service maintenance');
    });

    it('should be retryable (503)', () => {
      const error = new RegistryUnavailableError(registryUrl);
      expect(error.isRetryable()).toBe(true);
      expect(error.isClientError()).toBe(false);
    });

    it('should handle different registry URLs', () => {
      const urls = [
        'https://registry.openstandardagents.org',
        'http://localhost:3000',
        'https://custom-registry.example.com',
      ];

      urls.forEach((url) => {
        const error = new RegistryUnavailableError(url);
        expect(error.message).toContain(url);
        expect(error.details?.registryUrl).toBe(url);
      });
    });
  });

  describe('Error inheritance', () => {
    it('should all inherit from Error', () => {
      expect(new RegistryError('test')).toBeInstanceOf(Error);
      expect(new AgentNotFoundError('test')).toBeInstanceOf(Error);
      expect(new RegistryUnavailableError('test')).toBeInstanceOf(Error);
    });

    it('should have correct error names', () => {
      expect(new RegistryError('test').name).toBe('RegistryError');
      expect(new AgentNotFoundError('test').name).toBe('AgentNotFoundError');
      expect(new RegistryUnavailableError('test').name).toBe('RegistryUnavailableError');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize RegistryError', () => {
      const error = new RegistryError('Test', { operation: 'search' });
      const json = error.toJSON();

      expect(json.error.code).toBe('OSSA-REG-001');
      expect(json.error.message).toBe('Test');
      expect(json.error.statusCode).toBe(500);
      expect(json.error.details?.operation).toBe('search');
    });

    it('should serialize AgentNotFoundError', () => {
      const error = new AgentNotFoundError('mycompany/my-agent', {
        registry: 'https://registry.example.com',
      });
      const json = error.toJSON();

      expect(json.error.code).toBe('OSSA-REG-002');
      expect(json.error.statusCode).toBe(404);
      expect(json.error.details?.agentId).toBe('mycompany/my-agent');
      expect(json.error.details?.registry).toBe('https://registry.example.com');
    });

    it('should serialize RegistryUnavailableError', () => {
      const error = new RegistryUnavailableError('https://registry.example.com', {
        retryAfter: 60,
      });
      const json = error.toJSON();

      expect(json.error.code).toBe('OSSA-REG-003');
      expect(json.error.statusCode).toBe(503);
      expect(json.error.details?.registryUrl).toBe('https://registry.example.com');
      expect(json.error.details?.retryAfter).toBe(60);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle agent not found during search', () => {
      const error = new AgentNotFoundError('drupal/content-moderator', {
        registry: 'https://registry.openstandardagents.org',
        searchFilters: {
          domain: 'drupal',
          tier: 'worker',
          version: '>=1.0.0',
        },
        suggestion: 'Try searching without version constraint',
      });

      expect(error.code).toBe('OSSA-REG-002');
      expect(error.statusCode).toBe(404);
      expect(error.details?.agentId).toBe('drupal/content-moderator');
      expect(error.details?.suggestion).toBe('Try searching without version constraint');
    });

    it('should handle registry maintenance window', () => {
      const error = new RegistryUnavailableError(
        'https://registry.openstandardagents.org',
        {
          statusCode: 503,
          retryAfter: 3600,
          reason: 'Scheduled maintenance',
          maintenanceWindow: {
            start: '2026-02-04T00:00:00Z',
            end: '2026-02-04T04:00:00Z',
          },
        }
      );

      expect(error.code).toBe('OSSA-REG-003');
      expect(error.isRetryable()).toBe(true);
      expect(error.details?.retryAfter).toBe(3600);
      expect(error.details?.maintenanceWindow).toBeDefined();
    });

    it('should handle registry connection timeout', () => {
      const error = new RegistryUnavailableError(
        'https://registry.openstandardagents.org',
        {
          reason: 'Connection timeout after 5000ms',
          timeout: 5000,
          operation: 'search',
        }
      );

      expect(error.code).toBe('OSSA-REG-003');
      expect(error.details?.timeout).toBe(5000);
      expect(error.details?.operation).toBe('search');
    });
  });
});
