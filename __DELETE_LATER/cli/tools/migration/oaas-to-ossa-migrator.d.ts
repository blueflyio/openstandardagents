/**
 * OAAS to OSSA Migration Tool
 * Converts existing OAAS agents to the new OSSA canonical resource model
 */
export declare class OAASToOSSAMigrator {
    private options;
    private readonly ossaVersion;
    constructor(options: {
        workspace: string;
        dryRun?: boolean;
        backup?: boolean;
        targetLevel?: 'core' | 'governed' | 'advanced';
        preserveOriginal?: boolean;
    });
    migrateWorkspace(): Promise<void>;
    private findAgentFiles;
    private migrateAgent;
    private determineConformanceLevel;
    private convertToOSSA;
    private sanitizeName;
    private extractDomain;
    private convertCapabilities;
    private convertFrameworks;
    private generateTags;
    private inferPathType;
    private addGovernedFeatures;
    private addAdvancedFeatures;
    private convertSecurity;
    private generateMigrationReport;
}
export { OAASToOSSAMigrator };
