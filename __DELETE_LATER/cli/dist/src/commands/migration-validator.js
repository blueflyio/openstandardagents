#!/usr/bin/env tsx
/**
 * OSSA Migration Validator v0.1.8
 * Comprehensive validation and rollback system for OSSA migrations
 *
 * Features:
 * - Pre-migration validation
 * - Post-migration validation
 * - Rollback capabilities
 * - Compliance checking
 * - Migration integrity verification
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
import ora from 'ora';
import inquirer from 'inquirer';
import crypto from 'crypto';
class MigrationValidator {
    constructor(options = {}) {
        this.validationResults = [];
        this.options = {
            strict: false,
            checksum: true,
            detailed: true,
            failFast: false,
            outputReport: true,
            reportFormat: 'json',
            ...options
        };
    }
    /**
     * Validate OSSA v0.1.8 compliance
     */
    async validateOSSACompliance(filePath) {
        const spinner = ora(`Validating ${path.basename(filePath)}...`).start();
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const agent = yaml.load(content);
            const result = {
                file: filePath,
                status: 'valid',
                score: 100,
                issues: [],
                metadata: {
                    ossaVersion: agent.ossa,
                    migrationDate: agent.metadata?.annotations?.['ossa.io/migration-date'],
                    sourceVersion: agent.metadata?.annotations?.['ossa.io/source-version']
                }
            };
            // Core OSSA v0.1.8 validation
            this.validateCoreStructure(agent, result);
            this.validateMetadata(agent, result);
            this.validateSpec(agent, result);
            this.validateAPIFirst(agent, result);
            this.validateDiscovery(agent, result);
            // Advanced validations
            if (this.options.strict) {
                this.validateStrictCompliance(agent, result);
            }
            // Calculate final score and status
            this.calculateValidationScore(result);
            spinner.succeed(`Validated ${path.basename(filePath)} (${result.status})`);
            this.validationResults.push(result);
            return result;
        }
        catch (error) {
            spinner.fail(`Failed to validate ${path.basename(filePath)}`);
            const result = {
                file: filePath,
                status: 'invalid',
                score: 0,
                issues: [{
                        type: 'error',
                        code: 'PARSE_ERROR',
                        message: error instanceof Error ? error.message : 'Parse error'
                    }]
            };
            this.validationResults.push(result);
            return result;
        }
    }
    /**
     * Validate core OSSA structure
     */
    validateCoreStructure(agent, result) {
        // OSSA version identifier
        if (!agent.ossa) {
            result.issues.push({
                type: 'error',
                code: 'MISSING_OSSA_VERSION',
                message: 'Missing required ossa version identifier',
                suggestion: 'Add "ossa: 0.1.8" at root level'
            });
        }
        else if (agent.ossa !== '0.1.8') {
            result.issues.push({
                type: 'error',
                code: 'INVALID_OSSA_VERSION',
                message: `Invalid OSSA version: ${agent.ossa}`,
                suggestion: 'Set "ossa: 0.1.8" for current version'
            });
        }
        // Required root sections
        if (!agent.metadata) {
            result.issues.push({
                type: 'error',
                code: 'MISSING_METADATA',
                message: 'Missing required metadata section'
            });
        }
        if (!agent.spec) {
            result.issues.push({
                type: 'error',
                code: 'MISSING_SPEC',
                message: 'Missing required spec section'
            });
        }
        // Deprecated fields check
        if (agent.apiVersion) {
            result.issues.push({
                type: 'warning',
                code: 'DEPRECATED_API_VERSION',
                message: 'Deprecated apiVersion field found',
                suggestion: 'Remove apiVersion, use ossa version identifier instead'
            });
        }
        if (agent.kind) {
            result.issues.push({
                type: 'warning',
                code: 'DEPRECATED_KIND',
                message: 'Deprecated kind field found',
                suggestion: 'Remove kind field, no longer required in v0.1.8'
            });
        }
    }
    /**
     * Validate metadata section
     */
    validateMetadata(agent, result) {
        const metadata = agent.metadata;
        if (!metadata)
            return;
        // Required fields
        if (!metadata.name) {
            result.issues.push({
                type: 'error',
                code: 'MISSING_NAME',
                message: 'Missing required metadata.name',
                field: 'metadata.name'
            });
        }
        else if (!/^[a-z0-9-_]+$/.test(metadata.name)) {
            result.issues.push({
                type: 'error',
                code: 'INVALID_NAME_FORMAT',
                message: 'Agent name must be lowercase alphanumeric with hyphens/underscores only',
                field: 'metadata.name',
                suggestion: 'Use format: my-agent-name'
            });
        }
        if (!metadata.version) {
            result.issues.push({
                type: 'error',
                code: 'MISSING_VERSION',
                message: 'Missing required metadata.version',
                field: 'metadata.version'
            });
        }
        else if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
            result.issues.push({
                type: 'warning',
                code: 'INVALID_VERSION_FORMAT',
                message: 'Version should follow semantic versioning (x.y.z)',
                field: 'metadata.version'
            });
        }
        // Labels validation
        if (!metadata.labels) {
            result.issues.push({
                type: 'warning',
                code: 'MISSING_LABELS',
                message: 'Missing recommended labels section',
                suggestion: 'Add labels for tier, domain classification'
            });
        }
        else {
            this.validateLabels(metadata.labels, result);
        }
        // Annotations validation
        if (!metadata.annotations) {
            result.issues.push({
                type: 'info',
                code: 'MISSING_ANNOTATIONS',
                message: 'No annotations found',
                suggestion: 'Consider adding OSSA-specific annotations'
            });
        }
        else {
            this.validateAnnotations(metadata.annotations, result);
        }
    }
    /**
     * Validate labels
     */
    validateLabels(labels, result) {
        if (!labels.tier) {
            result.issues.push({
                type: 'warning',
                code: 'MISSING_TIER_LABEL',
                message: 'Missing recommended tier label',
                suggestion: 'Add tier: core|governed|advanced'
            });
        }
        else if (!['core', 'governed', 'advanced'].includes(labels.tier)) {
            result.issues.push({
                type: 'error',
                code: 'INVALID_TIER_LABEL',
                message: `Invalid tier: ${labels.tier}`,
                suggestion: 'Use tier: core|governed|advanced'
            });
        }
        if (!labels.domain) {
            result.issues.push({
                type: 'info',
                code: 'MISSING_DOMAIN_LABEL',
                message: 'Missing domain label for categorization'
            });
        }
    }
    /**
     * Validate annotations
     */
    validateAnnotations(annotations, result) {
        // Migration-specific annotations
        const migrationAnnotations = [
            'ossa.io/migration-date',
            'ossa.io/source-version',
            'ossa.io/migration-tool'
        ];
        migrationAnnotations.forEach(annotation => {
            if (!annotations[annotation]) {
                result.issues.push({
                    type: 'info',
                    code: 'MISSING_MIGRATION_ANNOTATION',
                    message: `Missing migration annotation: ${annotation}`
                });
            }
        });
    }
    /**
     * Validate spec section
     */
    validateSpec(agent, result) {
        const spec = agent.spec;
        if (!spec)
            return;
        // Agent identity
        if (!spec.agent) {
            result.issues.push({
                type: 'warning',
                code: 'MISSING_AGENT_SPEC',
                message: 'Missing agent identity section'
            });
        }
        // Capabilities
        if (!spec.capabilities) {
            result.issues.push({
                type: 'error',
                code: 'MISSING_CAPABILITIES',
                message: 'Missing required capabilities section'
            });
        }
        else if (!Array.isArray(spec.capabilities) || spec.capabilities.length === 0) {
            result.issues.push({
                type: 'warning',
                code: 'EMPTY_CAPABILITIES',
                message: 'No capabilities defined'
            });
        }
        // Frameworks (recommended)
        if (!spec.frameworks) {
            result.issues.push({
                type: 'info',
                code: 'MISSING_FRAMEWORKS',
                message: 'No frameworks specified',
                suggestion: 'Consider adding supported frameworks'
            });
        }
    }
    /**
     * Validate API-first approach compliance
     */
    validateAPIFirst(agent, result) {
        const spec = agent.spec;
        if (!spec)
            return;
        // API configuration
        if (!spec.api) {
            result.issues.push({
                type: 'error',
                code: 'MISSING_API_CONFIG',
                message: 'Missing API configuration - required for API-first approach',
                suggestion: 'Add spec.api section with OpenAPI configuration'
            });
        }
        else {
            if (!spec.api.version) {
                result.issues.push({
                    type: 'warning',
                    code: 'MISSING_API_VERSION',
                    message: 'Missing API version specification'
                });
            }
            else if (!spec.api.version.startsWith('3.')) {
                result.issues.push({
                    type: 'warning',
                    code: 'OLD_API_VERSION',
                    message: 'Consider upgrading to OpenAPI 3.1+',
                    suggestion: 'Use OpenAPI 3.1.0 for best compatibility'
                });
            }
            if (!spec.api.enabled) {
                result.issues.push({
                    type: 'warning',
                    code: 'API_DISABLED',
                    message: 'API is disabled - not following API-first approach'
                });
            }
        }
        // Operations mapping
        if (spec.capabilities && !spec.operations) {
            result.issues.push({
                type: 'info',
                code: 'MISSING_OPERATIONS',
                message: 'Capabilities not mapped to API operations',
                suggestion: 'Add operations section for API-first design'
            });
        }
    }
    /**
     * Validate discovery configuration
     */
    validateDiscovery(agent, result) {
        const spec = agent.spec;
        if (!spec)
            return;
        if (!spec.discovery) {
            result.issues.push({
                type: 'warning',
                code: 'MISSING_DISCOVERY',
                message: 'Missing discovery configuration',
                suggestion: 'Add discovery section for UADP compatibility'
            });
            return;
        }
        const discovery = spec.discovery;
        // UADP configuration
        if (!discovery.uadp) {
            result.issues.push({
                type: 'warning',
                code: 'MISSING_UADP',
                message: 'Missing UADP discovery configuration'
            });
        }
        else {
            if (!discovery.uadp.enabled) {
                result.issues.push({
                    type: 'info',
                    code: 'UADP_DISABLED',
                    message: 'UADP discovery is disabled'
                });
            }
            if (!discovery.uadp.tags || discovery.uadp.tags.length === 0) {
                result.issues.push({
                    type: 'warning',
                    code: 'MISSING_UADP_TAGS',
                    message: 'No UADP tags specified',
                    suggestion: 'Add tags for better discoverability'
                });
            }
        }
        // API discovery endpoint
        if (!discovery.api) {
            result.issues.push({
                type: 'info',
                code: 'MISSING_API_DISCOVERY',
                message: 'No API discovery endpoint configured',
                suggestion: 'Add API discovery for API-first approach'
            });
        }
    }
    /**
     * Validate strict compliance (advanced tier requirements)
     */
    validateStrictCompliance(agent, result) {
        const spec = agent.spec;
        const tier = agent.metadata?.labels?.tier;
        if (tier === 'advanced') {
            // Advanced tier requirements
            const requiredSections = ['security', 'monitoring', 'compliance', 'governance'];
            requiredSections.forEach(section => {
                if (!spec[section]) {
                    result.issues.push({
                        type: 'error',
                        code: `MISSING_${section.toUpperCase()}`,
                        message: `Advanced tier requires ${section} configuration`,
                        suggestion: `Add spec.${section} section`
                    });
                }
            });
        }
        else if (tier === 'governed') {
            // Governed tier requirements
            const requiredSections = ['security', 'monitoring'];
            requiredSections.forEach(section => {
                if (!spec[section]) {
                    result.issues.push({
                        type: 'warning',
                        code: `MISSING_${section.toUpperCase()}`,
                        message: `Governed tier should include ${section} configuration`
                    });
                }
            });
        }
    }
    /**
     * Calculate validation score and status
     */
    calculateValidationScore(result) {
        let score = 100;
        let hasErrors = false;
        result.issues.forEach(issue => {
            switch (issue.type) {
                case 'error':
                    score -= 20;
                    hasErrors = true;
                    break;
                case 'warning':
                    score -= 5;
                    break;
                case 'info':
                    score -= 1;
                    break;
            }
        });
        result.score = Math.max(0, score);
        if (hasErrors) {
            result.status = 'invalid';
        }
        else if (result.issues.some(i => i.type === 'warning')) {
            result.status = 'warning';
        }
        else {
            result.status = 'valid';
        }
    }
    /**
     * Generate validation report
     */
    async generateReport(outputPath) {
        const report = {
            timestamp: new Date().toISOString(),
            tool: 'ossa-migration-validator-v0.1.8',
            summary: this.generateSummary(),
            results: this.validationResults
        };
        if (outputPath) {
            await fs.ensureDir(path.dirname(outputPath));
            const ext = path.extname(outputPath).toLowerCase();
            let content;
            if (ext === '.json') {
                content = JSON.stringify(report, null, 2);
            }
            else if (ext === '.html') {
                content = this.generateHTMLReport(report);
            }
            else {
                content = yaml.dump(report, { indent: 2 });
            }
            await fs.writeFile(outputPath, content, 'utf8');
            console.log(chalk.cyan(`📊 Report saved: ${outputPath}`));
        }
    }
    /**
     * Generate summary statistics
     */
    generateSummary() {
        const total = this.validationResults.length;
        const valid = this.validationResults.filter(r => r.status === 'valid').length;
        const warnings = this.validationResults.filter(r => r.status === 'warning').length;
        const invalid = this.validationResults.filter(r => r.status === 'invalid').length;
        const avgScore = this.validationResults.reduce((sum, r) => sum + r.score, 0) / total;
        const totalIssues = this.validationResults.reduce((sum, r) => sum + r.issues.length, 0);
        const errorCount = this.validationResults.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0);
        const warningCount = this.validationResults.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'warning').length, 0);
        return {
            total,
            valid,
            warnings,
            invalid,
            complianceRate: (valid / total) * 100,
            averageScore: Math.round(avgScore),
            totalIssues,
            errorCount,
            warningCount
        };
    }
    /**
     * Generate HTML report
     */
    generateHTMLReport(report) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>OSSA Migration Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .valid { border-left: 5px solid #4CAF50; }
        .warning { border-left: 5px solid #FF9800; }
        .invalid { border-left: 5px solid #f44336; }
        .issue { margin: 5px 0; padding: 8px; border-radius: 3px; }
        .error { background: #ffebee; }
        .warn { background: #fff8e1; }
        .info { background: #e3f2fd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>OSSA Migration Validation Report</h1>
        <p>Generated: ${report.timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total files: ${report.summary.total}</p>
        <p>Valid: ${report.summary.valid} (${report.summary.complianceRate.toFixed(1)}%)</p>
        <p>Warnings: ${report.summary.warnings}</p>
        <p>Invalid: ${report.summary.invalid}</p>
        <p>Average score: ${report.summary.averageScore}/100</p>
    </div>
    
    <div class="results">
        ${report.results.map((result) => `
            <div class="result ${result.status}">
                <h3>${path.basename(result.file)} (Score: ${result.score}/100)</h3>
                ${result.issues.map((issue) => `
                    <div class="issue ${issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warn' : 'info'}">
                        <strong>${issue.type.toUpperCase()}:</strong> ${issue.message}
                        ${issue.suggestion ? `<br><em>Suggestion: ${issue.suggestion}</em>` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }
    /**
     * Display console summary
     */
    displaySummary() {
        const summary = this.generateSummary();
        console.log('\n' + chalk.blue('═'.repeat(60)));
        console.log(chalk.blue.bold('✅ Migration Validation Summary'));
        console.log(chalk.blue('═'.repeat(60)));
        console.log(chalk.cyan('\n📊 Results:'));
        console.log(`   Total files: ${summary.total}`);
        console.log(chalk.green(`   ✅ Valid: ${summary.valid} (${summary.complianceRate.toFixed(1)}%)`));
        console.log(chalk.yellow(`   ⚠️  With warnings: ${summary.warnings}`));
        console.log(chalk.red(`   ❌ Invalid: ${summary.invalid}`));
        console.log(`   📈 Average score: ${summary.averageScore}/100`);
        console.log(chalk.cyan('\n📋 Issues:'));
        console.log(chalk.red(`   Errors: ${summary.errorCount}`));
        console.log(chalk.yellow(`   Warnings: ${summary.warningCount}`));
        console.log(`   Total: ${summary.totalIssues}`);
        console.log(chalk.blue('\n═'.repeat(60)));
    }
}
/**
 * Rollback Manager
 */
class RollbackManager {
    constructor() {
        this.rollbackLog = '.ossa-rollback.json';
    }
    /**
     * Create rollback entry
     */
    async createRollbackEntry(originalPath, backupPath) {
        const checksum = await this.calculateChecksum(originalPath);
        const entry = {
            timestamp: new Date().toISOString(),
            source: originalPath,
            backup: backupPath,
            checksum,
            metadata: await this.extractMetadata(originalPath)
        };
        const rollbackData = await this.loadRollbackData();
        rollbackData.entries = rollbackData.entries || [];
        rollbackData.entries.push(entry);
        await fs.writeFile(this.rollbackLog, JSON.stringify(rollbackData, null, 2));
    }
    /**
     * Execute rollback
     */
    async executeRollback(options = {}) {
        const rollbackData = await this.loadRollbackData();
        if (!rollbackData.entries || rollbackData.entries.length === 0) {
            throw new Error('No rollback entries found');
        }
        console.log(chalk.yellow(`Found ${rollbackData.entries.length} entries to rollback`));
        if (options.selective) {
            const selected = await this.selectiveRollback(rollbackData.entries);
            await this.performRollback(selected, options);
        }
        else {
            await this.performRollback(rollbackData.entries, options);
        }
    }
    /**
     * Selective rollback interface
     */
    async selectiveRollback(entries) {
        const choices = entries.map(entry => ({
            name: `${path.basename(entry.source)} (${entry.timestamp})`,
            value: entry,
            checked: false
        }));
        const { selected } = await inquirer.prompt([{
                type: 'checkbox',
                name: 'selected',
                message: 'Select files to rollback:',
                choices
            }]);
        return selected;
    }
    /**
     * Perform rollback operation
     */
    async performRollback(entries, options) {
        for (const entry of entries) {
            const spinner = ora(`Rolling back ${path.basename(entry.source)}...`).start();
            try {
                if (options.dryRun) {
                    spinner.succeed(`Would rollback ${path.basename(entry.source)}`);
                    continue;
                }
                // Verify backup exists
                if (!await fs.pathExists(entry.backup)) {
                    spinner.fail(`Backup not found: ${entry.backup}`);
                    continue;
                }
                // Verify checksum if available
                if (entry.checksum) {
                    const backupChecksum = await this.calculateChecksum(entry.backup);
                    if (backupChecksum !== entry.checksum) {
                        spinner.warn(`Checksum mismatch for ${path.basename(entry.source)}`);
                        if (!options.force) {
                            const { proceed } = await inquirer.prompt([{
                                    type: 'confirm',
                                    name: 'proceed',
                                    message: 'Backup checksum mismatch. Continue anyway?',
                                    default: false
                                }]);
                            if (!proceed) {
                                spinner.fail('Rollback cancelled due to checksum mismatch');
                                continue;
                            }
                        }
                    }
                }
                // Restore from backup
                await fs.copy(entry.backup, entry.source);
                spinner.succeed(`Rolled back ${path.basename(entry.source)}`);
            }
            catch (error) {
                spinner.fail(`Failed to rollback ${path.basename(entry.source)}: ${error}`);
            }
        }
    }
    /**
     * Load rollback data
     */
    async loadRollbackData() {
        try {
            if (await fs.pathExists(this.rollbackLog)) {
                const content = await fs.readFile(this.rollbackLog, 'utf8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            // Ignore errors and return empty data
        }
        return { entries: [] };
    }
    /**
     * Calculate file checksum
     */
    async calculateChecksum(filePath) {
        const content = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    /**
     * Extract metadata from file
     */
    async extractMetadata(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = yaml.load(content);
            return {
                name: data.metadata?.name,
                version: data.metadata?.version,
                ossaVersion: data.ossa
            };
        }
        catch {
            return {};
        }
    }
}
/**
 * Create migration validation commands
 */
export function createMigrationValidatorCommands() {
    const validator = new Command('migration-validator')
        .description('Validate and rollback OSSA migrations');
    // Validate command
    validator
        .command('validate [pattern]')
        .description('Validate OSSA v0.1.8 compliance')
        .option('--strict', 'Enable strict validation mode')
        .option('--no-checksum', 'Skip checksum verification')
        .option('--detailed', 'Show detailed validation results')
        .option('--fail-fast', 'Stop on first validation error')
        .option('-r, --report <path>', 'Generate validation report')
        .option('-f, --format <format>', 'Report format (json|yaml|html)', 'json')
        .option('-v, --verbose', 'Verbose output')
        .action(async (pattern = '**/*agent*.{yml,yaml}', options) => {
        console.log(chalk.blue.bold('✅ OSSA Migration Validator'));
        console.log(chalk.gray(`Validating pattern: ${pattern}\n`));
        try {
            const files = await glob(pattern, {
                ignore: ['**/node_modules/**', '**/__DELETE_LATER/**']
            });
            if (files.length === 0) {
                console.log(chalk.yellow('No files found matching pattern.'));
                return;
            }
            const validationTool = new MigrationValidator({
                strict: options.strict,
                checksum: options.checksum,
                detailed: options.detailed,
                failFast: options.failFast,
                reportFormat: options.format
            });
            console.log(`Found ${files.length} files to validate`);
            for (const file of files) {
                const result = await validationTool.validateOSSACompliance(file);
                if (options.failFast && result.status === 'invalid') {
                    console.log(chalk.red('\nValidation failed. Stopping due to --fail-fast'));
                    break;
                }
            }
            validationTool.displaySummary();
            if (options.report) {
                await validationTool.generateReport(options.report);
            }
        }
        catch (error) {
            console.error(chalk.red('Validation failed:'), error);
            process.exit(1);
        }
    });
    // Rollback command
    validator
        .command('rollback')
        .description('Rollback previous migration using backups')
        .option('--backup-dir <dir>', 'Backup directory', '.ossa-migration-backup')
        .option('--selective', 'Select specific files to rollback')
        .option('--force', 'Force rollback without confirmation')
        .option('-d, --dry-run', 'Preview rollback without making changes')
        .action(async (options) => {
        console.log(chalk.yellow.bold('⏪ OSSA Migration Rollback'));
        try {
            const rollbackManager = new RollbackManager();
            await rollbackManager.executeRollback(options);
            console.log(chalk.green('\n✅ Rollback completed successfully'));
        }
        catch (error) {
            console.error(chalk.red('Rollback failed:'), error);
            process.exit(1);
        }
    });
    return validator;
}
export { MigrationValidator, RollbackManager };
