#!/usr/bin/env node
export class OAASv130Validator {
    errors: any[];
    warnings: any[];
    suggestions: any[];
    validatedAgents: any[];
    insights: any[];
    /**
     * Validate an individual agent configuration
     */
    validateAgent(filePath: any): void;
    validateApiVersion(agent: any, errors: any): void;
    isValidApiVersion(version: any): boolean;
    validateKind(agent: any, errors: any): void;
    validateMetadata(agent: any, errors: any, warnings: any, suggestions: any): void;
    validateSpec(agent: any, errors: any, warnings: any, suggestions: any): void;
    validateFrameworks(agent: any, errors: any, warnings: any, suggestions: any): void;
    validateCapabilities(agent: any, errors: any, warnings: any, suggestions: any): void;
    validateSecurity(agent: any, warnings: any, suggestions: any): void;
    validateCompliance(agent: any, warnings: any, suggestions: any): void;
    generateInsights(agent: any, insights: any): void;
    calculateAgentGrade(warnings: any, suggestions: any): "A+" | "A" | "B+" | "B" | "C+" | "C" | "D";
    /**
     * Generate comprehensive report with AI insights
     */
    generateReport(): {
        total: number;
        valid: number;
        invalid: number;
        complianceRate: number;
        grades: {};
        versions: {};
        errors: number;
        warnings: number;
        suggestions: number;
        insights: number;
    };
}
