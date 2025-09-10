# OSSA Development Guide
## Comprehensive Guide for Contributors and Developers

> **Open Standards for Scalable Agents (OSSA) v0.1.8**  
> Enterprise-grade development standards with technical excellence

---

## 🎯 Development Mission

OSSA establishes the definitive technical framework for universal AI agent interoperability through:

- ✅ **Universal Agent Discovery Protocol (UADP)** - Hierarchical, distributed agent discovery
- ✅ **Protocol-Agnostic Architecture** - Runtime translation between all major AI frameworks
- ✅ **Progressive Specification Complexity** - Bronze → Silver → Gold certification levels
- ✅ **Enterprise Production Standards** - Built on OpenAPI 3.1 with comprehensive compliance
- ✅ **Runtime Translation Engine** - No-modification integration with existing implementations

---

## 🏗️ Technical Architecture

### Core Architecture Components

```typescript
interface OAASArchitecture {
  discovery: UniversalAgentDiscoveryProtocol;    // UADP v1.0
  translation: RuntimeTranslationEngine;         // Multi-protocol bridge
  validation: ComplianceValidationEngine;        // Bronze/Silver/Gold certification
  orchestration: WorkspaceOrchestrationEngine;   // Multi-agent coordination
  governance: EnterpriseGovernanceFramework;     // ISO 42001, NIST AI RMF, EU AI Act
}
```

### Production Implementation Status

**✅ PRODUCTION-READY COMPONENTS:**
- **UADP Discovery Engine** - Operational hierarchical agent discovery
- **Validation API Server** - Running on port 3003 with enterprise features  
- **MCP Server Integration** - Complete Claude Desktop compatibility
- **CLI Integration** - Gold-level compliance with comprehensive tooling
- **Workspace Orchestrator** - Multi-agent coordination with performance monitoring

---

## 🚀 Development Setup

### Prerequisites

**System Requirements:**
- Node.js 18+ (required for ES modules and modern TypeScript)
- Git 2.30+ (for proper branch management)
- TypeScript 5.0+ (for OpenAPI 3.1 schema support)
- Docker (optional, for containerized testing)

**Recommended Tools:**
- VS Code with OSSA extension
- Postman/Insomnia for API testing
- GitLab CI/CD for automation

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/ossa-ai/open-standards-scalable-agents.git
cd open-standards-scalable-agents

# Install dependencies
npm install

# Install global CLI tools
npm install -g @bluefly/open-standards-scalable-agents@0.1.8

# Verify installation
ossa --version
npm test
```

### 2. Development Environment Configuration

```bash
# Set up development environment variables
export NODE_ENV=development
export OSSA_DEBUG=true
export OSSA_LOG_LEVEL=debug

# Configure IDE settings
cp .vscode/settings.example.json .vscode/settings.json

# Install pre-commit hooks
npx husky install
npm run prepare
```

### 3. Project Structure Understanding

```
ossa/
├── .ossa/                          # Project configuration
├── api/                            # OpenAPI 3.1 specifications
├── cli/                            # CLI source code and commands
├── docs/                           # Documentation (this file)
├── examples/                       # Reference implementations
├── lib/                            # Core library implementations
├── spec/                           # OSSA specifications
│   ├── schemas/                   # JSON Schema definitions
│   └── v0.1.8/                   # Version-specific specs
├── src/                           # Source code
│   ├── services/                 # Core services
│   ├── validators/               # Validation engines
│   └── utils/                    # Shared utilities
├── templates/                      # Agent templates
└── test/                          # Test suites
```

---

## 🛠️ Development Workflow

### Golden Development Pattern

OSSA follows the **Golden Workflow** pattern for all development:

```bash
# 1. Create feature branch (semantic versioning)
git checkout -b feature/0.1.8-new-validation-engine

# 2. Implement with test-driven development
npm run test:watch                 # Start TDD cycle

# 3. Validate compliance throughout development
ossa validate --all --strict      # Continuous validation
npm run lint                       # Code quality
npm run typecheck                  # TypeScript compliance

