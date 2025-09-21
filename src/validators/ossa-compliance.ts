/**
 * OSSA Compliance Validator
 * Validates agents against OSSA taxonomy standards
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';

export interface ComplianceReport {
  valid: boolean;
  agent: string;
  category: string;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface AgentConfig {
  name: string;
  category: string;
  type: string;
  description: string;
  version: string;
  capabilities?: string[];
  domains?: string[];
  integrations?: string[];
  requirements?: {
    runtime?: string;
    memory?: string;
    gpu?: boolean;
  };
}

export class OSSAComplianceValidator {
  private readonly REQUIRED_FILES = ['agent.yml', 'openapi.yaml', 'README.md'];

  private readonly VALID_CATEGORIES = [
    'critics', 'governors', 'integrators', 'judges',
    'monitors', 'orchestrators', 'trainers', 'voice', 'workers'
  ];

  private readonly CATEGORY_TYPES = {
    critics: 'critic',
    governors: 'governor',
    integrators: 'integrator',
    judges: 'judge',
    monitors: 'monitor',
    orchestrators: 'orchestrator',
    trainers: 'trainer',
    voice: 'voice',
    workers: 'worker'
  };

  /**
   * Validate a single agent
   */
  async validateAgent(agentPath: string): Promise<ComplianceReport> {
    const agentName = path.basename(agentPath);
    const category = path.basename(path.dirname(agentPath));

    const report: ComplianceReport = {
      valid: true,
      agent: agentName,
      category,
      errors: [],
      warnings: [],
      score: 100
    };

    // Check required files
    this.validateRequiredFiles(agentPath, report);

    // Validate agent configuration
    await this.validateAgentConfig(agentPath, report);

    // Validate OpenAPI specification
    await this.validateOpenAPISpec(agentPath, report);

    // Validate README documentation
    this.validateReadme(agentPath, report);

    // Calculate compliance score
    report.score = this.calculateScore(report);
    report.valid = report.errors.length === 0;

    return report;
  }

  /**
   * Validate all agents in a directory
   */
  async validateAll(agentsDir: string): Promise<ComplianceReport[]> {
    const reports: ComplianceReport[] = [];

    const categories = fs.readdirSync(agentsDir)
      .filter(item => fs.statSync(path.join(agentsDir, item)).isDirectory())
      .filter(item => !item.startsWith('.'));

    for (const category of categories) {
      const categoryPath = path.join(agentsDir, category);
      const agents = fs.readdirSync(categoryPath)
        .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());

      for (const agent of agents) {
        const agentPath = path.join(categoryPath, agent);
        const report = await this.validateAgent(agentPath);
        reports.push(report);
      }
    }

    return reports;
  }

  /**
   * Validate required files exist
   */
  private validateRequiredFiles(agentPath: string, report: ComplianceReport): void {
    for (const file of this.REQUIRED_FILES) {
      const filePath = path.join(agentPath, file);
      const altPath = filePath.replace('.yaml', '.yml');

      if (!fs.existsSync(filePath) && !fs.existsSync(altPath)) {
        report.errors.push(`Missing required file: ${file}`);
        report.score -= 20;
      }
    }
  }

  /**
   * Validate agent.yml configuration
   */
  private async validateAgentConfig(agentPath: string, report: ComplianceReport): Promise<void> {
    const configPath = path.join(agentPath, 'agent.yml');

    if (!fs.existsSync(configPath)) {
      return; // Already reported as missing
    }

    try {
      const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as AgentConfig;

      // Validate required fields
      if (!config.name) {
        report.errors.push('agent.yml: missing required field "name"');
      }

      if (!config.description) {
        report.errors.push('agent.yml: missing required field "description"');
      }

      if (!config.version) {
        report.errors.push('agent.yml: missing required field "version"');
      } else if (!this.isValidSemver(config.version)) {
        report.warnings.push(`agent.yml: version "${config.version}" is not valid semver`);
      }

      // Validate category
      if (!config.category) {
        report.errors.push('agent.yml: missing required field "category"');
      } else if (!this.VALID_CATEGORIES.includes(config.category)) {
        report.errors.push(`agent.yml: invalid category "${config.category}"`);
      } else if (config.category !== report.category) {
        report.errors.push(`agent.yml: category mismatch (expected "${report.category}", got "${config.category}")`);
      }

      // Validate type
      if (!config.type) {
        report.warnings.push('agent.yml: missing field "type"');
      } else if (config.category && config.type !== this.CATEGORY_TYPES[config.category as keyof typeof this.CATEGORY_TYPES]) {
        report.warnings.push(`agent.yml: type "${config.type}" doesn't match category "${config.category}"`);
      }

      // Validate capabilities
      if (!config.capabilities || config.capabilities.length === 0) {
        report.warnings.push('agent.yml: no capabilities defined');
      }

      // Validate domains
      if (!config.domains || config.domains.length === 0) {
        report.warnings.push('agent.yml: no domains defined');
      }

    } catch (error) {
      report.errors.push(`agent.yml: invalid YAML - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate OpenAPI specification
   */
  private async validateOpenAPISpec(agentPath: string, report: ComplianceReport): Promise<void> {
    const specPath = path.join(agentPath, 'openapi.yaml');
    const altPath = path.join(agentPath, 'openapi.yml');

    const finalPath = fs.existsSync(specPath) ? specPath : altPath;

    if (!fs.existsSync(finalPath)) {
      return; // Already reported as missing
    }

    try {
      const spec = yaml.load(fs.readFileSync(finalPath, 'utf8')) as OpenAPIV3.Document;

      // Validate OpenAPI version
      if (!spec.openapi || !spec.openapi.startsWith('3.')) {
        report.errors.push('openapi.yaml: must use OpenAPI 3.0 or higher');
      }

      // Validate info section
      if (!spec.info) {
        report.errors.push('openapi.yaml: missing required "info" section');
      } else {
        if (!spec.info.title) {
          report.errors.push('openapi.yaml: missing info.title');
        }
        if (!spec.info.version) {
          report.errors.push('openapi.yaml: missing info.version');
        }
      }

      // Validate paths
      if (!spec.paths || Object.keys(spec.paths).length === 0) {
        report.warnings.push('openapi.yaml: no paths defined');
      } else {
        // Check for required agent endpoints
        const requiredPaths = ['/health', '/capabilities', '/execute'];
        for (const reqPath of requiredPaths) {
          if (!spec.paths[reqPath]) {
            report.warnings.push(`openapi.yaml: missing recommended endpoint "${reqPath}"`);
          }
        }
      }

      // Validate security
      if (!spec.security && !spec.components?.securitySchemes) {
        report.warnings.push('openapi.yaml: no security schemes defined');
      }

    } catch (error) {
      report.errors.push(`openapi.yaml: invalid spec - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate README documentation
   */
  private validateReadme(agentPath: string, report: ComplianceReport): void {
    const readmePath = path.join(agentPath, 'README.md');

    if (!fs.existsSync(readmePath)) {
      return; // Already reported as missing
    }

    const content = fs.readFileSync(readmePath, 'utf8');

    // Check minimum content
    if (content.length < 100) {
      report.warnings.push('README.md: documentation is too short (< 100 characters)');
    }

    // Check for required sections
    const requiredSections = ['## Description', '## Capabilities', '## Usage'];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        report.warnings.push(`README.md: missing section "${section}"`);
      }
    }

    // Check for examples
    if (!content.includes('```')) {
      report.warnings.push('README.md: no code examples found');
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateScore(report: ComplianceReport): number {
    let score = 100;

    // Deduct for errors (10 points each)
    score -= report.errors.length * 10;

    // Deduct for warnings (3 points each)
    score -= report.warnings.length * 3;

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  /**
   * Check if version is valid semver
   */
  private isValidSemver(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Generate compliance report
   */
  generateReport(reports: ComplianceReport[]): string {
    const totalAgents = reports.length;
    const validAgents = reports.filter(r => r.valid).length;
    const avgScore = reports.reduce((sum, r) => sum + r.score, 0) / totalAgents;

    let output = '# OSSA Compliance Report\n\n';
    output += `**Date**: ${new Date().toISOString()}\n\n`;
    output += '## Summary\n\n';
    output += `- **Total Agents**: ${totalAgents}\n`;
    output += `- **Valid Agents**: ${validAgents} (${((validAgents / totalAgents) * 100).toFixed(1)}%)\n`;
    output += `- **Average Score**: ${avgScore.toFixed(1)}/100\n\n`;

    // Group by category
    const byCategory: { [key: string]: ComplianceReport[] } = {};
    for (const report of reports) {
      if (!byCategory[report.category]) {
        byCategory[report.category] = [];
      }
      byCategory[report.category].push(report);
    }

    output += '## Results by Category\n\n';
    for (const [category, categoryReports] of Object.entries(byCategory)) {
      const validCount = categoryReports.filter(r => r.valid).length;
      output += `### ${category} (${validCount}/${categoryReports.length} valid)\n\n`;

      for (const report of categoryReports) {
        const status = report.valid ? '✅' : '❌';
        output += `- ${status} **${report.agent}** (score: ${report.score})\n`;

        if (report.errors.length > 0) {
          output += `  - Errors: ${report.errors.join(', ')}\n`;
        }
        if (report.warnings.length > 0) {
          output += `  - Warnings: ${report.warnings.join(', ')}\n`;
        }
      }
      output += '\n';
    }

    return output;
  }
}

// CLI interface
if (require.main === module) {
  (async () => {
    const validator = new OSSAComplianceValidator();
    const agentsDir = path.resolve('.agents');

    console.log('🔍 Running OSSA Compliance Validation...\n');

    const reports = await validator.validateAll(agentsDir);
    const reportText = validator.generateReport(reports);

    // Save report
    const outputPath = path.join(process.cwd(), 'docs', 'COMPLIANCE-REPORT.md');
    fs.writeFileSync(outputPath, reportText);

    console.log(reportText);
    console.log(`\n📊 Report saved to: ${outputPath}`);

    // Exit with error if not all agents are valid
    const validCount = reports.filter(r => r.valid).length;
    if (validCount < reports.length) {
      process.exit(1);
    }
  })();
}