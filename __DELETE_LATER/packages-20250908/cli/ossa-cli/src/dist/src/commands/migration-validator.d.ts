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
interface ValidationOptions {
    strict?: boolean;
    checksum?: boolean;
    detailed?: boolean;
    failFast?: boolean;
    outputReport?: boolean;
    reportFormat?: 'json' | 'yaml' | 'html';
}
interface ValidationResult {
    file: string;
    status: 'valid' | 'invalid' | 'warning';
    score: number;
    issues: ValidationIssue[];
    metadata?: {
        ossaVersion?: string;
        migrationDate?: string;
        sourceVersion?: string;
    };
}
interface ValidationIssue {
    type: 'error' | 'warning' | 'info';
    code: string;
    message: string;
    field?: string;
    suggestion?: string;
}
interface RollbackOptions {
    backupDir?: string;
    force?: boolean;
    selective?: boolean;
    dryRun?: boolean;
}
declare class MigrationValidator {
    private validationResults;
    private options;
    constructor(options?: ValidationOptions);
    /**
     * Validate OSSA v0.1.8 compliance
     */
    validateOSSACompliance(filePath: string): Promise<ValidationResult>;
    /**
     * Validate core OSSA structure
     */
    private validateCoreStructure;
    /**
     * Validate metadata section
     */
    private validateMetadata;
    /**
     * Validate labels
     */
    private validateLabels;
    /**
     * Validate annotations
     */
    private validateAnnotations;
    /**
     * Validate spec section
     */
    private validateSpec;
    /**
     * Validate API-first approach compliance
     */
    private validateAPIFirst;
    /**
     * Validate discovery configuration
     */
    private validateDiscovery;
    /**
     * Validate strict compliance (advanced tier requirements)
     */
    private validateStrictCompliance;
    /**
     * Calculate validation score and status
     */
    private calculateValidationScore;
    /**
     * Generate validation report
     */
    generateReport(outputPath?: string): Promise<void>;
    /**
     * Generate summary statistics
     */
    private generateSummary;
    /**
     * Generate HTML report
     */
    private generateHTMLReport;
    /**
     * Display console summary
     */
    displaySummary(): void;
}
/**
 * Rollback Manager
 */
declare class RollbackManager {
    private rollbackLog;
    /**
     * Create rollback entry
     */
    createRollbackEntry(originalPath: string, backupPath: string): Promise<void>;
    /**
     * Execute rollback
     */
    executeRollback(options?: RollbackOptions): Promise<void>;
    /**
     * Selective rollback interface
     */
    private selectiveRollback;
    /**
     * Perform rollback operation
     */
    private performRollback;
    /**
     * Load rollback data
     */
    private loadRollbackData;
    /**
     * Calculate file checksum
     */
    private calculateChecksum;
    /**
     * Extract metadata from file
     */
    private extractMetadata;
}
/**
 * Create migration validation commands
 */
export declare function createMigrationValidatorCommands(): Command;
export { MigrationValidator, RollbackManager, ValidationOptions, ValidationResult };
