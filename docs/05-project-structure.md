# 05. Project Structure

**IMPORTANT: This document defines the ONLY allowed directory structure. AI bots and contributors MUST follow this structure exactly.**

## 🚫 What NOT to Create in Root

**The root directory MUST contain ONLY:**
- `.git/` (Git repository - auto-created)
- `.gitlab/` (GitLab CI components)
- `docs/` (All documentation)
- `examples/` (All examples)
- `services/` (All services and agents)
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `README.md`
- `ROADMAP.md`

**NEVER create in root:**
- `package.json`, `package-lock.json` (move to services/)
- `node_modules/` (should be in specific service directories)
- `scripts/` (move to services/scripts/)
- `agents/` (move to services/agents/)
- Any test files (move to appropriate service)
- Any other files or directories

## ✅ Allowed Directory Structure

```
openapi-ai-agents-standard/
├── .git/                          # Git repository (auto-created)
├── .gitlab/                       # GitLab CI components
│   └── ci-components/
│       └── agent-validator/
│           └── template.yml
├── CODE_OF_CONDUCT.md            # Community guidelines (Switzerland of AI)
├── CONTRIBUTING.md               # Contribution guidelines with revenue sharing
├── LICENSE                       # Apache 2.0 license (enterprise-friendly)
├── README.md                     # Main documentation with strategic positioning
├── ROADMAP.md                    # 90-day market domination plan
├── STRATEGIC_POSITIONING.md      # Market strategy and competitive analysis
│
├── docs/                         # Comprehensive documentation suite
│   ├── README.md                # Documentation index and navigation
│   ├── 01-technical-specification.md  # Core standard definition
│   ├── 02-integration-guide.md       # Framework integration patterns
│   ├── 03-governance-compliance.md   # Enterprise governance model
│   ├── 04-enterprise-integrations.md # Priority integration targets
│   └── 05-project-structure.md       # This file - structure rules
│
├── examples/                     # All example implementations
│   ├── README.md                # Examples overview
│   ├── basic/                   # Basic templates
│   │   ├── agent.yml            # Basic agent template
│   │   ├── openapi.yaml         # Basic OpenAPI template
│   │   └── hello-agent.yaml     # Hello world example
│   ├── agents/                  # Agent examples
│   │   ├── README.md            # Agent examples overview
│   │   └── crew-ai-agent/       # CrewAI integration example
│   │       ├── agent.yml        # CrewAI agent config
│   │       └── openapi.yaml     # CrewAI OpenAPI spec
│   └── integrations/            # Integration examples
│       ├── github-actions/      # GitHub Actions integration
│       ├── python/              # Python client examples
│       └── typescript/          # TypeScript client examples
│
└── services/                     # All services, agents, and scripts
    ├── package.json             # Root package configuration
    ├── package-lock.json        # Root package lock file
    ├── scripts/                 # All automation scripts
    │   ├── report-compliance.js # Compliance reporting script
    │   └── test-agents.js       # Agent test suite
    │
    ├── agents/                  # Agent implementations
    │   ├── protocol-bridge/     # Protocol Bridge Agent
    │   │   ├── package.json
    │   │   └── src/
    │   │       ├── index.js
    │   │       ├── index.test.js
    │   │       ├── protocol-converter.js
    │   │       ├── mcp-bridge.js
    │   │       └── a2a-bridge.js
    │   ├── framework-integration/  # Framework Integration Agent
    │   ├── performance-optimization/ # Performance Agent
    │   ├── documentation-generation/ # Documentation Agent
    │   └── quality-assurance/      # QA Agent
    │
    ├── agent-orchestrator/      # Agent orchestration service
    │   ├── agent.yml            # Service agent config
    │   └── openapi.yaml         # Service OpenAPI spec
    │
    ├── agent-registry/          # Agent registry service
    │   ├── agent.yml            # Service agent config
    │   └── openapi.yaml         # Service OpenAPI spec
    │
    ├── universal-agent-toolkit/ # Universal agent toolkit
    │   ├── package.json         # Service package config
    │   └── server.js            # Service server
    │
    ├── validation-api/          # Validation API service
    │   ├── Dockerfile           # Service container
    │   ├── docker-compose.yml   # Service compose
    │   ├── openapi.json         # Service OpenAPI spec
    │   ├── package.json         # Service package config
    │   ├── server.js            # Service server
    │   ├── __tests__/           # Service tests
    │   │   ├── compliance-validator.test.js
    │   │   ├── dual-format-validator.test.js
    │   │   └── validation-api.test.js
    │   ├── services/            # Service modules
    │   │   ├── agent-config-validator.js
    │   │   ├── compliance-validator.js
    │   │   ├── dual-format-validator.js
    │   │   ├── framework-service.js
    │   │   ├── openapi-validator-service.js
    │   │   ├── openapi-validator.js
    │   │   ├── protocol-validator.js
    │   │   ├── tddai-integration.js
    │   │   └── token-estimator.js
    │   └── scripts/             # Service scripts
    │       └── bulk-agent-validator.js
    │
    └── validation-cli/          # Validation CLI tool
        └── lib/                 # CLI library
            ├── package.json     # CLI package config
            ├── __tests__/       # CLI tests
            │   └── validator.test.js
            └── validators/      # CLI validators
                ├── agent-config-validator.js
                ├── compliance-validator.js
                ├── framework-service.js
                ├── openapi-validator-service.js
                ├── openapi-validator.js
                ├── protocol-validator.js
                ├── tddai-integration.js
                └── token-estimator.js
```

