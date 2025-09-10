/**
 * OSSA Router - Agent Discovery Protocol Implementation
 * Version: 0.1.8
 * 
 * High-performance multi-protocol agent discovery router supporting:
 * - REST API endpoints
 * - GraphQL queries and subscriptions
 * - gRPC streaming
 * - Sub-100ms response time optimization for 1000+ agents
 */

export * from './discovery';
export * from './protocols';
export * from './optimization';
export * from './types';

// Main router factory
export { createOSSARouter } from './router';

// Protocol implementations
export { RESTProtocol } from './protocols/rest';
export { GraphQLProtocol } from './protocols/graphql';
export { GRPCProtocol } from './protocols/grpc';

// Discovery engine
export { DiscoveryEngine } from './discovery/engine';
export { CapabilityMatcher } from './discovery/capability-matcher';

// Optimization components
export { PerformanceOptimizer } from './optimization/performance';
export { CacheManager } from './optimization/cache';
export { IndexManager } from './optimization/indexing';