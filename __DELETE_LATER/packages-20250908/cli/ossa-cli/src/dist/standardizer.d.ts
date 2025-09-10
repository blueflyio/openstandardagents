#!/usr/bin/env node
/**
 * OSSA v0.1.8 Agent Standardization System
 * Processes 47 .agents directories with proper branching strategy
 */
interface ProjectInfo {
    path: string;
    name: string;
    type: 'drupal-module' | 'npm-package' | 'ai-model' | 'platform';
    currentBranch: string;
    agentsDirPath: string;
    existingAgents: string[];
}
export declare class OSSAStandardizer {
    private workspaceRoot;
    private projects;
    private git;
    private branchPrefix;
    constructor(workspaceRoot?: string);
    discoverProjects(): Promise<ProjectInfo[]>;
    private extractProjectName;
    private determineProjectType;
    private listExistingAgents;
    standardizeAll(): Promise<void>;
    standardizeOneByName(projectName: string): Promise<void>;
    getProjectInfoByName(projectName: string): Promise<ProjectInfo | null>;
    private createBatches;
    private processBatch;
    private standardizeProject;
    private createFeatureBranch;
    private cleanupProject;
    private generateAgentTemplates;
    private determineTier;
    private determineDomain;
    private determinePurpose;
    private generateProjectContext;
    private generateCoreDescription;
    private generateIntegrationDescription;
    private generateTroubleshootDescription;
    private generateCoreExpertise;
    private generateIntegrationExpertise;
    private generateTroubleshootExpertise;
    private generateCoreCapabilities;
    private generateIntegrationCapabilities;
    private generateTroubleshootCapabilities;
    private generateIntegrationPoints;
    private generateFrameworkSupport;
    private createAgentStructure;
    private generateAgentReadme;
    private generateAdvancedOSSAFile;
    private commitChanges;
    private titleCase;
    private resolveProjectByName;
}
export {};
