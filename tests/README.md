# Playwright Testing Suite

## Overview

Comprehensive E2E and visual regression testing for openstandardagents.org using Playwright.

## Test Structure

```
tests/
├── e2e/                    # End-to-end interaction tests
│   └── ecosystem-interactions.spec.ts
├── visual/                 # Visual regression tests
│   └── ecosystem.spec.ts
└── README.md
```

## Running Tests

### Local Development

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run all tests
npm run test:all

# Run E2E tests only
npm run test:e2e

# Run visual tests only
npm run test:visual

# Update visual baselines
npm run test:visual:update

# Run specific test file
npx playwright test tests/visual/ecosystem.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed
```

### CI/CD Pipeline

Tests run automatically on:
- Merge requests
- Commits to `main` branch
- Commits to `release/*` branches

**Visual baseline updates** only run on `main` branch.

## Test Coverage

### E2E Tests (`tests/e2e/`)
- ✅ Icon hover effects
- ✅ Page load performance (<3s)
- ✅ CORS validation for external images

### Visual Tests (`tests/visual/`)
- ✅ All icons load successfully
- ✅ No broken CDN URLs
- ✅ Full page visual snapshot
- ✅ Mobile viewport rendering
- ✅ Critical icons presence check

## Device Coverage

- **Desktop Chrome** (1920x1080)
- **Desktop Safari** (1920x1080)
- **Mobile Chrome** (Pixel 5)
- **Mobile Safari** (iPhone 13)

## Visual Regression Strategy

1. **Baseline Creation**: First run on `main` generates baseline screenshots
2. **Comparison**: Subsequent runs compare against baseline
3. **Threshold**: Max 100 pixel difference allowed
4. **Failure**: Test fails if visual diff exceeds threshold

## Debugging Failed Tests

```bash
# View HTML report
npx playwright show-report

# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## CI Artifacts

Failed tests produce:
- HTML report (`playwright-report/`)
- Screenshots (`test-results/`)
- JUnit XML (`test-results/junit.xml`)

Access via GitLab CI job artifacts (7 day retention).

## Best Practices

1. **Wait for network idle** before visual snapshots
2. **Use data-testid** for stable selectors
3. **Keep tests independent** - no shared state
4. **Update baselines** only when intentional UI changes
5. **Review visual diffs** carefully before approving

## Troubleshooting

### Flaky Tests
- Increase timeout: `test.setTimeout(30000)`
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use `test.retry(2)` for unstable tests

### Visual Diff Failures
- Check if intentional UI change
- Update baseline: `npm run test:visual:update`
- Commit new baseline screenshots

### CI Failures
- Check GitLab CI logs
- Download artifacts to inspect screenshots
- Run locally with same Playwright version
