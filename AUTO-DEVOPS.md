# Auto DevOps Integration

## Overview

This project integrates GitLab Auto DevOps templates to provide automated security scanning, code quality analysis, and deployment capabilities.

## What is Auto DevOps?

Auto DevOps is GitLab's pre-configured CI/CD pipeline that automatically detects your language/framework and applies industry best practices for:
- Building
- Testing
- Security scanning
- Code quality
- Deployment

## Integrated Auto DevOps Features

### 1. Auto SAST (Static Application Security Testing)
**Template**: `Jobs/SAST.gitlab-ci.yml`

Automatically scans code for security vulnerabilities using multiple analyzers:
- **Semgrep**: JavaScript/TypeScript security patterns
- **NodeJsScan**: Node.js-specific security issues
- **ESLint Security**: Security-focused linting rules

**Configuration**:
```yaml
variables:
  SAST_EXCLUDED_PATHS: "spec, test, tests, tmp, node_modules, .cache"
  SAST_DISABLED: "false"
```

**Reports**:
- Security Dashboard integration
- MR widget with vulnerability details
- Severity levels: Critical, High, Medium, Low, Info

### 2. Auto Secret Detection
**Template**: `Jobs/Secret-Detection.gitlab-ci.yml`

Scans entire Git history for accidentally committed secrets:
- API keys
- Passwords
- Private keys
- OAuth tokens
- AWS credentials
- Database connection strings

**Configuration**:
```yaml
variables:
  SECRET_DETECTION_EXCLUDED_PATHS: "node_modules, .cache"
  SECRET_DETECTION_DISABLED: "false"
```

**Features**:
- Historical scanning (entire Git history)
- Pre-receive hook prevention
- Automatic remediation suggestions

### 3. Auto Dependency Scanning
**Template**: `Jobs/Dependency-Scanning.gitlab-ci.yml`

Scans npm dependencies for known vulnerabilities:
- **Gemnasium**: Comprehensive vulnerability database
- **Retire.js**: JavaScript library vulnerabilities
- **CVE Database**: Updated daily

**Configuration**:
```yaml
variables:
  DS_EXCLUDED_PATHS: "spec, test, tests, tmp"
  DEPENDENCY_SCANNING_DISABLED: "false"
```

**Scans**:
- `package.json`
- `package-lock.json`
- Transitive dependencies

### 4. Auto Container Scanning
**Template**: `Jobs/Container-Scanning.gitlab-ci.yml`

Scans Docker images for vulnerabilities using Trivy:
- OS package vulnerabilities
- Application dependency vulnerabilities
- Configuration issues

**Configuration**:
```yaml
variables:
  CS_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  CONTAINER_SCANNING_DISABLED: "false"
```

**Scans**:
- Base image vulnerabilities
- Installed packages
- Application dependencies in container

### 5. Auto Code Quality
**Template**: `Jobs/Code-Quality.gitlab-ci.yml`

Analyzes code quality using multiple tools:
- **ESLint**: JavaScript/TypeScript linting
- **Stylelint**: CSS/SCSS linting
- **Prettier**: Code formatting issues

**Configuration**:
```yaml
variables:
  CODE_QUALITY_DISABLED: "false"
```

**Features**:
- Inline MR comments
- Quality trends over time
- Blocker identification

## Pipeline Flow

```
┌─────────────┐
│  Validate   │ → Lint, Typecheck, Branch Protection
└──────┬──────┘
       ↓
┌─────────────┐
│    Test     │ → Unit Tests, E2E Tests (Playwright)
└──────┬──────┘
       ↓
┌─────────────┐
│    Build    │ → Next.js Build, Docker Image Build
└──────┬──────┘
       ↓
┌─────────────┐
│  Security   │ → SAST, Secret Detection, Dependency Scan, Container Scan
└──────┬──────┘
       ↓
┌─────────────┐
│   Quality   │ → Code Quality, Browser Performance, Accessibility
└──────┬──────┘
       ↓
┌─────────────┐
│   Review    │ → MR Preview Deployments
└──────┬──────┘
       ↓
┌─────────────┐
│   Deploy    │ → Staging (auto), Production (manual)
└─────────────┘
```

