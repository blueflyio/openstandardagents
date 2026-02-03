# Security Scanner

Automated security scanning and vulnerability detection agent.

## Features

- SAST (Static Application Security Testing)
- Dependency vulnerability scanning
- Secret detection
- Infrastructure-as-Code scanning
- SARIF report generation
- GitHub/GitLab integration

## Quick Start

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export GITHUB_TOKEN=ghp_...

docker-compose up -d

curl -X POST http://localhost:8088/v1/scan \
  -d '{"repository": "owner/repo", "branch": "main"}'
```

## Automated Scanning

Configure webhook for automatic PR scanning:

```yaml
# .github/workflows/security-scan.yml
on: [pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Security Scan
        run: curl -X POST $SCANNER_URL/v1/scan -d '{"repository":"${{github.repository}}"}'
```

## Export to Anthropic SDK

```bash
ossa export agent.ossa.yaml --platform anthropic --output security-scanner.ts
```

## License

Apache-2.0
