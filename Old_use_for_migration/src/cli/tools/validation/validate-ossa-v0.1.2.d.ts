#!/usr/bin/env node
export class OSSAValidator {
    errors: any[];
    warnings: any[];
    validatedAgents: any[];
    /**
     * Validate an individual agent configuration
     */
    validateAgent(filePath: any): void;
    validateApiVersion(agent: any, errors: any): void;
    validateKind(agent: any, errors: any): void;
    validateMetadata(agent: any, errors: any, warnings: any): void;
    validateSpec(agent: any, errors: any, warnings: any): void;
    validateConformanceLevel(agent: any, errors: any, warnings: any): void;
    validateAdvancedLevel(agent: any, errors: any, warnings: any): void;
    validateGovernedLevel(agent: any, errors: any, warnings: any): void;
    validateDiscovery(agent: any, errors: any, warnings: any): void;
    /**
     * Generate summary report
     */
    generateReport(): {
        total: number;
        valid: number;
        invalid: number;
        complianceRate: number;
        conformanceLevels: {};
        errors: number;
        warnings: number;
    };
}
