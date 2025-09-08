#!/usr/bin/env node
/**
 * Test credential detection specifically on files we know contain credentials
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

async function testCredentialDetection() {
  console.log(chalk.blue('🔍 Testing Credential Detection'));
  console.log(chalk.gray('==============================\n'));

  const credentialPatterns = [
    /sk-[a-zA-Z0-9]{48}/g,
    /claude-[a-zA-Z0-9-]{32,}/g,
    /ghp_[a-zA-Z0-9]{36}/g,
    /glpat-[a-zA-Z0-9_-]{20}/g,
    /xoxb-[a-zA-Z0-9-]+/g,
    /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    /(JWT_SECRET|PLATFORM_TOKEN|API_KEY)\s*=\s*[a-zA-Z0-9+/=]{20,}/gi
  ];

  // Test the files we know contain credentials
  const testFiles = [
    '/Users/flux423/Sites/LLM/__DELETE_LATER_LATER/FUCKING-BULLSHIT/LLM-agent-studio-workspace/.claude/projects/-Users-flux423-Sites-LLM-common-npm-tddai/07dae55e-d165-47a2-a6f1-f9b9d1145bae.jsonl',
    '/Users/flux423/Sites/LLM/.worktrees/agent-forge-clean/src/commands/submodule-migration.ts',
    '/Users/flux423/Sites/LLM/__DELETE_LATER_LATER/generate-secrets.sh'
  ];

  let totalFindings = 0;
  const findings = [];

  for (const filePath of testFiles) {
    try {
      console.log(chalk.cyan(`\n📄 Checking: ${path.basename(filePath)}`));
      
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      let fileFindings = 0;

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        for (const pattern of credentialPatterns) {
          pattern.lastIndex = 0;
          const matches = [...line.matchAll(pattern)];
          
          for (const match of matches) {
            if (match[0] && match[0].length > 8) {
              const finding = {
                file: path.basename(filePath),
                line: lineIndex + 1,
                pattern: pattern.source,
                match: match[0].substring(0, 12) + '...',
                risk: assessRisk(match[0]),
                context: line.substring(Math.max(0, match.index - 10), match.index + 30).replace(/[a-zA-Z0-9_-]{8,}/g, '[REDACTED]')
              };
              
              findings.push(finding);
              fileFindings++;
              totalFindings++;
              
              console.log(chalk.red(`   🚨 Line ${finding.line}: ${finding.risk.toUpperCase()} - ${finding.match}`));
            }
          }
        }
      }

      console.log(chalk.gray(`   Found ${fileFindings} credentials in this file`));

    } catch (error) {
      console.log(chalk.yellow(`   ⚠️ Could not read file: ${error.message}`));
    }
  }

  console.log(chalk.blue(`\n📊 Summary:`));
  console.log(`   Files checked: ${testFiles.length}`);
  console.log(`   Total credentials found: ${totalFindings}`);

  if (totalFindings > 0) {
    const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    findings.forEach(f => riskCounts[f.risk]++);
    
    console.log(chalk.red(`\n🔥 Risk Breakdown:`));
    console.log(`   Critical: ${riskCounts.critical}`);
    console.log(`   High: ${riskCounts.high}`);
    console.log(`   Medium: ${riskCounts.medium}`);
    console.log(`   Low: ${riskCounts.low}`);

    console.log(chalk.red(`\n💀 Most Critical Findings:`));
    const criticalFindings = findings.filter(f => f.risk === 'critical').slice(0, 5);
    for (const finding of criticalFindings) {
      console.log(`   ${chalk.red('⚠️')} ${finding.file}:${finding.line} - ${finding.match}`);
    }

    // Save detailed report
    const reportPath = `/Users/flux423/Sites/LLM/OSSA/.agents/reports/credential-detection-${new Date().toISOString().split('T')[0]}.json`;
    try {
      await fs.writeFile(reportPath, JSON.stringify({
        test_type: 'credential_detection',
        timestamp: new Date().toISOString(),
        total_findings: totalFindings,
        risk_breakdown: riskCounts,
        findings: findings.map(f => ({
          file: f.file,
          line: f.line,
          risk: f.risk,
          pattern_type: getPatternType(f.pattern)
        })),
        recommendations: [
          'IMMEDIATE: Rotate all exposed API keys and tokens',
          'Review access logs for unauthorized usage',
          'Move files with credentials to quarantine',
          'Implement automated secret scanning',
          'Use environment variables instead of hardcoded secrets'
        ]
      }, null, 2));
      
      console.log(chalk.blue(`\n📄 Detailed report saved: ${reportPath}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not save report: ${error.message}`));
    }

    console.log(chalk.red(`\n🚨 CRITICAL SECURITY ALERT: ${totalFindings} credentials exposed!`));
    return false; // Fail test due to security findings

  } else {
    console.log(chalk.green(`\n✅ No credentials detected`));
    return true;
  }
}

function assessRisk(match) {
  if (match.startsWith('sk-') || match.startsWith('claude-') || 
      match.startsWith('ghp_') || match.startsWith('glpat-')) {
    return 'critical';
  }
  if (match.length > 32 || match.includes('SECRET') || match.includes('TOKEN')) {
    return 'high';
  }
  if (match.length > 16) {
    return 'medium';
  }
  return 'low';
}

function getPatternType(pattern) {
  if (pattern.includes('sk-')) return 'OpenAI API Key';
  if (pattern.includes('claude-')) return 'Anthropic API Key';
  if (pattern.includes('ghp_')) return 'GitHub Token';
  if (pattern.includes('glpat-')) return 'GitLab Token';
  if (pattern.includes('xoxb-')) return 'Slack Bot Token';
  if (pattern.includes('eyJ')) return 'JWT Token';
  if (pattern.includes('SECRET|TOKEN')) return 'Generic Secret';
  return 'Unknown Pattern';
}

// Run the test
testCredentialDetection()
  .then(success => {
    if (!success) {
      console.log(chalk.red('\n💥 SECURITY BREACH: Exposed credentials detected!'));
      console.log(chalk.red('Take immediate action to rotate these credentials.'));
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('Credential detection test failed:'), error);
    process.exit(1);
  });