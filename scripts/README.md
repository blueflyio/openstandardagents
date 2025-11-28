# Validation Scripts

Automated validation and maintenance scripts for OSSA.

## Scripts

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