## 🔒 File Creation Rules

### **Root Directory**
- **ALLOWED ONLY**: `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`, `ROADMAP.md`
- **FORBIDDEN**: ALL other files including `.json`, `.js`, `.ts`, test files, or any directories except those listed

### **Documentation (`docs/`)**
- **ALLOWED**: `.md` files only
- **FORBIDDEN**: Code files, binary files, random directories

### **Examples (`examples/`)**
- **ALLOWED**: `.md`, `.yml`, `.yaml`, `.js`, `.ts`, `.json` files
- **FORBIDDEN**: Binary files, random directories, generated content

### **Scripts (`scripts/`)**
- **ALLOWED**: `.js` files for build automation only
- **FORBIDDEN**: Generated reports, temporary files, random directories

### **Services (`services/`)**
- **ALLOWED**: Service-specific files (`.js`, `.json`, `.yml`, `.yaml`, `.md`)
- **FORBIDDEN**: Generated reports, temporary files, random directories

## 🚨 AI Bot Restrictions

**AI bots MUST:**
1. **ONLY** create files in existing directories
2. **NEVER** create new top-level directories
3. **NEVER** create `compliance-reports/`, `security-reports/`, etc.
4. **NEVER** create temporary or random directories
5. **ALWAYS** follow the exact structure above

**AI bots SHOULD:**
1. Place new documentation in `docs/`
2. Place new examples in `examples/`
3. Place new services in `services/`
4. Place new scripts in `scripts/`
5. Update existing files rather than creating new ones

## 📋 File Naming Conventions

- **Directories**: lowercase with hyphens (`agent-orchestrator`)
- **Files**: lowercase with hyphens and appropriate extensions
- **README files**: `README.md` (exactly this name)
- **Configuration files**: `package.json`, `.gitignore`, etc.

## 🔍 Validation

Before committing, ensure:
1. No new top-level directories were created
2. No `compliance-reports/` or similar generated directories exist
3. All files are in their correct locations
4. No temporary or random files exist

## 📞 Reporting Issues

If you find AI bots creating random folders or files:
1. **IMMEDIATELY** delete the random directories/files
2. **NEVER** commit them
3. Report the issue with the bot's name and what it created
4. Update this document if new patterns are discovered

---

**Remember: This structure is ENFORCED. Deviations will be rejected.**
