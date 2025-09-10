import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

/**
 * OSSA Report Configuration
 * All reports are stored in ~/.ossa/reports for Docker compatibility
 */
export class OSSAReportConfig {
  private static readonly OSSA_HOME = join(homedir(), '.ossa');
  private static readonly REPORTS_DIR = join(OSSAReportConfig.OSSA_HOME, 'reports');

  static get reportsDirectory(): string {
    // Ensure directory exists
    if (!existsSync(OSSAReportConfig.REPORTS_DIR)) {
      mkdirSync(OSSAReportConfig.REPORTS_DIR, { recursive: true });
    }
    return OSSAReportConfig.REPORTS_DIR;
  }

  static getReportPath(filename: string): string {
    return join(OSSAReportConfig.reportsDirectory, filename);
  }

  static getReportPaths() {
    return {
      compliance: OSSAReportConfig.getReportPath('ossa-compliance-report.md'),
      deployment: OSSAReportConfig.getReportPath('deployment-status.md'),
      agentInventory: OSSAReportConfig.getReportPath('agent-inventory.md'),
      workspaceAudit: OSSAReportConfig.getReportPath('workspace-audit.md'),
      testResults: OSSAReportConfig.getReportPath('test-results.json'),
      roadmapUpdate: OSSAReportConfig.getReportPath('roadmap-update-report.json'),
      agentEcosystem: OSSAReportConfig.getReportPath('agent-ecosystem-status.json'),
      successReport: OSSAReportConfig.getReportPath('success-report.md'),
      syntaxAnalysis: OSSAReportConfig.getReportPath('syntax-analysis-summary.md'),
      workspaceTransform: OSSAReportConfig.getReportPath('workspace-transformation-report.md')
    };
  }
}

// Export default paths
export const OSSA_REPORTS = OSSAReportConfig.getReportPaths();
export const OSSA_REPORTS_DIR = OSSAReportConfig.reportsDirectory;