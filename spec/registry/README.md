# OSSA Agent Registry Specification

**Making OSSA the "OpenAPI of Agents"**

This directory contains the complete specification for the OSSA Agent Registry - a centralized discovery and distribution system that makes OSSA agents as easy to find, install, and share as npm packages or Docker containers.

---

## What's in this Directory?

### 📋 [registry-spec.md](./registry-spec.md)
**The comprehensive registry specification** covering:
- Registry architecture and data flow
- Complete REST API endpoints with examples
- Agent metadata schemas
- Search and discovery mechanisms
- Publishing and installation workflows
- Namespace and organization management
- Security model and verification system
- Rate limiting and quotas
- CLI command reference
- SDK integration guides
- Best practices for publishers and consumers

**Length**: 2,239 lines | **Size**: 52KB

This is your primary reference for understanding how the OSSA Registry works.

---

### 📐 [registry-api.schema.json](./registry-api.schema.json)
**JSON Schema definitions** for all API request/response types:
- `AgentRegistryMetadata`: Core agent metadata
- `PublishRequest`/`PublishResponse`: Publishing workflows
- `SearchRequest`/`SearchResponse`: Search and discovery
- `ReviewRequest`/`ReviewResponse`: User ratings
- `ErrorResponse`: Standardized error handling

Use this schema for:
- API client/server validation
- Code generation (TypeScript, Go, Python)
- Documentation generation
- Test fixtures

---

### 🔌 [openapi.yaml](./openapi.yaml)
**OpenAPI 3.1.0 specification** for the Registry REST API:
- All endpoints documented with examples
- Request/response schemas
- Authentication methods
- Rate limiting headers
- Error codes and responses

Use this for:
- Interactive API documentation (Swagger UI, Redoc)
- Client SDK generation (OpenAPI Generator)
- API testing (Postman, Insomnia)
- Contract testing

**Try it**: https://editor.swagger.io/ (paste openapi.yaml)

---

## Quick Start

### For Publishers

```bash
# 1. Install OSSA CLI
npm install -g @ossa/cli

# 2. Create your agent
cat > agent.ossa.yaml <<EOF
apiVersion: ossa/v0.3.0
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
spec:
  role: A helpful assistant
  llm:
    provider: anthropic
    model: claude-3-sonnet-20240229
EOF

# 3. Login to registry
ossa login

# 4. Publish
ossa publish
```

### For Consumers

```bash
# Search for agents
ossa search "security scanner"

# View agent details
ossa view blueflyio/security-scanner

# Install agent
ossa install blueflyio/security-scanner

# Install specific version
ossa install blueflyio/security-scanner@1.2.0
```

---

## Registry Endpoints

### Base URL
```
Production:  https://registry.openstandardagents.org/api/v1
Staging:     https://staging-registry.openstandardagents.org/api/v1
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/agents` | Search/list agents |
| **POST** | `/agents` | Publish agent |
| **GET** | `/agents/{publisher}/{name}` | Get agent details |
| **GET** | `/agents/{publisher}/{name}/versions` | List versions |
| **GET** | `/agents/{publisher}/{name}/{version}` | Get specific version |
| **DELETE** | `/agents/{publisher}/{name}/{version}` | Unpublish version |
| **POST** | `/agents/{publisher}/{name}/{version}/deprecate` | Deprecate version |
| **GET** | `/agents/{publisher}/{name}/stats` | Download stats |
| **GET** | `/agents/{publisher}/{name}/reviews` | User reviews |
| **POST** | `/agents/{publisher}/{name}/reviews` | Submit review |
| **GET** | `/agents/{publisher}/{name}/dependencies` | Dependency tree |

Full API documentation: [openapi.yaml](./openapi.yaml)

---

## Key Features

### 🔍 **Discovery**
- Full-text search across names, descriptions, keywords
- Filter by capability, domain, compliance, license
- Sort by downloads, rating, last updated
- Verified publisher badges

### 📦 **Publishing**
- One-command publishing: `ossa publish`
- Automated schema validation
- Security scanning (vulnerabilities, secrets)
- Semantic versioning enforcement
- Package signing with SHA-256 checksums

### 🔒 **Security**
- OAuth 2.0 authentication
- Automated security scans on publish
- Publisher verification system
- SLSA provenance support (optional)
- Rate limiting to prevent abuse