# 4. Use golden workflow commands
ossa create agent-name --tier advanced  # Use existing patterns
forge golden validate --comprehensive   # Don't create random scripts

# 5. Commit with proper semantic messages
git commit -m "feat(validation): add OpenAPI 3.1 strict validation engine

- Implement TypeBox-based schema validation
- Add Spectral linting for OpenAPI specs  
- Ensure OSSA 0.1.8 compliance
- Include comprehensive test coverage"
```

### Code Style Standards

**TypeScript/JavaScript:**
```typescript
// Use strict TypeScript configuration
import { Agent, ValidationResult } from '../types/ossa.js';

export class ValidationEngine {
  private readonly schemas: Map<string, JsonSchema>;
  
  constructor(private readonly config: ValidationConfig) {
    this.schemas = new Map();
  }
  
  /**
   * Validate agent specification against OSSA v0.1.8 standard
   * @param agent - Agent specification to validate
   * @returns Promise resolving to validation result
   */
  async validateAgent(agent: Agent): Promise<ValidationResult> {
    // Implementation with proper error handling
    try {
      const result = await this.performValidation(agent);
      return { 
        valid: result.errors.length === 0,
        errors: result.errors,
        warnings: result.warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: error.message, path: 'root' }],
        warnings: []
      };
    }
  }
}
```

**YAML/JSON Standards:**
```yaml
# Use consistent OSSA v0.1.8 format
apiVersion: ossa.bluefly.ai/v0.1.8
kind: Agent
metadata:
  name: example-agent
  description: Well-documented example agent
  version: 1.0.0
  tier: advanced
  domain: security
spec:
  openapi: 3.1.0
  info:
    title: Example Agent API
    version: 1.0.0
    description: |
      Comprehensive description of agent capabilities
      following OpenAPI 3.1 documentation standards
```

---

## 🧪 Testing Framework

### Testing Architecture

```bash
# Test structure follows the source structure
test/
├── unit/                          # Unit tests (Jest)
│   ├── services/
│   ├── validators/
│   └── utils/
├── integration/                   # Integration tests (Playwright)
│   ├── api/
│   ├── cli/
│   └── discovery/
├── e2e/                          # End-to-end tests
│   ├── workflows/
│   └── compliance/
└── fixtures/                     # Test data and mocks
    ├── agents/
    └── schemas/
```

### Running Tests

```bash
# Unit tests with coverage
npm test                          # Run all unit tests
npm run test:coverage            # Generate coverage report
npm run test:watch               # Watch mode for TDD

# Integration tests
npm run test:integration         # API and service integration
npm run test:cli                 # CLI command testing

# End-to-end tests
npm run test:e2e                 # Complete workflow testing
npm run test:compliance          # Compliance validation testing

# Performance tests
npm run test:performance         # Load and performance testing
```

### Test Coverage Requirements

| Test Type | Minimum Coverage | Target Coverage |
|-----------|------------------|-----------------|
| **Unit Tests** | 80% | 90% |
| **Integration Tests** | 85% | 95% |
| **Critical Paths** | 90% | 100% |
| **API Endpoints** | 95% | 100% |
| **CLI Commands** | 85% | 95% |

### Writing Quality Tests

```typescript
// Example of well-structured test
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ValidationEngine } from '../src/validators/validation-engine.js';
import { mockAgent, mockConfig } from './fixtures/test-data.js';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;
  
  beforeEach(() => {
    engine = new ValidationEngine(mockConfig);
  });
  
  describe('validateAgent', () => {
    it('should validate correct OSSA v0.1.8 agent specification', async () => {
      // Arrange
      const validAgent = mockAgent({ 
        apiVersion: 'ossa.bluefly.ai/v0.1.8',
        kind: 'Agent' 
      });
      
      // Act
      const result = await engine.validateAgent(validAgent);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should reject agent with invalid capability prefix format', async () => {
      // Arrange - Test specific error condition
      const invalidAgent = mockAgent({
        spec: {
          paths: {
            '/test': {
              post: {
                operationId: 'invalidFormat' // Missing ossa prefix
              }
            }
          }
        }
      });
      
      // Act
      const result = await engine.validateAgent(invalidAgent);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('operationId must follow ossa.domain.capability format'),
          path: 'spec.paths./test.post.operationId'
        })
      );
    });
  });
});
```

---

## 📦 Build and Release Process

### Build Configuration

```bash
# Build all components
npm run build                    # Full production build
npm run build:cli               # CLI tools only  
npm run build:lib               # Core libraries
npm run build:api               # API specifications

