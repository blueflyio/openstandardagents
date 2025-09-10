/**
 * Basic VORTEX System Tests - Simplified version to verify core functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TokenType,
  CachePolicy,
  VORTEX_TOKEN_PATTERNS
} from '../../src/vortex/token-types';
import { ContextTokenResolver } from '../../src/vortex/type-resolvers';

describe('VORTEX Basic Functionality', () => {
  describe('Token Types and Patterns', () => {
    it('should have correct token types', () => {
      expect(TokenType.CONTEXT).toBe('CONTEXT');
      expect(TokenType.DATA).toBe('DATA');
      expect(TokenType.STATE).toBe('STATE');
      expect(TokenType.METRICS).toBe('METRICS');
      expect(TokenType.TEMPORAL).toBe('TEMPORAL');
    });

    it('should have correct cache policies', () => {
      expect(CachePolicy.NO_CACHE).toBe('no-cache');
      expect(CachePolicy.SHORT_TERM).toBe('short-term');
      expect(CachePolicy.MEDIUM_TERM).toBe('medium-term');
      expect(CachePolicy.LONG_TERM).toBe('long-term');
    });

    it('should have token patterns defined', () => {
      expect(VORTEX_TOKEN_PATTERNS).toBeDefined();
      expect(VORTEX_TOKEN_PATTERNS.length).toBeGreaterThan(0);
      
      // Check that we have patterns for each token type
      const types = VORTEX_TOKEN_PATTERNS.map(p => p.type);
      expect(types).toContain(TokenType.CONTEXT);
      expect(types).toContain(TokenType.DATA);
      expect(types).toContain(TokenType.STATE);
      expect(types).toContain(TokenType.METRICS);
      expect(types).toContain(TokenType.TEMPORAL);
    });

    it('should match context token pattern', () => {
      const contextPattern = VORTEX_TOKEN_PATTERNS.find(p => p.type === TokenType.CONTEXT);
      expect(contextPattern).toBeDefined();
      
      const testString = '{CONTEXT:workflow:current:agent-roles}';
      const match = contextPattern!.pattern.exec(testString);
      expect(match).toBeTruthy();
      expect(match![1]).toBe('workflow'); // namespace
      expect(match![2]).toBe('current'); // scope
      expect(match![3]).toBe('agent-roles'); // identifier
    });
  });

  describe('Context Token Resolver', () => {
    let resolver: ContextTokenResolver;

    beforeEach(() => {
      resolver = new ContextTokenResolver();
    });

    it('should be created with correct properties', () => {
      expect(resolver.id).toBe('context-resolver-v1');
      expect(resolver.type).toBe(TokenType.CONTEXT);
      expect(resolver.namespace).toBe('workflow');
      expect(resolver.cachePolicy).toBe(CachePolicy.MEDIUM_TERM);
    });

    it('should validate context tokens', () => {
      const mockToken = {
        id: 'test-context',
        namespace: 'workflow',
        type: TokenType.CONTEXT,
        placeholder: '{CONTEXT:workflow:current:agent-roles}',
        cachePolicy: CachePolicy.MEDIUM_TERM,
        permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['workflow'] },
        metadata: {
          agentId: 'test',
          workflowId: 'test',
          version: '1.0',
          lifecycle: 'active' as const,
          usage: {
            resolveCount: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lastResolved: new Date(),
            averageResolveTime: 0,
            costAttribution: {
              tokensSaved: 0,
              timesSaved: 0,
              computeCostSaved: 0,
              agentCredits: {}
            }
          }
        },
        dependencies: [],
        expiry: new Date(Date.now() + 300000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = resolver.validate(mockToken);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should resolve context tokens', async () => {
      const mockToken = {
        id: 'test-context',
        namespace: 'workflow',
        type: TokenType.CONTEXT,
        placeholder: '{CONTEXT:workflow:current:agent-roles}',
        cachePolicy: CachePolicy.MEDIUM_TERM,
        permissions: { readAgents: ['*'], writeAgents: [], resolveAgents: ['*'], namespaceAccess: ['workflow'] },
        metadata: {
          agentId: 'test',
          workflowId: 'test',
          version: '1.0',
          lifecycle: 'active' as const,
          usage: {
            resolveCount: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lastResolved: new Date(),
            averageResolveTime: 0,
            costAttribution: {
              tokensSaved: 0,
              timesSaved: 0,
              computeCostSaved: 0,
              agentCredits: {}
            }
          }
        },
        dependencies: [],
        expiry: new Date(Date.now() + 300000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockContext = {
        agentId: 'test-agent',
        workflowId: 'test-workflow',
        permissions: ['read', 'resolve'],
        timestamp: new Date()
      };

      const result = await resolver.resolve(mockToken, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.resolvedValue).toBeDefined();
      expect(result.metadata.resolveTime).toBeGreaterThan(0);
      expect(result.metadata.costImpact.tokensSaved).toBeGreaterThan(0);
    });
  });

  describe('Variable Duration Caching (0-600s)', () => {
    it('should have different cache policies with appropriate durations', () => {
      const patterns = VORTEX_TOKEN_PATTERNS;
      
      // Find patterns with different cache policies
      const shortTermPattern = patterns.find(p => p.defaultCachePolicy === CachePolicy.SHORT_TERM);
      const mediumTermPattern = patterns.find(p => p.defaultCachePolicy === CachePolicy.MEDIUM_TERM);
      const longTermPattern = patterns.find(p => p.defaultCachePolicy === CachePolicy.LONG_TERM);
      const noCachePattern = patterns.find(p => p.defaultCachePolicy === CachePolicy.NO_CACHE);

      // STATE and METRICS should use SHORT_TERM (0-60s effective range)
      expect(shortTermPattern).toBeDefined();
      
      // CONTEXT should use MEDIUM_TERM (60-300s effective range)
      expect(mediumTermPattern).toBeDefined();
      
      // DATA should use LONG_TERM (300-600s effective range)
      expect(longTermPattern).toBeDefined();
      
      // TEMPORAL should use NO_CACHE (0s duration)
      expect(noCachePattern).toBeDefined();
      expect(noCachePattern!.type).toBe(TokenType.TEMPORAL);
    });

    it('should demonstrate token type cache policy boundaries', () => {
      const contextPattern = VORTEX_TOKEN_PATTERNS.find(p => p.type === TokenType.CONTEXT);
      const dataPattern = VORTEX_TOKEN_PATTERNS.find(p => p.type === TokenType.DATA);
      const statePattern = VORTEX_TOKEN_PATTERNS.find(p => p.type === TokenType.STATE);
      const metricsPattern = VORTEX_TOKEN_PATTERNS.find(p => p.type === TokenType.METRICS);
      const temporalPattern = VORTEX_TOKEN_PATTERNS.find(p => p.type === TokenType.TEMPORAL);

      // Verify the cache policy hierarchy for variable duration (0-600s)
      expect(temporalPattern!.defaultCachePolicy).toBe(CachePolicy.NO_CACHE); // 0s
      expect(statePattern!.defaultCachePolicy).toBe(CachePolicy.SHORT_TERM); // 0-60s range
      expect(metricsPattern!.defaultCachePolicy).toBe(CachePolicy.SHORT_TERM); // 0-60s range
      expect(contextPattern!.defaultCachePolicy).toBe(CachePolicy.MEDIUM_TERM); // 60-300s range
      expect(dataPattern!.defaultCachePolicy).toBe(CachePolicy.LONG_TERM); // 300-600s range
    });
  });

  describe('Type-Safe Token Boundaries', () => {
    it('should enforce strict type boundaries in token patterns', () => {
      const patterns = VORTEX_TOKEN_PATTERNS;
      
      for (const pattern of patterns) {
        // Each pattern should be associated with exactly one token type
        expect(pattern.type).toBeDefined();
        expect(Object.values(TokenType)).toContain(pattern.type);
        
        // Pattern should match its designated format
        expect(pattern.pattern).toBeDefined();
        expect(pattern.pattern instanceof RegExp).toBe(true);
        
        // Examples should match the pattern
        expect(pattern.examples.length).toBeGreaterThan(0);
        for (const example of pattern.examples) {
          pattern.pattern.lastIndex = 0; // Reset regex state
          const match = pattern.pattern.exec(example);
          expect(match).toBeTruthy();
        }
      }
    });

    it('should have clear namespace separation', () => {
      const patterns = VORTEX_TOKEN_PATTERNS;
      const namespaces = new Set(patterns.map(p => p.namespace));
      
      // Each token type should have its own namespace
      expect(namespaces.size).toBeGreaterThan(1);
      expect(Array.from(namespaces)).toContain('workflow'); // CONTEXT
      expect(Array.from(namespaces)).toContain('artifacts'); // DATA
      expect(Array.from(namespaces)).toContain('agents'); // STATE
      expect(Array.from(namespaces)).toContain('telemetry'); // METRICS
      expect(Array.from(namespaces)).toContain('time'); // TEMPORAL
    });
  });
});