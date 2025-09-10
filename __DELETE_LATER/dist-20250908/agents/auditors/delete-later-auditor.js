/**
 * Delete Later Auditor Agent
 *
 * Comprehensive auditing agent for __DELETE_LATER directories that scans for
 * security risks, exposed credentials, duplicate files, and provides safe
 * cleanup recommendations without deleting anything by default.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';
export class DeleteLaterAuditor {
    constructor(credentialPatterns, excludePatterns) {
        this.fileHashes = new Map();
        this.credentialPatterns = [
            ...DeleteLaterAuditor.DEFAULT_CREDENTIAL_PATTERNS,
            ...(credentialPatterns?.map(pattern => new RegExp(pattern, 'gi')) || [])
        ];
        this.excludePatterns = [
            ...DeleteLaterAuditor.DEFAULT_EXCLUDE_PATTERNS,
            ...(excludePatterns || [])
        ];
    }
    /**
     * Perform comprehensive audit of __DELETE_LATER directories
     */
    async performAudit(request) {
        const startTime = Date.now();
        console.log('🔍 Starting comprehensive audit...');
        console.log(`Target directories: ${request.target_directories.length}`);
        console.log(`Dry run mode: ${request.dry_run ?? true}`);
        // Validate directories exist
        await this.validateDirectories(request.target_directories);
        // Scan for files
        const files = await this.scanFiles(request.target_directories, request.scan_depth);
        console.log(`📁 Found ${files.length} files to analyze`);
        // Filter by size limit
        const filteredFiles = files.filter(file => file.size <= (request.file_size_limit || 104857600) // 100MB default
        );
        // Scan for credentials
        const credentials = await this.scanCredentials(filteredFiles);
        console.log(`🔒 Found ${credentials.length} potential credential exposures`);
        // Detect duplicates
        const duplicates = await this.detectDuplicates(filteredFiles);
        console.log(`📋 Found ${duplicates.length} duplicate file groups`);
        const report = {
            summary: {
                total_files: files.length,
                total_size: files.reduce((sum, f) => sum + f.size, 0),
                credential_files: credentials.length,
                duplicate_groups: duplicates.length,
                potential_cleanup_size: duplicates.reduce((sum, group) => sum + (group.potential_savings), 0)
            },
            credentials,
            duplicates,
            risk_assessment: this.assessRisks(credentials),
            recommendations: this.generateRecommendations(credentials, duplicates),
            execution_time: (Date.now() - startTime) / 1000
        };
        console.log('✅ Audit completed');
        return report;
    }
    /**
     * Scan directories for all files matching criteria
     */
    async scanFiles(directories, maxDepth = 10) {
        const files = [];
        for (const dir of directories) {
            try {
                const pattern = path.join(dir, '**/*');
                const matches = await glob(pattern, {
                    ignore: this.excludePatterns,
                    maxDepth,
                    absolute: true,
                    nodir: true
                });
                for (const filePath of matches) {
                    try {
                        const stats = await fs.stat(filePath);
                        const metadata = {
                            path: filePath,
                            size: stats.size,
                            last_modified: stats.mtime,
                            permissions: (stats.mode & parseInt('777', 8)).toString(8),
                            mime_type: this.detectMimeType(filePath),
                            is_binary: await this.isBinaryFile(filePath)
                        };
                        files.push(metadata);
                    }
                    catch (error) {
                        console.warn(`⚠️ Could not access file: ${filePath}`, error);
                    }
                }
            }
            catch (error) {
                console.error(`❌ Error scanning directory ${dir}:`, error);
            }
        }
        return files.sort((a, b) => b.size - a.size); // Sort by size descending
    }
    /**
     * Scan files for exposed credentials
     */
    async scanCredentials(files) {
        const findings = [];
        let processed = 0;
        for (const file of files) {
            if (file.is_binary || file.size > 10485760) { // Skip binary files and files > 10MB
                continue;
            }
            try {
                const content = await fs.readFile(file.path, 'utf-8');
                const lines = content.split('\n');
                for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                    const line = lines[lineIndex];
                    for (const pattern of this.credentialPatterns) {
                        pattern.lastIndex = 0; // Reset regex state
                        const matches = line.matchAll(pattern);
                        for (const match of matches) {
                            if (match[0] && match[0].length > 8) { // Ignore very short matches
                                const finding = {
                                    file_path: file.path,
                                    line_number: lineIndex + 1,
                                    pattern_matched: pattern.source,
                                    risk_level: this.assessCredentialRisk(match[0], line),
                                    context: this.sanitizeContext(line, match.index || 0),
                                    recommendations: this.getCredentialRecommendations(match[0], file.path)
                                };
                                findings.push(finding);
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.warn(`⚠️ Could not scan file for credentials: ${file.path}`);
            }
            processed++;
            if (processed % 100 === 0) {
                console.log(`🔍 Credential scan progress: ${processed}/${files.length}`);
            }
        }
        return findings;
    }
    /**
     * Detect duplicate files by content hash
     */
    async detectDuplicates(files) {
        const hashGroups = new Map();
        let processed = 0;
        for (const file of files) {
            if (file.size < 1024)
                continue; // Skip files smaller than 1KB
            try {
                const hash = await this.calculateFileHash(file.path);
                if (!hashGroups.has(hash)) {
                    hashGroups.set(hash, []);
                }
                hashGroups.get(hash).push(file);
            }
            catch (error) {
                console.warn(`⚠️ Could not hash file: ${file.path}`);
            }
            processed++;
            if (processed % 50 === 0) {
                console.log(`🔍 Duplicate scan progress: ${processed}/${files.length}`);
            }
        }
        // Convert to duplicate groups (only groups with 2+ files)
        const duplicateGroups = [];
        for (const [hash, groupFiles] of hashGroups) {
            if (groupFiles.length > 1) {
                const group = {
                    hash,
                    size: groupFiles[0].size,
                    files: groupFiles.sort((a, b) => b.last_modified.getTime() - a.last_modified.getTime()),
                    potential_savings: groupFiles[0].size * (groupFiles.length - 1)
                };
                duplicateGroups.push(group);
            }
        }
        return duplicateGroups.sort((a, b) => b.potential_savings - a.potential_savings);
    }
    /**
     * Generate cleanup plan without executing
     */
    async generateCleanupPlan(request, aggressive = false) {
        const report = await this.performAudit(request);
        const plan = {
            safe_to_delete: [],
            quarantine: [],
            manual_review: [],
            total_savings: 0,
            estimated_time: 0
        };
        // Files with credentials should be quarantined
        for (const finding of report.credentials) {
            if (finding.risk_level === 'critical' || finding.risk_level === 'high') {
                if (!plan.quarantine.includes(finding.file_path)) {
                    plan.quarantine.push(finding.file_path);
                }
            }
            else {
                if (!plan.manual_review.includes(finding.file_path)) {
                    plan.manual_review.push(finding.file_path);
                }
            }
        }
        // Duplicate files (keep newest, delete others)
        for (const group of report.duplicates) {
            const [newest, ...others] = group.files;
            for (const file of others) {
                if (aggressive || this.isSafeToDelete(file.path)) {
                    plan.safe_to_delete.push(file.path);
                    plan.total_savings += file.size;
                }
                else {
                    plan.manual_review.push(file.path);
                }
            }
        }
        plan.estimated_time = (plan.safe_to_delete.length * 0.1 + // 0.1s per file deletion
            plan.quarantine.length * 0.5 + // 0.5s per file move
            plan.manual_review.length * 0.05 // 0.05s per file review
        );
        return plan;
    }
    async validateDirectories(directories) {
        for (const dir of directories) {
            try {
                const stats = await fs.stat(dir);
                if (!stats.isDirectory()) {
                    throw new Error(`${dir} is not a directory`);
                }
            }
            catch (error) {
                throw new Error(`Directory ${dir} is not accessible: ${error}`);
            }
        }
    }
    async calculateFileHash(filePath) {
        const content = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    async isBinaryFile(filePath) {
        try {
            const buffer = await fs.readFile(filePath, { encoding: null });
            // Check for null bytes in first 8000 bytes
            const sample = buffer.subarray(0, Math.min(8000, buffer.length));
            for (let i = 0; i < sample.length; i++) {
                if (sample[i] === 0)
                    return true;
            }
            return false;
        }
        catch {
            return true;
        }
    }
    detectMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
            '.js': 'application/javascript',
            '.ts': 'application/typescript',
            '.json': 'application/json',
            '.html': 'text/html',
            '.css': 'text/css',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.yml': 'text/yaml',
            '.yaml': 'text/yaml',
            '.xml': 'text/xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.pdf': 'application/pdf',
            '.zip': 'application/zip',
            '.tar': 'application/x-tar',
            '.gz': 'application/gzip'
        };
        return mimeMap[ext] || 'application/octet-stream';
    }
    assessCredentialRisk(match, line) {
        // Critical: Real API keys, JWT tokens, connection strings
        if (match.startsWith('sk-') || match.startsWith('claude-') ||
            match.startsWith('ghp_') || match.startsWith('glpat-') ||
            match.includes('://')) {
            return 'critical';
        }
        // High: Looks like real secrets
        if (match.length > 32 && /[A-Za-z0-9]{20,}/.test(match)) {
            return 'high';
        }
        // Medium: Potential secrets
        if (match.length > 16) {
            return 'medium';
        }
        return 'low';
    }
    sanitizeContext(line, matchIndex) {
        const start = Math.max(0, matchIndex - 20);
        const end = Math.min(line.length, matchIndex + 50);
        const context = line.substring(start, end);
        // Replace the actual credential with [REDACTED]
        return context.replace(/[a-zA-Z0-9_-]{8,}/g, '[REDACTED]');
    }
    getCredentialRecommendations(match, filePath) {
        const recommendations = [];
        if (match.startsWith('sk-') || match.startsWith('claude-')) {
            recommendations.push('Immediately rotate this API key in your provider console');
            recommendations.push('Review access logs for unauthorized usage');
        }
        if (match.startsWith('ghp_') || match.startsWith('glpat-')) {
            recommendations.push('Revoke this token immediately in Git provider settings');
            recommendations.push('Check repository access logs');
        }
        recommendations.push('Move this file to quarantine directory');
        recommendations.push('Use environment variables instead of hardcoded secrets');
        recommendations.push('Implement secret scanning in CI/CD pipeline');
        if (filePath.includes('__DELETE_LATER')) {
            recommendations.push('This file was marked for deletion - verify no production usage');
        }
        return recommendations;
    }
    assessRisks(credentials) {
        const assessment = { critical: 0, high: 0, medium: 0, low: 0 };
        for (const finding of credentials) {
            assessment[finding.risk_level]++;
        }
        return assessment;
    }
    generateRecommendations(credentials, duplicates) {
        const recommendations = [];
        if (credentials.length > 0) {
            recommendations.push('🚨 CRITICAL: Exposed credentials detected - immediate action required');
            recommendations.push('Rotate all exposed API keys and tokens immediately');
            recommendations.push('Review access logs for unauthorized usage');
            recommendations.push('Implement automated secret scanning');
        }
        if (duplicates.length > 0) {
            const totalSavings = duplicates.reduce((sum, g) => sum + g.potential_savings, 0);
            const sizeMB = Math.round(totalSavings / 1024 / 1024);
            recommendations.push(`Remove duplicate files to free ${sizeMB}MB of storage`);
            recommendations.push('Implement file deduplication process');
        }
        recommendations.push('Move files with credentials to secure quarantine directory');
        recommendations.push('Establish regular cleanup schedule for delete-later directories');
        recommendations.push('Consider implementing automated retention policies');
        return recommendations;
    }
    isSafeToDelete(filePath) {
        const safePaths = [
            '/__DELETE_LATER/',
            '/__DELETE_LATER_LATER/',
            '/tmp/',
            '.tmp',
            '.log',
            '.cache'
        ];
        const safeExtensions = ['.log', '.tmp', '.cache', '.bak', '.old'];
        const isSafePath = safePaths.some(safe => filePath.includes(safe));
        const isSafeExtension = safeExtensions.some(ext => filePath.endsWith(ext));
        return isSafePath || isSafeExtension;
    }
    /**
     * Create quarantine directory if it doesn't exist
     */
    async ensureQuarantineDirectory(baseDir) {
        const quarantineDir = path.join(baseDir, '__QUARANTINE');
        try {
            await fs.access(quarantineDir);
        }
        catch {
            await fs.mkdir(quarantineDir, { recursive: true });
            await fs.chmod(quarantineDir, 0o700); // Secure permissions
            // Create README
            const readmeContent = `# Quarantine Directory

This directory contains files that were flagged during security audit for potential credential exposure.

⚠️  WARNING: Files in this directory may contain sensitive information such as:
- API keys and tokens
- Database passwords
- Private keys
- Other secrets

DO NOT share these files or commit them to version control.

Review each file manually before deciding whether to:
1. Delete permanently
2. Extract and secure any needed information
3. Report to security team if credentials were exposed

Created by OSSA Delete Later Auditor Agent
Date: ${new Date().toISOString()}
`;
            await fs.writeFile(path.join(quarantineDir, 'README.md'), readmeContent);
        }
        return quarantineDir;
    }
}
DeleteLaterAuditor.DEFAULT_CREDENTIAL_PATTERNS = [
    // API Keys
    /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
    /claude-[a-zA-Z0-9-]{32,}/g, // Anthropic API keys
    /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access tokens
    /glpat-[a-zA-Z0-9_-]{20}/g, // GitLab personal access tokens
    /xoxb-[a-zA-Z0-9-]+/g, // Slack bot tokens
    /pk_[a-zA-Z0-9]{24}/g, // Stripe publishable keys
    /sk_live_[a-zA-Z0-9]{24}/g, // Stripe secret keys
    // JWT Tokens
    /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    // Generic patterns
    /(api[_-]?key|secret|password|token|credential|auth[_-]?token|access[_-]?token|private[_-]?key|aws[_-]?access).*[:=]\s*['"]*([a-zA-Z0-9_-]{20,})/gi,
    // Database connection strings
    /postgres:\/\/[^:]+:[^@]+@[^\/]+\/[^\s'"]+/gi,
    /mongodb:\/\/[^:]+:[^@]+@[^\/]+\/[^\s'"]+/gi,
    // Cloud provider keys
    /AKIA[0-9A-Z]{16}/g, // AWS Access Key IDs
    /[0-9a-zA-Z\/+]{40}/g, // AWS Secret Access Keys (generic)
];
DeleteLaterAuditor.DEFAULT_EXCLUDE_PATTERNS = [
    '**/.git/**',
    '**/node_modules/**',
    '**/.DS_Store',
    '**/*.log',
    '**/*.tmp',
    '**/.*',
];
export default DeleteLaterAuditor;
