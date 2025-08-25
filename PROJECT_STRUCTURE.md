# OpenAPI AI Agents Standard - Project Structure Guide

**IMPORTANT: This document defines the ONLY allowed directory structure. AI bots and contributors MUST follow this structure exactly.**

## 🚫 What NOT to Create

**NEVER create these directories or files:**
- `compliance-reports/` (generated at build time)
- `security-reports/` (generated at build time)
- `performance-reports/` (generated at build time)
- `test-results/` (generated at build time)
- `temp/`, `tmp/`, `random/` (temporary files)
- `ai-generated/`, `bot-created/` (AI bot artifacts)
- Any directory not listed below

## ✅ Allowed Directory Structure

```
openapi-ai-agents-standard/
├── .git/                          # Git repository (auto-created)
├── .gitlab/                       # GitLab CI components
│   └── ci-components/
│       └── agent-validator/
│           └── template.yml
├── .gitignore                     # Git ignore rules
├── .gitlab-ci.yml                # GitLab CI/CD pipeline
├── CODE_OF_CONDUCT.md            # Community guidelines
├── CONTRIBUTING.md               # Contribution guidelines
├── LICENSE                       # MIT license
├── PROJECT_STRUCTURE.md          # This file
├── README.md                     # Main project documentation
├── ROADMAP.md                    # Development roadmap
├── package.json                  # NPM package configuration
├── package-lock.json             # NPM lock file (auto-generated)
├── node_modules/                 # Dependencies (auto-generated, gitignored)
│
├── docs/                         # Documentation only
│   ├── specification.md          # Technical specification
│   ├── integration-guide.md     # Framework integration guide
│   ├── governance.md            # Governance and compliance
│   └── INTEGRATION.md           # Integration examples
│
├── examples/                     # Example implementations only
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
├── scripts/                      # Build and automation scripts only
│   └── report-compliance.js     # Compliance reporting script
│
└── services/                     # Core services only
    ├── agent-orchestrator/      # Agent orchestration service
    │   ├── agent.yml            # Service agent config
    │   └── openapi.yaml         # Service OpenAPI spec
    ├── agent-registry/          # Agent registry service
    │   ├── agent.yml            # Service agent config
    │   └── openapi.yaml         # Service OpenAPI spec
    ├── universal-agent-toolkit/ # Universal agent toolkit
    │   ├── package.json         # Service package config
    │   └── server.js            # Service server
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
- **ALLOWED**: `.md`, `.yml`, `.yaml`, `.js`, `.ts`, `.json` files
- **FORBIDDEN**: Any other file types or random directories

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
