# CI/CD Testing Documentation with Auto DevOps

## Overview

Comprehensive testing pipeline using GitLab Ultimate features and Auto DevOps for the OSSA website.

## Auto DevOps Integration

This pipeline integrates GitLab Auto DevOps templates for automated security and quality scanning:

### Auto DevOps Features Enabled

#### 1. Auto SAST (Static Application Security Testing)
- **Template**: `Jobs/SAST.gitlab-ci.yml`
- **Analyzers**: 
  - Semgrep for JavaScript/TypeScript
  - NodeJsScan for Node.js security
  - ESLint security plugin
- **Excluded Paths**: `spec, test, tests, tmp, node_modules, .cache`
- **Report**: SAST JSON format
- **Integration**: Security Dashboard + MR widget

#### 2. Auto Secret Detection
- **Template**: `Jobs/Secret-Detection.gitlab-ci.yml`
- **Detects**:
  - API keys
  - Passwords
  - Private keys
  - OAuth tokens
  - AWS credentials
- **Excluded Paths**: `node_modules, .cache`
- **Report**: Secret Detection JSON format

#### 3. Auto Dependency Scanning
- **Template**: `Jobs/Dependency-Scanning.gitlab-ci.yml`
- **Scanners**:
  - Gemnasium for npm dependencies
  - Retire.js for JavaScript libraries
- **Excluded Paths**: `spec, test, tests, tmp`
- **Report**: Dependency Scanning JSON format
- **CVE Database**: Updated daily

#### 4. Auto Container Scanning
- **Template**: `Jobs/Container-Scanning.gitlab-ci.yml`
- **Scanner**: Trivy
- **Scans**: Docker image `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`
- **Detects**:
  - OS package vulnerabilities
  - Application dependency vulnerabilities
- **Report**: Container Scanning JSON format

#### 5. Auto Code Quality
- **Template**: `Jobs/Code-Quality.gitlab-ci.yml`
- **Analyzers**:
  - ESLint
  - Stylelint
  - Prettier
- **Report**: Code Quality JSON format
- **Integration**: Inline MR comments

## Testing Stages

### 1. Validate Stage
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode validation
- **Branch Protection**: Enforces development → main merge policy

### 2. Test Stage

#### Unit Tests
- **Framework**: Jest (placeholder - ready for implementation)
- **Coverage**: Cobertura format
- **Reports**: JUnit XML for GitLab integration
- **Threshold**: 80% coverage target

#### E2E Tests
- **Framework**: Playwright v1.48.0
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Reports**: JUnit XML + HTML
- **Artifacts**: Test results, screenshots, videos on failure

### 3. Build Stage
- **Framework**: Next.js 15.5.6 with Turbopack
- **Output**: Static export to `out/` directory
- **Docker Image**: Built and pushed to GitLab Container Registry
- **Image Tag**: `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`
- **Artifacts**: Retained for 1 day

### 4. Security Stage

#### SAST (Static Application Security Testing)
- **Tier**: Ultimate
- **Runs**: All branches
- **Report**: Shows vulnerabilities in code
- **Severity Levels**: Critical, High, Medium, Low, Info

#### Secret Detection
- **Tier**: Free
- **Runs**: All branches
- **Detects**: Hardcoded secrets, API keys, credentials
- **Historical Scanning**: Scans entire Git history

#### Dependency Scanning
- **Tier**: Ultimate
- **Runs**: Development and main branches
- **Scans**: package.json, package-lock.json
- **Database**: GitLab Advisory Database + CVE

#### Container Scanning
- **Tier**: Ultimate
- **Runs**: Development and main branches
- **Scanner**: Trivy
- **Scans**: Final Docker image
- **Detects**: OS and app vulnerabilities

### 5. Quality Stage

#### Code Quality
- **Tool**: GitLab Code Quality (Auto DevOps template)
- **Report**: JSON format with issue severity
- **Integration**: Shows in MR diff view

