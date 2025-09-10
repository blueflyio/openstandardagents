export declare const manageBackups: () => Promise<void>;
export declare const manageTemplates: () => Promise<void>;
export declare const analyzeMigrations: () => Promise<void>;
export declare const migrateLegacyFormat: () => Promise<void>;
export declare const testMigration: () => Promise<void>;
export declare const generateBatchReport: () => Promise<void>;
export declare const getRollbackInfo: () => Promise<{
    status: string;
    items: never[];
}>;
export declare const performSelectiveRollback: () => Promise<void>;
export declare const performFullRollback: () => Promise<void>;
export declare const verifyRollback: () => Promise<{
    success: boolean;
    message: string;
}>;
export declare const displayVerificationResults: () => Promise<void>;
export declare const loadValidationConfig: () => {
    rules: never[];
};
export declare const executeMigrationValidation: () => Promise<{
    results: never[];
}>;
export declare const generateHtmlReport: () => Promise<void>;
export declare const displayValidationResults: () => Promise<void>;
export declare const generateValidationReport: () => Promise<void>;
export declare const exportMigrationPlan: () => Promise<void>;
export declare const startMigrationWatch: () => Promise<void>;
export declare const getMigrationStatistics: () => Promise<{
    total: number;
    successful: number;
    failed: number;
}>;
export declare const displayMigrationStats: () => Promise<void>;
export declare const getMigrationHistory: () => Promise<never[]>;
export declare const displayMigrationHistory: () => Promise<void>;
export declare const getMigrationStatus: () => Promise<{
    status: string;
}>;
export declare const displayMigrationStatus: () => Promise<void>;
export declare const getActiveMigrations: () => Promise<never[]>;
export declare const displayActiveMigrations: () => Promise<void>;
export declare const stopProxyService: () => Promise<void>;
export declare const getProxyStatus: () => Promise<{
    status: string;
}>;
export declare const configureProxy: () => Promise<void>;
export declare const loadTransformationRules: () => {
    rules: never[];
};
export declare const initializeProtocolBridge: () => Promise<void>;
export declare const loadIntegrationConfig: () => {
    config: {};
};
export declare const generateIntegrationExamples: () => Promise<void>;
export declare const testFrameworkIntegration: () => Promise<{
    success: boolean;
}>;
export declare const generateDocumentation: () => Promise<void>;
export declare const executeApiTests: () => Promise<{
    results: never[];
}>;
export declare const generateTestReport: () => Promise<void>;
export declare const loadApiSpecification: () => {
    spec: {};
};
export declare const generateClientLibrary: () => Promise<void>;
export declare const createWebhook: () => Promise<void>;
export declare const listWebhooks: () => Promise<void>;
export declare const deleteWebhook: () => Promise<void>;
export declare const testWebhook: () => Promise<void>;
export declare const listApiVersions: () => Promise<void>;
export declare const updatePolicy: () => Promise<void>;
export declare const deletePolicy: () => Promise<void>;
export declare const validatePolicy: () => Promise<void>;
export declare const applyPolicy: () => Promise<void>;
export declare const checkSecurityCompliance: () => Promise<{
    compliant: boolean;
}>;
export declare const generateSecurityReport: () => Promise<void>;
export declare const mapDataFlows: () => Promise<{
    flows: never[];
}>;
export declare const validateConsentMechanisms: () => Promise<{
    valid: boolean;
}>;
export declare const checkRetentionPolicies: () => Promise<{
    compliant: boolean;
}>;
export declare const calculatePrivacyCompliance: () => {
    score: number;
};
export declare const displayPrivacyAssessment: () => Promise<void>;
export declare const generatePrivacyReport: () => Promise<void>;
export declare const validateGovernanceControls: () => Promise<{
    valid: boolean;
}>;
export declare const validateGovernanceProcesses: () => Promise<{
    valid: boolean;
}>;
export declare const validateGovernanceDocumentation: () => Promise<{
    valid: boolean;
}>;
export declare const calculateGovernanceMaturity: () => {
    level: number;
};
export declare const displayGovernanceValidation: () => Promise<void>;
export declare const generateGovernanceReport: () => Promise<void>;
export declare const identifyRisks: () => Promise<{
    risks: never[];
}>;
export declare const generateRiskMatrix: () => Promise<{
    matrix: never[];
}>;
export declare const developMitigationStrategies: () => Promise<{
    strategies: never[];
}>;
export declare const calculateOverallRisk: () => {
    level: string;
};
export declare const displayRiskAssessment: () => Promise<void>;
export declare const generateRiskReport: () => Promise<void>;
export declare const calculateCertificationReadiness: () => Promise<{
    readiness: number;
}>;
export declare const identifyComplianceGaps: () => Promise<{
    gaps: never[];
}>;
export declare const generateCertificationRoadmap: () => Promise<{
    roadmap: never[];
}>;
export declare const collectCertificationEvidence: () => Promise<{
    evidence: never[];
}>;
export declare const displayCertificationAssessment: () => Promise<void>;
export declare const generateCertificationReport: () => Promise<void>;
export declare const launchComplianceDashboard: () => Promise<void>;
export declare const performMonitoringCheck: () => Promise<void>;
export declare const collectEvidence: () => Promise<void>;
export declare const verifyEvidence: () => Promise<void>;
export declare const archiveEvidence: () => Promise<void>;
export declare const generateEvidenceReport: () => Promise<void>;
export declare const removeRegistry: () => Promise<void>;
export declare const getRegistryStatus: () => Promise<{
    status: string;
}>;
export declare const syncRegistry: () => Promise<void>;
export declare const backupRegistry: () => Promise<void>;
export declare const verifyRegistryConnectivity: () => Promise<void>;
export declare const exportTopology: () => Promise<void>;
export declare const generateTopologyVisualization: () => Promise<void>;
export declare const displayTopologyGraph: () => Promise<void>;
export declare const collectDiscoveryAnalytics: () => Promise<{
    analytics: {};
}>;
export declare const exportAnalytics: () => Promise<void>;
export declare const displayDiscoveryAnalytics: () => Promise<void>;
export declare const performDeregistration: () => Promise<{
    success: boolean;
}>;
export declare const showDiscoveryConfig: () => Promise<void>;
export declare const setDiscoveryConfig: () => Promise<void>;
export declare const resetDiscoveryConfig: () => Promise<void>;
export declare const validateDiscoveryConfig: () => Promise<void>;
export declare const createComplianceReport: () => Promise<void>;
