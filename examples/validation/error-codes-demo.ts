/**
 * OSSA Error Code Catalog - Demo
 *
 * Demonstrates how to use error codes for validation and debugging
 */

import {
  EnhancedOSSAValidator,
  OSSAErrorCode,
  getErrorDetails,
  searchErrorsByTag,
  searchErrorsBySeverity,
} from '../../src/validation';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Example 1: Validate with error codes
function validateWithErrorCodes() {
  console.log('=== Example 1: Validate with Error Codes ===\n');

  const invalidManifest = {
    kind: 'Agent', // Missing apiVersion (OSSA-001)
    metadata: {
      name: 'My_Agent', // Invalid DNS format (OSSA-800)
      decentralized_identity: {
        did: 'did:key:abc123', // Wrong DID method (OSSA-100)
      },
    },
    // Missing spec (OSSA-005)
  };

  const validator = new EnhancedOSSAValidator();
  const result = validator.validate(invalidManifest);

  console.log('Valid:', result.valid);
  console.log('Total Issues:', result.report.summary.total);
  console.log('Errors:', result.report.summary.errorCount);
  console.log('\nFormatted Output:\n');
  console.log(result.formatted.text);
  console.log('\n');
}

// Example 2: Handle specific error codes
function handleSpecificErrors() {
  console.log('=== Example 2: Handle Specific Errors ===\n');

  const manifest = {
    apiVersion: 'ossa/v0.3.6',
    kind: 'Agent',
    metadata: {
      name: 'security-scanner',
      decentralized_identity: {
        did: 'did:ossa:INVALID_UPPERCASE', // Invalid (uppercase)
      },
      genetics: {
        generation: 1,
        // Missing parent_dids (OSSA-201)
      },
    },
    spec: {
      type: 'analyzer',
    },
  };

  const validator = new EnhancedOSSAValidator();
  const result = validator.validate(manifest);

  if (!result.valid) {
    result.report.errors.forEach((error) => {
      console.log(`Error Code: ${error.code}`);
      console.log(`Path: ${error.path}`);
      console.log(`Message: ${error.message}`);

      // Handle specific errors
      switch (error.code) {
        case OSSAErrorCode.OSSA_100:
          console.log('🔧 Fix: Use lowercase in DID');
          console.log('   did: "did:ossa:invalid_uppercase" → did: "did:ossa:invaliduppercase"');
          break;
        case OSSAErrorCode.OSSA_201:
          console.log('🔧 Fix: Add parent DIDs for generation 1');
          console.log('   Add: "parent_dids": ["did:ossa:parent1", "did:ossa:parent2"]');
          break;
        default:
          console.log(`🔧 Fix: ${error.remediation}`);
      }

      console.log(`📚 Docs: ${error.docsUrl}`);
      console.log('---\n');
    });
  }
}

// Example 3: Search and filter errors
function searchAndFilter() {
  console.log('=== Example 3: Search and Filter Errors ===\n');

  // Find all DID-related errors
  const didErrors = searchErrorsByTag('did');
  console.log(`DID-related errors: ${didErrors.length}`);
  didErrors.forEach((error) => {
    console.log(`  - ${error.code}: ${error.message}`);
  });
  console.log('');

  // Find all critical errors
  const criticalErrors = searchErrorsBySeverity('error');
  console.log(`Critical errors in catalog: ${criticalErrors.length}`);
  console.log('');

  // Find genetics errors
  const geneticsErrors = searchErrorsByTag('genetics');
  console.log(`Genetics errors: ${geneticsErrors.length}`);
  geneticsErrors.slice(0, 5).forEach((error) => {
    console.log(`  - ${error.code}: ${error.message}`);
  });
  console.log('');
}

// Example 4: Get error details
function getErrorInfo() {
  console.log('=== Example 4: Get Error Details ===\n');

  const details = getErrorDetails(OSSAErrorCode.OSSA_001);

  console.log(`Code: ${details!.code}`);
  console.log(`Severity: ${details!.severity}`);
  console.log(`Message: ${details!.message}`);
  console.log(`Remediation: ${details!.remediation}`);
  console.log(`Docs: ${details!.docsUrl}`);
  console.log(`Tags: ${details!.tags?.join(', ')}`);

  if (details!.examples && details!.examples.length > 0) {
    console.log('\nExamples:');
    details!.examples.forEach((example, i) => {
      console.log(`\n  Example ${i + 1}: ${example.title}`);
      console.log(`  Invalid: ${example.invalid}`);
      console.log(`  Valid: ${example.valid}`);
      console.log(`  Why: ${example.explanation}`);
    });
  }
  console.log('');
}

// Example 5: Export multiple formats
function exportFormats() {
  console.log('=== Example 5: Export Multiple Formats ===\n');

  const manifest = {
    apiVersion: 'ossa/v0.3.6',
    kind: 'Agent',
    metadata: {
      name: 'test-agent',
    },
    // Missing spec
  };

  const validator = new EnhancedOSSAValidator();
  const result = validator.validate(manifest);

  // Export JSON
  const jsonPath = join(__dirname, 'validation-report.json');
  writeFileSync(jsonPath, result.formatted.json);
  console.log(`✅ Exported JSON: ${jsonPath}`);

  // Export Markdown
  const mdPath = join(__dirname, 'validation-report.md');
  writeFileSync(mdPath, result.formatted.markdown);
  console.log(`✅ Exported Markdown: ${mdPath}`);

  // Export HTML
  const htmlPath = join(__dirname, 'validation-report.html');
  writeFileSync(htmlPath, result.formatted.html);
  console.log(`✅ Exported HTML: ${htmlPath}`);

  console.log('\n');
}

// Example 6: Validate file
function validateFile() {
  console.log('=== Example 6: Validate File ===\n');

  const validator = new EnhancedOSSAValidator();

  try {
    // Create test manifest
    const testManifest = {
      apiVersion: 'ossa/v0.3.6',
      kind: 'Agent',
      metadata: {
        name: 'file-test-agent',
        taxonomy: {
          domain: 'security',
          subdomain: 'auth',
        },
        access_tier: {
          tier: 'tier_1_read',
          permissions: ['read_code', 'read_configs'],
        },
      },
      spec: {
        type: 'analyzer',
        model: {
          provider: 'anthropic',
          name: 'claude-3-5-sonnet-20241022',
        },
      },
    };

    const testPath = join(__dirname, 'test-manifest.json');
    writeFileSync(testPath, JSON.stringify(testManifest, null, 2));

    // Validate
    const result = validator.validateFile(testPath);

    console.log(`File: ${testPath}`);
    console.log(`Valid: ${result.valid}`);
    console.log(`Issues: ${result.report.summary.total}`);

    if (result.valid) {
      console.log('✅ Manifest is valid!');
    } else {
      console.log('\nIssues found:');
      console.log(result.formatted.text);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('');
}

// Run all examples
async function main() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  OSSA Error Code Catalog - Demo              ║');
  console.log('║  Production-Quality Error Handling           ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  validateWithErrorCodes();
  handleSpecificErrors();
  searchAndFilter();
  getErrorInfo();
  exportFormats();
  validateFile();

  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Demo Complete                                ║');
  console.log('║  Check generated files in examples/validation ║');
  console.log('╚═══════════════════════════════════════════════╝');
}

main().catch(console.error);