### 🏢 **Organizations**
- Namespaced publishing: `@org/agent-name`
- Team access controls (owner, admin, developer, viewer)
- Domain verification for verified badge
- Private registries for enterprises

### 📊 **Analytics**
- Download statistics (total, monthly, weekly)
- User ratings and reviews
- Regional distribution
- Version adoption metrics

### 🌐 **Distribution**
- Global CDN for fast downloads
- Multi-region replication
- Package caching
- Bandwidth quotas by plan

---

## Comparison to Existing Ecosystems

| Feature | OSSA Registry | npm | Docker Hub | OpenAI GPT Store |
|---------|---------------|-----|------------|------------------|
| Semantic versioning | ✅ | ✅ | ✅ | ❌ |
| Dependency resolution | ✅ | ✅ | ❌ | ❌ |
| Capability-based search | ✅ | ❌ | 🟡 | 🟡 |
| Compliance profiles | ✅ | ❌ | ❌ | ❌ |
| Multi-framework support | ✅ | ❌ | ✅ | ❌ |
| Automated security scans | ✅ | 🟡 | 🟡 | ❌ |
| Private registries | ✅ | ✅ | ✅ | ❌ |
| Cost transparency | ✅ | ❌ | ❌ | ❌ |
| Publisher verification | ✅ | ✅ | ✅ | ❌ |

---

## Example: Publishing a Security Scanner

```bash
# Directory structure
security-scanner/
├── agent.ossa.yaml          # OSSA manifest
├── ossa.json                # Registry metadata
├── README.md                # Documentation
├── CHANGELOG.md             # Version history
├── tools/
│   └── scan.py              # Agent tools
└── prompts/
    └── system.txt           # System prompts

# ossa.json
{
  "name": "security-scanner",
  "version": "1.2.0",
  "description": "Enterprise security vulnerability scanner",
  "keywords": ["security", "vulnerability", "scanning", "compliance"],
  "license": "Apache-2.0",
  "repository": "https://github.com/blueflyio/security-scanner",
  "homepage": "https://bluefly.io/agents/security-scanner",
  "documentation": "https://docs.bluefly.io/agents/security-scanner",
  "manifest": "./agent.ossa.yaml",
  "dependencies": {
    "@ossa/runtime": "^0.3.0",
    "vuln-scanner-lib": "^2.1.0"
  },
  "files": [
    "agent.ossa.yaml",
    "tools/",
    "prompts/",
    "README.md"
  ]
}

# Publish
$ ossa publish

📦 Packaging security-scanner@1.2.0...
✓ Manifest validated
✓ Dependencies resolved
✓ Package created (1.2 MB)
🔐 Security scan: passed
📤 Uploading to registry...
✓ Published security-scanner@1.2.0

View at: https://registry.openstandardagents.org/agents/blueflyio/security-scanner
```

---

## Example: Installing an Agent

```bash
# Search for agents
$ ossa search "kubernetes security"

Found 12 agents matching "kubernetes security":

1. blueflyio/k8s-security-scanner ⭐ 4.7 (1,245 downloads)
   Enterprise Kubernetes security vulnerability scanner
   Tags: security, kubernetes, compliance, fedramp

2. acmecorp/cluster-auditor ⭐ 4.5 (892 downloads)
   AI-powered Kubernetes cluster security auditor
   Tags: security, kubernetes, audit

# View details
$ ossa view blueflyio/k8s-security-scanner

k8s-security-scanner v1.2.0 by blueflyio ✓
Enterprise Kubernetes security vulnerability scanner

Downloads: 1,245 | Rating: ⭐ 4.7/5 (234 reviews)
License: Apache-2.0
Repository: https://github.com/blueflyio/k8s-security-scanner

Capabilities:
- vulnerability-detection
- compliance-check
- risk-assessment

Compliance: FedRAMP Moderate, SOC2, HIPAA

Dependencies:
- @ossa/runtime@^0.3.0
- kubernetes-tools@^1.28.0

# Install
$ ossa install blueflyio/k8s-security-scanner

⬇️  Downloading k8s-security-scanner@1.2.0...
✓ Checksum verified
📦 Resolving dependencies...
✓ @ossa/runtime@0.3.3
✓ kubernetes-tools@1.28.4
✅ Installed k8s-security-scanner@1.2.0

Run with: ossa run k8s-security-scanner
```