# Development builds
npm run dev                     # Development server
npm run watch                   # Watch mode compilation
```

### Release Process

```bash
# 1. Version bump (semantic versioning)
npm run version:patch           # 0.1.8 → 0.1.9
npm run version:minor           # 0.1.8 → 0.2.0  
npm run version:major           # 0.1.8 → 1.0.0

# 2. Pre-release validation
npm run validate:all            # Comprehensive validation
npm run test:all                # All test suites
npm run lint:fix                # Fix linting issues
npm run typecheck              # TypeScript validation

# 3. Generate documentation
npm run docs:build              # API documentation
npm run changelog:generate      # Release notes

# 4. Publish (automated via CI/CD)
npm run publish:safe            # Publish with validation
```

### Publishing Checklist

**Pre-Publish Validation:**
- [ ] All tests pass with required coverage
- [ ] TypeScript compilation successful
- [ ] Linting passes with zero errors
- [ ] Documentation is up-to-date
- [ ] CHANGELOG.md updated with release notes
- [ ] Version numbers consistent across all files
- [ ] No security vulnerabilities detected
- [ ] OpenAPI specifications validate successfully

---

## 🔧 CLI Development

### Adding New Commands

```typescript
// cli/src/commands/new-command.ts
import { Command } from 'commander';
import { logger } from '../utils/logger.js';

export function createNewCommand(): Command {
  return new Command('new-command')
    .description('Description of what the command does')
    .option('-f, --format <format>', 'Output format', 'yaml')
    .option('--verbose', 'Enable verbose logging')
    .argument('<path>', 'Path to agent or directory')
    .action(async (path: string, options) => {
      try {
        // Command implementation
        logger.info(`Processing ${path} with format ${options.format}`);
        
        // Your command logic here
        const result = await processCommand(path, options);
        
        // Output results
        console.log(JSON.stringify(result, null, 2));
        
      } catch (error) {
        logger.error(`Command failed: ${error.message}`);
        process.exit(1);
      }
    });
}

// Register command in cli/src/index.ts
program.addCommand(createNewCommand());
```

### CLI Testing

```bash
# Test CLI commands
npm run test:cli                # All CLI tests
npm run test:cli:unit          # Unit tests for CLI
npm run test:cli:integration   # CLI integration tests

# Manual testing
./bin/ossa --help              # Test help system
./bin/ossa validate --dry-run  # Test with dry run
```

---

## 🛡️ Security and Compliance

### Security Standards

**Code Security:**
```bash
# Security validation tools
npm audit                      # Dependency vulnerabilities
npm run security:scan         # Static code analysis
npm run security:deps         # Dependency security check
```

**OSSA Security Requirements:**
- All agent communications encrypted (TLS 1.3+)
- API authentication via bearer tokens or mTLS
- Input validation for all external data
- No hardcoded secrets or credentials
- Comprehensive audit logging

### Compliance Framework Integration

```typescript
// Example compliance validation
import { ComplianceValidator } from '../validators/compliance.js';

const validator = new ComplianceValidator({
  frameworks: ['ISO-42001', 'NIST-AI-RMF', 'EU-AI-ACT'],
  strictMode: true
});

