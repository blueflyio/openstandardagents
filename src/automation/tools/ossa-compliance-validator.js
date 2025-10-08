#!/usr/bin/env node

/**
 * OSSA v0.1.9+ Gold Compliance Validator
 * Automated validation and monitoring for LLM Platform projects
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

const REQUIRED_OSSA_VERSION = '0.1.9';
const COMPLIANCE_THRESHOLD = 95; // Gold standard requires 95%+

class OSSAComplianceValidator {
    constructor() {
        this.results = {
            total: 0,
            compliant: 0,
            violations: [],
            warnings: [],
            passed: []
        };
    }

    async validateProject(projectPath) {
        console.log(chalk.blue(`\n🔍 Validating: ${projectPath}`));

        const validation = {
            project: projectPath,
            score: 0,
            maxScore: 100,
            issues: [],
            status: 'unknown'
        };

        // Check for OSSA configuration
        const ossaFiles = [
            join(projectPath, 'ossa.yaml'),
            join(projectPath, '.ossa.yaml'),
            join(projectPath, 'ossa.config.yaml')
        ];

        let ossaConfig = null;
        for (const file of ossaFiles) {
            if (existsSync(file)) {
                try {
                    ossaConfig = yaml.load(readFileSync(file, 'utf8'));
                    validation.score += 20; // OSSA config exists
                    break;
                } catch (error) {
                    validation.issues.push(`Invalid OSSA YAML: ${error.message}`);
                }
            }
        }

        if (!ossaConfig) {
            validation.issues.push('❌ CRITICAL: Missing OSSA configuration file');
            validation.status = 'failed';
            this.results.violations.push(validation);
            return validation;
        }

        // Validate OSSA version
        const ossaVersion = ossaConfig.ossa?.version || ossaConfig.version;
        if (!ossaVersion) {
            validation.issues.push('❌ CRITICAL: OSSA version not specified');
        } else if (ossaVersion < REQUIRED_OSSA_VERSION) {
            validation.issues.push(`❌ CRITICAL: Outdated OSSA version ${ossaVersion}, requires ${REQUIRED_OSSA_VERSION}+`);
        } else {
            validation.score += 25; // Correct OSSA version
        }

        // Check package.json compliance
        const packageJsonPath = join(projectPath, 'package.json');
        if (existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
                validation.score += 15; // Package.json exists

                // Check for security dependencies
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps['@bluefly/open-standards-scalable-agents']) {
                    validation.score += 10; // OSSA dependency
                }

                // Check for security audit scripts
                if (packageJson.scripts && packageJson.scripts['security:audit']) {
                    validation.score += 10; // Security audit script
                }
            } catch (error) {
                validation.issues.push(`Invalid package.json: ${error.message}`);
            }
        }

        // Validate security configuration
        if (ossaConfig.security) {
            validation.score += 15; // Security config present

            if (ossaConfig.security.vulnerability_scanning || ossaConfig.security.scan_enabled) {
                validation.score += 5; // Vulnerability scanning enabled
            }
        }

        // Validate governance settings
        if (ossaConfig.governance || ossaConfig.compliance) {
            validation.score += 10; // Governance config present

            const governance = ossaConfig.governance || ossaConfig.compliance;
            if (governance.audit_enabled || governance.audit_frequency) {
                validation.score += 5; // Audit enabled
            }
        }

        // Determine status
        const percentage = (validation.score / validation.maxScore) * 100;
        if (percentage >= COMPLIANCE_THRESHOLD) {
            validation.status = 'compliant';
            this.results.compliant++;
            this.results.passed.push(validation);
            console.log(chalk.green(`✅ COMPLIANT (${percentage.toFixed(1)}%)`));
        } else if (percentage >= 70) {
            validation.status = 'warning';
            this.results.warnings.push(validation);
            console.log(chalk.yellow(`⚠️ PARTIAL (${percentage.toFixed(1)}%)`));
        } else {
            validation.status = 'failed';
            this.results.violations.push(validation);
            console.log(chalk.red(`❌ FAILED (${percentage.toFixed(1)}%)`));
        }

        this.results.total++;
        return validation;
    }

    async scanAllProjects() {
        console.log(chalk.bold.blue('🔒 OSSA v0.1.9+ Gold Compliance Validator\n'));

        const projectDirs = [
            'OSSA',
            'agent_buildkit',
            'llm-platform',
            'common_npm/agent-brain',
            'common_npm/agent-chat',
            'common_npm/agent-mesh',
            'common_npm/agent-ops',
            'common_npm/agent-protocol',
            'common_npm/agent-router',
            'common_npm/agent-studio',
            'common_npm/agent-tracer',
            'common_npm/agentic-flows',
            'common_npm/compliance-engine',
            'common_npm/doc-engine',
            'common_npm/foundation-bridge',
            'common_npm/rfp-automation',
            'common_npm/studio-ui',
            'common_npm/workflow-engine'
        ];

        for (const dir of projectDirs) {
            const fullPath = join(process.cwd(), dir);
            if (existsSync(fullPath)) {
                await this.validateProject(fullPath);
            } else {
                console.log(chalk.gray(`⏭️ Skipping: ${dir} (not found)`));
            }
        }
    }

    generateReport() {
        const compliance = (this.results.compliant / this.results.total) * 100;
        const timestamp = new Date().toISOString();

        const report = {
            metadata: {
                timestamp,
                validator_version: '1.0.0',
                ossa_requirement: REQUIRED_OSSA_VERSION,
                gold_threshold: COMPLIANCE_THRESHOLD
            },
            summary: {
                total_projects: this.results.total,
                compliant_projects: this.results.compliant,
                compliance_percentage: Math.round(compliance * 100) / 100,
                gold_certification: compliance >= COMPLIANCE_THRESHOLD ? 'ELIGIBLE' : 'DENIED'
            },
            violations: this.results.violations,
            warnings: this.results.warnings,
            compliant: this.results.passed
        };

        // Write detailed report
        const reportPath = `.audit-reports/ossa-compliance-${new Date().toISOString().split('T')[0]}.json`;
        writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Console summary
        console.log(chalk.bold('\n📊 COMPLIANCE SUMMARY'));
        console.log(`Total Projects: ${this.results.total}`);
        console.log(`Compliant: ${chalk.green(this.results.compliant)}`);
        console.log(`Warnings: ${chalk.yellow(this.results.warnings.length)}`);
        console.log(`Violations: ${chalk.red(this.results.violations.length)}`);
        console.log(`Compliance Rate: ${compliance.toFixed(1)}%`);

        if (compliance >= COMPLIANCE_THRESHOLD) {
            console.log(chalk.bold.green('\n🏆 GOLD CERTIFICATION: ELIGIBLE'));
        } else {
            console.log(chalk.bold.red('\n🚫 GOLD CERTIFICATION: DENIED'));
            console.log(chalk.red(`Required: ${COMPLIANCE_THRESHOLD}% | Actual: ${compliance.toFixed(1)}%`));
        }

        console.log(`\n📄 Detailed report: ${reportPath}`);
        return report;
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new OSSAComplianceValidator();

    validator.scanAllProjects()
        .then(() => validator.generateReport())
        .catch(error => {
            console.error(chalk.red('❌ Validation failed:'), error);
            process.exit(1);
        });
}

export default OSSAComplianceValidator;