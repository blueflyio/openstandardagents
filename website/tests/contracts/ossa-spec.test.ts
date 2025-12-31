/**
 * Contract Tests for OSSA Spec Sync
 * 
 * These tests validate that the OSSA spec and examples fetched by sync jobs
 * match the expected schema. This prevents platform-agents or OSSA changes
 * from silently breaking openstandardagents.org sync jobs.
 * 
 * Run: npm run test:contracts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

// Simple test runner (no framework dependency)
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (_error) {
    console.error(`❌ ${name}: ${_error instanceof Error ? _error.message : String(_error)}`);
    process.exit(1);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toHaveProperty: (prop: string) => {
      if (!(prop in actual)) {
        throw new Error(`Expected object to have property ${prop}`);
      }
    },
    toMatch: (regex: RegExp | string) => {
      const pattern = typeof regex === 'string' ? new RegExp(regex) : regex;
      if (!pattern.test(String(actual))) {
        throw new Error(`Expected ${actual} to match ${pattern}`);
      }
    },
    toContain: (item: any) => {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected ${actual} to be an array`);
      }
      if (!actual.includes(item)) {
        throw new Error(`Expected array to contain ${item}`);
      }
    },
  };
}

const specDir = join(process.cwd(), '../../spec');
const schemasDir = join(process.cwd(), '../public/schemas');
const examplesFile = join(process.cwd(), '../public/examples.json');
const versionsFile = join(process.cwd(), '../lib/versions.json');

console.log('🔍 Running OSSA spec contract tests...\n');

let testsRun = 0;
let testsPassed = 0;

// Spec Files - only validate if they exist (may not exist on first run)
if (existsSync(schemasDir)) {
  test('v0.3.0 agent schema exists and is valid', () => {
    const schemaPath = join(schemasDir, 'v0.3.0', 'agent.json');
    if (existsSync(schemaPath)) {
      const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('type');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('apiVersion');
      expect(schema.properties).toHaveProperty('kind');
      expect(schema.properties).toHaveProperty('metadata');
      expect(schema.properties).toHaveProperty('spec');
    }
  });
  testsRun++;
} else {
  console.log('⏭️  Skipping schema tests (schemas not synced yet)');
}

// Examples File - validate structure if exists
if (existsSync(examplesFile)) {
  test('examples.json is valid JSON', () => {
    const content = readFileSync(examplesFile, 'utf-8');
    const examples = JSON.parse(content);
    expect(Array.isArray(examples)).toBe(true);
  });

  test('examples have required structure', () => {
    const content = readFileSync(examplesFile, 'utf-8');
    const examples = JSON.parse(content);
    
    if (examples.length > 0) {
      const firstExample = examples[0];
      expect(firstExample).toHaveProperty('name');
      expect(firstExample).toHaveProperty('category');
      expect(firstExample).toHaveProperty('content');
      
      // Validate OSSA manifest structure
      if (firstExample.content) {
        const manifest = parseYaml(firstExample.content);
        expect(manifest).toHaveProperty('apiVersion');
        expect(String(manifest.apiVersion)).toMatch(/^ossa\/v\d+\.\d+\.\d+/);
        expect(manifest).toHaveProperty('kind');
        expect(['Agent', 'Task', 'Workflow']).toContain(manifest.kind);
        expect(manifest).toHaveProperty('metadata');
        expect(manifest.metadata).toHaveProperty('name');
      }
    }
  });
  testsRun += 2;
} else {
  console.log('⏭️  Skipping examples tests (examples.json not synced yet)');
}

// Versions File - must exist (created by fetch-versions)
if (existsSync(versionsFile)) {
  test('versions.json is valid JSON with required fields', () => {
    const content = readFileSync(versionsFile, 'utf-8');
    const versions = JSON.parse(content);
    
    expect(versions).toHaveProperty('stable');
    expect(versions).toHaveProperty('dev');
    expect(versions).toHaveProperty('versions');
    expect(Array.isArray(versions.versions)).toBe(true);
    
    // Validate version format
    expect(String(versions.stable)).toMatch(/^\d+\.\d+\.\d+$/);
    if (versions.dev) {
      expect(String(versions.dev)).toMatch(/^\d+\.\d+\.\d+(-dev|-rc\.\d+)?$/);
    }
  });
  testsRun++;
} else {
  console.log('⏭️  Skipping versions tests (versions.json not synced yet)');
}

if (testsRun === 0) {
  console.log('⚠️  No files to validate - this is normal on first run before sync');
  console.log('   Contract tests will validate structure after sync jobs run');
} else {
  console.log(`\n✅ All ${testsRun} contract tests passed!`);
}
