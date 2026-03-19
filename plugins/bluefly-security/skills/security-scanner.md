---
name: security-scanner
description: "**Security Scanner Agent**: Comprehensive security analysis including SAST, DAST, dependency scanning, container image scanning, secrets detection, and OWASP compliance validation. Generates security reports and remediation guidance. - MANDATORY TRIGGERS: security, vulnerability, CVE, SAST, DAST, scan, secrets, OWASP, dependency scan, container scan, trivy, security audit, compliance, penetration"
license: "Apache-2.0"
compatibility: "Requires trivy, gitleaks, npm audit. Environment: Security scanning tools installed"
allowed-tools: "Bash(npm:*) Bash(composer:*) Bash(docker:*) Read Edit Task mcp__filesystem__*"
metadata:
  ossa_manifest: ~/Sites/LLM/platform-agents/packages/@ossa/security-scanner/agent.ossa.yaml
  service_account: security-scanner
  service_account_id: pending
  domain: security
  tier: worker
  autonomy: fully_autonomous
  ossa_version: v0.3.2
  npm_package: "@bluefly/openstandardagents"
---

# Security Scanner Agent Skill

**OSSA Agent**: `security-scanner` | **Version**: 1.0.0 | **Namespace**: blueflyio

This skill invokes the **security-scanner** OSSA agent for comprehensive security analysis and vulnerability detection.

## Quick Start

```bash
# Install scanning tools
brew install trivy gitleaks

# Verify installation
trivy --version
gitleaks version
```

## Agent Capabilities (from OSSA Manifest)

### Static Analysis (SAST)
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `static_analysis` | reasoning | fully_autonomous | Analyze source code |
| `code-vulnerability` | reasoning | fully_autonomous | Find code vulnerabilities |
| `injection-detection` | reasoning | fully_autonomous | Detect injection flaws |
| `xss-detection` | reasoning | fully_autonomous | Find XSS vulnerabilities |

### Dependency Scanning
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `dependency_scanning` | reasoning | fully_autonomous | Scan dependencies |
| `npm-audit` | reasoning | fully_autonomous | NPM security audit |
| `composer-audit` | reasoning | fully_autonomous | Composer security check |
| `cve-lookup` | reasoning | fully_autonomous | CVE database lookup |

### Container Security
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `container_scanning` | reasoning | fully_autonomous | Scan container images |
| `trivy-scan` | reasoning | fully_autonomous | Trivy vulnerability scan |
| `dockerfile-lint` | reasoning | fully_autonomous | Lint Dockerfiles |

### Secrets Detection
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `secrets_detection` | reasoning | fully_autonomous | Find exposed secrets |
| `gitleaks-scan` | reasoning | fully_autonomous | Scan git history |
| `env-file-check` | reasoning | fully_autonomous | Check .env files |

### Compliance
| Capability | Category | Autonomy | Description |
|------------|----------|----------|-------------|
| `compliance_check` | reasoning | fully_autonomous | OWASP compliance |
| `cis-benchmark` | reasoning | fully_autonomous | CIS benchmark check |
| `report-generation` | action | fully_autonomous | Generate reports |

## Scanning Operations

### Full Security Audit
```bash
# Run all scans
trivy fs --scanners vuln,secret,misconfig .
npm audit
composer audit
gitleaks detect --source .
```

### Dependency Scanning

#### NPM
```bash
# Audit dependencies
npm audit

# Detailed JSON output
npm audit --json

# Fix automatically
npm audit fix

# Force fix (breaking changes possible)
npm audit fix --force
```

#### Composer (PHP)
```bash
# Security audit
composer audit

# Check abandoned packages
composer outdated --direct

# Update vulnerable packages
composer update --with-dependencies <package>
```

#### Python
```bash
# pip-audit
pip-audit

# safety check
safety check
```

### Container Scanning

```bash
# Scan image with Trivy
trivy image <image:tag>

# Scan for specific severity
trivy image --severity HIGH,CRITICAL <image:tag>

# Output as JSON
trivy image --format json --output results.json <image:tag>

# Scan Dockerfile
trivy config Dockerfile

# Scan running container
docker exec <container> trivy filesystem /
```

### Secrets Detection

```bash
# Scan current directory
gitleaks detect --source . -v

# Scan git history
gitleaks detect --source . --log-opts="--all"

# Baseline (ignore known)
gitleaks detect --baseline-path .gitleaks-baseline.json

# Custom rules
gitleaks detect --config .gitleaks.toml
```

### SAST (Static Analysis)

```bash
# PHP - PHPStan security rules
phpstan analyze --level 8 src/

# JavaScript/TypeScript - ESLint security
npx eslint --plugin security src/

# General - Semgrep
semgrep --config "p/security-audit" .
```

## OWASP Top 10 Checks

