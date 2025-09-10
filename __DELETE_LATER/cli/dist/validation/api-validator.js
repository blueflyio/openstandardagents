/**
 * OSSA API-First Validation Framework
 *
 * Comprehensive validation system for OpenAPI specifications,
 * OSSA compliance, and runtime API validation.
 *
 * @version 0.1.8
 */
import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import { isConformanceTier, isAgentClass, isAgentCategory, CONFORMANCE_TIERS, AGENT_CLASSES, AGENT_CATEGORIES } from '../api/generated-types.js';
// =====================================================================
// Main Validation Class
// =====================================================================
export class OSSAValidator {
    constructor() {
        this.rules = new Map();
        this.initializeRules();
    }
    /**
     * Load OpenAPI specification for validation
     */
    async loadOpenAPISpec(specPath) {
        try {
            const content = await fs.readFile(specPath, 'utf-8');
            const spec = specPath.endsWith('.yaml') || specPath.endsWith('.yml')
                ? yaml.parse(content)
                : JSON.parse(content);
            this.openApiSpec = spec;
        }
        catch (error) {
            throw new Error(`Failed to load OpenAPI spec from ${specPath}: ${error}`);
        }
    }
    /**
     * Validate OpenAPI specification with OSSA extensions
     */
    async validateOpenAPI(specPath, options = {}) {
        await this.loadOpenAPISpec(specPath);
        const context = {
            type: 'openapi',
            version: '3.1.0',
            options
        };
        const result = this.createValidationResult('openapi-spec');
        // Core OpenAPI validation
        this.validateOpenAPIStructure(this.openApiSpec, result, context);
        // OSSA extensions validation
        this.validateOSSAExtensions(this.openApiSpec, result, context);
        // Security validation
        this.validateSecuritySchemes(this.openApiSpec, result, context);
        // Path validation
        this.validatePaths(this.openApiSpec, result, context);
        return this.finalizeResult(result);
    }
    /**
     * Validate agent configuration against OSSA standards
     */
    validateAgent(agent, options = {}) {
        const context = {
            type: 'agent',
            version: '0.1.8',
            options
        };
        const result = this.createValidationResult('agent-config');
        // Basic agent structure
        this.validateAgentStructure(agent, result, context);
        // OSSA compliance
        this.validateAgentCompliance(agent, result, context);
        // Capability validation
        this.validateAgentCapabilities(agent.spec, result, context);
        // Protocol validation
        this.validateAgentProtocols(agent.spec, result, context);
        return this.finalizeResult(result);
    }
    /**
     * Validate workflow definition
     */
    validateWorkflow(workflow, options = {}) {
        const context = {
            type: 'workflow',
            version: '0.1.8',
            options
        };
        const result = this.createValidationResult('workflow-definition');
        // Basic workflow structure
        this.validateWorkflowStructure(workflow, result, context);
        // Step validation
        this.validateWorkflowSteps(workflow, result, context);
        // Dependency validation
        this.validateWorkflowDependencies(workflow, result, context);
        return this.finalizeResult(result);
    }
    /**
     * Validate runtime API responses
     */
    async validateAPIResponse(endpoint, method, response, expectedSchema) {
        const context = {
            type: 'openapi',
            version: '3.1.0',
            options: {}
        };
        const result = this.createValidationResult('api-response');
        // Response structure validation
        if (expectedSchema) {
            this.validateResponseSchema(response, expectedSchema, result, context);
        }
        // OSSA response format validation
        this.validateOSSAResponseFormat(response, result, context);
        return this.finalizeResult(result);
    }
    // =====================================================================
    // Private Validation Methods
    // =====================================================================
    validateOpenAPIStructure(spec, result, context) {
        const rules = this.rules.get('openapi-structure') || [];
        rules.forEach(rule => {
            try {
                const ruleResult = rule.validate(spec, context);
                this.addRuleResult(rule, ruleResult, result);
            }
            catch (error) {
                result.errors.push({
                    code: `${rule.name}_error`,
                    message: `Rule execution failed: ${error}`,
                    severity: 'high'
                });
            }
        });
    }
    validateOSSAExtensions(spec, result, context) {
        const rules = this.rules.get('ossa-extensions') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(spec, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateSecuritySchemes(spec, result, context) {
        const rules = this.rules.get('security') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(spec.components?.securitySchemes, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validatePaths(spec, result, context) {
        const rules = this.rules.get('paths') || [];
        Object.entries(spec.paths || {}).forEach(([path, pathSpec]) => {
            rules.forEach(rule => {
                const ruleResult = rule.validate({ path, spec: pathSpec }, context);
                this.addRuleResult(rule, ruleResult, result, `paths.${path}`);
            });
        });
    }
    validateAgentStructure(agent, result, context) {
        const rules = this.rules.get('agent-structure') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(agent, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateAgentCompliance(agent, result, context) {
        const rules = this.rules.get('agent-compliance') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(agent, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateAgentCapabilities(spec, result, context) {
        const rules = this.rules.get('agent-capabilities') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(spec.capabilities, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateAgentProtocols(spec, result, context) {
        const rules = this.rules.get('agent-protocols') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(spec.protocols, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateWorkflowStructure(workflow, result, context) {
        const rules = this.rules.get('workflow-structure') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(workflow, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateWorkflowSteps(workflow, result, context) {
        const rules = this.rules.get('workflow-steps') || [];
        workflow.steps.forEach((step, index) => {
            rules.forEach(rule => {
                const ruleResult = rule.validate(step, context);
                this.addRuleResult(rule, ruleResult, result, `steps[${index}]`);
            });
        });
    }
    validateWorkflowDependencies(workflow, result, context) {
        const rules = this.rules.get('workflow-dependencies') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(workflow, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateResponseSchema(response, schema, result, context) {
        const rules = this.rules.get('response-schema') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate({ response, schema }, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    validateOSSAResponseFormat(response, result, context) {
        const rules = this.rules.get('ossa-response') || [];
        rules.forEach(rule => {
            const ruleResult = rule.validate(response, context);
            this.addRuleResult(rule, ruleResult, result);
        });
    }
    // =====================================================================
    // Validation Rules Initialization
    // =====================================================================
    initializeRules() {
        // OpenAPI Structure Rules
        this.addRules('openapi-structure', [
            {
                name: 'openapi-version',
                description: 'OpenAPI version should be 3.1.0',
                severity: 'critical',
                validate: (spec) => ({
                    passed: spec.openapi === '3.1.0',
                    message: spec.openapi !== '3.1.0' ? `OpenAPI version is ${spec.openapi}, should be 3.1.0` : undefined,
                    suggestion: 'Update openapi field to "3.1.0"'
                })
            },
            {
                name: 'info-required',
                description: 'Info section is required',
                severity: 'critical',
                validate: (spec) => ({
                    passed: !!spec.info && !!spec.info.title && !!spec.info.version,
                    message: !spec.info ? 'Info section is missing' : 'Info title or version is missing',
                    suggestion: 'Add complete info section with title and version'
                })
            },
            {
                name: 'servers-present',
                description: 'At least one server should be defined',
                severity: 'medium',
                validate: (spec) => ({
                    passed: !!spec.servers && spec.servers.length > 0,
                    message: 'No servers defined',
                    suggestion: 'Add at least one server configuration'
                })
            }
        ]);
        // OSSA Extensions Rules
        this.addRules('ossa-extensions', [
            {
                name: 'ossa-standard-extension',
                description: 'x-openapi-ai-agents-standard extension is required',
                severity: 'critical',
                validate: (spec) => {
                    const hasExtension = spec['x-openapi-ai-agents-standard'];
                    return {
                        passed: !!hasExtension,
                        message: !hasExtension ? 'Missing x-openapi-ai-agents-standard extension' : undefined,
                        suggestion: 'Add OSSA standard extension with version and conformance tier'
                    };
                }
            },
            {
                name: 'ossa-version',
                description: 'OSSA version should be 0.1.8',
                severity: 'critical',
                validate: (spec) => {
                    const extension = spec['x-openapi-ai-agents-standard'];
                    return {
                        passed: extension?.version === '0.1.8',
                        message: extension?.version !== '0.1.8' ? `OSSA version is ${extension?.version}, should be 0.1.8` : undefined,
                        suggestion: 'Update OSSA version to "0.1.8"'
                    };
                }
            },
            {
                name: 'conformance-tier',
                description: 'Valid conformance tier is required',
                severity: 'high',
                validate: (spec) => {
                    const extension = spec['x-openapi-ai-agents-standard'];
                    const validTiers = ['core', 'governed', 'advanced'];
                    return {
                        passed: validTiers.includes(extension?.conformance_tier),
                        message: !validTiers.includes(extension?.conformance_tier) ?
                            `Invalid conformance tier: ${extension?.conformance_tier}` : undefined,
                        suggestion: `Use one of: ${validTiers.join(', ')}`
                    };
                }
            }
        ]);
        // Security Rules
        this.addRules('security', [
            {
                name: 'security-schemes-defined',
                description: 'At least one security scheme should be defined',
                severity: 'high',
                validate: (securitySchemes) => ({
                    passed: !!securitySchemes && Object.keys(securitySchemes).length > 0,
                    message: 'No security schemes defined',
                    suggestion: 'Define at least one security scheme (API key, OAuth2, etc.)'
                })
            },
            {
                name: 'api-key-auth',
                description: 'API key authentication should be available',
                severity: 'medium',
                validate: (securitySchemes) => {
                    const hasApiKey = securitySchemes && Object.values(securitySchemes).some((scheme) => scheme.type === 'apiKey');
                    return {
                        passed: hasApiKey,
                        message: 'API key authentication not found',
                        suggestion: 'Add API key authentication scheme for basic access'
                    };
                }
            }
        ]);
        // Path Rules
        this.addRules('paths', [
            {
                name: 'health-endpoint',
                description: 'Health endpoint should be present',
                severity: 'high',
                validate: ({ path }) => ({
                    passed: path === '/health',
                    message: undefined // This rule passes for the health endpoint, fails overall if not found
                })
            },
            {
                name: 'response-schemas',
                description: 'All responses should have schemas defined',
                severity: 'medium',
                validate: ({ spec }) => {
                    const methods = ['get', 'post', 'put', 'delete', 'patch'];
                    let hasSchemas = true;
                    methods.forEach(method => {
                        if (spec[method]?.responses) {
                            Object.values(spec[method].responses).forEach((response) => {
                                if (response.content && !response.content['application/json']?.schema) {
                                    hasSchemas = false;
                                }
                            });
                        }
                    });
                    return {
                        passed: hasSchemas,
                        message: !hasSchemas ? 'Some responses missing schemas' : undefined,
                        suggestion: 'Add response schemas for all endpoints'
                    };
                }
            }
        ]);
        // Agent Structure Rules
        this.addRules('agent-structure', [
            {
                name: 'required-fields',
                description: 'Agent must have required fields',
                severity: 'critical',
                validate: (agent) => {
                    const required = ['id', 'name', 'version', 'spec', 'registered_at'];
                    const missing = required.filter(field => !agent[field]);
                    return {
                        passed: missing.length === 0,
                        message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : undefined,
                        suggestion: 'Ensure all required fields are present'
                    };
                }
            },
            {
                name: 'valid-version',
                description: 'Agent version should follow semver',
                severity: 'medium',
                validate: (agent) => {
                    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
                    return {
                        passed: semverRegex.test(agent.version),
                        message: !semverRegex.test(agent.version) ? `Invalid version format: ${agent.version}` : undefined,
                        suggestion: 'Use semantic versioning (e.g., 1.0.0)'
                    };
                }
            }
        ]);
        // Agent Compliance Rules
        this.addRules('agent-compliance', [
            {
                name: 'conformance-tier-valid',
                description: 'Agent conformance tier must be valid',
                severity: 'critical',
                validate: (agent) => ({
                    passed: isConformanceTier(agent.spec.conformance_tier),
                    message: !isConformanceTier(agent.spec.conformance_tier) ?
                        `Invalid conformance tier: ${agent.spec.conformance_tier}` : undefined,
                    suggestion: `Use one of: ${CONFORMANCE_TIERS.join(', ')}`
                })
            },
            {
                name: 'agent-class-valid',
                description: 'Agent class must be valid',
                severity: 'critical',
                validate: (agent) => ({
                    passed: isAgentClass(agent.spec.class),
                    message: !isAgentClass(agent.spec.class) ? `Invalid agent class: ${agent.spec.class}` : undefined,
                    suggestion: `Use one of: ${AGENT_CLASSES.join(', ')}`
                })
            },
            {
                name: 'agent-category-valid',
                description: 'Agent category must be valid if provided',
                severity: 'medium',
                validate: (agent) => {
                    if (!agent.spec.category)
                        return { passed: true };
                    return {
                        passed: isAgentCategory(agent.spec.category),
                        message: !isAgentCategory(agent.spec.category) ?
                            `Invalid agent category: ${agent.spec.category}` : undefined,
                        suggestion: `Use one of: ${AGENT_CATEGORIES.join(', ')}`
                    };
                }
            }
        ]);
        // Agent Capabilities Rules
        this.addRules('agent-capabilities', [
            {
                name: 'primary-capabilities-present',
                description: 'At least one primary capability must be defined',
                severity: 'critical',
                validate: (capabilities) => ({
                    passed: capabilities?.primary && capabilities.primary.length > 0,
                    message: !capabilities?.primary?.length ? 'No primary capabilities defined' : undefined,
                    suggestion: 'Define at least one primary capability'
                })
            },
            {
                name: 'capability-naming',
                description: 'Capabilities should use kebab-case naming',
                severity: 'low',
                validate: (capabilities) => {
                    const kebabRegex = /^[a-z]+(-[a-z]+)*$/;
                    const invalidNames = (capabilities?.primary || []).filter((cap) => !kebabRegex.test(cap));
                    return {
                        passed: invalidNames.length === 0,
                        message: invalidNames.length > 0 ? `Non-kebab-case capabilities: ${invalidNames.join(', ')}` : undefined,
                        suggestion: 'Use kebab-case naming (e.g., data-analysis, natural-language-processing)'
                    };
                }
            }
        ]);
        // Workflow Structure Rules
        this.addRules('workflow-structure', [
            {
                name: 'required-workflow-fields',
                description: 'Workflow must have required fields',
                severity: 'critical',
                validate: (workflow) => {
                    const required = ['name', 'steps'];
                    const missing = required.filter(field => !workflow[field]);
                    return {
                        passed: missing.length === 0,
                        message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : undefined,
                        suggestion: 'Ensure all required fields are present'
                    };
                }
            },
            {
                name: 'steps-not-empty',
                description: 'Workflow must have at least one step',
                severity: 'critical',
                validate: (workflow) => ({
                    passed: workflow.steps && workflow.steps.length > 0,
                    message: !workflow.steps?.length ? 'Workflow has no steps' : undefined,
                    suggestion: 'Add at least one step to the workflow'
                })
            }
        ]);
        // Workflow Steps Rules
        this.addRules('workflow-steps', [
            {
                name: 'step-required-fields',
                description: 'Step must have required fields',
                severity: 'critical',
                validate: (step) => {
                    const required = ['id', 'type', 'agent_id'];
                    const missing = required.filter(field => !step[field]);
                    return {
                        passed: missing.length === 0,
                        message: missing.length > 0 ? `Step missing required fields: ${missing.join(', ')}` : undefined,
                        suggestion: 'Ensure all required step fields are present'
                    };
                }
            },
            {
                name: 'valid-step-type',
                description: 'Step type must be valid',
                severity: 'critical',
                validate: (step) => {
                    const validTypes = ['agent_call', 'condition', 'parallel', 'sequential'];
                    return {
                        passed: validTypes.includes(step.type),
                        message: !validTypes.includes(step.type) ? `Invalid step type: ${step.type}` : undefined,
                        suggestion: `Use one of: ${validTypes.join(', ')}`
                    };
                }
            }
        ]);
    }
    // =====================================================================
    // Utility Methods
    // =====================================================================
    addRules(category, rules) {
        if (!this.rules.has(category)) {
            this.rules.set(category, []);
        }
        this.rules.get(category).push(...rules);
    }
    createValidationResult(type) {
        return {
            valid: true,
            score: 0,
            errors: [],
            warnings: [],
            info: [],
            metadata: {
                validator_version: '0.1.8',
                ossa_version: '0.1.8',
                timestamp: new Date().toISOString(),
                validation_type: type,
                total_checks: 0,
                passed_checks: 0
            }
        };
    }
    addRuleResult(rule, ruleResult, result, path) {
        result.metadata.total_checks++;
        if (ruleResult.passed) {
            result.metadata.passed_checks++;
        }
        else {
            if (rule.severity === 'critical' || rule.severity === 'high') {
                result.errors.push({
                    code: rule.name,
                    message: ruleResult.message || rule.description,
                    path,
                    severity: rule.severity,
                    suggestion: ruleResult.suggestion
                });
            }
            else {
                result.warnings.push({
                    code: rule.name,
                    message: ruleResult.message || rule.description,
                    path,
                    recommendation: ruleResult.suggestion
                });
            }
        }
    }
    finalizeResult(result) {
        // Calculate overall validity and score
        result.valid = result.errors.length === 0;
        result.score = result.metadata.total_checks > 0
            ? Math.round((result.metadata.passed_checks / result.metadata.total_checks) * 100)
            : 0;
        return result;
    }
}
// =====================================================================
// Validation Utilities
// =====================================================================
export class ValidationFormatter {
    static formatResult(result, format = 'detailed') {
        switch (format) {
            case 'json':
                return JSON.stringify(result, null, 2);
            case 'summary':
                return this.formatSummary(result);
            case 'detailed':
            default:
                return this.formatDetailed(result);
        }
    }
    static formatSummary(result) {
        const status = result.valid ? '✅ VALID' : '❌ INVALID';
        return `${status} | Score: ${result.score}% | Errors: ${result.errors.length} | Warnings: ${result.warnings.length}`;
    }
    static formatDetailed(result) {
        let output = '';
        output += `Validation Result: ${result.valid ? '✅ VALID' : '❌ INVALID'}\n`;
        output += `Score: ${result.score}%\n`;
        output += `Checks: ${result.metadata.passed_checks}/${result.metadata.total_checks} passed\n\n`;
        if (result.errors.length > 0) {
            output += '❌ ERRORS:\n';
            result.errors.forEach((error, index) => {
                output += `  ${index + 1}. [${error.severity.toUpperCase()}] ${error.message}\n`;
                if (error.path)
                    output += `     Path: ${error.path}\n`;
                if (error.suggestion)
                    output += `     Suggestion: ${error.suggestion}\n`;
                output += '\n';
            });
        }
        if (result.warnings.length > 0) {
            output += '⚠️  WARNINGS:\n';
            result.warnings.forEach((warning, index) => {
                output += `  ${index + 1}. ${warning.message}\n`;
                if (warning.path)
                    output += `     Path: ${warning.path}\n`;
                if (warning.recommendation)
                    output += `     Recommendation: ${warning.recommendation}\n`;
                output += '\n';
            });
        }
        if (result.info.length > 0) {
            output += 'ℹ️  INFO:\n';
            result.info.forEach((info, index) => {
                output += `  ${index + 1}. ${info.message}\n`;
                if (info.path)
                    output += `     Path: ${info.path}\n`;
                output += '\n';
            });
        }
        return output;
    }
}
// Create and export default validator instance
export const validator = new OSSAValidator();
