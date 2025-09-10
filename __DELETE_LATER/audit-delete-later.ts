#!/usr/bin/env npx tsx
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface AuditEntry {
  path: string;
  type: 'file' | 'dir';
  size: number;
  modified: Date;
  hash?: string;
  recommendation: 'KEEP' | 'MOVE' | 'ARCHIVE';
  reason: string;
  hasSensitiveData: boolean;
}

interface AuditReport {
  timestamp: Date;
  totalFiles: number;
  totalDirs: number;
  totalSize: number;
  duplicates: Map<string, string[]>;
  entries: AuditEntry[];
  summary: {
    toMove: number;
    toKeep: number;
    toArchive: number;
    withSensitiveData: number;
  };
}

class DeleteLaterAuditor {
  private report: AuditReport;
  private hashMap: Map<string, string[]> = new Map();
  private sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /token/i,
    /password/i,
    /credential/i,
    /private[_-]?key/i,
    /\.env/,
    /glpat-/,
    /ghp_/,
    /sk-[a-zA-Z0-9]{48}/,
  ];

  constructor() {
    this.report = {
      timestamp: new Date(),
      totalFiles: 0,
      totalDirs: 0,
      totalSize: 0,
      duplicates: new Map(),
      entries: [],
      summary: {
        toMove: 0,
        toKeep: 0,
        toArchive: 0,
        withSensitiveData: 0,
      }
    };
  }

  private async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return 'error-reading-file';
    }
  }

  private checkSensitive(filePath: string, content?: string): boolean {
    const fileName = path.basename(filePath);
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(fileName) || (content && pattern.test(content))) {
        return true;
      }
    }
    return false;
  }

  private async analyzeFile(filePath: string, stats: any): Promise<AuditEntry> {
    const hash = await this.getFileHash(filePath);
    const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
    const hasSensitiveData = this.checkSensitive(filePath, content);
    
    // Track duplicates
    if (!this.hashMap.has(hash)) {
      this.hashMap.set(hash, []);
    }
    this.hashMap.get(hash)!.push(filePath);

    // Determine recommendation
    let recommendation: 'KEEP' | 'MOVE' | 'ARCHIVE' = 'MOVE';
    let reason = 'In DELETE_LATER folder';

    if (hasSensitiveData) {
      recommendation = 'MOVE';
      reason = 'Contains sensitive data - move to secure quarantine';
      this.report.summary.withSensitiveData++;
    } else if (filePath.includes('node_modules') || filePath.includes('vendor')) {
      recommendation = 'MOVE';
      reason = 'Dependency cache - can be regenerated';
    } else if (path.extname(filePath) === '.log' || path.extname(filePath) === '.tmp') {
      recommendation = 'MOVE';
      reason = 'Temporary/log file';
    } else if (stats.size > 10 * 1024 * 1024) { // > 10MB
      recommendation = 'ARCHIVE';
      reason = 'Large file - archive for space';
    }

    return {
      path: filePath,
      type: 'file',
      size: stats.size,
      modified: stats.mtime,
      hash,
      recommendation,
      reason,
      hasSensitiveData
    };
  }

  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip .git and .tokens
        if (entry.name === '.git' || fullPath.includes('/.tokens/')) {
          continue;
        }

        if (entry.isDirectory()) {
          this.report.totalDirs++;
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          this.report.totalFiles++;
          const stats = await fs.stat(fullPath);
          this.report.totalSize += stats.size;
          
          const auditEntry = await this.analyzeFile(fullPath, stats);
          this.report.entries.push(auditEntry);
          
          // Update summary
          if (auditEntry.recommendation === 'MOVE') this.report.summary.toMove++;
          else if (auditEntry.recommendation === 'KEEP') this.report.summary.toKeep++;
          else if (auditEntry.recommendation === 'ARCHIVE') this.report.summary.toArchive++;
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dirPath}:`, error);
    }
  }

  public async audit(basePath: string): Promise<AuditReport> {
    console.log(`Starting audit of DELETE_LATER folders in ${basePath}...`);
    
    // Find all DELETE_LATER directories
    const deleteLaterDirs = [
      path.join(basePath, '__DELETE_LATER'),
      path.join(basePath, '__DELETE_LATER_LATER'),
      path.join(basePath, '_DELETE_LATER'),
    ];

    for (const dir of deleteLaterDirs) {
      try {
        await fs.access(dir);
        console.log(`Scanning ${dir}...`);
        await this.scanDirectory(dir);
      } catch {
        // Directory doesn't exist, skip
      }
    }

    // Find duplicates
    for (const [hash, paths] of this.hashMap) {
      if (paths.length > 1) {
        this.report.duplicates.set(hash, paths);
      }
    }

    return this.report;
  }

  public formatReport(report: AuditReport): string {
    const sizeMB = (report.totalSize / (1024 * 1024)).toFixed(2);
    const duplicateCount = report.duplicates.size;
    
    let output = `# DELETE_LATER Audit Report\n\n`;
    output += `Generated: ${report.timestamp.toISOString()}\n\n`;
    output += `## Summary\n`;
    output += `- Total Files: ${report.totalFiles}\n`;
    output += `- Total Directories: ${report.totalDirs}\n`;
    output += `- Total Size: ${sizeMB} MB\n`;
    output += `- Duplicate File Groups: ${duplicateCount}\n`;
    output += `- Files with Sensitive Data: ${report.summary.withSensitiveData}\n\n`;
    
    output += `## Recommendations\n`;
    output += `- Files to Move: ${report.summary.toMove}\n`;
    output += `- Files to Keep: ${report.summary.toKeep}\n`;
    output += `- Files to Archive: ${report.summary.toArchive}\n\n`;
    
    if (report.summary.withSensitiveData > 0) {
      output += `## ⚠️ SECURITY ALERT\n`;
      output += `Found ${report.summary.withSensitiveData} files with potentially sensitive data:\n\n`;
      
      const sensitiveFiles = report.entries.filter(e => e.hasSensitiveData);
      for (const file of sensitiveFiles.slice(0, 10)) {
        output += `- ${file.path}\n`;
      }
      if (sensitiveFiles.length > 10) {
        output += `- ... and ${sensitiveFiles.length - 10} more\n`;
      }
      output += `\n`;
    }
    
    if (duplicateCount > 0) {
      output += `## Duplicate Files\n`;
      let dupIndex = 0;
      for (const [hash, paths] of report.duplicates) {
        if (dupIndex++ >= 5) break; // Show only first 5 groups
        output += `\n### Duplicate Group ${dupIndex} (${paths.length} files)\n`;
        for (const p of paths) {
          output += `- ${p}\n`;
        }
      }
      if (duplicateCount > 5) {
        output += `\n... and ${duplicateCount - 5} more duplicate groups\n`;
      }
    }
    
    output += `\n## Move Plan\n`;
    output += `\`\`\`bash\n`;
    output += `# Create quarantine directory\n`;
    output += `mkdir -p /Users/flux423/Sites/LLM/_DELETE_LATER/$(date +%Y%m%d)\n\n`;
    output += `# Move files (dry-run first)\n`;
    output += `# Add --apply flag to actually move files\n`;
    output += `\`\`\`\n`;
    
    return output;
  }
}

// Main execution
async function main() {
  const auditor = new DeleteLaterAuditor();
  const report = await auditor.audit('/Users/flux423/Sites/LLM');
  
  // Save JSON report
  const jsonPath = `/Users/flux423/Sites/LLM/OSSA/.agents/reports/delete-later-audit-${new Date().toISOString().split('T')[0]}.json`;
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  console.log(`JSON report saved to: ${jsonPath}`);
  
  // Save markdown report
  const mdPath = `/Users/flux423/Sites/LLM/OSSA/.agents/reports/delete-later-audit-${new Date().toISOString().split('T')[0]}.md`;
  const markdown = auditor.formatReport(report);
  await fs.writeFile(mdPath, markdown);
  console.log(`Markdown report saved to: ${mdPath}`);
  
  // Print summary
  console.log('\n' + markdown);
}

main().catch(console.error);