## Security Dashboard

All security findings are aggregated in GitLab's Security Dashboard:

1. **Project Security Dashboard**: `/security/dashboard`
2. **Vulnerability Report**: `/security/vulnerabilities`
3. **Dependency List**: `/security/dependencies`

## Merge Request Integration

Security and quality findings appear directly in MRs:

### Security Widget
- Shows new vulnerabilities introduced
- Compares source vs target branch
- Provides remediation guidance

### Code Quality Widget
- Shows new code quality issues
- Inline comments on affected lines
- Quality score comparison

### Performance Widget
- Browser performance metrics
- Core Web Vitals comparison
- Performance degradation alerts

## Customization

### Disable Specific Scanners

To disable a scanner, set its variable to `"true"`:

```yaml
variables:
  SAST_DISABLED: "true"
  SECRET_DETECTION_DISABLED: "true"
  DEPENDENCY_SCANNING_DISABLED: "true"
  CONTAINER_SCANNING_DISABLED: "true"
  CODE_QUALITY_DISABLED: "true"
```

### Exclude Paths

Customize excluded paths for each scanner:

```yaml
variables:
  SAST_EXCLUDED_PATHS: "spec, test, tests, tmp, node_modules"
  SECRET_DETECTION_EXCLUDED_PATHS: "node_modules, .cache"
  DS_EXCLUDED_PATHS: "spec, test, tests, tmp"
```

### Custom SAST Rules

Create `.gitlab/sast-ruleset.yml` to customize SAST rules:

```yaml
sast:
  pipeline:
    - semgrep
  analyzers:
    - name: semgrep
      rules:
        - id: "javascript.lang.security.audit.xss"
          severity: "Critical"
```

## Best Practices

### 1. Review Security Findings
- Check Security Dashboard daily
- Address Critical/High vulnerabilities immediately
- Create issues for Medium/Low findings

### 2. Keep Dependencies Updated
- Review Dependency Scanning results weekly
- Update vulnerable dependencies promptly
- Use Dependabot or Renovate for automation

### 3. Monitor Code Quality
- Set quality gates in MR approval rules
- Address new code quality issues before merging
- Track quality trends over time

### 4. Container Security
- Use minimal base images (alpine)
- Scan images before deployment
- Update base images regularly

### 5. Secret Management
- Never commit secrets to Git
- Use GitLab CI/CD variables for secrets
- Enable push rules to prevent secret commits

## Troubleshooting

### SAST Job Fails
```bash
# Check analyzer logs
gitlab-runner exec docker sast

# Verify excluded paths
echo $SAST_EXCLUDED_PATHS
```

### Container Scanning Fails
```bash
# Verify image exists
docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# Check Trivy version
docker run aquasec/trivy --version
```

### Dependency Scanning Fails
```bash
# Verify package files exist
ls -la package.json package-lock.json

# Check for syntax errors
npm install --dry-run
```

## Resources

- [Auto DevOps Documentation](https://docs.gitlab.com/topics/autodevops/)
- [SAST Documentation](https://docs.gitlab.com/ee/user/application_security/sast/)
- [Secret Detection Documentation](https://docs.gitlab.com/ee/user/application_security/secret_detection/)
- [Dependency Scanning Documentation](https://docs.gitlab.com/ee/user/application_security/dependency_scanning/)
- [Container Scanning Documentation](https://docs.gitlab.com/ee/user/application_security/container_scanning/)
- [Code Quality Documentation](https://docs.gitlab.com/ee/ci/testing/code_quality/)

## License Tiers

| Feature | Free | Premium | Ultimate |
|---------|------|---------|----------|
| SAST | ✅ | ✅ | ✅ |
| Secret Detection | ✅ | ✅ | ✅ |
| Code Quality | ✅ | ✅ | ✅ |
| Dependency Scanning | ❌ | ❌ | ✅ |
| Container Scanning | ❌ | ❌ | ✅ |
| Security Dashboard | ❌ | ❌ | ✅ |
| Vulnerability Management | ❌ | ❌ | ✅ |

**Note**: This project uses GitLab Ultimate features.
