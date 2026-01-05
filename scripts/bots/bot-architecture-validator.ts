#!/usr/bin/env node
/**
 * Bot: Architecture Validator Agent
 * Validates code against architectural principles: SOLID, DRY, OpenAPI-first, TDD
 */

const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
const PROJECT_ID = process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID || '';
const MR_IID = process.env.CI_MERGE_REQUEST_IID || '';

interface Violation {
  principle: string;
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

async function getMRChanges(): Promise<any[]> {
  const response = await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}/changes`, {
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch MR changes: ${response.statusText}`);
  }

  const data = await response.json();
  return data.changes || [];
}

function checkSOLID(code: string, file: string): Violation[] {
  const violations: Violation[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/class\s+\w+.*extends.*implements.*implements/)) {
      violations.push({
        principle: 'SOLID - Interface Segregation',
        file,
        line: i + 1,
        message: 'Class implements too many interfaces - violates Interface Segregation Principle',
        severity: 'warning'
      });
    }

    if (line.match(/function\s+\w+.*\{[\s\S]{500,}/)) {
      violations.push({
        principle: 'SOLID - Single Responsibility',
        file,
        line: i + 1,
        message: 'Function is too long - may violate Single Responsibility Principle',
        severity: 'warning'
      });
    }
  }

  return violations;
}

function checkDRY(code: string, file: string): Violation[] {
  const violations: Violation[] = [];
  const lines = code.split('\n');
  const seenPatterns = new Map<string, number[]>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length > 20 && !line.startsWith('//') && !line.startsWith('*')) {
      if (seenPatterns.has(line)) {
        const previousLines = seenPatterns.get(line) || [];
        if (previousLines.length > 0) {
          violations.push({
            principle: 'DRY',
            file,
            line: i + 1,
            message: `Duplicate code detected (also on lines ${previousLines.join(', ')})`,
            severity: 'warning'
          });
        }
        previousLines.push(i + 1);
      } else {
        seenPatterns.set(line, [i + 1]);
      }
    }
  }

  return violations;
}

function checkOpenAPIFirst(code: string, file: string): Violation[] {
  const violations: Violation[] = [];

  if (file.includes('controller') || file.includes('route') || file.includes('endpoint')) {
    if (!code.includes('openapi') && !code.includes('OpenAPI') && !code.includes('@openapi')) {
      violations.push({
        principle: 'OpenAPI-First',
        file,
        line: 1,
        message: 'API endpoint should have OpenAPI spec before implementation',
        severity: 'error'
      });
    }
  }

  return violations;
}

function checkTDD(code: string, file: string): Violation[] {
  const violations: Violation[] = [];

  if (file.includes('src/') && !file.includes('test') && !file.includes('spec')) {
    const testFile = file
      .replace(/^src\//, 'tests/unit/')
      .replace(/\.ts$/, '.test.ts')
      .replace(/\.js$/, '.test.js');

    violations.push({
      principle: 'TDD',
      file: testFile,
      line: 1,
      message: `Test file should exist for ${file} - TDD requires tests first`,
      severity: 'warning'
    });
  }

  return violations;
}

async function postComment(violations: Violation[]): Promise<void> {
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');

  let comment = '## 🏗️ Architecture Validation Results\n\n';

  if (errors.length > 0) {
    comment += '### ❌ Errors (Blocking)\n\n';
    errors.forEach(v => {
      comment += `- **${v.file}:${v.line}** - ${v.principle}: ${v.message}\n`;
    });
    comment += '\n';
  }

  if (warnings.length > 0) {
    comment += '### ⚠️ Warnings\n\n';
    warnings.forEach(v => {
      comment += `- **${v.file}:${v.line}** - ${v.principle}: ${v.message}\n`;
    });
  }

  if (violations.length === 0) {
    comment += '✅ All architectural principles validated';
  }

  await fetch(`${GITLAB_URL}/projects/${PROJECT_ID}/merge_requests/${MR_IID}/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITLAB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: comment })
  });
}

async function validateArchitecture(): Promise<void> {
  if (!GITLAB_TOKEN || !PROJECT_ID || !MR_IID) {
    throw new Error('GITLAB_TOKEN, PROJECT_ID, and MR_IID are required');
  }

  console.log(`Validating MR !${MR_IID} against architectural principles...`);

  const changes = await getMRChanges();
  const allViolations: Violation[] = [];

  for (const change of changes) {
    if (change.deleted_file || !change.new_path) {
      continue;
    }

    const content = change.diff || '';
    const file = change.new_path;

    allViolations.push(...checkSOLID(content, file));
    allViolations.push(...checkDRY(content, file));
    allViolations.push(...checkOpenAPIFirst(content, file));
    allViolations.push(...checkTDD(content, file));
  }

  await postComment(allViolations);

  const errors = allViolations.filter(v => v.severity === 'error');
  
  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} architectural violations`);
    process.exit(1);
  }

  console.log(`\n✅ Architecture validation complete: ${allViolations.length} warnings`);
}

if (require.main === module) {
  validateArchitecture().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { validateArchitecture };
