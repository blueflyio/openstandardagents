import { components } from '../types/api.js';
type ValidationResult = components['schemas']['ValidationResult'];
type ValidationError = components['schemas']['ValidationError'];
type AgentTaxonomy = components['schemas']['AgentTaxonomy'];
/**
 * OSSA Specification Authority - ACDL Validator v0.1.9-alpha.1
 *
 * Implements comprehensive ACDL (Agent Capability Description Language) validation
 * according to OSSA v0.1.9-alpha.1 specification standards.
 */
export declare class SpecificationValidator {
    private readonly ossaVersion;
    private readonly ajv;
    private readonly validAgentTypes;
    private readonly validDomains;
    private readonly validProtocols;
    private readonly conformanceLevels;
    constructor();
    /**
     * Comprehensive ACDL validation according to OSSA v0.1.9-alpha.1
     */
    validate(manifest: any): Promise<ValidationResult | ValidationError>;
    /**
     * Validate agent manifest against JSON Schema
     */
    private validateAgentManifestSchema;
    /**
     * Validate OSSA-specific compliance rules
     */
    private validateOSSACompliance;
    /**
     * Validate protocol configurations
     */
    private validateProtocols;
    /**
     * Validate performance characteristics
     */
    private validatePerformance;
    /**
     * Validate conformance level requirements
     */
    private validateConformance;
    /**
     * Validate budget and token efficiency specifications
     */
    private validateBudgets;
    /**
     * Determine the achieved conformance level based on manifest features
     */
    private determineConformanceLevel;
    /**
     * Get comprehensive OSSA agent taxonomy with 360° feedback loop
     */
    getTaxonomy(): AgentTaxonomy;
    /**
     * Get comprehensive JSON Schema for specific agent type
     */
    getSchema(agentType: string): any;
    /**
     * Get type-specific capability domains
     */
    private getTypeSpecificCapabilities;
    /**
     * Validate agent capability matching for orchestration
     */
    validateCapabilityMatch(requiredCapabilities: string[], agentManifest: any): Promise<{
        compatible: boolean;
        score: number;
        missing: string[];
        warnings: string[];
    }>;
    /**
     * Get OSSA specification version
     */
    getVersion(): string;
    /**
     * Get supported conformance levels with requirements
     */
    getConformanceLevels(): typeof this.conformanceLevels;
}
export {};
//# sourceMappingURL=validator.d.ts.map