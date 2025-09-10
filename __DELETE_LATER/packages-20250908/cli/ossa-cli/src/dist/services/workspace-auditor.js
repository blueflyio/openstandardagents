/**
 * OSSA Workspace Auditor Service
 * Monitors and audits .agents-workspace directories
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { EventEmitter } from 'events';
export class WorkspaceAuditor extends EventEmitter {
    constructor(workspacePath = '/Users/flux423/Sites/LLM/.agents-workspace') {
        super();
        this.auditInterval = null;
        this.lastReport = null;
        this.workspacePath = workspacePath;
    }
    /**
     * Start background auditing
     */
    startAuditing(intervalMs = 60000) {
        console.log(`🔍 Starting workspace auditing for: ${this.workspacePath}`);
        // Initial audit
        this.performAudit();
        // Schedule periodic audits
        this.auditInterval = setInterval(() => {
            this.performAudit();
        }, intervalMs);
    }
    /**
     * Stop auditing
     */
    stopAuditing() {
        if (this.auditInterval) {
            clearInterval(this.auditInterval);
            this.auditInterval = null;
            console.log('🛑 Stopped workspace auditing');
        }
    }
    /**
     * Perform workspace audit
     */
    async performAudit() {
        const agents = [];
        try {
            // Find all .agents directories
            const agentDirs = this.findAgentDirectories(this.workspacePath);
            for (const dir of agentDirs) {
                const config = await this.auditAgentDirectory(dir);
                agents.push(config);
            }
            // Create report
            const report = {
                timestamp: new Date(),
                workspacePath: this.workspacePath,
                agents,
                summary: {
                    total: agents.length,
                    valid: agents.filter(a => a.status === 'valid').length,
                    invalid: agents.filter(a => a.status === 'invalid').length,
                    warnings: agents.filter(a => a.status === 'warning').length
                }
            };
            this.lastReport = report;
            this.emit('audit-complete', report);
            // Log summary
            console.log(`✅ Audit Complete: ${report.summary.total} agents (${report.summary.valid} valid, ${report.summary.invalid} invalid, ${report.summary.warnings} warnings)`);
            // Write report to file
            this.saveReport(report);
            return report;
        }
        catch (error) {
            console.error('❌ Audit failed:', error);
            throw error;
        }
    }
    /**
     * Find all .agents directories
     */
    findAgentDirectories(basePath) {
        const agentDirs = [];
        function traverse(dir) {
            if (!fs.existsSync(dir))
                return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dir, entry.name);
                    // Skip __DELETE_LATER and node_modules
                    if (entry.name === '__DELETE_LATER' || entry.name === 'node_modules') {
                        continue;
                    }
                    // Check if it's an .agents directory
                    if (entry.name === '.agents') {
                        agentDirs.push(fullPath);
                    }
                    else {
                        // Recurse into subdirectories
                        traverse(fullPath);
                    }
                }
            }
        }
        traverse(basePath);
        return agentDirs;
    }
    /**
     * Audit individual agent directory
     */
    async auditAgentDirectory(agentPath) {
        const issues = [];
        let status = 'valid';
        const config = {
            name: path.basename(path.dirname(agentPath)),
            version: 'unknown',
            path: agentPath,
            status: 'valid',
            issues: [],
            lastChecked: new Date()
        };
        try {
            // Check for required files
            const requiredFiles = ['agent.yaml', 'capabilities.yaml'];
            const optionalFiles = ['README.md', 'deployment.yaml'];
            for (const file of requiredFiles) {
                const filePath = path.join(agentPath, file);
                if (!fs.existsSync(filePath)) {
                    issues.push(`Missing required file: ${file}`);
                    status = 'invalid';
                }
                else {
                    // Validate YAML
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        const parsed = yaml.load(content);
                        if (file === 'agent.yaml' && parsed) {
                            config.version = parsed.version || 'unknown';
                            // Validate agent.yaml structure
                            if (!parsed.name)
                                issues.push('agent.yaml missing "name" field');
                            if (!parsed.version)
                                issues.push('agent.yaml missing "version" field');
                            if (!parsed.capabilities)
                                issues.push('agent.yaml missing "capabilities" field');
                        }
                    }
                    catch (e) {
                        issues.push(`Invalid YAML in ${file}: ${e}`);
                        status = 'invalid';
                    }
                }
            }
            // Check optional files
            for (const file of optionalFiles) {
                const filePath = path.join(agentPath, file);
                if (!fs.existsSync(filePath)) {
                    issues.push(`Missing optional file: ${file}`);
                    if (status === 'valid')
                        status = 'warning';
                }
            }
            // Check for OSSA compliance
            const ossaPath = path.join(agentPath, 'ossa.yaml');
            if (!fs.existsSync(ossaPath)) {
                issues.push('Not OSSA compliant (missing ossa.yaml)');
                if (status === 'valid')
                    status = 'warning';
            }
        }
        catch (error) {
            issues.push(`Audit error: ${error}`);
            status = 'invalid';
        }
        config.status = status;
        config.issues = issues;
        return config;
    }
    /**
     * Save audit report
     */
    saveReport(report) {
        const reportsDir = path.join(this.workspacePath, '.audit-reports');
        // Create reports directory if it doesn't exist
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        // Save report as JSON
        const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportsDir, `audit-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        // Also save latest report
        const latestPath = path.join(reportsDir, 'latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
    }
    /**
     * Get last audit report
     */
    getLastReport() {
        return this.lastReport;
    }
    /**
     * Get audit health status
     */
    getHealthStatus() {
        if (!this.lastReport) {
            return { healthy: false, message: 'No audit performed yet' };
        }
        const report = this.lastReport;
        const healthy = report.summary.invalid === 0;
        const message = `${report.summary.valid}/${report.summary.total} agents valid`;
        return { healthy, message };
    }
}
