# OSSA /src Directory Cleanup Plan

## Current Issues

### 1. Duplicate Directories
```
/src/api/                  # Main API definitions
/src/cli/api/              # CLI-specific API (should be merged)
/src/services/services/    # Nested duplicate
/src/services/src/         # Another src inside services!
```

### 2. Duplicate Files
- `uadp-discovery.js` and `uadp-discovery.ts` (keep TypeScript version)
- Multiple `openapi.yaml` files in different locations
- JavaScript files that have TypeScript equivalents

### 3. Incorrect Structure
Current structure violates the 3-level depth rule with nested duplicates.

## Recommended Structure

```
/src/
├── api/                    # All API definitions
│   ├── http/              # REST endpoints
│   ├── graphql/           # GraphQL schemas
│   ├── mcp/               # MCP protocol
│   ├── schemas/           # Shared schemas (OpenAPI, JSON)
│   └── openapi.yaml       # Main OpenAPI spec
├── cli/                    # CLI application
│   ├── bin/               # Executable entry points
│   ├── commands/          # CLI commands
│   ├── templates/         # Templates for generation
│   └── dist/              # Compiled output
├── services/              # Business logic services
│   ├── agent-core/        # Core agent functionality
│   ├── coordination/      # Multi-agent coordination
│   ├── discovery/         # Agent discovery (UADP)
│   ├── gateway/           # API gateway
│   ├── monitoring/        # Observability
│   └── orchestration/     # Workflow orchestration
├── config/                # Configuration files
│   ├── ci/                # CI/CD configs
│   └── ossa/              # OSSA-specific configs
├── utils/                 # Shared utilities
│   ├── validators/        # Validation helpers
│   └── frameworks/        # Framework integrations
├── types/                 # TypeScript type definitions
├── telemetry/            # Telemetry and metrics
└── repositories/         # Data access layer

```

## Cleanup Actions

### Phase 1: Backup
```bash
# Create backup
cp -r /Users/flux423/Sites/LLM/OSSA/src /Users/flux423/Sites/LLM/OSSA/src_backup_$(date +%Y%m%d)
```

### Phase 2: Remove Duplicates
```bash
# Remove nested duplicates
mv /Users/flux423/Sites/LLM/OSSA/src/services/services/* /Users/flux423/Sites/LLM/OSSA/src/services/ 2>/dev/null
mv /Users/flux423/Sites/LLM/OSSA/src/services/src/* /Users/flux423/Sites/LLM/OSSA/src/services/ 2>/dev/null

# Remove empty nested directories
rmdir /Users/flux423/Sites/LLM/OSSA/src/services/services 2>/dev/null
rmdir /Users/flux423/Sites/LLM/OSSA/src/services/src 2>/dev/null
```

### Phase 3: Consolidate APIs
```bash
# Merge CLI API into main API
cp /Users/flux423/Sites/LLM/OSSA/src/cli/api/*.ts /Users/flux423/Sites/LLM/OSSA/src/api/cli/
mv /Users/flux423/Sites/LLM/OSSA/src/cli/api /Users/flux423/Sites/LLM/OSSA/__DELETE_LATER/cli-api-backup
```

### Phase 4: Remove Duplicate Files
```bash
# Keep TypeScript versions, remove JavaScript duplicates
mv /Users/flux423/Sites/LLM/OSSA/src/services/uadp-discovery.js /Users/flux423/Sites/LLM/OSSA/__DELETE_LATER/
mv /Users/flux423/Sites/LLM/OSSA/src/services/orchestration-cli.js /Users/flux423/Sites/LLM/OSSA/__DELETE_LATER/
mv /Users/flux423/Sites/LLM/OSSA/src/services/validation-server.js /Users/flux423/Sites/LLM/OSSA/__DELETE_LATER/
```

### Phase 5: Organize Services
```bash
# Move service files to appropriate subdirectories
# orchestration-cli.js → services/orchestration/cli.ts
# uadp-discovery.ts → services/discovery/uadp.ts
# validation-server.js → services/validation/server.ts
```

## Benefits After Cleanup

1. **Clear separation of concerns** - API, CLI, and Services are distinct
2. **No duplicate files** - Single source of truth for each component
3. **Consistent TypeScript** - Remove JS/TS duplicates
4. **3-level depth compliance** - Proper hierarchical structure
5. **Easier navigation** - Logical organization by function

## Next Steps

1. Review this plan
2. Create backup
3. Execute cleanup phases
4. Update imports in affected files
5. Test CLI and services still work
6. Commit changes