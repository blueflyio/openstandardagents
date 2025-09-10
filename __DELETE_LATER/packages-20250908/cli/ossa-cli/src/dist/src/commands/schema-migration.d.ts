#!/usr/bin/env tsx
/**
 * OSSA Schema Migration Tools v0.1.8
 * API-First Schema Transformation Utilities
 *
 * Transforms legacy agent schemas to OpenAPI 3.1+ compliant specifications
 * with full API-first architectural patterns
 */
import { Command } from 'commander';
interface SchemaTransformOptions {
    outputFormat?: 'yaml' | 'json';
    apiVersion?: string;
    generateDocs?: boolean;
    strict?: boolean;
    verbose?: boolean;
}
interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    paths: Record<string, any>;
    components?: {
        schemas?: Record<string, any>;
        securitySchemes?: Record<string, any>;
    };
    security?: Array<Record<string, string[]>>;
}
declare class SchemaTransformationEngine {
    private options;
    constructor(options?: SchemaTransformOptions);
    /**
     * Transform agent configuration to OpenAPI specification
     */
    transformAgentToAPI(agentPath: string, outputPath?: string): Promise<OpenAPISpec>;
    /**
     * Create OpenAPI specification from agent configuration
     */
    private createOpenAPISpec;
    /**
     * Generate server configurations
     */
    private generateServers;
    /**
     * Generate API paths from agent capabilities
     */
    private generatePaths;
    /**
     * Add standard agent API paths
     */
    private addStandardPaths;
    /**
     * Transform capabilities to API paths
     */
    private addCapabilityPaths;
    /**
     * Add custom operations to paths
     */
    private addOperationPaths;
    /**
     * Generate OpenAPI components
     */
    private generateComponents;
    /**
     * Generate security schemes
     */
    private generateSecuritySchemes;
    /**
     * Generate security requirements
     */
    private generateSecurity;
    /**
     * Write OpenAPI specification to file
     */
    private writeSpec;
    /**
     * Generate API documentation
     */
    private generateDocumentation;
    /**
     * Generate ReDoc HTML documentation
     */
    private generateReDocHTML;
    /**
     * Utility functions
     */
    private kebabCase;
    private generateOperationId;
}
/**
 * Export schema migration commands
 */
export declare function createSchemaMigrationCommands(): Command;
export { SchemaTransformationEngine, SchemaTransformOptions, OpenAPISpec };
