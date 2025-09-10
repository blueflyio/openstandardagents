#!/usr/bin/env node
/**
 * OAAS Migration Tool
 * Helps migrate existing single-agent systems to OAAS standard
 */
interface MigrationOptions {
    source: string;
    output: string;
    framework: string;
    level: 'minimal' | 'basic' | 'integration' | 'production' | 'enterprise';
    interactive: boolean;
}
declare class OAASMigrator {
    private options;
    constructor(options: MigrationOptions);
    /**
     * Main migration entry point
     */
    migrate(): Promise<void>;
    /**
     * Detect the source framework/format
     */
    private detectSourceType;
    /**
     * Extract agent information from source
     */
    private extractAgentInfo;
    private extractLangChainAgent;
    private extractCrewAIAgent;
    private extractMCPAgent;
    private extractAutoGenAgent;
    private extractOpenAIAgent;
    private extractCustomAgent;
    /**
     * Convert extracted info to OAAS format
     */
    private convertToOAAS;
    private createMinimalAgent;
    private createBasicAgent;
    private createIntegrationAgent;
    private createProductionAgent;
    private createEnterpriseAgent;
    private generateFrameworkConfig;
    private getFrameworkSpecificConfig;
    /**
     * Generate OAAS files structure
     */
    private generateOAASFiles;
    private generateOpenAPISpec;
    private generatePaths;
    private generateSchemas;
    private generateExamples;
    private generateTrainingData;
    private generateReadme;
    private generateMigrationReport;
    private validateMigration;
    private kebabCase;
    private pascalCase;
    private titleCase;
    private getNextLevel;
}
export { OAASMigrator };
