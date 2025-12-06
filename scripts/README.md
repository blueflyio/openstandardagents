# Validation Scripts

Automated validation and maintenance scripts for OSSA.

## Scripts

### compliance-audit.ts

Automated GitLab Ultimate compliance audit system. Checks projects for:
- Branch protection (main/development, force push)
- Merge request approvals and requirements
- Security scanning (SAST, dependency scanning, secret detection)
- DORA metrics configuration
- Compliance frameworks and merge trains
- Pipeline configuration and success rates

```bash
# Audit default project
npm run compliance:audit

# Audit specific project
npm run compliance:audit:project blueflyio/other-project

# Direct execution with custom output
tsx scripts/compliance-audit.ts blueflyio/openstandardagents report.json
```

**Requirements**: `GITLAB_TOKEN` environment variable

**Output**: Console report + JSON file with detailed compliance status

### validate-all.js

Comprehensive validation suite:
- Version consistency across packages
- Schema exports and files
- Spec directory structure
- Schema validation
- Version reference checks

```bash
npm run validate:all
```

### fix-schema-formats.js

Automatically fixes unsupported format constraints in JSON schemas.

```bash
npm run fix:schemas
```

Removes format constraints like `"format": "uri"` that aren't supported by ajv-cli.

### sync-version.js (website)

Syncs version from package.json to website code.

```bash
cd website && npm run sync-version
```

## CI/CD Integration

Validation runs automatically on:
- Merge requests
- Commits to main/development

See `.gitlab-ci-validation.yml` for configuration.

## Pre-commit Hook

Install husky to run validations before commit:

```bash
npm install
npm run prepare
```

## Maintenance

### Adding New Validations

Edit `scripts/validate-all.js`:

```javascript
check('New Check', () => {
  // Your validation logic
  if (somethingWrong) {
    throw new Error('Description');
  }
  console.log('✓ Check passed');
});
```

### Adding Unsupported Formats

Edit `scripts/fix-schema-formats.js`:

```javascript
const UNSUPPORTED_FORMATS = ['uri', 'new-format'];
```

## Troubleshooting

### Schema validation fails

```bash
npm run fix:schemas
npm run validate:schema
```

### Version mismatch

```bash
# Update root version
npm version patch

# Sync to website
cd website && npm run sync-version
```

### Pre-commit hook not running

```bash
npm run prepare
chmod +x .husky/pre-commit
```
