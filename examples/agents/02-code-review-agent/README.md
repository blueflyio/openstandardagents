# Code Review Agent

Automated code review agent powered by Anthropic Claude with advanced code analysis capabilities.

## Features

- Automated PR/MR review
- Security vulnerability detection
- Performance analysis
- Code quality scoring
- Actionable fix suggestions
- Multi-language support

## Quick Start

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start service
docker-compose up -d

# Review a PR
curl -X POST http://localhost:8081/v1/review/pr \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "owner/repo",
    "prNumber": 123,
    "baseRef": "main",
    "headRef": "feature/new-feature"
  }'
```

## OSSA Export

```bash
# Export to Anthropic TypeScript SDK
ossa export agent.ossa.yaml --platform anthropic --output code-review.ts

# Export to npm package
ossa export agent.ossa.yaml --platform npm --output dist/
```

## Integration

### GitHub Actions

```yaml
name: Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Review Code
        run: |
          curl -X POST ${{ secrets.CODE_REVIEW_URL }}/v1/review/pr \
            -d '{"repository":"${{ github.repository }}","prNumber":${{ github.event.number }}}'
```

### GitLab CI

```yaml
code_review:
  stage: test
  script:
    - |
      curl -X POST ${CODE_REVIEW_URL}/v1/review/pr \
        -d "{\"repository\":\"${CI_PROJECT_PATH}\",\"prNumber\":${CI_MERGE_REQUEST_IID}}"
```
