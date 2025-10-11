#!/usr/bin/env tsx
/**
 * Golden CI Orchestration Component Validation Script
 * Validates that OSSA properly implements the golden workflow component
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  pass: number;
  warn: number;
  fail: number;
}

class GoldenValidator {
  private result: ValidationResult = { pass: 0, warn: 0, fail: 0 };

  private check(condition: boolean, message: string, severity: 'error' | 'warning' = 'error'): void {
    if (condition) {
      console.log(`✅ ${message}`);
      this.result.pass++;
    } else {
      if (severity === 'warning') {
        console.log(`⚠️  ${message}`);
        this.result.warn++;
      } else {
        console.log(`❌ ${message}`);
        this.result.fail++;
      }
    }
  }

  private fileExists(path: string): boolean {
    return existsSync(join(process.cwd(), path));
  }

  private fileContains(path: string, pattern: string): boolean {
    try {
      const content = readFileSync(join(process.cwd(), path), 'utf-8');
      return content.includes(pattern) || new RegExp(pattern).test(content);
    } catch {
      return false;
    }
  }

  private getPackageVersion(): string {
    try {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
      return pkg.version || '';
    } catch {
      return '';
    }
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', {
        encoding: 'utf-8'
      }).trim();
    } catch {
      return '';
    }
  }

  private getWorkingBranchCount(): number {
    try {
      const branches = execSync('git branch -a', { encoding: 'utf-8' });
      const workingBranches = branches
        .split('\n')
        .filter((branch) => /^\s*(feature|bug|chore|docs|hotfix|test|perf|ci)\//.test(branch));
      return workingBranches.length;
    } catch {
      return 0;
    }
  }

  public async validate(): Promise<void> {
    console.log('🔍 Validating Bluefly Golden CI Orchestration Component');
    console.log('=========================================================');

    this.validateComponentStructure();
    this.validateVersionDetection();
    this.validateBranchCompliance();
    this.validateGitLabCI();
    this.validatePipelineJobs();
    this.validateSafetyChecks();
    this.validateIntegrationPoints();
    this.validateTestingSupport();
    this.validateDocumentation();

    this.printSummary();
  }

  private validateComponentStructure(): void {
    console.log('\n1. Component Structure Validation');
    console.log('---------------------------------');

    this.check(this.fileExists('.gitlab/components/workflow/golden/component.yml'), 'Golden component.yml exists');
    this.check(this.fileExists('.gitlab/components/workflow/golden/template.yml'), 'Golden template.yml exists');
    this.check(this.fileExists('.gitlab/components/workflow/golden/README.md'), 'Golden README.md exists');
  }

  private validateVersionDetection(): void {
    console.log('\n2. Version Detection');
    console.log('-------------------');

    const version = this.getPackageVersion();
    this.check(!!version, `Package.json version detected: ${version}`);
    this.check(version === '0.1.9', 'OSSA version is 0.1.9');

    this.check(
      this.fileContains('.gitlab/components/workflow/golden/component.yml', 'version: "0.1.0"'),
      'Golden component version is 0.1.0'
    );
  }

  private validateBranchCompliance(): void {
    console.log('\n3. Branch Compliance');
    console.log('-------------------');

    const branchCount = this.getWorkingBranchCount();
    this.check(branchCount <= 40, `Working branches ≤40 (5 per type): ${branchCount}`, 'warning');

    const currentBranch = this.getCurrentBranch();
    this.check(currentBranch !== 'main', `Not on main branch (current: ${currentBranch})`);
  }

  private validateGitLabCI(): void {
    console.log('\n4. GitLab CI Configuration');
    console.log('-------------------------');

    this.check(this.fileExists('.gitlab-ci.yml'), 'GitLab CI file exists');
    this.check(this.fileContains('.gitlab-ci.yml', 'golden/template.yml'), 'CI includes golden component');
    // Check that version is NOT hardcoded (should be auto-detected)
    this.check(
      !this.fileContains('.gitlab-ci.yml', 'PROJECT_VERSION: "0.1.9"'),
      'Version is auto-detected (not hardcoded)'
    );
    this.check(this.fileContains('.gitlab-ci.yml', 'enable_ai_ml_testing.*true'), 'AI/ML testing enabled', 'warning');
    this.check(
      this.fileContains('.gitlab-ci.yml', 'ossa_compliance_check.*true'),
      'OSSA compliance check enabled',
      'warning'
    );
    this.check(this.fileContains('.gitlab-ci.yml', 'ENABLE_OSSA.*true'), 'OSSA compliance enabled');
    this.check(this.fileContains('.gitlab-ci.yml', 'ENABLE_TDD.*true'), 'TDD compliance enabled');
  }

  private validatePipelineJobs(): void {
    console.log('\n5. Pipeline Jobs Validation');
    console.log('--------------------------');

    const templatePath = '.gitlab/components/workflow/golden/template.yml';

    this.check(this.fileContains(templatePath, 'detect:version:'), 'Version detection job defined');
    this.check(this.fileContains(templatePath, 'test:ai-ml:'), 'AI/ML testing job defined');
    this.check(this.fileContains(templatePath, 'tag:pre-release:'), 'Pre-release tagging job defined');
    this.check(this.fileContains(templatePath, 'changelog:update:'), 'CHANGELOG update job defined');
    this.check(this.fileContains(templatePath, 'release:production:'), 'Production release job defined');
    this.check(this.fileContains(templatePath, 'when: manual'), 'Manual release gate configured');
    this.check(this.fileContains(templatePath, 'inputs.project_version'), 'Explicit version input supported');
    this.check(this.fileContains(templatePath, 'inputs.enable_ai_ml_testing'), 'AI/ML testing input supported');
    this.check(this.fileContains(templatePath, 'inputs.ossa_compliance_check'), 'OSSA compliance input supported');
  }

  private validateSafetyChecks(): void {
    console.log('\n6. Safety Checks');
    console.log('---------------');

    const templatePath = '.gitlab/components/workflow/golden/template.yml';

    // Check for problematic "when: never" (not the valid one in rules)
    const content = readFileSync(join(process.cwd(), templatePath), 'utf-8');
    const whenNeverCount = (content.match(/when: never/g) || []).length;
    const validWhenNever = content.includes('- when: never') ? 1 : 0;
    this.check(whenNeverCount <= validWhenNever, 'No problematic "when: never" blockers');
    this.check(this.fileContains(templatePath, 'rules:'), 'Uses rules instead of only/except');
    this.check(!this.fileContains(templatePath, 'force-push'), 'No force-push commands');
  }

  private validateIntegrationPoints(): void {
    console.log('\n7. Integration Points');
    console.log('--------------------');

    this.check(this.fileContains('.gitlab-ci.yml', 'test:integration'), 'Integration tests defined', 'warning');
    this.check(
      this.fileContains('.gitlab-ci.yml', 'Registry Bridge Service'),
      'Registry Bridge Service mentioned',
      'warning'
    );
    this.check(this.fileContains('.gitlab-ci.yml', 'UADP'), 'UADP testing included', 'warning');
  }

  private validateTestingSupport(): void {
    console.log('\n8. Testing Support');
    console.log('-----------------');

    this.check(this.fileContains('package.json', 'test:uadp'), 'UADP test script defined', 'warning');
    this.check(this.fileContains('package.json', 'test:integration'), 'Integration test script defined', 'warning');
    this.check(this.fileContains('package.json', 'test:ai-ml'), 'AI/ML test script defined', 'warning');
  }

  private validateDocumentation(): void {
    console.log('\n9. Documentation');
    console.log('---------------');

    this.check(this.fileExists('CHANGELOG.md'), 'CHANGELOG.md exists');
    this.check(this.fileContains('CHANGELOG.md', '0.1.9'), 'CHANGELOG has v0.1.9 entry');
    this.check(this.fileExists('README.md'), 'README.md exists');
    this.check(this.fileExists('ROADMAP.md'), 'ROADMAP.md exists');
    this.check(this.fileExists('docs/gitlab-component-requirements.md'), 'GitLab component requirements documented');
  }

  private printSummary(): void {
    console.log('\n=========================================================');
    console.log('Validation Summary:');
    console.log(`✅ Passed: ${this.result.pass}`);
    console.log(`⚠️  Warnings: ${this.result.warn}`);
    console.log(`❌ Failed: ${this.result.fail}`);
    console.log();

    if (this.result.fail === 0) {
      console.log('🎉 Golden CI Orchestration Component is properly configured!');
      process.exit(0);
    } else {
      console.log('⚠️  Some validation checks failed. Please review above.');
      process.exit(1);
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new GoldenValidator();
  validator.validate();
}

export { GoldenValidator };