---

## Authentication

### OAuth 2.0 Flow

```bash
# Login via browser (recommended)
$ ossa login

Opening browser for authentication...
✓ Authenticated as @blueflyio
Token saved to ~/.ossa/token
```

### API Token

```bash
# Generate token via web UI
https://registry.openstandardagents.org/settings/tokens

# Use token directly
export OSSA_TOKEN=ossa_tok_1234567890abcdef
ossa publish
```

### CI/CD Integration

```yaml
# GitHub Actions
name: Publish Agent
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ossa/setup-cli@v1
      - name: Publish
        env:
          OSSA_TOKEN: ${{ secrets.OSSA_TOKEN }}
        run: ossa publish
```

---

## Rate Limits

| Endpoint | Authenticated | Unauthenticated |
|----------|--------------|-----------------|
| GET /agents | 1000/hour | 100/hour |
| GET /agents/{id} | 5000/hour | 500/hour |
| POST /agents | 50/hour | N/A |
| DELETE /agents/{id} | 10/hour | N/A |
| POST /reviews | 20/hour | N/A |

Rate limit headers in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1735939800
```

---

## SDK Support

### JavaScript/TypeScript
```typescript
import { OSSARegistry } from '@ossa/registry-sdk';

const registry = new OSSARegistry({
  url: 'https://registry.openstandardagents.org/api/v1',
  token: process.env.OSSA_TOKEN
});

const results = await registry.search({ query: 'security' });
const agent = await registry.getAgent('blueflyio/security-scanner');
await registry.install('security-scanner', { version: '^1.0.0' });
```

### Python
```python
from ossa_registry import Registry

registry = Registry(
    url='https://registry.openstandardagents.org/api/v1',
    token=os.environ['OSSA_TOKEN']
)

results = registry.search(query='security')
agent = registry.get_agent('blueflyio/security-scanner')
registry.install('security-scanner', version='^1.0.0')
```

### Go
```go
import "github.com/openstandardagents/registry-sdk-go"

client := registry.NewClient(&registry.Config{
    URL:   "https://registry.openstandardagents.org/api/v1",
    Token: os.Getenv("OSSA_TOKEN"),
})

results, _ := client.Search(ctx, &registry.SearchRequest{Query: "security"})
agent, _ := client.GetAgent(ctx, "blueflyio/security-scanner")
client.Install(ctx, &registry.InstallRequest{Agent: "security-scanner"})
```

---

## Roadmap

### Q1 2025
- [x] Registry specification (this document)
- [x] API schema and OpenAPI spec
- [ ] Reference implementation (Go backend)
- [ ] CLI implementation (@ossa/cli)

### Q2 2025
- [ ] Web UI for browsing agents
- [ ] Publisher verification system
- [ ] Security scanning integration
- [ ] Private registry support

### Q3 2025
- [ ] SDK libraries (JS, Python, Go)
- [ ] CI/CD integrations (GitHub Actions, GitLab CI)
- [ ] Analytics dashboard
- [ ] Enterprise features

### Q4 2025
- [ ] Multi-region CDN deployment
- [ ] Package signing with SLSA
- [ ] Compliance automation
- [ ] Marketplace features

---

## Contributing

Want to help build the registry?

1. **Specification Feedback**: Open issues in the [OSSA repo](https://gitlab.com/blueflyio/openstandardagents/-/issues)
2. **Implementation**: Reference implementation coming Q1 2025
3. **Testing**: Help test the staging registry when available
4. **Documentation**: Improve these docs via merge requests

---

## References

- [OSSA Specification](../)
- [Agent Manifest Spec](../v0.2.9/agent.md)
- [A2A Protocol](../v0.2.9/a2a-protocol.md)
- [Semantic Versioning](https://semver.org/)
- [OpenAPI Specification](https://spec.openapis.org/)
- [SLSA Provenance](https://slsa.dev/)

---

## License

This specification is licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).

---

**Status**: Draft (v1.0.0)
**Last Updated**: 2025-12-12
**Authors**: OSSA Technical Committee
