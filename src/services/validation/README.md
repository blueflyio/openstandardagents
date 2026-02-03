# Enhanced Validation Services

Comprehensive validation suite for OSSA agent manifests with cost estimation, security checks, and best practices validation.

## Overview

The Enhanced Validator provides a complete validation solution that goes beyond schema validation to include:

- **Cost Estimation**: Estimate runtime costs based on LLM provider, model, and usage patterns
- **Security Validation**: Detect security vulnerabilities and exposed secrets
- **Best Practices**: Check manifests against OSSA best practices and recommendations
- **Schema Validation**: Standard JSON Schema validation (via existing ValidationService)

## Architecture

### SOLID Principles

- **Single Responsibility**: Each validator focuses on one concern
- **Open/Closed**: Extensible through composition
- **Dependency Inversion**: Uses interfaces and dependency injection
- **DRY**: Centralized pricing data and validation rules

### Components

```
EnhancedValidator (orchestrator)
  ├── ValidationService (schema validation)
  ├── CostEstimator (cost estimation)
  ├── SecurityValidator (security checks)
  └── BestPracticesValidator (best practices)
```

## Usage

### Basic Validation

```typescript
import { EnhancedValidator } from './services/validation';
import { Container } from 'inversify';

// Setup DI container
const container = new Container();
container.bind(SchemaRepository).toSelf();
container.bind(ValidationService).toSelf();
container.bind(EnhancedValidator).toSelf();

const validator = container.get(EnhancedValidator);

// Validate a manifest
const manifest = {
  apiVersion: 'ossa/v0.3.6',
  kind: 'Agent',
  metadata: {
    name: 'my-agent',
    version: '1.0.0',
    description: 'My AI agent',
  },
  spec: {
    role: 'Assistant',
    llm: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    },
  },
};

const report = await validator.validate(manifest);

console.log(`Schema Valid: ${report.schemaValid}`);
console.log(`Security Score: ${report.security.score}/100`);
console.log(`Best Practices Score: ${report.bestPractices.score}/100`);
console.log(`Estimated Daily Cost: $${report.cost.estimatedDailyCost}`);
console.log(`Overall Passed: ${report.passed}`);
```

### Generate Reports

```typescript
// Human-readable text report
const textReport = validator.generateTextReport(report);
console.log(textReport);

// JSON report
const jsonReport = validator.generateJsonReport(report);
```

### Validation Summary

```typescript
const summary = validator.getSummary(report);
console.log(summary);
// {
//   passed: true,
//   schemaValid: true,
//   securityScore: 85,
//   bestPracticesScore: 90,
//   estimatedDailyCost: 0.15,
//   criticalIssues: 0,
//   warnings: 2
// }
```

## Cost Estimation

### Supported Providers

- **OpenAI**: gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo, o1-preview, o1-mini
- **Anthropic**: claude-opus-4, claude-sonnet-4, claude-haiku-4, claude-3-*
- **Google**: gemini-1.5-pro, gemini-1.5-flash, gemini-pro
- **Cohere**: command-r-plus, command-r, command
- **Mistral**: mistral-large, mistral-medium, mistral-small

### Pricing (as of 2026-02-02)

Prices are per 1K tokens (input/output):

```typescript
{
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
  },
  anthropic: {
    'claude-opus-4': { input: 0.015, output: 0.075 },
    'claude-sonnet-4': { input: 0.003, output: 0.015 }
  }
}
```

### Cost Recommendations

The cost estimator provides recommendations such as:

- Model suggestions for cost savings
- Warnings about high daily costs
- Token optimization tips
- Missing constraints warnings

## Security Validation

### Checks Performed

1. **Exposed Secrets**
   - API key patterns (OpenAI, Anthropic, Google, etc.)
   - Private keys
   - Bearer tokens
   - Suspicious environment variables

2. **Insecure Configurations**
   - Missing authentication
   - HTTP endpoints (should be HTTPS)
   - Missing autonomy controls

3. **Excessive Permissions**
   - High autonomy without approval
   - Wildcard permissions

4. **Missing Security Controls**
   - No autonomy configuration
   - No constraints
   - No observability

### Severity Levels

- **Critical**: Exposed secrets, severe vulnerabilities
- **High**: Missing authentication, excessive permissions
- **Medium**: Insecure endpoints, missing controls
- **Low**: Missing observability, dependency issues
- **Info**: General recommendations

### Common Vulnerabilities Detected

```typescript
// CWE-798: Use of Hard-coded Credentials
{
  severity: 'critical',
  category: 'exposed_secret',
  message: 'Potential API key found in manifest',
  cwe: 'CWE-798'
}

// CWE-306: Missing Authentication
{
  severity: 'medium',
  category: 'missing_auth',
  message: 'Tool has endpoint but no authentication',
  cwe: 'CWE-306'
}
```

## Best Practices Validation

### Categories

1. **Metadata**
   - Description completeness
   - Version following semver
   - Author information
   - Tags for discoverability

2. **LLM Configuration**
   - Provider and model specified
   - Temperature settings
   - Token limits

3. **Tools**
   - Tool descriptions
   - Input/output schemas
   - Clear naming