#### Browser Performance
- **Tool**: Sitespeed.io
- **Metrics**: 
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Time to Interactive (TTI)
  - Total Blocking Time (TBT)
- **Report**: JSON format for GitLab

#### Accessibility Testing
- **Tool**: Pa11y CI
- **Standard**: WCAG 2.1 AA
- **Runners**: Axe + HTML_CodeSniffer
- **Pages Tested**:
  - Homepage
  - About
  - Docs
  - Specification

#### Metrics Reports
- **Deployment Frequency**: Counter per environment
- **Build Duration**: Gauge in seconds
- **Format**: Prometheus metrics

### 6. Review Stage
- **Platform**: GitLab Pages
- **Trigger**: Merge requests
- **Auto-stop**: 1 day after deployment
- **URL**: Artifacts-based preview

### 7. Deploy Stage

#### Staging (Development Branch)
- **Environment**: OrbStack local
- **URL**: http://ossa.orb.local
- **Tier**: Staging
- **Trigger**: Automatic on development push

#### Production (Main Branch)
- **Environment**: openstandardagents.org
- **URL**: https://openstandardagents.org
- **Tier**: Production
- **Trigger**: Manual approval required
- **Resource Group**: Prevents concurrent deployments

## GitLab Ultimate Features Used

### 1. Unit Test Reports
```yaml
artifacts:
  reports:
    junit: website/junit.xml
```
- Shows test results in MR
- Tracks test trends over time
- Identifies flaky tests

### 2. Test Cases
- Playwright tests with JUnit output
- Test case management integration
- Historical test data

### 3. Metrics Reports
```yaml
artifacts:
  reports:
    metrics: metrics.txt
```
- Custom Prometheus metrics
- Deployment frequency tracking
- Build performance monitoring

### 4. Code Quality
```yaml
artifacts:
  reports:
    codequality: gl-code-quality-report.json
```
- Inline MR comments
- Quality trends
- Blocker identification

### 5. Browser Performance
```yaml
artifacts:
  reports:
    browser_performance: sitespeed-results/data/performance.json
```
- Performance degradation alerts
- Core Web Vitals tracking
- Historical performance data

### 6. Accessibility Testing
```yaml
artifacts:
  reports:
    accessibility: accessibility.json
```
- WCAG compliance tracking
- Accessibility issue detection
- Remediation guidance

## Running Tests Locally

### Unit Tests
```bash
cd website
npm test
```

### E2E Tests
```bash
cd website
npm run test:e2e
```

### E2E Tests (UI Mode)
```bash
cd website
npm run test:e2e:ui
```

### Linting
```bash
cd website
npm run lint
```

### Type Checking
```bash
cd website
npm run typecheck
```

### Accessibility Testing
```bash
cd website
npm run build
npx pa11y-ci
```

## Coverage Requirements

- **Unit Tests**: 80% minimum
- **E2E Tests**: Critical user journeys
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals passing

## Merge Request Checklist

Before merging, ensure:
- [ ] All tests pass (unit + E2E)
- [ ] Code quality issues resolved
- [ ] No performance regressions
- [ ] No accessibility violations
- [ ] Coverage threshold met
- [ ] Lint and typecheck pass
- [ ] Review app deployed successfully

## CI/CD Pipeline Triggers

- **Merge Requests**: Full pipeline
- **Development Branch**: Full pipeline + staging deploy
- **Main Branch**: Full pipeline + manual production deploy
- **Feature Branches**: Validate + test + build only

## Artifacts Retention

- **Test Reports**: 30 days
- **Build Artifacts**: 1 day (review), 30 days (staging), 90 days (production)
- **Quality Reports**: 30 days
- **Performance Reports**: 30 days

## Future Enhancements

- [ ] Add Jest unit tests for components
- [ ] Add visual regression testing
- [ ] Add load testing with k6
- [ ] Add security scanning (SAST/DAST)
- [ ] Add dependency scanning
- [ ] Add container scanning
- [ ] Add license compliance scanning
