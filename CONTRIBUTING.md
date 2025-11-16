# Contributing to OSSA

Thank you for your interest in contributing to **OSSA (Open Standard for AI Agents)**!

OSSA is a community-driven open standard, and we welcome contributions from developers, researchers, and organizations working with AI agents.

---

## Ways to Contribute

### 1. Specification Improvements
- Propose schema enhancements
- Add new platform extensions (Cursor, LangChain, etc.)
- Improve documentation clarity
- Add examples for new use cases

### 2. Documentation
- Fix typos or unclear sections
- Add tutorials and guides
- Translate documentation
- Create integration examples

### 3. Examples
- Add OSSA manifests for your agent
- Share migration guides from other frameworks
- Contribute platform-specific examples

### 4. Tooling
- Improve OSSA CLI
- Add validation rules
- Enhance error messages
- Contribute to test coverage

### 5. Community
- Answer questions in discussions
- Share your OSSA implementation
- Write blog posts or tutorials
- Present OSSA at conferences

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS)
- npm or pnpm
- Git
- GitLab account (primary development platform)

### Development Setup

```bash
# Clone the repository (GitLab preferred)
git clone https://gitlab.bluefly.io/llm/openapi-ai-agents-standard.git
cd openapi-ai-agents-standard

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Validate an example
npm run validate examples/getting-started/hello-world-complete.ossa.yaml
```

---

## Contribution Workflow

### Step 1: Create an Issue

Before starting work, **create a GitLab issue** describing:
- What you want to add/change
- Why it's needed
- How you plan to implement it

This helps avoid duplicate work and ensures alignment with OSSA's goals.

### Step 2: Fork & Branch

```bash
# Fork the repository on GitLab
# Clone your fork
git clone https://gitlab.bluefly.io/YOUR_USERNAME/openapi-ai-agents-standard.git
cd openapi-ai-agents-standard

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### Step 3: Make Your Changes

```bash
# Make your changes
# Add tests if applicable
npm run test

# Ensure code quality
npm run lint
npm run typecheck

# Build to verify
npm run build
```

### Step 4: Commit

We use conventional commits:

```bash
git add .
git commit -m "feat: add support for X platform extension"
# or
git commit -m "fix: correct validation for Y field"
# or
git commit -m "docs: improve README quick start section"
```

**Commit Types**:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Build process, dependencies

### Step 5: Push & Create MR

```bash
# Push to your fork
git push origin feature/your-feature-name

# On GitLab, create a Merge Request (MR) targeting `development` branch
# Fill out the MR template with:
# - Summary of changes
# - Link to related issue
# - Test plan
```

---

## Testing Requirements

All contributions must include tests where applicable:

### For Specification Changes
```bash
# Add schema validation tests
npm run test:unit

# Ensure all examples still validate
npm run test:integration
```

### For New Platform Extensions
```bash
# Add validator tests in tests/unit/services/validators/
# Add integration tests in tests/integration/
# Add example manifests in examples/YOUR_PLATFORM/
```

### For Documentation
```bash
# Verify all code examples work
# Check for broken links
# Ensure markdown formatting is correct
```

---

## Code Style

We use:
- **Prettier** for formatting
- **ESLint** for code quality
- **TypeScript** with strict mode

```bash
# Auto-format code
npm run format

# Check linting
npm run lint

# Type check
npm run typecheck
```

---

## Schema Design Principles

When proposing schema changes, follow these principles:

1. **Simplicity First** - OSSA should be easy to understand
2. **Vendor Neutral** - No bias toward any framework
3. **Backward Compatible** - Don't break existing manifests
4. **Well Documented** - Every field needs clear documentation
5. **Validated** - Add JSON Schema validation rules
6. **Tested** - Include example manifests

---

## Platform Extension Guidelines

Adding a new platform extension (e.g., Anthropic, Vercel AI)?

### 1. Create Schema Extension

Add to `spec/v0.2.3/ossa-0.2.3.schema.json`:

```json
"definitions": {
  "YourPlatformExtension": {
    "type": "object",
    "properties": {
      "platform_specific_field": {
        "type": "string",
        "description": "Description of what this does"
      }
    }
  }
}
```

### 2. Add Validator

Create `src/services/validators/your-platform.validator.ts`:

```typescript
export class YourPlatformValidator {
  validate(extension: any): ValidationResult {
    // Validation logic
  }
}
```

### 3. Add Tests

```typescript
// tests/unit/services/validators/your-platform.validator.test.ts
describe('YourPlatformValidator', () => {
  it('should validate valid extension', () => {
    // Test
  });
});
```

### 4. Add Examples

```yaml
# examples/your-platform/example-agent.ossa.yaml
apiVersion: ossa/v0.2.3
kind: Agent
metadata:
  name: example-agent
spec:
  # ...
extensions:
  your_platform:
    platform_specific_field: "value"
```

### 5. Update Documentation

- Add platform docs to `docs/platforms/your-platform.md`
- Update README with platform support
- Add migration guide if applicable

---

## Documentation Standards

### Markdown
- Use ATX-style headers (`#` not `===`)
- Code blocks with language tags
- Links use reference style for readability
- No trailing whitespace

### Examples
- All examples must be valid OSSA manifests
- Include comprehensive inline comments
- Show both minimal and complete versions
- Test that examples validate

### API Documentation
- JSDoc comments on all public APIs
- Parameter descriptions with types
- Return value descriptions
- Usage examples

---

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Email: security@bluefly.io

We'll respond within 48 hours and work with you to address the issue.

### Security Best Practices

- No hardcoded credentials in examples
- Sanitize all user inputs in validators
- Use secure defaults in generated manifests
- Validate all external inputs

---

## License

By contributing to OSSA, you agree that your contributions will be licensed under the **Apache License 2.0**.

All contributions must be your own work or properly attributed.

---

## Code of Conduct

### Our Standards

- **Be respectful** - Treat all contributors with respect
- **Be constructive** - Provide helpful feedback
- **Be inclusive** - Welcome diverse perspectives
- **Be collaborative** - Work together toward common goals

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

Violations may result in temporary or permanent bans.

---

## Questions?

- **GitLab Discussions**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues
- **GitLab Wiki**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis
- **Email**: support@bluefly.io

---

## Recognition

Contributors are recognized in:
- README.md acknowledgments
- Release notes
- GitLab contributors page
- Annual contributor reports

Thank you for helping make OSSA the standard for AI agents!

---

**Development Repo**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard
**GitHub Mirror**: https://github.com/BlueflyCollective/OSSA (read-only)
