#!/usr/bin/env node

/**
 * ⚠️ DEPRECATED SCRIPT - MIGRATION REQUIRED ⚠️ 
 * 
 * This script is DEPRECATED as of September 2025 and will be removed in December 2025.
 * Please migrate to the new CLI command: `ossa validate --legacy`
 * 
 * Migration Guide: ../../../docs/MIGRATION_GUIDE.md
 * Install CLI: npm install -g @bluefly/open-standards-scalable-agents@0.1.8
 * 
 * OLD: node lib/tools/validation/validate-ossa-v0.1.2.js <path>
 * NEW: ossa validate --legacy [path]
 * 
 * =============================================================================
 * 
 * OSSA v0.1.2 Compliance Validation Script
 * Open Standards for Scalable Agents validation tool
 */

import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';

// Display deprecation warning at runtime
console.log('\n\x1b[43m\x1b[30m ⚠️ DEPRECATION WARNING - LEGACY SCRIPT ⚠️ \x1b[0m');
console.log('\x1b[33m╔══════════════════════════════════════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[33m║ This OSSA v0.1.2 script is DEPRECATED (December 2025 removal)              ║\x1b[0m');
console.log('\x1b[33m║                                                                              ║\x1b[0m');
console.log('\x1b[33m║ \x1b[31mOLD:\x1b[33m node lib/tools/validation/validate-ossa-v0.1.2.js <path>          ║\x1b[0m');
console.log('\x1b[33m║ \x1b[32mNEW:\x1b[33m ossa validate --legacy [path]                                   ║\x1b[0m');
console.log('\x1b[33m║                                                                              ║\x1b[0m');
console.log('\x1b[33m║ Install CLI: npm install -g @bluefly/open-standards-scalable-agents@0.1.8   ║\x1b[0m');
console.log('\x1b[33m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m');
console.log('');
import path from 'path';

class OSSAValidator {
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

            // Core OSSA v0.1.2 validation
            this.validateApiVersion(agent, errors);
            this.validateKind(agent, errors);
            this.validateMetadata(agent, errors, warnings);
            this.validateSpec(agent, errors, warnings);
            this.validateConformanceLevel(agent, errors, warnings);
            this.validateDiscovery(agent, errors, warnings);

            // Report results
            if (errors.length === 0) {
                console.log(`✅ VALID: ${path.basename(filePath)}`);
                if (warnings.length > 0) {
                    console.log(`⚠️  Warnings: ${warnings.length}`);
                    warnings.forEach(w => console.log(`   - ${w}`));
                }
                this.validatedAgents.push({
                    file: filePath,
                    conformanceLevel: agent.metadata?.labels?.tier || agent.metadata?.annotations?.['ossa.io/conformance-level'] || 'unknown',
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
        } else if (agent.apiVersion !== 'open-standards-scalable-agents/v0.1.2') {
            errors.push('Invalid apiVersion - must be: open-standards-scalable-agents/v0.1.2');
        }
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
            errors.push('Missing required field: metadata.version');
        }

        // Labels validation
        if (!metadata.labels) {
            warnings.push('Missing recommended field: metadata.labels');
        } else {
            if (!metadata.labels.tier) {
                warnings.push('Missing recommended label: tier (core/governed/advanced)');
            } else if (!['core', 'governed', 'advanced'].includes(metadata.labels.tier)) {
                errors.push('Invalid tier label - must be: core, governed, or advanced');
            }
            if (!metadata.labels.domain) {
                warnings.push('Missing recommended label: domain');
            }
        }

        // Annotations validation
        if (!metadata.annotations) {
            warnings.push('Missing OSSA migration annotations');
        } else {
            const annotations = metadata.annotations;
            if (!annotations['ossa.io/conformance-level']) {
                warnings.push('Missing ossa.io/conformance-level annotation');
            }
            if (!annotations['ossa.io/migration-date']) {
                warnings.push('Missing ossa.io/migration-date annotation');
            }
            if (!annotations['ossa.io/source-format']) {
                warnings.push('Missing ossa.io/source-format annotation');
            }
        }
    }

    validateSpec(agent, errors, warnings) {
        if (!agent.spec) {
            errors.push('Missing required section: spec');
            return;
        }

        const spec = agent.spec;

        // Agent identity
        if (!spec.agent) {
            errors.push('Missing required section: spec.agent');
        } else {
            if (!spec.agent.name) {
                warnings.push('Missing recommended field: spec.agent.name');
            }
            if (!spec.agent.expertise) {
                warnings.push('Missing recommended field: spec.agent.expertise');
            }
        }

        // Capabilities
        if (!spec.capabilities) {
            errors.push('Missing required section: spec.capabilities');
        } else if (!Array.isArray(spec.capabilities)) {
            errors.push('spec.capabilities must be an array');
        } else if (spec.capabilities.length === 0) {
            warnings.push('Empty capabilities array - agents should declare at least one capability');
        }

        // Frameworks
        if (!spec.frameworks) {
            warnings.push('Missing frameworks section - recommended for interoperability');
        }
    }

