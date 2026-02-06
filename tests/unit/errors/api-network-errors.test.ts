/**
 * Unit tests for API, Network, and Configuration Error classes
 */

import { describe, it, expect } from '@jest/globals';
import {
  // API Errors
  ApiError,
  RateLimitError,
  UnauthorizedError,
  ForbiddenError,
  // Network Errors
  NetworkError,
  TimeoutError,
  ConnectionRefusedError,
  // Configuration Errors
  ConfigurationError,
  MissingEnvVarError,
  InvalidConfigError,
  // Authentication Errors
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  // Export Errors
  ExportError,
  PlatformNotSupportedError,
  TemplateNotFoundError,
  // Migration Errors
  MigrationError,
  UnsupportedVersionError,
  // Generation Errors
  GenerationError,
  TypeGenerationError,
  ZodGenerationError,
  // Knowledge Graph Errors
  KnowledgeGraphError,
  VectorDBConnectionError,
  EntityIndexingError,
} from '../../../src/errors';

describe('API Errors', () => {
  describe('ApiError', () => {
    it('should create error with custom status code', () => {
      const error = new ApiError('API request failed', 500);
      expect(error.code).toBe('OSSA-API-001');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('API request failed');
    });

    it('should support different status codes', () => {
      const error400 = new ApiError('Bad request', 400);
      expect(error400.statusCode).toBe(400);

      const error502 = new ApiError('Bad gateway', 502);
      expect(error502.statusCode).toBe(502);
    });

    it('should include details', () => {
      const error = new ApiError('API error', 500, {
        endpoint: '/api/agents',
        method: 'POST',
      });
      expect(error.details?.endpoint).toBe('/api/agents');
    });
  });

  describe('RateLimitError', () => {
    it('should create error with code OSSA-API-002', () => {
      const error = new RateLimitError();
      expect(error.code).toBe('OSSA-API-002');
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
    });

    it('should include retryAfter', () => {
      const error = new RateLimitError(60);
      expect(error.details?.retryAfter).toBe(60);
    });

    it('should include additional context', () => {
      const error = new RateLimitError(120, {
        limit: 100,
        remaining: 0,
        reset: Date.now() + 120000,
      });
      expect(error.details?.limit).toBe(100);
      expect(error.details?.remaining).toBe(0);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create error with code OSSA-API-003', () => {
      const error = new UnauthorizedError();
      expect(error.code).toBe('OSSA-API-003');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid credentials');
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('ForbiddenError', () => {
    it('should create error with code OSSA-API-004', () => {
      const error = new ForbiddenError();
      expect(error.code).toBe('OSSA-API-004');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');
      expect(error.message).toBe('Insufficient permissions');
    });
  });
});

describe('Network Errors', () => {
  describe('NetworkError', () => {
    it('should create error with code OSSA-NET-001', () => {
      const error = new NetworkError('Network failure');
      expect(error.code).toBe('OSSA-NET-001');
      expect(error.statusCode).toBe(503);
    });

    it('should be retryable', () => {
      const error = new NetworkError('Network failure');
      expect(error.isRetryable()).toBe(true);
    });
  });

  describe('TimeoutError', () => {
    it('should create error with code OSSA-NET-002', () => {
      const error = new TimeoutError(5000);
      expect(error.code).toBe('OSSA-NET-002');
      expect(error.statusCode).toBe(504);
      expect(error.message).toBe('Request timed out after 5000ms');
    });

    it('should include timeout in details', () => {
      const error = new TimeoutError(10000);
      expect(error.details?.timeout).toBe(10000);
    });

    it('should support additional context', () => {
      const error = new TimeoutError(5000, {
        operation: 'fetch-agent',
        url: 'https://registry.example.com',
      });
      expect(error.details?.operation).toBe('fetch-agent');
    });
  });

  describe('ConnectionRefusedError', () => {
    it('should create error with code OSSA-NET-003', () => {
      const url = 'https://registry.example.com';
      const error = new ConnectionRefusedError(url);
      expect(error.code).toBe('OSSA-NET-003');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe(`Connection refused to "${url}"`);
    });

    it('should include url in details', () => {
      const url = 'https://registry.example.com';
      const error = new ConnectionRefusedError(url);
      expect(error.details?.url).toBe(url);
    });
  });
});

describe('Configuration Errors', () => {
  describe('ConfigurationError', () => {
    it('should create error with code OSSA-CFG-001', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error.code).toBe('OSSA-CFG-001');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('MissingEnvVarError', () => {
    it('should create error with code OSSA-CFG-002', () => {
      const error = new MissingEnvVarError('DATABASE_URL');
      expect(error.code).toBe('OSSA-CFG-002');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Required environment variable "DATABASE_URL" is not set');
    });

    it('should include envVar in details', () => {
      const error = new MissingEnvVarError('API_KEY');
      expect(error.details?.envVar).toBe('API_KEY');
    });
  });

  describe('InvalidConfigError', () => {
    it('should create error with code OSSA-CFG-003', () => {
      const error = new InvalidConfigError('database');
      expect(error.code).toBe('OSSA-CFG-003');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Invalid configuration for "database"');
    });

    it('should include configKey in details', () => {
      const error = new InvalidConfigError('redis');
      expect(error.details?.configKey).toBe('redis');
    });
  });
});

describe('Authentication Errors', () => {
  describe('AuthenticationError', () => {
    it('should create error with code OSSA-AUTH-001', () => {
      const error = new AuthenticationError('Auth failed');
      expect(error.code).toBe('OSSA-AUTH-001');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('TokenExpiredError', () => {
    it('should create error with code OSSA-AUTH-002', () => {
      const error = new TokenExpiredError();
      expect(error.code).toBe('OSSA-AUTH-002');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication token has expired');
    });
  });

  describe('InvalidTokenError', () => {
    it('should create error with code OSSA-AUTH-003', () => {
      const error = new InvalidTokenError();
      expect(error.code).toBe('OSSA-AUTH-003');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid authentication token');
    });
  });
});

describe('Export Errors', () => {
  describe('ExportError', () => {
    it('should create error with code OSSA-EXP-001', () => {
      const error = new ExportError('Export failed');
      expect(error.code).toBe('OSSA-EXP-001');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('PlatformNotSupportedError', () => {
    it('should create error with code OSSA-EXP-002', () => {
      const error = new PlatformNotSupportedError('unsupported-platform');
      expect(error.code).toBe('OSSA-EXP-002');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Platform "unsupported-platform" is not supported');
    });

    it('should include platform in details', () => {
      const error = new PlatformNotSupportedError('custom-platform');
      expect(error.details?.platform).toBe('custom-platform');
    });
  });

  describe('TemplateNotFoundError', () => {
    it('should create error with code OSSA-EXP-003', () => {
      const error = new TemplateNotFoundError('drupal-template');
      expect(error.code).toBe('OSSA-EXP-003');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Template "drupal-template" not found');
    });

    it('should include template in details', () => {
      const error = new TemplateNotFoundError('langchain-template');
      expect(error.details?.template).toBe('langchain-template');
    });
  });
});

describe('Migration Errors', () => {
  describe('MigrationError', () => {
    it('should create error with code OSSA-MIG-001', () => {
      const error = new MigrationError('Migration failed');
      expect(error.code).toBe('OSSA-MIG-001');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('UnsupportedVersionError', () => {
    it('should create error with code OSSA-MIG-002', () => {
      const error = new UnsupportedVersionError('v0.1.0');
      expect(error.code).toBe('OSSA-MIG-002');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Version "v0.1.0" is not supported');
    });

    it('should include version in details', () => {
      const error = new UnsupportedVersionError('v0.2.0');
      expect(error.details?.version).toBe('v0.2.0');
    });
  });
});

describe('Generation Errors', () => {
  describe('GenerationError', () => {
    it('should create error with code OSSA-GEN-001', () => {
      const error = new GenerationError('Generation failed');
      expect(error.code).toBe('OSSA-GEN-001');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('TypeGenerationError', () => {
    it('should create error with code OSSA-GEN-002', () => {
      const error = new TypeGenerationError('Type generation failed');
      expect(error.code).toBe('OSSA-GEN-002');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('ZodGenerationError', () => {
    it('should create error with code OSSA-GEN-003', () => {
      const error = new ZodGenerationError('Zod generation failed');
      expect(error.code).toBe('OSSA-GEN-003');
      expect(error.statusCode).toBe(500);
    });
  });
});

describe('Knowledge Graph Errors', () => {
  describe('KnowledgeGraphError', () => {
    it('should create error with code OSSA-KG-001', () => {
      const error = new KnowledgeGraphError('KG operation failed');
      expect(error.code).toBe('OSSA-KG-001');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('VectorDBConnectionError', () => {
    it('should create error with code OSSA-KG-002', () => {
      const dbUrl = 'http://localhost:6333';
      const error = new VectorDBConnectionError(dbUrl);
      expect(error.code).toBe('OSSA-KG-002');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe(`Failed to connect to vector database at "${dbUrl}"`);
    });

    it('should include dbUrl in details', () => {
      const dbUrl = 'http://qdrant:6333';
      const error = new VectorDBConnectionError(dbUrl);
      expect(error.details?.dbUrl).toBe(dbUrl);
    });
  });

  describe('EntityIndexingError', () => {
    it('should create error with code OSSA-KG-003', () => {
      const entityType = 'issue';
      const error = new EntityIndexingError(entityType);
      expect(error.code).toBe('OSSA-KG-003');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe(`Failed to index entity type "${entityType}"`);
    });

    it('should include entityType in details', () => {
      const entityType = 'merge_request';
      const error = new EntityIndexingError(entityType);
      expect(error.details?.entityType).toBe(entityType);
    });
  });
});
