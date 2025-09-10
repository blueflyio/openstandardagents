/**
 * OSSA API-First Validation Framework
 *
 * Comprehensive validation system for OpenAPI specifications,
 * OSSA compliance, and runtime API validation.
 *
 * @version 0.1.8
 */
import { Agent, WorkflowDefinition } from '../api/generated-types.js';
export interface ValidationResult {
    valid: boolean;
    score: number;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    info: ValidationInfo[];
    metadata: ValidationMetadata;
}
export interface ValidationError {
    code: string;
    message: string;
    path?: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    suggestion?: string;
}
export interface ValidationWarning {
    code: string;
    message: string;
    path?: string;
    recommendation?: string;
}
export interface ValidationInfo {
    code: string;
    message: string;
    path?: string;
}
export interface ValidationMetadata {
    validator_version: string;
    ossa_version: string;
    timestamp: string;
    validation_type: string;
    total_checks: number;
    passed_checks: number;
}
export interface ValidationOptions {
    strict?: boolean;
    includeDrafts?: boolean;
    customRules?: ValidationRule[];
    skipOptional?: boolean;
    outputFormat?: 'detailed' | 'summary' | 'json';
}
export interface ValidationRule {
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    validate: (data: any, context: ValidationContext) => ValidationRuleResult;
}
export interface ValidationRuleResult {
    passed: boolean;
    message?: string;
    suggestion?: string;
}
export interface ValidationContext {
    type: 'openapi' | 'agent' | 'workflow' | 'protocol';
    version: string;
    options: ValidationOptions;
}
export declare class OSSAValidator {
    private rules;
    private openApiSpec?;
    constructor();
    /**
     * Load OpenAPI specification for validation
     */
    loadOpenAPISpec(specPath: string): Promise<void>;
    /**
     * Validate OpenAPI specification with OSSA extensions
     */
    validateOpenAPI(specPath: string, options?: ValidationOptions): Promise<ValidationResult>;
    /**
     * Validate agent configuration against OSSA standards
     */
    validateAgent(agent: Agent, options?: ValidationOptions): ValidationResult;
    /**
     * Validate workflow definition
     */
    validateWorkflow(workflow: WorkflowDefinition, options?: ValidationOptions): ValidationResult;
    /**
     * Validate runtime API responses
     */
    validateAPIResponse(endpoint: string, method: string, response: any, expectedSchema?: any): Promise<ValidationResult>;
    private validateOpenAPIStructure;
    private validateOSSAExtensions;
    private validateSecuritySchemes;
    private validatePaths;
    private validateAgentStructure;
    private validateAgentCompliance;
    private validateAgentCapabilities;
    private validateAgentProtocols;
    private validateWorkflowStructure;
    private validateWorkflowSteps;
    private validateWorkflowDependencies;
    private validateResponseSchema;
    private validateOSSAResponseFormat;
    private initializeRules;
    private addRules;
    private createValidationResult;
    private addRuleResult;
    private finalizeResult;
}
export declare class ValidationFormatter {
    static formatResult(result: ValidationResult, format?: 'detailed' | 'summary' | 'json'): string;
    private static formatSummary;
    private static formatDetailed;
}
export declare const validator: OSSAValidator;
