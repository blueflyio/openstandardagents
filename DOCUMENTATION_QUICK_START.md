# Documentation Quick Start

**TL;DR**: Auto-generate professional documentation for OSSA in 3 commands

## Quick Commands

```bash
# 1. Install dependencies
npm ci

# 2. Generate all documentation
npm run docs:generate

# 3. View generated docs
ls -la website/content/docs/
```

## What Gets Generated

### API Documentation
- **Input**: `openapi/core/*.yaml`
- **Output**: `website/content/docs/api-reference/`
- **Includes**: All endpoints, examples, authentication

### CLI Documentation
- **Input**: `src/cli/commands/*.ts`
- **Output**: `website/content/docs/cli-reference/`
- **Includes**: All 11 commands, examples, options

### Schema Documentation
- **Input**: `spec/v0.2.5-RC/ossa-0.2.5-RC.schema.json`
- **Output**: `website/content/docs/schema-reference/`
- **Includes**: All fields, why/how/where, examples

## Individual Generation

```bash
# Generate only API docs
npm run docs:api:generate

# Generate only CLI docs
npm run docs:cli:generate

# Generate only schema docs
npm run docs:schema:generate
```

## Validation

```bash
# Validate documentation
npm run docs:validate

# Check for broken links
npx markdown-link-check website/content/docs/**/*.md

# Lint markdown
npm run docs:lint
```

## Automation

### GitLab Agent
```bash
# Deploy documentation agent
kubectl apply -f .gitlab/agents/doc-agent/manifest.ossa.yaml

# Check agent status
kubectl get pods -l app=doc-agent
```

### CI/CD Pipeline
Documentation automatically regenerates when:
- OpenAPI specs change
- CLI commands change
- JSON Schema changes

## File Structure

```
openstandardagents/
├── DOCUMENTATION_AUDIT.md              # Complete audit
├── DOCUMENTATION_IMPLEMENTATION_GUIDE.md  # 21-day plan
├── DOCUMENTATION_TRANSFORMATION_SUMMARY.md  # Overview
├── DOCUMENTATION_QUICK_START.md        # This file
├── scripts/
│   ├── generate-api-docs.ts           # API doc generator
│   ├── generate-cli-docs.ts           # CLI doc generator
│   └── generate-schema-docs.ts        # Schema doc generator
├── .gitlab/agents/doc-agent/
│   └── manifest.ossa.yaml             # Documentation agent
└── website/content/docs/
    ├── api-reference/                 # Generated API docs
    ├── cli-reference/                 # Generated CLI docs
    └── schema-reference/              # Generated schema docs
```

## Next Steps

1. **Read**: `DOCUMENTATION_AUDIT.md` for complete analysis
2. **Follow**: `DOCUMENTATION_IMPLEMENTATION_GUIDE.md` for step-by-step
3. **Review**: `DOCUMENTATION_TRANSFORMATION_SUMMARY.md` for overview
4. **Generate**: Run `npm run docs:generate` to create docs
5. **Deploy**: Deploy documentation agent for automation

## Key Features

✅ **Auto-Generated**: No manual documentation updates  
✅ **Always In Sync**: Docs update when code changes  
✅ **Professional Quality**: Consistent templates  
✅ **Example-Rich**: Every command/endpoint has examples  
✅ **Cross-Linked**: Related topics connected  
✅ **Self-Healing**: GitLab agent auto-fixes issues  

## Support

- **Issues**: Label with `documentation`
- **Questions**: See implementation guide
- **Templates**: See audit document

---

**Transform OSSA documentation in 21 days. Start now.**