```yaml
owasp_checks:
  A01_Broken_Access_Control:
    - Check authorization on all endpoints
    - Verify RBAC implementation
    - Test for IDOR vulnerabilities

  A02_Cryptographic_Failures:
    - Verify HTTPS everywhere
    - Check encryption at rest
    - Validate key management

  A03_Injection:
    - SQL injection tests
    - Command injection tests
    - LDAP injection tests

  A04_Insecure_Design:
    - Review threat models
    - Check security requirements

  A05_Security_Misconfiguration:
    - Default credentials
    - Unnecessary features enabled
    - Missing security headers

  A06_Vulnerable_Components:
    - Dependency scanning
    - Version checks
    - CVE monitoring

  A07_Auth_Failures:
    - Password policies
    - Session management
    - MFA implementation

  A08_Data_Integrity:
    - CSRF protection
    - Input validation
    - Signature verification

  A09_Logging_Monitoring:
    - Audit logging
    - Alert thresholds
    - Incident response

  A10_SSRF:
    - URL validation
    - Allowlist enforcement
```

## Severity Classification

```yaml
severity_levels:
  CRITICAL:
    - Remote code execution
    - Authentication bypass
    - SQL injection
    - Exposed secrets (production)
    action: "Block merge, fix immediately"

  HIGH:
    - XSS stored
    - CSRF
    - Path traversal
    - Privilege escalation
    action: "Block merge, fix within 24h"

  MEDIUM:
    - XSS reflected
    - Information disclosure
    - Missing security headers
    action: "Fix within sprint"

  LOW:
    - Verbose errors
    - Missing rate limiting
    - Deprecated functions
    action: "Add to backlog"
```

## Security Report Template

```markdown
# Security Scan Report

**Date**: {{date}}
**Project**: {{project}}
**Commit**: {{sha}}

## Summary
- Critical: {{critical_count}}
- High: {{high_count}}
- Medium: {{medium_count}}
- Low: {{low_count}}

## Critical Findings

### {{finding_title}}
- **CVE**: {{cve_id}}
- **Package**: {{package}}
- **Installed**: {{version}}
- **Fixed In**: {{fix_version}}
- **Description**: {{description}}
- **Remediation**: {{fix_instructions}}

## Recommendations
1. {{recommendation_1}}
2. {{recommendation_2}}

## Compliance Status
- OWASP Top 10: {{status}}
- CIS Benchmark: {{status}}
```

## GitLab CI Integration

```yaml
# .gitlab-ci.yml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml

container_scanning:
  variables:
    CS_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## Access Control (OSSA Spec)

```yaml
access:
  tier: tier_1_read
  permissions:
    - read:code
    - read:dependencies
    - read:containers
    - execute:scanners
  prohibited:
    - write:code
    - write:repository
    - network:external
  notes: "Read-only scanning, no code modifications"
```

## Observability Metrics

```yaml
custom_metrics:
  - name: vulnerabilities_found
    type: gauge
    labels: [severity, category]
  - name: scans_completed
    type: counter
  - name: mean_time_to_remediation
    type: histogram
  - name: false_positive_rate
    type: gauge
```

## Integration with Claude Code

Triggered by:
- "Run security scan"
- "Check for vulnerabilities"
- "Scan dependencies"
- "Find secrets in code"
- "OWASP compliance check"
- "Scan container image"

## Examples

### Full Scan
```
User: Run security scan on this project
Agent: Running comprehensive security scan...

       Dependency Scan (npm audit):
       ✓ 0 critical, 2 high, 5 moderate

       Secrets Detection (gitleaks):
       ⚠ 1 potential secret found
         - .env.example:12 (API key pattern)

       Container Scan (trivy):
       ✓ Base image: node:20-alpine
       ✓ 0 critical, 1 high (libcurl CVE-2024-xxxx)

       SAST:
       ⚠ 2 potential XSS in src/utils/render.ts

       Summary: 2 HIGH, 7 MEDIUM issues
       Report: ./security-report.md
```

### Fix Vulnerabilities
```
User: Fix the npm vulnerabilities
Agent: Analyzing 7 vulnerabilities...

       Auto-fixable: 5
       Manual fix required: 2

       Running npm audit fix...
       ✓ Fixed 5 vulnerabilities

       Remaining (breaking changes):
       - lodash@4.17.20 → 4.17.21 (major)
       - axios@0.21.0 → 1.6.0 (major)

       Run with --force to fix, may break code
```

### Container Scan
```
User: Scan my Docker image
Agent: Scanning ghcr.io/org/app:latest...

       OS: Alpine 3.19
       Packages: 45

       Vulnerabilities:
       CRITICAL: 0
       HIGH: 1
         - CVE-2024-1234: libssl3 3.1.0 (fixed: 3.1.1)
       MEDIUM: 3

       Recommendation: Update base image
       FROM node:20-alpine3.20 (fixes all issues)
```

## Service Account

- **Account**: security-scanner
- **Group**: blueflyio
- **Permissions**: Read-only scanning

## Related Agents

- `code-reviewer` - Code quality analysis
- `ci-fixer-worker` - Fix security-failing pipelines
- `mr-reviewer` - Security review in MRs

## References

- [OSSA v0.3.2 Specification](https://gitlab.com/blueflyio/openstandardagents)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
