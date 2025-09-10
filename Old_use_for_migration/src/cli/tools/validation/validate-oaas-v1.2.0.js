#!/usr/bin/env node

/**
 * OpenAPI AI Agents Standard (OAAS) v1.2.0 Compliance Validation Script
 * Universal agent specification validation tool
 */

import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import path from 'path';

class OAASv120Validator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validatedAgents = [];
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

            // Core OAAS v1.2.0 validation
            this.validateApiVersion(agent, errors);
            this.validateKind(agent, errors);
            this.validateMetadata(agent, errors, warnings);
            this.validateSpec(agent, errors, warnings);
            this.validateFrameworks(agent, errors, warnings);
            this.validateCapabilities(agent, errors, warnings);

            // Report results
            if (errors.length === 0) {
                console.log(`✅ VALID: ${path.basename(filePath)}`);
                if (warnings.length > 0) {
                    console.log(`⚠️  Warnings: ${warnings.length}`);
                    warnings.forEach(w => console.log(`   - ${w}`));
                }
                this.validatedAgents.push({
                    file: filePath,
                    version: agent.apiVersion || 'unknown',
                    status: 'valid',
                    warnings: warnings.length
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
                    warnings: warnings.length
                });
            }

            this.errors.push(...errors);
            this.warnings.push(...warnings);

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
            errors.push(`Invalid apiVersion - must be one of: openapi-ai-agents/v1.2.0, openapi-ai-agents/v0.1.1, open-standards-scalable-agents/v0.1.2`);
        }
    }

    isValidApiVersion(version) {
        const validVersions = [
            'openapi-ai-agents/v1.2.0',     // Current standard
            'openapi-ai-agents/v0.1.1',     // Previous version  
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

    validateMetadata(agent, errors, warnings) {
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
    }

    validateSpec(agent, errors, warnings) {
        if (!agent.spec) {
            errors.push('Missing required section: spec');
            return;
        }

        const spec = agent.spec;

        // Agent identity (v1.2.0 supports both formats)
        if (spec.agent) {
            if (!spec.agent.name && !spec.agent.expertise) {
                warnings.push('spec.agent should have name or expertise');
            }
        } else if (!spec.expertise) {
            warnings.push('Missing spec.agent or spec.expertise - recommended for agent discovery');
        }

        // Capabilities
        if (!spec.capabilities) {
            errors.push('Missing required section: spec.capabilities');
        } else if (!Array.isArray(spec.capabilities)) {
            errors.push('spec.capabilities must be an array');
        } else if (spec.capabilities.length === 0) {
            warnings.push('Empty capabilities array - agents should declare at least one capability');
        }
    }

    validateFrameworks(agent, errors, warnings) {
        const spec = agent.spec;
        if (!spec?.frameworks) {
            warnings.push('Missing frameworks section - recommended for interoperability');
            return;
        }

        const frameworks = spec.frameworks;
        const supportedFrameworks = ['mcp', 'langchain', 'crewai', 'openai', 'anthropic', 'autogen', 'drupal'];
        
        Object.keys(frameworks).forEach(framework => {
            if (!supportedFrameworks.includes(framework)) {
                warnings.push(`Unknown framework: ${framework}. Supported: ${supportedFrameworks.join(', ')}`);
            }
            
            // Validate framework configuration
            const config = frameworks[framework];
            if (typeof config === 'object' && config.enabled !== undefined && typeof config.enabled !== 'boolean') {
                errors.push(`Framework ${framework}.enabled must be a boolean`);
            }
        });
    }

    validateCapabilities(agent, errors, warnings) {
        const capabilities = agent.spec?.capabilities;
        if (!capabilities || !Array.isArray(capabilities)) return;

        capabilities.forEach((capability, index) => {
            if (typeof capability !== 'object') {
                errors.push(`Capability ${index} must be an object`);
                return;
            }

            if (!capability.name) {
                errors.push(`Capability ${index} missing required field: name`);
            }

            if (!capability.description) {
                warnings.push(`Capability ${capability.name || index} missing description`);
            }

            // Validate capability name format
            if (capability.name && !/^[a-z_][a-z0-9_]*$/.test(capability.name)) {
                warnings.push(`Capability name '${capability.name}' should use snake_case format`);
            }
        });
    }

    /**
     * Generate summary report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('🏆 OAAS v1.2.0 VALIDATION SUMMARY');
        console.log('='.repeat(80));

        const totalAgents = this.validatedAgents.length;
        const validAgents = this.validatedAgents.filter(a => a.status === 'valid').length;
        const invalidAgents = this.validatedAgents.filter(a => a.status === 'invalid').length;

        console.log(`\n📊 Overall Results:`);
        console.log(`   Total Agents Processed: ${totalAgents}`);
        console.log(`   ✅ Valid Agents: ${validAgents}`);
        console.log(`   ❌ Invalid Agents: ${invalidAgents}`);
        console.log(`   📈 Compliance Rate: ${((validAgents / totalAgents) * 100).toFixed(1)}%`);

        // Version breakdown
        const versions = {};
        this.validatedAgents
            .filter(a => a.status === 'valid')
            .forEach(a => {
                const version = a.version || 'unknown';
                versions[version] = (versions[version] || 0) + 1;
            });

        console.log(`\n📋 API Version Distribution:`);
        Object.entries(versions).forEach(([version, count]) => {
            const emoji = version.includes('v1.2.0') ? '🥇' : 
                         version.includes('v0.1.1') ? '🥈' : '🥉';
            console.log(`   ${emoji} ${version}: ${count} agents`);
        });

        console.log(`\n⚠️  Total Warnings: ${this.warnings.length}`);
        console.log(`❌ Total Errors: ${this.errors.length}`);

        if (invalidAgents > 0) {
            console.log(`\n❌ Invalid Agents:`);
            this.validatedAgents
                .filter(a => a.status === 'invalid')
                .forEach(a => {
                    console.log(`   - ${path.basename(a.file)} (${a.errors} errors, ${a.warnings} warnings)`);
                });
        }

        console.log(`\n🎯 Next Steps:`);
        if (invalidAgents > 0) {
            console.log(`   1. Fix ${invalidAgents} invalid agent configurations`);
        }
        if (this.warnings.length > 0) {
            console.log(`   2. Address ${this.warnings.length} warnings for better compliance`);
        }
        console.log(`   3. Consider upgrading to openapi-ai-agents/v1.2.0 for latest features`);
        console.log(`   4. Use framework discovery for better interoperability`);

        console.log('\n' + '='.repeat(80));
        
        return {
            total: totalAgents,
            valid: validAgents,
            invalid: invalidAgents,
            complianceRate: (validAgents / totalAgents) * 100,
            versions,
            errors: this.errors.length,
            warnings: this.warnings.length
        };
    }
}

// Main execution
function main() {
    const validator = new OAASv120Validator();
    
    console.log('🚀 OpenAPI AI Agents Standard v1.2.0 Validator');
    console.log('Universal Agent Interoperability Validation Tool');
    
    // Find all agent.yml files (exclude schema files)
    const agentFiles = glob.sync('**/*agent*.yml', {
        ignore: ['node_modules/**', '**/node_modules/**', 'schemas/**', 'services/examples/**']
    });
    
    console.log(`\n📁 Found ${agentFiles.length} agent files to validate\n`);
    
    // Validate each agent
    agentFiles.forEach(file => validator.validateAgent(file));
    
    // Generate summary report
    const summary = validator.generateReport();
    
    // Exit with error code if validation failed
    process.exit(summary.invalid > 0 ? 1 : 0);
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { OAASv120Validator };