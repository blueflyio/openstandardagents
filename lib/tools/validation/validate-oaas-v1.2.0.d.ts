#!/usr/bin/env node
export class OAASv120Validator {
    errors: any[];
    warnings: any[];
    validatedAgents: any[];
    /**
     * Validate an individual agent configuration
     */
    validateAgent(filePath: any): void;
    validateApiVersion(agent: any, errors: any): void;
    isValidApiVersion(version: any): boolean;
    validateKind(agent: any, errors: any): void;
    validateMetadata(agent: any, errors: any, warnings: any): void;
    validateSpec(agent: any, errors: any, warnings: any): void;
    validateFrameworks(agent: any, errors: any, warnings: any): void;
    validateCapabilities(agent: any, errors: any, warnings: any): void;
    /**
     * Generate summary report
     */
    generateReport(): {
        total: number;
        valid: number;
        invalid: number;
        complianceRate: number;
        versions: {};
        errors: number;
        warnings: number;
    };
}
