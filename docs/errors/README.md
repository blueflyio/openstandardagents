# OSSA Error Documentation

Comprehensive error code documentation for OSSA manifest validation.

## Overview

OSSA validation uses structured error codes (OSSA-XXX) to provide:
- **Clear identification**: Unique code for each error type
- **Remediation steps**: Actionable guidance to fix issues
- **Documentation links**: Deep links to detailed error docs
- **Programmatic handling**: Enable tools to handle errors automatically

## Error Code Format

**Pattern**: `OSSA-XXX`
- **Prefix**: `OSSA` (constant)
- **Code**: 3-digit number (001-999)

## Error Categories

| Range | Category | Description |
|-------|----------|-------------|
| 001-099 | [Schema Validation](./catalog.md#schema-validation-001-099) | JSON Schema validation errors |
| 100-199 | [Identity & DID](./catalog.md#identity--did-100-199) | Decentralized identity errors |
| 200-299 | [Genetics & Breeding](./catalog.md#genetics--breeding-200-299) | Agent genetics errors |
| 300-399 | [Lifecycle](./catalog.md#lifecycle-300-399) | Lifecycle stage errors |
| 400-499 | [Economics & Marketplace](./catalog.md#economics--marketplace-400-499) | Economic system errors |
| 500-599 | [Taxonomy](./catalog.md#taxonomy-500-599) | Taxonomy classification errors |
| 600-699 | [Access Control & SoD](./catalog.md#access-control--separation-of-duties-600-699) | Access control errors |
| 700-799 | [Revolutionary Features](./catalog.md#revolutionary-features-700-799) | Revolutionary feature errors |
| 800-899 | [Naming & Format](./catalog.md#naming--format-800-899) | Naming and format errors |
| 900-999 | [Catalog & Publishing](./catalog.md#catalog--publishing-900-999) | Catalog and publishing errors |

## Quick Start

### Command Line

```bash
# Validate with error codes
ossa validate manifest.json

# Example output:
# ❌ Invalid OSSA manifest
#
# Summary: 3 issues found
#   Errors: 2
#   Warnings: 1
#
# 🔴 Errors:
#   [OSSA-001] /: Missing required field
#       → Add the required field to your manifest. Check the schema for required fields.
#       📚 https://openstandardagents.org/docs/errors/ossa-001
#
#   [OSSA-100] /metadata/decentralized_identity/did: Invalid DID format
#       → DID must follow format: did:ossa:[a-z0-9]{32,64}
#       📚 https://openstandardagents.org/docs/errors/ossa-100
```

### Output Formats

```bash
# Human-readable text (default)
ossa validate manifest.json

# JSON (for programmatic use)
ossa validate manifest.json --format=json

# Markdown (for documentation)
ossa validate manifest.json --format=markdown > validation-report.md

# HTML (for web display)
ossa validate manifest.json --format=html > validation-report.html
```

### Programmatic Use

```typescript
import { EnhancedOSSAValidator } from '@openstandardagents/core';

const validator = new EnhancedOSSAValidator();
const result = validator.validateFile('manifest.json');

// Check validity
if (!result.valid) {
  console.log('Validation failed!');

  // Access structured report
  console.log(`Total errors: ${result.report.summary.errorCount}`);

  // Iterate errors
  result.report.errors.forEach((error) => {
    console.log(`[${error.code}] ${error.path}: ${error.message}`);
    console.log(`Fix: ${error.remediation}`);
    console.log(`Docs: ${error.docsUrl}`);
  });

  // Get formatted output
  console.log(result.formatted.text);

  // Export as JSON
  fs.writeFileSync('report.json', result.formatted.json);

  // Export as HTML
  fs.writeFileSync('report.html', result.formatted.html);
}
```

### Error Handling

```typescript
import { OSSAErrorCode, getErrorDetails } from '@openstandardagents/core';

// Handle specific error codes
result.report.errors.forEach((error) => {
  switch (error.code) {
    case OSSAErrorCode.OSSA_001:
      console.log('Missing required field - check schema');
      break;
    case OSSAErrorCode.OSSA_100:
      console.log('Invalid DID - use ossa generate-did');
      break;
    default:
      console.log(`Unexpected error: ${error.code}`);
  }
});

// Get error details
const details = getErrorDetails(OSSAErrorCode.OSSA_001);
console.log(details.remediation); // Remediation steps
console.log(details.examples);    // Code examples
```

### Search and Filter

```typescript
import {
  searchErrorsByTag,
  searchErrorsBySeverity
} from '@openstandardagents/core';

// Find all DID-related errors
const didErrors = searchErrorsByTag('did');
console.log(`Found ${didErrors.length} DID errors`);

// Find all critical errors
const criticalErrors = searchErrorsBySeverity('error');
console.log(`${criticalErrors.length} critical errors in catalog`);

// Filter validation results
const criticalIssues = result.report.errors.filter(
  (e) => e.severity === 'error'
);
```

## Detailed Error Documentation

Each error code has detailed documentation with:
- **Description**: What the error means
- **Common causes**: Why this error occurs
- **Remediation**: Step-by-step fix instructions
- **Examples**: Invalid vs valid manifests
- **Related errors**: Links to related error codes
- **Schema reference**: Relevant schema sections

### Example Pages

- [OSSA-001: Missing Required Field](./ossa-001.md)
- [OSSA-100: Invalid DID Format](./oss-100.md)
- [OSSA-210: Invalid Trait](./ossa-210.md)
- [Full Catalog](./catalog.md)

## Error Statistics

Current catalog (v0.3.6):
- **Total errors**: 101
- **Critical errors**: 71 (70%)
- **Warnings**: 24 (24%)
- **Info**: 6 (6%)

## Contributing

### Adding New Error Codes

1. **Update catalog** (`src/validation/error-codes.ts`):
```typescript
export enum OSSAErrorCode {
  // ...existing codes
  OSSA_XXX = 'OSSA-XXX',
}

export const ERROR_CATALOG: Record<OSSAErrorCode, ErrorDetails> = {
  // ...existing entries
  [OSSAErrorCode.OSSA_XXX]: {
    code: OSSAErrorCode.OSSA_XXX,
    severity: 'error',
    message: 'Clear, concise error message',
    remediation: 'Step-by-step fix instructions',
    docsUrl: 'https://openstandardagents.org/docs/errors/ossa-xxx',
    examples: [
      {
        title: 'Example name',
        invalid: '{ "bad": "example" }',
        valid: '{ "good": "example" }',
        explanation: 'Why the fix works',
      },
    ],
    tags: ['category', 'subcategory'],
  },
};
```

2. **Create documentation** (`docs/errors/ossa-xxx.md`):
```markdown
# OSSA-XXX: Error Title

**Severity**: Error
**Category**: Category Name
**Tags**: tag1, tag2

## Description
...

## Remediation
...

## Examples
...
```

3. **Update catalog** (`docs/errors/catalog.md`):
```markdown
| [OSSA-XXX](./ossa-xxx.md) | error | Error message | tags |
```

4. **Add tests** (`tests/validation/error-codes.test.ts`):
```typescript
test('OSSA-XXX: Error name', () => {
  const details = getErrorDetails(OSSAErrorCode.OSSA_XXX);
  expect(details).toBeDefined();
  expect(details.code).toBe('OSSA-XXX');
});
```

### Improving Existing Errors

1. **Add better examples**: Show more invalid/valid pairs
2. **Enhance remediation**: Provide clearer step-by-step instructions
3. **Link related errors**: Cross-reference similar issues
4. **Update documentation**: Improve detailed error pages

## Best Practices

### For Developers

1. **Always show error codes**: Display OSSA-XXX in error messages
2. **Link to documentation**: Include docsUrl in error output
3. **Show remediation**: Display remediation steps, not just errors
4. **Use structured output**: Export JSON/HTML for integration

### For Users

1. **Read full error docs**: Click docsUrl for complete guidance
2. **Check examples**: Compare your manifest to examples
3. **Follow remediation**: Apply fixes step-by-step
4. **Search by tag**: Find related errors using tags

### For Tool Authors

1. **Handle error codes**: Switch on OSSAErrorCode enum
2. **Display remediation**: Show actionable fix instructions
3. **Export multiple formats**: Support JSON, Markdown, HTML
4. **Filter by severity**: Let users focus on critical issues

## API Reference

### Error Codes

```typescript
import { OSSAErrorCode } from '@openstandardagents/core';

// All error codes
const allCodes = Object.values(OSSAErrorCode);

// Specific code
const code = OSSAErrorCode.OSSA_001;
```

### Error Details

```typescript
import { getErrorDetails, ErrorDetails } from '@openstandardagents/core';

const details: ErrorDetails = getErrorDetails(OSSAErrorCode.OSSA_001);

console.log(details.code);         // OSSA-001
console.log(details.severity);     // error
console.log(details.message);      // Missing required field
console.log(details.remediation);  // Add the required field...
console.log(details.docsUrl);      // https://...
console.log(details.examples);     // Example[]
console.log(details.tags);         // ['schema', 'validation']
```

### Validation

```typescript
import { EnhancedOSSAValidator } from '@openstandardagents/core';

const validator = new EnhancedOSSAValidator();
const result = validator.validateFile('manifest.json');

// Access report
const report = result.report;
console.log(report.valid);                  // boolean
console.log(report.errors);                 // FormattedError[]
console.log(report.warnings);               // FormattedError[]
console.log(report.info);                   // FormattedError[]
console.log(report.summary.errorCount);     // number

// Access formatted output
console.log(result.formatted.text);       // string
console.log(result.formatted.json);       // string
console.log(result.formatted.markdown);   // string
console.log(result.formatted.html);       // string
```

### Search

```typescript
import {
  searchErrorsByTag,
  searchErrorsBySeverity
} from '@openstandardagents/core';

// Search by tag
const didErrors = searchErrorsByTag('did');
const geneticsErrors = searchErrorsByTag('genetics');

// Search by severity
const errors = searchErrorsBySeverity('error');
const warnings = searchErrorsBySeverity('warning');
const info = searchErrorsBySeverity('info');
```

## See Also

- [OSSA Specification](../../spec/v0.3/ossa-0.3.6.schema.json)
- [Validation Guide](../validation-guide.md)
- [Best Practices](../best-practices.md)
- [Examples](../../examples/)

## Support

- **GitHub**: [Open an issue](https://github.com/bluefly-ai/openstandardagents/issues)
- **Discord**: [Join community](https://discord.gg/openstandardagents)
- **Docs**: [Full documentation](https://openstandardagents.org/docs)
