#!/usr/bin/env tsx
/**
 * OSSA Legacy Format Converter v0.1.8
 * Backward Compatibility and Format Conversion Utilities
 *
 * Converts legacy agent configurations, custom formats, and proprietary
 * schemas to OSSA v0.1.8 compliant specifications
 */
import { Command } from 'commander';
interface ConversionOptions {
    sourceFormat?: 'auto' | 'json' | 'yaml' | 'toml' | 'properties' | 'custom';
    targetFormat?: 'yaml' | 'json';
    strict?: boolean;
    preserveComments?: boolean;
    verbose?: boolean;
    dryRun?: boolean;
    backup?: boolean;
}
interface ConversionResult {
    source: string;
    target?: string;
    status: 'success' | 'error' | 'warning';
    message?: string;
    format?: string;
    issues?: string[];
}
declare class LegacyFormatConverter {
    private results;
    private options;
    constructor(options?: ConversionOptions);
    /**
     * Convert legacy agent configuration
     */
    convertAgent(sourcePath: string, outputPath?: string): Promise<ConversionResult>;
    /**
     * Detect legacy format and version
     */
    private detectFormat;
    /**
     * Detect JSON format specifics
     */
    private detectJSONFormat;
    /**
     * Detect YAML format specifics
     */
    private detectYAMLFormat;
    /**
     * Parse source content based on detected format
     */
    private parseSource;
    /**
     * Simple TOML parser for basic configurations
     */
    private parseTOML;
    /**
     * Parse Java-style properties files
     */
    private parseProperties;
    /**
     * Transform legacy agent to OSSA v0.1.8 format
     */
    private transformToOSSA;
    /**
     * Transform metadata section
     */
    private transformMetadata;
    /**
     * Transform spec section
     */
    private transformSpec;
    /**
     * Extract agent name from legacy format
     */
    private extractName;
    /**
     * Extract version from legacy format
     */
    private extractVersion;
    /**
     * Extract description from legacy format
     */
    private extractDescription;
    /**
     * Extract expertise from legacy format
     */
    private extractExpertise;
    /**
     * Extract capabilities from legacy format
     */
    private extractCapabilities;
    /**
     * Extract tags for UADP discovery
     */
    private extractTags;
    /**
     * Validate conversion results
     */
    private validateConversion;
    /**
     * Generate output path based on source path
     */
    private generateOutputPath;
    /**
     * Write OSSA agent to file
     */
    private writeOSSAAgent;
    /**
     * Create backup of original file
     */
    private createBackup;
    /**
     * Generate conversion summary
     */
    generateSummary(): void;
}
/**
 * Create legacy converter commands
 */
export declare function createLegacyConverterCommands(): Command;
export { LegacyFormatConverter, ConversionOptions, ConversionResult };
