#!/usr/bin/env tsx
/**
 * OSSA Migration Tools v0.1.8
 * Comprehensive migration utilities for transitioning from OSSA v0.1.2 to v0.1.8
 *
 * Features:
 * - Agent configuration migration
 * - Schema transformation to API-first approach
 * - Legacy format conversion
 * - Validation and rollback capabilities
 */
import { Command } from 'commander';
interface MigrationOptions {
    dryRun?: boolean;
    backup?: boolean;
    force?: boolean;
    verbose?: boolean;
    outputDir?: string;
    pattern?: string;
}
interface MigrationResult {
    source: string;
    target: string;
    status: 'success' | 'error' | 'skipped';
    message?: string;
    changes?: string[];
}
declare class OSSAMigrationTool {
    private options;
    private results;
    private backupDir;
    constructor(options?: MigrationOptions);
    /**
     * Main migration orchestration
     */
    migrate(sourcePath: string): Promise<MigrationResult[]>;
    /**
     * Migrate individual agent configuration
     */
    private migrateAgent;
    /**
     * Transform agent from v0.1.2 to v0.1.8 format
     */
    private transformAgent;
    /**
     * Transform spec section for v0.1.8 API-first approach
     */
    private transformSpec;
    /**
     * Generate default API endpoints based on agent capabilities
     */
    private generateDefaultEndpoints;
    /**
     * Generate OpenAPI operation ID from capability name
     */
    private generateOperationId;
    /**
     * Convert string to kebab-case
     */
    private kebabCase;
    /**
     * Check if agent needs migration
     */
    private needsMigration;
    /**
     * Detect changes between original and migrated agent
     */
    private detectChanges;
    /**
     * Find agent files to migrate
     */
    private findAgentFiles;
    /**
     * Create backup of original file
     */
    private createBackup;
    /**
     * Ensure backup directory exists
     */
    private ensureBackupDir;
    /**
     * Generate migration summary
     */
    generateSummary(): void;
    /**
     * Rollback migration using backups
     */
    rollback(): Promise<void>;
}
/**
 * Create migration command
 */
export declare function createMigrationCommands(): Command;
export { OSSAMigrationTool, MigrationOptions, MigrationResult };
