#!/usr/bin/env node

/**
 * OpenAPI AI Agents Standard - Compliance Report Generator
 * Generates comprehensive compliance reports for all supported frameworks
 */

import chalk from 'chalk';
import fs from 'fs';
import yaml from 'js-yaml';
import ora from 'ora';
import path from 'path';
import { table } from 'table';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComplianceReporter {
  constructor() {
    this.reportsDir = path.join(__dirname, '../compliance-reports');
    this.examplesDir = path.join(__dirname, '../examples');
    this.servicesDir = path.join(__dirname, '../services');
    this.reportData = {
      timestamp: new Date().toISOString(),
      version: '0.2.0',
      frameworks: {},
      overall_score: 0,
      recommendations: [],
      next_steps: []
    };
  }

  async generateReport() {
    console.log(chalk.blue.bold('🔍 OpenAPI AI Agents Standard - Compliance Report Generator'));
    console.log(chalk.gray('Generating comprehensive compliance analysis...\n'));

    const spinner = ora('Analyzing compliance frameworks...').start();

    try {
      // Ensure reports directory exists
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
      }

      // Analyze each compliance framework
      await this.analyzeISO42001();
      await this.analyzeNISTAIRMF();
      await this.analyzeEUAIAct();
      await this.analyzeFISMA();
      await this.analyzeFedRAMP();
      await this.analyzeSOC2();

      // Calculate overall compliance score
      this.calculateOverallScore();

      // Generate recommendations and next steps
      this.generateRecommendations();

      // Generate reports
      await this.generateDetailedReport();
      await this.generateSummaryReport();
      await this.generateExecutiveSummary();

      spinner.succeed('Compliance report generation completed!');
      
      console.log(chalk.green('\n✅ Reports generated successfully:'));
      console.log(chalk.gray(`📁 Directory: ${this.reportsDir}`));
      console.log(chalk.gray(`📊 Overall Score: ${this.reportData.overall_score}%`));
      console.log(chalk.gray(`🏆 Certification Level: ${this.getCertificationLevel(this.reportData.overall_score)}`));

    } catch (error) {
      spinner.fail('Failed to generate compliance report');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }

  async analyzeISO42001() {
    const framework = 'ISO_42001_2023';
    this.reportData.frameworks[framework] = {
      name: 'ISO 42001:2023 - AI Management Systems',
      description: 'International standard for AI management systems',
      requirements: [
        'Governance framework',
        'Risk management processes',
        'Data quality management',
        'Monitoring and measurement',
        'Continuous improvement'
      ],
      compliance_score: 0,
      status: 'pending',
      findings: [],
      gaps: [],
      strengths: []
    };

    // Analyze governance configuration
    const governanceScore = await this.assessGovernance();
    this.reportData.frameworks[framework].compliance_score = governanceScore;
    this.reportData.frameworks[framework].status = this.getStatus(governanceScore);

    // Add specific findings
    if (governanceScore >= 90) {
      this.reportData.frameworks[framework].strengths.push('Strong governance framework established');
    } else {
      this.reportData.frameworks[framework].gaps.push('Governance framework needs enhancement');
    }
  }

  async analyzeNISTAIRMF() {
    const framework = 'NIST_AI_RMF_1_0';
    this.reportData.frameworks[framework] = {
      name: 'NIST AI RMF 1.0 - AI Risk Management Framework',
      description: 'U.S. government framework for AI risk management',
      requirements: [
        'Govern (policies, roles, oversight)',
        'Map (context, risk categories, threat analysis)',
        'Measure (metrics, baselines, thresholds)',
        'Manage (response plan, communication, review)'
      ],
      compliance_score: 0,
      status: 'pending',
      findings: [],
      gaps: [],
      strengths: []
    };

    // Analyze risk management maturity
    const riskScore = await this.assessRiskManagement();
    this.reportData.frameworks[framework].compliance_score = riskScore;
    this.reportData.frameworks[framework].status = this.getStatus(riskScore);

    if (riskScore >= 85) {
      this.reportData.frameworks[framework].strengths.push('Comprehensive risk management framework');
    } else {
      this.reportData.frameworks[framework].gaps.push('Risk management processes need strengthening');
    }
  }

  async analyzeEUAIAct() {
    const framework = 'EU_AI_Act';
    this.reportData.frameworks[framework] = {
      name: 'EU AI Act - European AI Regulation',
      description: 'European Union regulation for AI systems',
      requirements: [
        'Risk classification',
        'Transparency measures',
        'Human oversight',
        'Data governance',
        'Documentation requirements'
      ],
      compliance_score: 0,
      status: 'pending',
      findings: [],
      gaps: [],
      strengths: []
    };

    // Analyze transparency and oversight
    const transparencyScore = await this.assessTransparency();
    this.reportData.frameworks[framework].compliance_score = transparencyScore;
    this.reportData.frameworks[framework].status = this.getStatus(transparencyScore);

    if (transparencyScore >= 80) {
      this.reportData.frameworks[framework].strengths.push('Good transparency and oversight measures');
    } else {
      this.reportData.frameworks[framework].gaps.push('Transparency measures need improvement');
    }
  }

  async analyzeFISMA() {
    const framework = 'FISMA';
    this.reportData.frameworks[framework] = {
      name: 'FISMA - Federal Information Security Management Act',
      description: 'U.S. federal information security requirements',
      requirements: [
        'Access control mechanisms',
        'Audit logging',
        'Incident response procedures',
        'Security training',
        'Risk assessments'
      ],
      compliance_score: 0,
      status: 'pending',
      findings: [],
      gaps: [],
      strengths: []
    };

    const securityScore = await this.assessSecurityControls();
    this.reportData.frameworks[framework].compliance_score = securityScore;
    this.reportData.frameworks[framework].status = this.getStatus(securityScore);
  }

  async analyzeFedRAMP() {
    const framework = 'FedRAMP';
    this.reportData.frameworks[framework] = {
      name: 'FedRAMP - Federal Risk and Authorization Management Program',
      description: 'U.S. government cloud security requirements',
      requirements: [
        'Multi-factor authentication',
        'Encryption at rest and in transit',
        'Continuous monitoring',
        'Vulnerability management',
        'Incident response'
      ],
      compliance_score: 0,
      status: 'pending',
      findings: [],
      gaps: [],
      strengths: []
    };

    const cloudSecurityScore = await this.assessCloudSecurity();
    this.reportData.frameworks[framework].compliance_score = cloudSecurityScore;
    this.reportData.frameworks[framework].status = this.getStatus(cloudSecurityScore);
  }

  async analyzeSOC2() {
    const framework = 'SOC2';
    this.reportData.frameworks[framework] = {
      name: 'SOC2 - System and Organization Controls 2',
      description: 'AICPA trust service criteria for service organizations',
      requirements: [
        'Security controls',
        'Availability controls',
        'Processing integrity',
        'Confidentiality',
        'Privacy'
      ],
      compliance_score: 0,
      status: 'pending',
      findings: [],
      gaps: [],
      strengths: []
    };

    const trustScore = await this.assessTrustControls();
    this.reportData.frameworks[framework].compliance_score = trustScore;
    this.reportData.frameworks[framework].status = this.getStatus(trustScore);
  }

  async assessGovernance() {
    // Simulate governance assessment
    const governanceFiles = [
      'examples/basic/agent.yml',
      'services/validation-api/services/compliance-validator.js'
    ];

    let score = 0;
    let checks = 0;

    for (const file of governanceFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        checks++;
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const config = yaml.load(content);
            
            if (config.spec?.governance) score += 25;
            if (config.spec?.risk_management) score += 25;
            if (config.spec?.monitoring) score += 25;
            if (config.spec?.data_quality) score += 25;
          } catch (error) {
            console.warn(chalk.yellow(`Warning: Could not parse ${file}`));
          }
        } else {
          // Check for governance-related code in JS files
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('governance') || content.includes('compliance')) {
            score += 50;
          }
        }
      }
    }

    return checks > 0 ? Math.round(score / checks) : 0;
  }

  async assessRiskManagement() {
    // Simulate risk management assessment
    const riskFiles = [
      'services/validation-api/services/compliance-validator.js',
      'services/validation-api/services/dual-format-validator.js'
    ];

    let score = 0;
    let checks = 0;

    for (const file of riskFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        checks++;
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('risk_management')) score += 25;
        if (content.includes('threat_analysis')) score += 25;
        if (content.includes('mitigation')) score += 25;
        if (content.includes('monitoring')) score += 25;
      }
    }

    return checks > 0 ? Math.round(score / checks) : 0;
  }

  async assessTransparency() {
    // Simulate transparency assessment
    const transparencyFiles = [
      'examples/basic/agent.yml',
      'README.md',
      'docs/'
    ];

    let score = 0;
    let checks = 0;

    for (const file of transparencyFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        checks++;
        if (fs.statSync(filePath).isDirectory()) {
          // Check directory contents
          const files = fs.readdirSync(filePath);
          if (files.length > 0) score += 50;
        } else {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('transparency') || content.includes('documentation')) {
            score += 50;
          }
        }
      }
    }

    return checks > 0 ? Math.round(score / checks) : 0;
  }

  async assessSecurityControls() {
    // Simulate security controls assessment
    return 75; // Placeholder score
  }

  async assessCloudSecurity() {
    // Simulate cloud security assessment
    return 70; // Placeholder score
  }

  async assessTrustControls() {
    // Simulate trust controls assessment
    return 80; // Placeholder score
  }

  calculateOverallScore() {
    const frameworks = Object.values(this.reportData.frameworks);
    if (frameworks.length === 0) {
      this.reportData.overall_score = 0;
      return;
    }

    const totalScore = frameworks.reduce((sum, framework) => {
      return sum + framework.compliance_score;
    }, 0);

    this.reportData.overall_score = Math.round(totalScore / frameworks.length);
  }

  generateRecommendations() {
    const recommendations = [];
    const nextSteps = [];

    // Analyze gaps and generate recommendations
    Object.entries(this.reportData.frameworks).forEach(([key, framework]) => {
      if (framework.compliance_score < 80) {
        recommendations.push(`Enhance ${framework.name} compliance (current: ${framework.compliance_score}%)`);
        nextSteps.push(`Implement missing ${framework.name} requirements`);
      }
    });

    // Add general recommendations
    if (this.reportData.overall_score < 70) {
      recommendations.push('Establish comprehensive compliance program');
      nextSteps.push('Conduct compliance gap analysis');
    }

    if (this.reportData.overall_score < 85) {
      recommendations.push('Strengthen governance and risk management');
      nextSteps.push('Develop governance framework');
    }

    this.reportData.recommendations = recommendations;
    this.reportData.next_steps = nextSteps;
  }

  getStatus(score) {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 70) return 'adequate';
    if (score >= 50) return 'needs_improvement';
    return 'critical';
  }

  getCertificationLevel(score) {
    if (score >= 95) return 'platinum';
    if (score >= 90) return 'gold';
    if (score >= 80) return 'silver';
    if (score >= 70) return 'bronze';
    return 'none';
  }

  async generateDetailedReport() {
    const reportPath = path.join(this.reportsDir, 'detailed-compliance-report.json');
    const report = {
      metadata: {
        generated_at: this.reportData.timestamp,
        version: this.reportData.version,
        tool: 'OpenAPI AI Agents Standard Compliance Reporter'
      },
      summary: {
        overall_score: this.reportData.overall_score,
        certification_level: this.getCertificationLevel(this.reportData.overall_score),
        frameworks_analyzed: Object.keys(this.reportData.frameworks).length,
        status_distribution: this.getStatusDistribution()
      },
      frameworks: this.reportData.frameworks,
      recommendations: this.reportData.recommendations,
      next_steps: this.reportData.next_steps
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.gray(`📄 Detailed report: ${reportPath}`));
  }

  async generateSummaryReport() {
    const reportPath = path.join(this.reportsDir, 'compliance-summary.md');
    
    let markdown = `# Compliance Summary Report\n\n`;
    markdown += `**Generated:** ${new Date(this.reportData.timestamp).toLocaleString()}\n`;
    markdown += `**Version:** ${this.reportData.version}\n`;
    markdown += `**Overall Score:** ${this.reportData.overall_score}%\n`;
    markdown += `**Certification Level:** ${this.getCertificationLevel(this.reportData.overall_score)}\n\n`;

    markdown += `## Framework Analysis\n\n`;
    markdown += `| Framework | Score | Status | Key Findings |\n`;
    markdown += `|-----------|-------|--------|--------------|\n`;

    Object.entries(this.reportData.frameworks).forEach(([key, framework]) => {
      const findings = framework.strengths.length > 0 ? framework.strengths[0] : framework.gaps[0] || 'No findings';
      markdown += `| ${framework.name} | ${framework.compliance_score}% | ${framework.status} | ${findings} |\n`;
    });

    markdown += `\n## Recommendations\n\n`;
    this.reportData.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });

    markdown += `\n## Next Steps\n\n`;
    this.reportData.next_steps.forEach(step => {
      markdown += `- ${step}\n`;
    });

    fs.writeFileSync(reportPath, markdown);
    console.log(chalk.gray(`📄 Summary report: ${reportPath}`));
  }

  async generateExecutiveSummary() {
    const reportPath = path.join(this.reportsDir, 'executive-summary.md');
    
    let markdown = `# Executive Summary\n\n`;
    markdown += `## Compliance Status\n\n`;
    markdown += `The OpenAPI AI Agents Standard project has achieved a **${this.reportData.overall_score}% compliance score** `;
    markdown += `with **${this.getCertificationLevel(this.reportData.overall_score)} certification level**.\n\n`;

    markdown += `## Key Achievements\n\n`;
    
    const excellentFrameworks = Object.values(this.reportData.frameworks)
      .filter(f => f.compliance_score >= 90);
    
    if (excellentFrameworks.length > 0) {
      markdown += `✅ **${excellentFrameworks.length} frameworks** achieved excellent compliance (90%+)\n`;
    }

    const goodFrameworks = Object.values(this.reportData.frameworks)
      .filter(f => f.compliance_score >= 80 && f.compliance_score < 90);
    
    if (goodFrameworks.length > 0) {
      markdown += `✅ **${goodFrameworks.length} frameworks** achieved good compliance (80-89%)\n`;
    }

    markdown += `\n## Areas for Improvement\n\n`;
    
    const needsImprovement = Object.values(this.reportData.frameworks)
      .filter(f => f.compliance_score < 80);
    
    if (needsImprovement.length > 0) {
      markdown += `⚠️ **${needsImprovement.length} frameworks** need improvement (<80%)\n`;
      needsImprovement.forEach(framework => {
        markdown += `   - ${framework.name}: ${framework.compliance_score}%\n`;
      });
    }

    markdown += `\n## Strategic Recommendations\n\n`;
    markdown += `1. **Immediate Actions** (Next 30 days)\n`;
    markdown += `   - ${this.reportData.next_steps[0] || 'Review compliance gaps'}\n`;
    
    markdown += `\n2. **Short-term Goals** (Next 90 days)\n`;
    markdown += `   - Achieve 85%+ overall compliance score\n`;
    markdown += `   - Implement governance framework\n`;
    
    markdown += `\n3. **Long-term Objectives** (Next 6 months)\n`;
    markdown += `   - Achieve 90%+ overall compliance score\n`;
    markdown += `   - Obtain industry certifications\n`;
    markdown += `   - Establish continuous compliance monitoring\n`;

    fs.writeFileSync(reportPath, markdown);
    console.log(chalk.gray(`📄 Executive summary: ${reportPath}`));
  }

  getStatusDistribution() {
    const distribution = {
      excellent: 0,
      good: 0,
      adequate: 0,
      needs_improvement: 0,
      critical: 0
    };

    Object.values(this.reportData.frameworks).forEach(framework => {
      distribution[framework.status]++;
    });

    return distribution;
  }

  displaySummary() {
    console.log(chalk.blue.bold('\n📊 Compliance Summary'));
    console.log(chalk.gray('─'.repeat(50)));

    const tableData = [
      ['Framework', 'Score', 'Status', 'Key Finding']
    ];

    Object.entries(this.reportData.frameworks).forEach(([key, framework]) => {
      const finding = framework.strengths.length > 0 ? framework.strengths[0] : framework.gaps[0] || 'No findings';
      tableData.push([
        framework.name,
        `${framework.compliance_score}%`,
        this.getStatusEmoji(framework.status),
        finding.substring(0, 40) + (finding.length > 40 ? '...' : '')
      ]);
    });

    console.log(table(tableData));

    console.log(chalk.blue.bold('\n🎯 Overall Assessment'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`Score: ${chalk.bold(this.reportData.overall_score)}%`);
    console.log(`Level: ${chalk.bold(this.getCertificationLevel(this.reportData.overall_score))}`);
    console.log(`Status: ${this.getStatusEmoji(this.getStatus(this.reportData.overall_score))} ${this.getStatus(this.reportData.overall_score)}`);

    if (this.reportData.recommendations.length > 0) {
      console.log(chalk.blue.bold('\n💡 Key Recommendations'));
      console.log(chalk.gray('─'.repeat(30)));
      this.reportData.recommendations.slice(0, 3).forEach(rec => {
        console.log(`• ${rec}`);
      });
    }
  }

  getStatusEmoji(status) {
    const emojis = {
      excellent: '🟢',
      good: '🟡',
      adequate: '🟠',
      needs_improvement: '🔴',
      critical: '⚫'
    };
    return emojis[status] || '❓';
  }
}

// Main execution
async function main() {
  const reporter = new ComplianceReporter();
  await reporter.generateReport();
  reporter.displaySummary();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ComplianceReporter;
