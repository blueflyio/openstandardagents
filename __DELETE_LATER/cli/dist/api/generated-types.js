/**
 * OSSA Platform API Types
 * Generated from OpenAPI 3.1.0 specification
 *
 * This file contains TypeScript interfaces generated from the comprehensive
 * OSSA v0.1.8 OpenAPI specification with full compliance extensions.
 *
 * @version 0.1.8
 * @generated 2024-01-15T10:00:00Z
 */
// ========================================================================
// Runtime Validation Schemas
// ========================================================================
export const CONFORMANCE_TIERS = ['core', 'governed', 'advanced'];
export const CERTIFICATION_LEVELS = ['bronze', 'silver', 'gold', 'platinum'];
export const AGENT_CLASSES = ['general', 'specialist', 'workflow', 'integration', 'security', 'data', 'nlp', 'vision', 'audio'];
export const AGENT_CATEGORIES = ['assistant', 'tool', 'service', 'coordinator'];
export const PROTOCOL_NAMES = ['openapi', 'mcp', 'uadp', 'graphql', 'grpc', 'websocket'];
export const HEALTH_STATUSES = ['healthy', 'degraded', 'unhealthy', 'unknown'];
// Validation helper functions
export const isConformanceTier = (value) => {
    return CONFORMANCE_TIERS.includes(value);
};
export const isCertificationLevel = (value) => {
    return CERTIFICATION_LEVELS.includes(value);
};
export const isAgentClass = (value) => {
    return AGENT_CLASSES.includes(value);
};
export const isAgentCategory = (value) => {
    return AGENT_CATEGORIES.includes(value);
};
export const isProtocolName = (value) => {
    return PROTOCOL_NAMES.includes(value);
};
export const isHealthStatus = (value) => {
    return HEALTH_STATUSES.includes(value);
};
// ========================================================================
// Type Guards
// ========================================================================
export const isAgent = (obj) => {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.version === 'string' &&
        typeof obj.spec === 'object' &&
        typeof obj.registered_at === 'string';
};
export const isApiError = (obj) => {
    return obj && typeof obj.error === 'string';
};
export const isHealthResponse = (obj) => {
    return obj &&
        typeof obj.status === 'string' &&
        ['healthy', 'degraded', 'unhealthy'].includes(obj.status) &&
        typeof obj.version === 'string' &&
        typeof obj.timestamp === 'string';
};
// ========================================================================
// Default Values
// ========================================================================
export const DEFAULT_AGENT_FILTERS = {
    limit: 20,
    offset: 0,
};
export const DEFAULT_METRICS_FILTERS = {
    timeframe: '1h',
    format: 'json',
};
export const DEFAULT_API_CONFIG = {
    timeout: 30000,
    retryConfig: {
        retries: 3,
        retryDelay: 1000,
    },
};
// Export all types for external consumption
export * from './types.js';