    validateConformanceLevel(agent, errors, warnings) {
        const tier = agent.metadata?.labels?.tier;
        const conformanceLevel = agent.metadata?.annotations?.['ossa.io/conformance-level'];
        
        if (tier && conformanceLevel && tier !== conformanceLevel) {
            warnings.push('Inconsistent conformance level between labels.tier and annotations');
        }

        // Validate conformance level requirements
        if (tier === 'advanced' || conformanceLevel === 'advanced') {
            this.validateAdvancedLevel(agent, errors, warnings);
        } else if (tier === 'governed' || conformanceLevel === 'governed') {
            this.validateGovernedLevel(agent, errors, warnings);
        }
    }

    validateAdvancedLevel(agent, errors, warnings) {
        const spec = agent.spec;
        
        if (!spec.security) {
            warnings.push('Advanced level should include security configuration');
        }
        if (!spec.monitoring) {
            warnings.push('Advanced level should include monitoring configuration');
        }
        if (!spec.compliance) {
            warnings.push('Advanced level should include compliance configuration');
        }
        if (!spec.governance) {
            warnings.push('Advanced level should include governance configuration');
        }
    }

    validateGovernedLevel(agent, errors, warnings) {
        const spec = agent.spec;
        
        if (!spec.security) {
            warnings.push('Governed level should include security configuration');
        }
        if (!spec.monitoring) {
            warnings.push('Governed level should include monitoring configuration');
        }
    }

    validateDiscovery(agent, errors, warnings) {
        const spec = agent.spec;
        
        if (!spec.discovery) {
            warnings.push('Missing discovery section - required for UADP compatibility');
        } else {
            const discovery = spec.discovery;
            
            if (!discovery.uadp) {
                warnings.push('Missing UADP discovery configuration');
            } else {
                const uadp = discovery.uadp;
                
                if (!uadp.enabled) {
                    warnings.push('UADP discovery disabled - agents should be discoverable');
                }
                if (!uadp.tags || !Array.isArray(uadp.tags) || uadp.tags.length === 0) {
                    warnings.push('Missing or empty UADP tags - needed for capability discovery');
                }
            }
        }
    }

    /**
     * Generate summary report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('🏆 OSSA v0.1.2 VALIDATION SUMMARY');
        console.log('='.repeat(80));

        const totalAgents = this.validatedAgents.length;
        const validAgents = this.validatedAgents.filter(a => a.status === 'valid').length;
        const invalidAgents = this.validatedAgents.filter(a => a.status === 'invalid').length;

        console.log(`\n📊 Overall Results:`);
        console.log(`   Total Agents Processed: ${totalAgents}`);
        console.log(`   ✅ Valid Agents: ${validAgents}`);
        console.log(`   ❌ Invalid Agents: ${invalidAgents}`);
        console.log(`   📈 Compliance Rate: ${((validAgents / totalAgents) * 100).toFixed(1)}%`);

        // Conformance level breakdown
        const conformanceLevels = {};
        this.validatedAgents
            .filter(a => a.status === 'valid')
            .forEach(a => {
                const level = a.conformanceLevel || 'unknown';
                conformanceLevels[level] = (conformanceLevels[level] || 0) + 1;
            });

        console.log(`\n📋 Conformance Level Distribution:`);
        Object.entries(conformanceLevels).forEach(([level, count]) => {
            const emoji = level === 'advanced' ? '🥇' : level === 'governed' ? '🥈' : '🥉';
            console.log(`   ${emoji} ${level}: ${count} agents`);
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
        console.log(`   3. Enable UADP discovery for universal agent finding`);
        console.log(`   4. Consider upgrading core agents to governed/advanced levels`);

        console.log('\n' + '='.repeat(80));
        
        return {
            total: totalAgents,
            valid: validAgents,
            invalid: invalidAgents,
            complianceRate: (validAgents / totalAgents) * 100,
            conformanceLevels,
            errors: this.errors.length,
            warnings: this.warnings.length
        };
    }
}

// Main execution
function main() {
    const validator = new OSSAValidator();
    
    console.log('🚀 OSSA v0.1.2 Compliance Validator');
    console.log('Open Standards for Scalable Agents Validation Tool');
    
    // Find all agent.yml files
    const agentFiles = glob.sync('**/*agent*.yml', {
        ignore: ['node_modules/**', '**/node_modules/**']
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

export { OSSAValidator };