4. **Autonomy**
   - Autonomy level defined
   - Approval requirements
   - Action restrictions

5. **Constraints**
   - Cost constraints
   - Performance constraints
   - Resource limits

6. **Observability**
   - Tracing enabled
   - Metrics collection
   - Logging configuration

7. **Messaging** (v0.3.0+)
   - Channel descriptions
   - Message examples
   - Reliability configuration

### Issue Severity

- **Error**: Critical best practices violations (score -15 each)
- **Warning**: Important recommendations (score -8 each)
- **Info**: Optional improvements (score -3 each)

## Validation Report Structure

```typescript
interface EnhancedValidationReport {
  // Schema validation
  schemaValid: boolean;
  schemaErrors: ErrorObject[];
  schemaWarnings: string[];

  // Best practices
  bestPractices: {
    score: number; // 0-100
    issues: BestPracticeIssue[];
    passed: boolean; // score >= 80
  };

  // Security
  security: {
    score: number; // 0-100
    vulnerabilities: SecurityVulnerability[];
    passed: boolean; // score >= 70 && no critical
  };

  // Cost estimation
  cost: {
    provider: string;
    model: string;
    estimatedDailyCost: number;
    estimatedMonthlyCost: number;
    breakdown: {
      inputCost: number;
      outputCost: number;
      requestsPerDay: number;
      tokensPerRequest: { input: number; output: number };
    };
    recommendations: string[];
    currency: string;
  };

  // Overall
  passed: boolean; // All checks passed
  manifest?: OssaAgent;
}
```

## Testing

Comprehensive test suite with >80% coverage:

```bash
npm test -- tests/unit/validation/enhanced-validator.test.ts
```

### Test Coverage

- Schema validation integration
- Cost estimation accuracy
- Security vulnerability detection
- Best practices checking
- Multiple manifests validation
- Report generation
- Integration tests with real-world manifests

## Examples

### Example 1: Secure, Well-Configured Agent

```typescript
const manifest = {
  apiVersion: 'ossa/v0.3.6',
  kind: 'Agent',
  metadata: {
    name: 'secure-agent',
    version: '1.0.0',
    description: 'A well-configured secure agent',
    author: 'Security Team',
    tags: ['production', 'secure'],
  },
  spec: {
    role: 'Data Analyst',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      temperature: 0.3,
      maxTokens: 4000,
    },
    tools: [
      {
        type: 'mcp',
        name: 'data-api',
        server: 'mcp-server-api',
        auth: {
          type: 'bearer',
          credentials: '${API_TOKEN}', // Environment variable
        },
      },
    ],
    autonomy: {
      level: 'supervised',
      approval_required: true,
      allowed_actions: ['read', 'analyze'],
      blocked_actions: ['delete', 'modify'],
    },
    constraints: {
      cost: {
        maxTokensPerDay: 100000,
        maxCostPerDay: 10.0,
      },
      performance: {
        maxLatencySeconds: 30,
        timeoutSeconds: 60,
      },
    },
    observability: {
      tracing: { enabled: true },
      metrics: { enabled: true },
      logging: { level: 'info' },
    },
  },
};

// Result: High scores, minimal warnings
// Security: 95/100
// Best Practices: 90/100
// Estimated Daily Cost: ~$3.00
```

### Example 2: Insecure Agent (Anti-pattern)

```typescript
const manifest = {
  apiVersion: 'ossa/v0.3.6',
  kind: 'Agent',
  metadata: { name: 'insecure-agent' },
  spec: {
    role: 'Assistant',
    llm: { provider: 'openai', model: 'gpt-4' },
    tools: [
      {
        type: 'api',
        endpoint: 'http://api.example.com', // HTTP, not HTTPS
        auth: {
          type: 'apiKey',
          credentials: 'sk-1234567890abcdef', // EXPOSED SECRET!
        },
      },
    ],
    autonomy: {
      level: 'autonomous',
      approval_required: false, // Dangerous!
      allowed_actions: ['*'], // Wildcard!
    },
  },
};

// Result: Critical security issues
// Security: 20/100 (FAILED - critical vulnerabilities)
// Best Practices: 40/100
// Multiple critical vulnerabilities detected
```

## Integration

The Enhanced Validator integrates with the existing ValidationService via dependency injection:

```typescript
// DI Container setup
container.bind(SchemaRepository).toSelf();
container.bind(ValidationService).toSelf();
container.bind(EnhancedValidator).toSelf();

// The EnhancedValidator uses ValidationService internally
// for schema validation, then adds cost/security/best practices
```

## Performance

- **Parallel Validation**: Security, cost, and best practices run in parallel
- **Caching**: Schema repository caches loaded schemas
- **Efficient**: Typical validation completes in <200ms

## Future Enhancements

- [ ] Add more LLM providers (AWS Bedrock, Azure OpenAI)
- [ ] Real-time pricing updates
- [ ] Custom security rules
- [ ] Configurable best practices thresholds
- [ ] Integration with CI/CD pipelines
- [ ] Policy enforcement (Cedar, OPA)

## Contributing

Follow OSSA development standards:

- DRY: No duplication
- SOLID: Single responsibility
- API-First: OpenAPI-driven
- Tests: >80% coverage required
