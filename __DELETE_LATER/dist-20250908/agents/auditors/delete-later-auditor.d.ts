/**
 * Delete Later Auditor Agent
 *
 * Comprehensive auditing agent for __DELETE_LATER directories that scans for
 * security risks, exposed credentials, duplicate files, and provides safe
 * cleanup recommendations without deleting anything by default.
 */
export interface AuditRequest {
    target_directories: string[];
    scan_depth?: number;
    file_size_limit?: number;
    credential_patterns?: string[];
    exclude_patterns?: string[];
    dry_run?: boolean;
}
export interface CredentialFinding {
    file_path: string;
    line_number: number;
    pattern_matched: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    context: string;
    recommendations: string[];
}
export interface FileMetadata {
    path: string;
    size: number;
    last_modified: Date;
    permissions: string;
    mime_type: string;
    is_binary: boolean;
}
export interface DuplicateGroup {
    hash: string;
    size: number;
    files: FileMetadata[];
    potential_savings: number;
}
export interface AuditReport {
    summary: {
        total_files: number;
        total_size: number;
        credential_files: number;
        duplicate_groups: number;
        potential_cleanup_size: number;
    };
    credentials: CredentialFinding[];
    duplicates: DuplicateGroup[];
    risk_assessment: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    recommendations: string[];
    execution_time: number;
}
export interface CleanupPlan {
    safe_to_delete: string[];
    quarantine: string[];
    manual_review: string[];
    total_savings: number;
    estimated_time: number;
}
export declare class DeleteLaterAuditor {
    private static readonly DEFAULT_CREDENTIAL_PATTERNS;
    private static readonly DEFAULT_EXCLUDE_PATTERNS;
    private readonly credentialPatterns;
    private readonly excludePatterns;
    private readonly fileHashes;
    constructor(credentialPatterns?: string[], excludePatterns?: string[]);
    /**
     * Perform comprehensive audit of __DELETE_LATER directories
     */
    performAudit(request: AuditRequest): Promise<AuditReport>;
    /**
     * Scan directories for all files matching criteria
     */
    private scanFiles;
    /**
     * Scan files for exposed credentials
     */
    scanCredentials(files: FileMetadata[]): Promise<CredentialFinding[]>;
    /**
     * Detect duplicate files by content hash
     */
    detectDuplicates(files: FileMetadata[]): Promise<DuplicateGroup[]>;
    /**
     * Generate cleanup plan without executing
     */
    generateCleanupPlan(request: AuditRequest, aggressive?: boolean): Promise<CleanupPlan>;
    private validateDirectories;
    private calculateFileHash;
    private isBinaryFile;
    private detectMimeType;
    private assessCredentialRisk;
    private sanitizeContext;
    private getCredentialRecommendations;
    private assessRisks;
    private generateRecommendations;
    private isSafeToDelete;
    /**
     * Create quarantine directory if it doesn't exist
     */
    ensureQuarantineDirectory(baseDir: string): Promise<string>;
}
export default DeleteLaterAuditor;
