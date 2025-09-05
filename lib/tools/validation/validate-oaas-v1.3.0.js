#!/usr/bin/env node

/**
 * ⚠️ DEPRECATED SCRIPT - MIGRATION REQUIRED ⚠️ 
 * 
 * This OAAS validation script is DEPRECATED and will be removed in December 2025.
 * OAAS has been superseded by the OSSA standard.
 * 
 * Migration Guide: ../../../docs/MIGRATION_GUIDE.md
 * Install CLI: npm install -g @bluefly/open-standards-scalable-agents@0.1.8
 * 
 * OLD: node lib/tools/validation/validate-oaas-v1.3.0.js <path>
 * NEW: ossa migrate --from oaas-1.3.0 <path>
 * 
 * =============================================================================
 * 
 * OpenAPI AI Agents Standard (OAAS) v1.3.0 Enhanced Validation Tool
 * Next-generation agent specification validation with AI-powered insights
 */

import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';

// Display deprecation warning at runtime
console.log('\n\x1b[43m\x1b[30m ⚠️ DEPRECATED OAAS SCRIPT - MIGRATE TO OSSA ⚠️ \x1b[0m');
console.log('\x1b[33m╔══════════════════════════════════════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[33m║ OAAS is deprecated. Please migrate to OSSA v0.1.8 standard                 ║\x1b[0m');
console.log('\x1b[33m║                                                                              ║\x1b[0m');
console.log('\x1b[33m║ \x1b[31mOLD:\x1b[33m node lib/tools/validation/validate-oaas-v1.3.0.js <path>        ║\x1b[0m');
console.log('\x1b[33m║ \x1b[32mNEW:\x1b[33m ossa migrate --from oaas-1.3.0 <path>                           ║\x1b[0m');
console.log('\x1b[33m║                                                                              ║\x1b[0m');
console.log('\x1b[33m║ Install CLI: npm install -g @bluefly/open-standards-scalable-agents@0.1.8   ║\x1b[0m');
console.log('\x1b[33m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m');
console.log('');
import path from 'path';

