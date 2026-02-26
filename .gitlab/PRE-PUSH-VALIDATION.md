# Pre-Push Validation System

## Overview

This repository uses **Lefthook** to automatically validate code quality before pushing to remote, preventing broken code from reaching CI/CD pipelines.

## What Gets Validated

### Pre-Commit (Fast - < 10 seconds)
- TypeScript type checking
- ESLint (with auto-fix)
- Schema validation

### Pre-Push (Comprehensive - < 2 minutes)
1. **Build** - Full TypeScript compilation
2. **Unit Tests** - All unit tests must pass
3. **Smoke Tests** - Critical functionality validation
4. **SDK Validation** - TypeScript and Python SDKs build and test
5. **Schema + Examples** - All manifests validate correctly

## Installation

### 1. Install Lefthook

```bash
# macOS
brew install lefthook

# npm (global)
npm install -g lefthook

# Or use npx (no installation)
npx lefthook install
```

### 2. Install Git Hooks

```bash
lefthook install
```

This creates `.git/hooks/pre-commit` and `.git/hooks/pre-push` that automatically run validation.

## Usage

### Normal Workflow (Recommended)

```bash
# Make changes
git add .
git commit -m "feat: add new feature"

# Pre-commit validation runs automatically (< 10 seconds)
# - Typecheck
# - Lint (auto-fixes)
# - Schema validation

git push origin your-branch

# Pre-push validation runs automatically (< 2 minutes)
# - Build
# - Unit tests
# - Smoke tests
# - SDK validation
# - Schema + examples
```

### Emergency Override (Use Sparingly)

```bash
# Skip ALL hooks (emergency only)
LEFTHOOK=0 git push

# Skip specific hooks
LEFTHOOK_EXCLUDE=pre-push git push
```

## Local CI Validation (Manual)

Run the full CI validation suite locally **before** pushing:

```bash
# Full validation (mirrors CI pipeline)
npm run ci:validate

# Fast validation (typecheck + lint + unit tests)
npm run ci:validate:fast

# Individual validations
npm run typecheck        # TypeScript type checking
npm run lint            # ESLint
npm run test:unit       # Unit tests
npm run test:smoke      # Smoke tests
npm run validate:sdks   # SDK validation
npm run validate        # Schema + examples
```

## SDK Validation

### TypeScript SDK

```bash
# Full validation
npm run validate:sdk:typescript

# Or manually
cd src/sdks/typescript
npm install
npm run build
npm run typecheck
```

### Python SDK

```bash
# Full validation
npm run validate:sdk:python

# Or manually
cd src/sdks/python
pip install -e .[dev]
python -m pytest tests/ -v
python -m mypy ossa/
```

## CI/CD Integration

The same validations run in GitLab CI:

- **Feature Branch Push**: Fast validation (typecheck, lint, unit tests)
- **Merge Request**: Full validation including SDK tests
- **Release/Main**: Full validation + coverage + security scans

## Troubleshooting

### "Lefthook not found"

```bash
# Install lefthook
brew install lefthook

# Or use npx
npx lefthook install
```

### "Hooks not running"

```bash
# Reinstall hooks
lefthook install

# Verify hooks are installed
ls -la .git/hooks/
```

### "Tests failing locally but pass in CI"

```bash
# Clean install
npm run clean
npm install
npm run build

# Run full validation
npm run ci:validate
```

### "Pre-push is slow"

Pre-push validation is **intentionally comprehensive** to catch issues before CI. It typically takes < 2 minutes.

To skip (emergency only):
```bash
LEFTHOOK=0 git push
```

## Benefits

1. **Faster Feedback** - Catch issues in seconds, not minutes (waiting for CI)
2. **Prevent CI Failures** - Don't waste CI/CD resources on broken code
3. **Better Code Quality** - Automatic validation ensures standards
4. **Save Money** - Fewer CI pipeline runs = lower costs
5. **Confidence** - Know your push will pass CI before you push

## Configuration

### `lefthook.yml`

Main configuration file defining what runs on each git hook.

### `package.json` scripts

All validation commands are defined as npm scripts for consistency:

- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint
- `npm run validate:schema` - Schema validation
- `npm run validate:sdks` - SDK validation
- `npm run ci:validate` - Full CI validation locally

## Advanced

### Run Specific Hook Manually

```bash
# Run pre-push validation without actually pushing
lefthook run pre-push

# Run pre-commit validation
lefthook run pre-commit
```

### Customize Validation

Edit `lefthook.yml` to add/remove validations:

```yaml
pre-push:
  commands:
    my-custom-validation:
      run: npm run my-script
      fail_text: "❌ Custom validation failed"
```

## Questions?

- **"Can I skip validation?"** - Yes, but only in emergencies: `LEFTHOOK=0 git push`
- **"Is this required?"** - Strongly recommended to prevent CI failures
- **"Does this replace CI?"** - No, CI still runs. This prevents wasting CI resources.
- **"Can I run validation without hooks?"** - Yes: `npm run ci:validate`

---

**Built with DRY, SOLID principles. Using battle-tested tools: Lefthook, Jest, TypeScript, Python.**