const complianceResult = await validator.validate(agent, {
  includeRecommendations: true,
  generateReport: true
});
```

---

## 📈 Performance and Monitoring

### Performance Standards

| Metric | Target | Critical |
|--------|--------|----------|
| **Agent Discovery** | < 500ms | < 1000ms |
| **Validation** | < 100ms | < 250ms |
| **Translation** | < 50ms | < 100ms |
| **Memory Usage** | < 100MB | < 200MB |

### Monitoring Integration

```typescript
// Performance monitoring example
import { PerformanceMonitor } from '../utils/monitoring.js';

@PerformanceMonitor.trace('agent-validation')
async function validateAgent(agent: Agent): Promise<ValidationResult> {
  const start = Date.now();
  
  try {
    const result = await performValidation(agent);
    
    // Record metrics
    PerformanceMonitor.recordMetric('validation.duration', Date.now() - start);
    PerformanceMonitor.recordMetric('validation.success', 1);
    
    return result;
  } catch (error) {
    PerformanceMonitor.recordMetric('validation.error', 1);
    throw error;
  }
}
```

---

## 🐛 Debugging and Troubleshooting

### Debug Configuration

```bash
# Enable debug logging
export OSSA_DEBUG=true
export OSSA_LOG_LEVEL=debug
export NODE_ENV=development

# Run with debugging
ossa validate --debug --verbose agents/example.yaml
```

### Common Development Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| **TypeScript Compilation Errors** | Build fails with type errors | Run `npm run typecheck` and fix type issues |
| **Test Failures** | Tests fail unexpectedly | Check test fixtures and mock data |
| **CLI Command Issues** | Commands not working | Verify command registration in CLI index |
| **Performance Degradation** | Slow validation/discovery | Profile with `--trace-warnings` flag |
| **OpenAPI Validation Errors** | Schema validation fails | Use Spectral linting: `npm run lint:openapi` |

### Debug Tools

```bash
# Node.js debugging
node --inspect-brk ./bin/ossa validate agent.yaml

# Performance profiling  
node --prof ./bin/ossa validate large-directory/

# Memory usage analysis
node --trace-gc ./bin/ossa validate memory-test.yaml
```

---

## 🤝 Contributing Guidelines

### Pull Request Process

1. **Fork and Branch**
   ```bash
   git fork https://github.com/ossa-ai/open-standards-scalable-agents
   git checkout -b feature/0.1.8-your-feature-name
   ```

2. **Development**
   - Follow TDD principles
   - Write comprehensive tests
   - Ensure compliance validation passes
   - Update documentation

3. **Pre-Submission Checklist**
   ```bash
   npm run validate:all          # Full validation
   npm run test:all             # All tests
   npm run lint:fix             # Code quality
   npm run docs:build           # Documentation
   ```

4. **Submit Pull Request**
   - Clear description of changes
   - Reference any related issues
   - Include test results and validation output

### Code Review Standards

**Review Criteria:**
- [ ] Code follows established patterns and standards
- [ ] Comprehensive test coverage (minimum 80%)
- [ ] Documentation updated appropriately
- [ ] No breaking changes without major version bump
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] OpenAPI 3.1 compliance maintained

---

## 📚 Additional Resources

### Development References

- **[OSSA Specification v0.1.8](../spec/v0.1.8/README.md)** - Complete technical specification
- **[API Reference](../reference/api/README.md)** - Comprehensive API documentation  
- **[OpenAPI 3.1 Guide](../guides/openapi-3.1.md)** - OpenAPI 3.1 implementation guide
- **[Compliance Framework](../enterprise/compliance.md)** - Enterprise compliance requirements

### Tools and Extensions

- **VS Code OSSA Extension** - Syntax highlighting and validation
- **Postman Collection** - API testing collection
- **Docker Development Environment** - Containerized development setup
- **GitLab CI/CD Templates** - Automated testing and deployment

### Community and Support

- **GitHub Discussions** - Technical discussions and Q&A
- **Discord Community** - Real-time developer chat  
- **Monthly Developer Calls** - Community sync meetings
- **Documentation Wiki** - Community-maintained documentation

---

**🚀 Ready to contribute to the future of AI agent interoperability? Start with our [Getting Started Guide](../getting-started/README.md) and join the OSSA development community!**