class OAASv130Validator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.suggestions = [];
        this.validatedAgents = [];
        this.insights = [];
    }

    /**
     * Validate an individual agent configuration
     */
    validateAgent(filePath) {
        console.log(`\n🔍 Validating: ${filePath}`);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const agent = yaml.load(content);
            const errors = [];
            const warnings = [];
            const suggestions = [];
            const insights = [];

            // Enhanced OAAS v1.3.0 validation
            this.validateApiVersion(agent, errors);
            this.validateKind(agent, errors);
            this.validateMetadata(agent, errors, warnings, suggestions);
            this.validateSpec(agent, errors, warnings, suggestions);
            this.validateFrameworks(agent, errors, warnings, suggestions);
            this.validateCapabilities(agent, errors, warnings, suggestions);
            this.validateSecurity(agent, warnings, suggestions);
            this.validateCompliance(agent, warnings, suggestions);
            this.generateInsights(agent, insights);

            // Enhanced reporting
            if (errors.length === 0) {
                const grade = this.calculateAgentGrade(warnings, suggestions);
                console.log(`✅ VALID: ${path.basename(filePath)} (Grade: ${grade})`);
                
                if (warnings.length > 0) {
                    console.log(`⚠️  Warnings: ${warnings.length}`);
                    warnings.forEach(w => console.log(`   - ${w}`));
                }
                
                if (suggestions.length > 0 && process.argv.includes('--verbose')) {
                    console.log(`💡 Suggestions: ${suggestions.length}`);
                    suggestions.forEach(s => console.log(`   + ${s}`));
                }

                this.validatedAgents.push({
                    file: filePath,
                    version: agent.apiVersion || 'unknown',
                    status: 'valid',
                    grade,
                    warnings: warnings.length,
                    suggestions: suggestions.length,
                    insights: insights.length
                });
            } else {
                console.log(`❌ INVALID: ${path.basename(filePath)}`);
                errors.forEach(e => console.log(`   ERROR: ${e}`));
                if (warnings.length > 0) {
                    warnings.forEach(w => console.log(`   WARNING: ${w}`));
                }
                this.validatedAgents.push({
                    file: filePath,
                    status: 'invalid',
                    errors: errors.length,
                    warnings: warnings.length,
                    suggestions: suggestions.length
                });
            }

            this.errors.push(...errors);
            this.warnings.push(...warnings);
            this.suggestions.push(...suggestions);
            this.insights.push(...insights);

        } catch (error) {
            console.log(`❌ PARSE ERROR: ${path.basename(filePath)}`);
            console.log(`   ${error.message}`);
            this.errors.push(`Parse error in ${filePath}: ${error.message}`);
        }
    }

    validateApiVersion(agent, errors) {
        if (!agent.apiVersion) {
            errors.push('Missing required field: apiVersion');
        } else if (!this.isValidApiVersion(agent.apiVersion)) {
            errors.push(`Invalid apiVersion - must be one of: openapi-ai-agents/v1.3.0, openapi-ai-agents/v1.2.0, openapi-ai-agents/v0.1.1, open-standards-scalable-agents/v0.1.2`);
        }
    }

    isValidApiVersion(version) {
        const validVersions = [
            'openapi-ai-agents/v1.3.0',     // Latest standard
            'openapi-ai-agents/v1.2.0',     // Previous version
            'openapi-ai-agents/v0.1.1',     // Legacy version  
            'open-standards-scalable-agents/v0.1.2'  // Legacy OSSA
        ];
        return validVersions.includes(version);
    }

    validateKind(agent, errors) {
        if (!agent.kind) {
            errors.push('Missing required field: kind');
        } else if (agent.kind !== 'Agent') {
            errors.push('Invalid kind - must be: Agent');
        }
    }

    validateMetadata(agent, errors, warnings, suggestions) {
        if (!agent.metadata) {
            errors.push('Missing required section: metadata');
            return;
        }

        const metadata = agent.metadata;

        // Required fields
        if (!metadata.name) {
            errors.push('Missing required field: metadata.name');
        }
        if (!metadata.version) {
            warnings.push('Missing recommended field: metadata.version');
        }

        // Validate name format
        if (metadata.name && !/^[a-z0-9-]+$/.test(metadata.name)) {
            errors.push('metadata.name must use lowercase letters, numbers, and hyphens only');
        }

        // v1.3.0 enhanced metadata validation
        if (!metadata.description) {
            warnings.push('Missing metadata.description - recommended for agent discovery');
        }

        if (!metadata.labels) {
            suggestions.push('Consider adding metadata.labels for better categorization');
        } else {
            if (!metadata.labels.tier) {
                suggestions.push('Add metadata.labels.tier (basic|standard|advanced|enterprise) for capability signaling');
            }
            if (!metadata.labels.domain) {
                suggestions.push('Add metadata.labels.domain for functional categorization');
            }
        }

        if (!metadata.annotations) {
            suggestions.push('Consider adding metadata.annotations for framework-specific metadata');
        }
    }

    validateSpec(agent, errors, warnings, suggestions) {
        if (!agent.spec) {
            errors.push('Missing required section: spec');
            return;
        }

        const spec = agent.spec;

        // Agent identity (enhanced v1.3.0 validation)
        if (spec.agent) {
            if (!spec.agent.name && !spec.agent.expertise) {
                warnings.push('spec.agent should have name or expertise');
            }
            // v1.3.0 enhanced agent validation
            if (spec.agent.expertise && spec.agent.expertise.length < 10) {
                suggestions.push('Consider a more detailed expertise description for better discovery');
            }
        } else if (!spec.expertise) {
            warnings.push('Missing spec.agent or spec.expertise - recommended for agent discovery');
        }

        // Capabilities (handle both array and structured format)
        if (!spec.capabilities) {
            errors.push('Missing required section: spec.capabilities');
        } else {
            let hasCapabilities = false;
            if (Array.isArray(spec.capabilities)) {
                hasCapabilities = spec.capabilities.length > 0;
                if (!hasCapabilities) {
                    warnings.push('Empty capabilities array - agents should declare at least one capability');
                }
            } else if (typeof spec.capabilities === 'object') {
                // Check for structured format (primary/secondary)
                const primaryCaps = spec.capabilities.primary;
                const secondaryCaps = spec.capabilities.secondary;
                
                if (primaryCaps && Array.isArray(primaryCaps) && primaryCaps.length > 0) {
                    hasCapabilities = true;
                }
                if (secondaryCaps && Array.isArray(secondaryCaps) && secondaryCaps.length > 0) {
                    hasCapabilities = true;
                }
                
                if (!hasCapabilities) {
                    // Check for any other array values
                    Object.values(spec.capabilities).forEach(cap => {
                        if (Array.isArray(cap) && cap.length > 0) {
                            hasCapabilities = true;
                        }
                    });
                }
                
                if (!hasCapabilities) {
                    warnings.push('capabilities section appears empty - agents should declare at least one capability');
                }
            } else {
                errors.push('spec.capabilities must be an array or object with capability arrays');
            }
        }

        // v1.3.0 enhanced spec validation
        if (!spec.context_management) {
            suggestions.push('Consider adding spec.context_management for optimal token usage');
        }

        if (!spec.integration) {
            suggestions.push('Consider adding spec.integration for deployment configuration');
        }

        if (!spec.monitoring) {
            suggestions.push('Consider adding spec.monitoring for production observability');
        }
    }

    validateFrameworks(agent, errors, warnings, suggestions) {
        const spec = agent.spec;
        if (!spec?.frameworks) {
            warnings.push('Missing frameworks section - recommended for interoperability');
            return;
        }

        const frameworks = spec.frameworks;
        const supportedFrameworks = ['mcp', 'langchain', 'crewai', 'openai', 'anthropic', 'autogen', 'drupal', 'vertex_ai', 'azure_ai'];
        
        Object.keys(frameworks).forEach(framework => {
            if (!supportedFrameworks.includes(framework)) {
                warnings.push(`Unknown framework: ${framework}. Supported: ${supportedFrameworks.join(', ')}`);
            }
            
            // Validate framework configuration
            const config = frameworks[framework];
            if (typeof config === 'object' && config.enabled !== undefined && typeof config.enabled !== 'boolean') {
                errors.push(`Framework ${framework}.enabled must be a boolean`);
            }

            // v1.3.0 enhanced framework validation
            if (config?.enabled && !config.version) {
                suggestions.push(`Consider specifying version for framework ${framework}`);
            }
        });

        // Check for framework diversity
        const enabledFrameworks = Object.entries(frameworks)
            .filter(([_, config]) => config?.enabled === true).length;
        
        if (enabledFrameworks < 2) {
            suggestions.push('Consider enabling multiple frameworks for better interoperability');
        }
    }

    validateCapabilities(agent, errors, warnings, suggestions) {
        const capabilities = agent.spec?.capabilities;
        if (!capabilities) return;

        // Handle both array format and structured format (primary/secondary)
        let capabilitiesToValidate = [];
        
        if (Array.isArray(capabilities)) {
            // Standard array format
            capabilitiesToValidate = capabilities;
        } else if (typeof capabilities === 'object') {
            // Structured format with primary/secondary
            if (capabilities.primary && Array.isArray(capabilities.primary)) {
                capabilitiesToValidate = capabilitiesToValidate.concat(capabilities.primary);
            }
            if (capabilities.secondary && Array.isArray(capabilities.secondary)) {
                capabilitiesToValidate = capabilitiesToValidate.concat(capabilities.secondary);
            }
            
            // If no primary/secondary, try to validate as direct capabilities
            if (capabilitiesToValidate.length === 0) {
                Object.values(capabilities).forEach(cap => {
                    if (Array.isArray(cap)) {
                        capabilitiesToValidate = capabilitiesToValidate.concat(cap);
                    }
                });
            }
        }

        if (capabilitiesToValidate.length === 0) return;

        capabilitiesToValidate.forEach((capability, index) => {
            if (typeof capability !== 'object') {
                errors.push(`Capability ${index} must be an object`);
                return;
            }

            if (!capability.name && !capability.id) {
                errors.push(`Capability ${index} missing required field: name or id`);
            }

            const capName = capability.name || capability.id || index;

            if (!capability.description) {
                warnings.push(`Capability ${capName} missing description`);
            }

            // Validate capability name format (allow both name and id fields)
            const nameToValidate = capability.name || capability.id;
            if (nameToValidate && !/^[a-z_][a-z0-9_]*$/.test(nameToValidate)) {
                warnings.push(`Capability name '${nameToValidate}' should use snake_case format`);
            }

            // v1.3.0 enhanced capability validation
            if (!capability.input_schema) {
                suggestions.push(`Capability ${capName} could benefit from input_schema definition`);
            }

            if (!capability.output_schema) {
                suggestions.push(`Capability ${capName} could benefit from output_schema definition`);
            }

            if (capability.frameworks && !Array.isArray(capability.frameworks)) {
                warnings.push(`Capability ${capName} frameworks should be an array`);
            }
        });

        // Check for capability categories
        const hasAnalysisCapabilities = capabilitiesToValidate.some(c => (c.name || c.id)?.includes('analyze'));
        const hasGenerationCapabilities = capabilitiesToValidate.some(c => (c.name || c.id)?.includes('generate'));
        const hasValidationCapabilities = capabilitiesToValidate.some(c => (c.name || c.id)?.includes('validate'));

        if (!hasAnalysisCapabilities && !hasGenerationCapabilities) {
            suggestions.push('Consider adding either analysis or generation capabilities for broader utility');
        }
    }

    validateSecurity(agent, warnings, suggestions) {
        const spec = agent.spec;
        
        if (!spec?.security) {
            suggestions.push('Consider adding spec.security for production deployment');
            return;
        }

        const security = spec.security;
        
        if (!security.authentication) {
            warnings.push('Missing security.authentication configuration');
        } else if (security.authentication === 'none') {
            warnings.push('Authentication disabled - not recommended for production');
        }

        if (!security.data_classification) {
            suggestions.push('Consider adding security.data_classification for compliance');
        }

        if (!security.audit_logging) {
            suggestions.push('Consider enabling security.audit_logging for compliance tracking');
        }
    }

    validateCompliance(agent, warnings, suggestions) {
        const spec = agent.spec;
        
        if (!spec?.compliance) {
            suggestions.push('Consider adding spec.compliance for enterprise deployment');
            return;
        }

        const compliance = spec.compliance;
        
        if (compliance.standards && !Array.isArray(compliance.standards)) {
            warnings.push('compliance.standards should be an array');
        }

        if (!compliance.data_handling) {
            suggestions.push('Consider adding compliance.data_handling configuration');
        }
    }

    generateInsights(agent, insights) {
        const spec = agent.spec;
        
        // Extract capabilities for analysis (handle both array and structured format)
        let capabilitiesToAnalyze = [];
        const capabilities = spec?.capabilities;
        
        if (Array.isArray(capabilities)) {
            capabilitiesToAnalyze = capabilities;
        } else if (capabilities && typeof capabilities === 'object') {
            if (capabilities.primary && Array.isArray(capabilities.primary)) {
                capabilitiesToAnalyze = capabilitiesToAnalyze.concat(capabilities.primary);
            }
            if (capabilities.secondary && Array.isArray(capabilities.secondary)) {
                capabilitiesToAnalyze = capabilitiesToAnalyze.concat(capabilities.secondary);
            }
        }

        // Analyze agent complexity
        const capabilityCount = capabilitiesToAnalyze.length || 0;
        const frameworkCount = Object.keys(spec?.frameworks || {}).length;
        
        if (capabilityCount > 10) {
            insights.push('High capability count detected - consider agent specialization');
        }
        
        if (frameworkCount > 5) {
            insights.push('Many frameworks supported - excellent interoperability');
        }

        // Analyze naming patterns
        const hasConsistentNaming = capabilitiesToAnalyze.length === 0 || capabilitiesToAnalyze.every(c => {
            const name = c.name || c.id;
            return name && (name.includes('_') || /^[a-z]+[A-Z]/.test(name));
        });
        
        if (!hasConsistentNaming && capabilitiesToAnalyze.length > 0) {
            insights.push('Consider consistent naming patterns for capabilities');
        }

        // Production readiness analysis
        const hasMonitoring = !!spec?.monitoring;
        const hasSecurity = !!spec?.security;
        const hasCompliance = !!spec?.compliance;
        
        const productionScore = [hasMonitoring, hasSecurity, hasCompliance].filter(Boolean).length;
        if (productionScore >= 2) {
            insights.push('Agent appears production-ready with good operational support');
        } else if (productionScore === 1) {
            insights.push('Partial production readiness - consider adding more operational features');
        }
    }

    calculateAgentGrade(warnings, suggestions) {
        let score = 100;
        score -= warnings.length * 5;  // 5 points per warning
        score -= suggestions.length * 2; // 2 points per suggestion
        
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'B+';
        if (score >= 80) return 'B';
        if (score >= 75) return 'C+';
        if (score >= 70) return 'C';
        return 'D';
    }

    /**
     * Generate comprehensive report with AI insights
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('🏆 OAAS v1.3.0 ENHANCED VALIDATION SUMMARY');
        console.log('🤖 AI-Powered Agent Analysis & Insights');
        console.log('='.repeat(80));

        const totalAgents = this.validatedAgents.length;
        const validAgents = this.validatedAgents.filter(a => a.status === 'valid').length;
        const invalidAgents = this.validatedAgents.filter(a => a.status === 'invalid').length;

        console.log(`\n📊 Overall Results:`);
        console.log(`   Total Agents Processed: ${totalAgents}`);
        console.log(`   ✅ Valid Agents: ${validAgents}`);
        console.log(`   ❌ Invalid Agents: ${invalidAgents}`);
        console.log(`   📈 Compliance Rate: ${((validAgents / totalAgents) * 100).toFixed(1)}%`);

        // Grade distribution
        const grades = {};
        this.validatedAgents
            .filter(a => a.status === 'valid')
            .forEach(a => {
                const grade = a.grade || 'N/A';
                grades[grade] = (grades[grade] || 0) + 1;
            });

        console.log(`\n📋 Quality Grade Distribution:`);
        Object.entries(grades).forEach(([grade, count]) => {
            const emoji = grade === 'A+' ? '🥇' : 
                         grade.startsWith('A') ? '🥈' : 
                         grade.startsWith('B') ? '🥉' : '📝';
            console.log(`   ${emoji} ${grade}: ${count} agents`);
        });

        // Version distribution
        const versions = {};
        this.validatedAgents
            .filter(a => a.status === 'valid')
            .forEach(a => {
                const version = a.version || 'unknown';
                versions[version] = (versions[version] || 0) + 1;
            });

        console.log(`\n📋 API Version Distribution:`);
        Object.entries(versions).forEach(([version, count]) => {
            const emoji = version.includes('v1.3.0') ? '🚀' : 
                         version.includes('v1.2.0') ? '🥇' : 
                         version.includes('v0.1.1') ? '🥈' : '🥉';
            console.log(`   ${emoji} ${version}: ${count} agents`);
        });

        console.log(`\n📊 Quality Metrics:`);
        console.log(`   ⚠️  Total Warnings: ${this.warnings.length}`);
        console.log(`   ❌ Total Errors: ${this.errors.length}`);
        console.log(`   💡 Enhancement Suggestions: ${this.suggestions.length}`);
        console.log(`   🧠 AI Insights Generated: ${this.insights.length}`);

        if (invalidAgents > 0) {
            console.log(`\n❌ Invalid Agents:`);
            this.validatedAgents
                .filter(a => a.status === 'invalid')
                .forEach(a => {
                    console.log(`   - ${path.basename(a.file)} (${a.errors} errors, ${a.warnings} warnings)`);
                });
        }

        // Top insights
        if (this.insights.length > 0) {
            console.log(`\n🧠 Key AI Insights:`);
            const uniqueInsights = [...new Set(this.insights)].slice(0, 5);
            uniqueInsights.forEach((insight, i) => {
                console.log(`   ${i + 1}. ${insight}`);
            });
        }

        console.log(`\n🎯 Next Steps & Recommendations:`);
        if (invalidAgents > 0) {
            console.log(`   1. Fix ${invalidAgents} invalid agent configurations`);
        }
        if (this.warnings.length > 0) {
            console.log(`   2. Address ${this.warnings.length} warnings for better compliance`);
        }
        if (this.suggestions.length > 0) {
            console.log(`   3. Implement ${this.suggestions.length} enhancement suggestions for optimal agents`);
        }
        console.log(`   4. Consider upgrading to openapi-ai-agents/v1.3.0 for latest AI-powered features`);
        console.log(`   5. Use --verbose flag for detailed suggestions and insights`);

        console.log('\n' + '='.repeat(80));
        
        return {
            total: totalAgents,
            valid: validAgents,
            invalid: invalidAgents,
            complianceRate: (validAgents / totalAgents) * 100,
            grades,
            versions,
            errors: this.errors.length,
            warnings: this.warnings.length,
            suggestions: this.suggestions.length,
            insights: this.insights.length
        };
    }
}

// Main execution
function main() {
    const validator = new OAASv130Validator();
    
    console.log('🚀 OpenAPI AI Agents Standard v1.3.0 Enhanced Validator');
    console.log('🤖 Next-Generation Agent Validation with AI Insights');
    
    // Find all agent.yml files (exclude schema files)
    const agentFiles = glob.sync('**/*agent*.yml', {
        ignore: ['node_modules/**', '**/node_modules/**', 'schemas/**', 'services/examples/**']
    });
    
    console.log(`\n📁 Found ${agentFiles.length} agent files to validate\n`);
    
    // Validate each agent
    agentFiles.forEach(file => validator.validateAgent(file));
    
    // Generate enhanced report
    const summary = validator.generateReport();
    
    // Exit with error code if validation failed
    process.exit(summary.invalid > 0 ? 1 : 0);
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { OAASv130Validator };