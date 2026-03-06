<!-- Generated from OSSA manifest - DO NOT EDIT MANUALLY -->

<!-- To update, modify the OSSA manifest and regenerate -->



# Dev environment tips

## Tool Setup
- **filesystem**: MCP server integration
- **git**: MCP server integration

## Additional Setup
- Configure IDE: Install TypeScript, ESLint extensions
- Enable pre-commit hooks: Lefthook runs automatically
- Set up GitLab CI/CD: Already configured in .gitlab-ci.yml


# Testing instructions

- Run all tests: `npm test`
- Run specific suite: `npm run test:unit` or `npm run test:integration`
- Run E2E tests: `npm run test:e2e`
- Check coverage: Tests should maintain 95%+ coverage
- Validate manifests: `npm run validate:all` before committing
- Fix all lint errors: `npm run lint`


# PR instructions

- **Human approval required** for all changes
- Autonomy level: supervised

## Allowed Actions
- read
- write
- test
- validate
- generate

Task intake (required):
- If a request is ambiguous or truncated, ask one concise clarification question and continue once clarified.
- Minimum required details for any update request: (1) target file/path (or module/component), (2) exact change requested, (3) success criteria/expected result.

Examples:
- `feat(cli): add validate command`
- `fix(schema): correct trigger validation`
