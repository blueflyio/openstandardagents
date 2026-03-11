---
name: code-review
description: "**Code Reviewer Agent**: Multi-language static code analysis for quality, security vulnerabilities, best practices, maintainability, and complexity metrics. Expertise in TypeScript, JavaScript, PHP, Python, Go, and Rust. Detects code smells, anti-patterns, and suggests improvements. - MANDATORY TRIGGERS: review code, analyze code, code quality, static analysis, code smell, complexity, refactor, code review, check my code, lint code, clean code, technical debt"
license: "Apache-2.0"
compatibility: "Requires language-specific linters (ESLint, PHPCS, etc.). No GitLab access needed."
allowed-tools: "Bash(npm:*) Bash(composer:*) Read Edit Task"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/code-reviewer/agent.ossa.yaml
  service_account: code-reviewer
  service_account_id: pending
  domain: code
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# Code Reviewer Agent Skill

**OSSA Agent**: `code-reviewer` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **code-reviewer** OSSA agent for deep static code analysis, quality assessment, and improvement suggestions across multiple languages.

## Quick Start

```bash
# Install OSSA SDK
npm i @bluefly/openstandardagents
```

## Agent Capabilities (from OSSA Manifest)

### Core Review
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `analyze-code-quality` | reasoning | fully_autonomous | Analyze overall code quality |
| `detect-security-vulnerabilities` | reasoning | fully_autonomous | Detect security vulnerabilities |
| `check-best-practices` | reasoning | fully_autonomous | Check best practices adherence |
| `evaluate-maintainability` | reasoning | fully_autonomous | Evaluate code maintainability |
| `identify-code-smells` | reasoning | fully_autonomous | Identify code smells and anti-patterns |
| `suggest-improvements` | action | fully_autonomous | Suggest code improvements |

### TypeScript Expertise
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `typescript-review` | reasoning | fully_autonomous | TypeScript-specific review |
| `multi-language-support` | reasoning | fully_autonomous | Review in TS, JS, PHP, Python, Go, Rust |

### Quality Metrics
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `quality-metrics` | reasoning | fully_autonomous | Calculate quality metrics |
| `review-diff` | reasoning | fully_autonomous | Review code diffs |
| `analyze-complexity` | reasoning | fully_autonomous | Cyclomatic complexity analysis |
| `critique-review` | reasoning | fully_autonomous | Critical analysis of reviews |
| `pattern-detection` | reasoning | fully_autonomous | Detect design patterns |

## Supported Languages

```yaml
languages:
  typescript:
    linter: eslint
    formatter: prettier
    type_checker: tsc

  javascript:
    linter: eslint
    formatter: prettier

  php:
    linter: phpcs
    analyzer: phpstan
    formatter: phpcbf

  python:
    linter: ruff
    type_checker: mypy
    formatter: black

  go:
    linter: golangci-lint
    formatter: gofmt

  rust:
    linter: clippy
    formatter: rustfmt
```

## Code Smells Detected

```yaml
code_smells:
  complexity:
    - "Function too long (>50 lines)"
    - "Cyclomatic complexity >10"
    - "Nested callbacks (callback hell)"
    - "Deep nesting (>4 levels)"

  duplication:
    - "Copy-paste code"
    - "Similar logic in multiple places"
    - "Magic numbers repeated"

  naming:
    - "Single letter variables"
    - "Unclear function names"
    - "Inconsistent naming convention"

  structure:
    - "God objects"
    - "Feature envy"
    - "Data clumps"
    - "Inappropriate intimacy"

  performance:
    - "N+1 queries"
    - "Unnecessary loops"
    - "Memory leaks"
    - "Blocking operations in async"
```

## Security Patterns

```yaml
security_patterns:
  injection:
    - sql: "String concatenation in queries"
    - xss: "Unsanitized user input in HTML"
    - command: "Shell commands with user input"

  authentication:
    - "Hardcoded credentials"
    - "Weak password validation"
    - "Missing rate limiting"

  data:
    - "Sensitive data in logs"
    - "Unencrypted secrets"
    - "Missing input validation"
```

## Review Report Template

```markdown
## Code Review Report

### File: <filename>
- **Language**: TypeScript
- **Lines**: 450
- **Functions**: 12

### Quality Score: 7.5/10

### Issues Found

#### Critical (0)
None

#### High (2)
1. **Security**: Potential XSS in line 45
   ```typescript
   element.innerHTML = userInput; // UNSAFE
   ```
   **Fix**: Use `textContent` or sanitize input

2. **Performance**: N+1 query pattern in line 120-135
   **Fix**: Use batch query

#### Medium (5)
1. Function `processData` is 75 lines (max: 50)
2. Cyclomatic complexity 15 in `validateInput`
3. Magic number `86400` on line 67
4. Duplicate logic in `save()` and `update()`
5. Deep nesting (5 levels) in `handleResponse`

#### Low (8)
- Missing JSDoc on public functions
- Inconsistent naming: `getData` vs `fetch_items`
- [...]

### Metrics
| Metric | Value | Threshold |
|--------|-------|-----------|
| Cyclomatic Complexity (avg) | 8.2 | <10 |
| Lines per Function (avg) | 32 | <50 |
| Test Coverage | 72% | >80% |
| Duplicate Code | 3.5% | <5% |

### Recommendations
1. Extract complex logic into smaller functions
2. Add batch query optimization
3. Define constants for magic numbers
```

## Complexity Analysis

```bash
# Calculate cyclomatic complexity
# For JavaScript/TypeScript
npx complexity-report --format json src/

# For PHP
vendor/bin/phpmd src/ text cleancode,codesize,controversial

# For Python
radon cc src/ -a -nc
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_1_read
  permissions:
    - read:code
    - read:repository
    - read:diff
    - read:merge_request
  prohibited:
    - write:credentials
    - write:secrets
    - write:code  # Analysis only, no modifications
```

## Observability Metrics

```yaml
custom_metrics:
  - name: reviews_completed
    type: counter
    description: "Number of code reviews completed"
  - name: issues_found
    type: counter
    description: "Number of issues identified"
  - name: security_vulnerabilities
    type: counter
    description: "Number of security vulnerabilities detected"
```

## Integration with Claude Code

This skill is triggered by phrases like:
- "Review this code for quality"
- "Check for code smells"
- "Analyze complexity of this function"
- "Is this code maintainable?"
- "Find security issues in this file"

## Examples

### Full Review
```
User: Review src/services/auth.ts
Agent: Analyzing auth.ts...
       Quality Score: 6.5/10
       Found: 2 high, 4 medium, 6 low issues
       [Detailed report]
```

### Complexity Check
```
User: Is this function too complex?
Agent: Analyzing function `processOrder`...
       Cyclomatic Complexity: 14 (HIGH)
       Recommendation: Split into smaller functions
```

### Security Focus
```
User: Check for security vulnerabilities
Agent: Scanning for security patterns...
       Found: 1 potential XSS vulnerability
       Line 45: innerHTML assignment
```

## Service Account

- **Account**: code-reviewer
- **Group**: blueflyio
- **Permissions**: Read-only (tier_1_read)

## Related Agents

- `mr-reviewer` - MR context + code review
- `security-scanner` - Dedicated security scanning
- `drupal-standards-worker` - Drupal-specific standards

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [Clean Code Principles](https://clean-code-developer.com)
- [OWASP Security Guidelines](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
