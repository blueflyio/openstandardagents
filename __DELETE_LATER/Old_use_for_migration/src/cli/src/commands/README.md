# OSSA Migration Tools v0.1.8

Comprehensive migration utilities for transitioning from OSSA v0.1.2 to v0.1.8 with full API-first architecture support.

## Overview

The OSSA Migration Tools provide automated migration capabilities for:
- Agent configuration transformation
- Schema conversion to OpenAPI 3.1+ specifications  
- Legacy format compatibility
- Validation and rollback capabilities
- API-first architectural compliance

## Migration Commands

### 1. Agent Migration (`migrate`)

Transform OSSA v0.1.2 agents to v0.1.8 format with API-first approach.

```bash
# Migrate agents in current directory
ossa migrate agents

# Migrate specific path with dry run
ossa migrate agents ./agents --dry-run

# Force migration with verbose output
ossa migrate agents ./legacy-agents --force --verbose --output-dir ./migrated

# Migrate with custom pattern
ossa migrate agents --pattern "**/*agent*.yml" --no-backup
```

**Options:**
- `--dry-run` - Preview changes without writing files
- `--no-backup` - Skip creating backups
- `--force` - Force migration without prompts
- `--verbose` - Detailed output
- `--output-dir <dir>` - Custom output directory
- `--pattern <pattern>` - File matching pattern

### 2. Schema Migration (`schema-migration`)

Convert agent schemas to OpenAPI 3.1+ specifications with API-first design.

```bash
# Transform single agent to OpenAPI
ossa schema-migration transform ./agent.yml --output ./agent-api.yaml

# Batch transformation
ossa schema-migration batch "**/*agent*.yml" --output-dir ./api-specs

# Generate JSON format with documentation
ossa schema-migration transform ./agent.yml --format json --api-version 3.1.0
```

**Features:**
- Automatic endpoint generation from capabilities
- OpenAPI 3.1+ compliance
- ReDoc documentation generation
- Security scheme configuration
- UADP discovery integration

### 3. Legacy Format Converter (`legacy-convert`)

Convert proprietary and legacy formats to OSSA v0.1.8.

```bash
# Convert single file with format detection
ossa legacy-convert file ./legacy-agent.json

# Convert TOML configuration
ossa legacy-convert file ./agent.toml --format toml --target yaml

# Batch convert multiple formats
ossa legacy-convert batch "**/*.{json,toml,properties}" --output-dir ./converted

# Convert with strict validation
ossa legacy-convert file ./agent.properties --strict --verbose
```

**Supported Formats:**
- JSON (various schemas)
- YAML (legacy OSSA versions)
- TOML configurations
- Java Properties files
- Custom agent formats

### 4. Migration Validator (`migration-validator`)

Validate migration results and provide rollback capabilities.

```bash
# Validate OSSA v0.1.8 compliance
ossa migration-validator validate "**/*agent*.yml"

# Strict validation with HTML report
ossa migration-validator validate --strict --report ./validation-report.html

# Generate detailed JSON report
ossa migration-validator validate --detailed --report ./report.json --format json

# Rollback previous migration
ossa migration-validator rollback --selective
```

**Validation Features:**
- Core OSSA v0.1.8 structure validation
- API-first architecture compliance
- Discovery protocol verification
- Conformance tier requirements
- Migration integrity checks

## Migration Workflow

### Complete Migration Process

1. **Pre-Migration Analysis**
   ```bash
   # Scan for legacy agents
   ossa migrate agents --dry-run --verbose
   
   # Validate current state  
   ossa migration-validator validate --strict
   ```

2. **Execute Migration**
   ```bash
   # Migrate agent configurations
   ossa migrate agents --force --backup
   
   # Transform schemas to API-first
   ossa schema-migration batch --api-version 3.1.0
   ```

3. **Convert Legacy Formats**
   ```bash
   # Handle custom formats
   ossa legacy-convert batch "**/*.{toml,properties,json}"
   ```

4. **Post-Migration Validation**
   ```bash
   # Comprehensive validation
   ossa migration-validator validate --strict --detailed --report ./final-report.html
   ```

5. **Rollback if Needed**
   ```bash
   # Selective rollback
   ossa migration-validator rollback --selective
   ```

## Migration Features

### Agent Configuration Migration

**From v0.1.2:**
```yaml
apiVersion: open-standards-scalable-agents/v0.1.2
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
spec:
  capabilities: ["execute", "analyze"]
```

**To v0.1.8:**
```yaml
ossa: 0.1.8
metadata:
  name: my-agent
  version: 1.0.0
  annotations:
    ossa.io/migration-date: "2025-09-08"
    ossa.io/source-version: "v0.1.2"
spec:
  agent:
    name: my-agent
    expertise: ["general"]
  capabilities: ["execute", "analyze"]
  api:
    version: "3.1.0"
    enabled: true
    endpoints:
      - path: "/execute/execute"
        method: "POST"
      - path: "/execute/analyze" 
        method: "POST"
  discovery:
    uadp:
      enabled: true
      tags: ["agent", "migrated"]
```

### Schema Transformation

Automatic conversion to OpenAPI 3.1+ specifications:

- **Capability Mapping**: Transforms capabilities to REST endpoints
- **Security Integration**: Adds authentication schemes
- **Documentation**: Generates ReDoc HTML documentation
- **Discovery**: Integrates UADP protocol support

### Legacy Format Support

**TOML Configuration:**
```toml
[metadata]
name = "my-agent"
version = "1.0.0"

[capabilities]
execute = true
analyze = true
```

**Properties File:**
```properties
agent.name=my-agent
agent.version=1.0.0
capabilities.execute=true
capabilities.analyze=true
```

All converted to compliant OSSA v0.1.8 format.

### Validation & Rollback

**Validation Checks:**
- Core structure compliance
- Required field validation
- API-first architecture
- Discovery protocol configuration
- Conformance tier requirements

**Rollback Features:**
- Automatic backup creation
- Checksum verification
- Selective file rollback
- Migration integrity validation

## Configuration

### Migration Options

Create `.ossa-migration.yml` for custom settings:

```yaml
migration:
  backup:
    enabled: true
    directory: ".ossa-migration-backup"
    retention: 30 # days
  
  validation:
    strict: false
    failFast: false
    
  output:
    format: "yaml"
    preserveComments: true
    
  api:
    version: "3.1.0"
    generateDocs: true
    
  discovery:
    uadp:
      enabled: true
      autoTags: true
```

### Environment Variables

```bash
# Migration settings
OSSA_MIGRATION_BACKUP_DIR=".migration-backup"
OSSA_MIGRATION_STRICT=false
OSSA_MIGRATION_API_VERSION="3.1.0"

# Validation settings
OSSA_VALIDATION_FAIL_FAST=false
OSSA_VALIDATION_DETAILED=true
```

## Examples

### Migrate Enterprise Deployment

```bash
#!/bin/bash
# Enterprise migration script

echo "🚀 OSSA Enterprise Migration v0.1.2 → v0.1.8"

# 1. Pre-migration validation
ossa migration-validator validate "agents/**/*.yml" --report pre-migration.json

# 2. Backup current state
cp -r agents agents-backup-$(date +%Y%m%d)

# 3. Migrate agents
ossa migrate agents agents/ --force --verbose --output-dir migrated-agents/

# 4. Transform schemas to API-first
ossa schema-migration batch "migrated-agents/**/*.yml" --output-dir api-specs/

# 5. Convert legacy configurations
ossa legacy-convert batch "config/**/*.{toml,properties}" --output-dir converted-config/

# 6. Post-migration validation
ossa migration-validator validate "migrated-agents/**/*.yml" --strict --report post-migration.html

echo "✅ Migration completed. Review post-migration.html for results."
```

### Selective Migration

```bash
# Migrate only core tier agents
ossa migrate agents --pattern "**/core-*-agent.yml" --dry-run

# Convert specific legacy formats
ossa legacy-convert batch "**/*.toml" --format toml --target yaml

# Validate only advanced tier agents
ossa migration-validator validate "**/advanced-*-agent.yml" --strict
```

## Error Handling

### Common Issues

1. **Parse Errors**: Invalid YAML/JSON syntax
   ```bash
   # Validate syntax before migration
   yamllint agents/*.yml
   ```

2. **Missing Required Fields**: 
   ```bash
   # Use detailed validation
   ossa migration-validator validate --detailed
   ```

3. **Backup Conflicts**:
   ```bash
   # Force overwrite backups
   ossa migrate agents --force --backup
   ```

4. **API Version Compatibility**:
   ```bash
   # Specify API version
   ossa schema-migration transform agent.yml --api-version 3.1.0
   ```

### Recovery Commands

```bash
# Rollback all changes
ossa migration-validator rollback --force

# Rollback specific files
ossa migration-validator rollback --selective

# Restore from custom backup
cp -r agents-backup-20250908/* agents/
```

## Best Practices

### Pre-Migration

1. **Version Control**: Commit all changes before migration
2. **Backup**: Create comprehensive backups
3. **Validation**: Run pre-migration validation
4. **Testing**: Test migration on non-production agents

### During Migration

1. **Incremental**: Migrate in batches, not all at once
2. **Monitoring**: Use verbose output to monitor progress
3. **Validation**: Validate each batch before proceeding
4. **Documentation**: Keep migration logs

### Post-Migration

1. **Comprehensive Validation**: Run strict validation on all agents
2. **Testing**: Test API endpoints and discovery
3. **Documentation**: Update documentation and procedures
4. **Monitoring**: Monitor agent behavior post-migration

## Integration

### CI/CD Pipeline

```yaml
# .github/workflows/ossa-migration.yml
name: OSSA Migration
on: 
  workflow_dispatch:
    inputs:
      migration_type:
        description: 'Migration type'
        required: true
        type: choice
        options:
          - agents
          - schemas
          - legacy
          - validate

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install OSSA CLI
        run: npm install -g @bluefly/ossa-cli@latest
        
      - name: Run Migration
        run: |
          case "${{ github.event.inputs.migration_type }}" in
            "agents")
              ossa migrate agents --dry-run --report migration-preview.json
              ;;
            "schemas") 
              ossa schema-migration batch --dry-run
              ;;
            "legacy")
              ossa legacy-convert batch --dry-run
              ;;
            "validate")
              ossa migration-validator validate --strict --report validation.html
              ;;
          esac
          
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: migration-reports
          path: "*.{json,html}"
```

### Docker Integration

```dockerfile
FROM node:18-alpine

# Install OSSA CLI
RUN npm install -g @bluefly/ossa-cli@latest

# Copy agents
COPY agents/ /workspace/agents/

# Run migration
WORKDIR /workspace
RUN ossa migrate agents --force --verbose

# Validate results
RUN ossa migration-validator validate --strict

CMD ["ossa", "migrate", "--help"]
```

## Support

For migration support and troubleshooting:

1. **Documentation**: [OSSA Migration Guide](../../../docs/MIGRATION_GUIDE.md)
2. **Examples**: [Migration Examples](../../../examples/)
3. **Issues**: [GitHub Issues](https://github.com/bluefly/ossa/issues)
4. **Community**: [OSSA Discord](https://discord.gg/ossa)

## Version Compatibility

| OSSA CLI | Supports Migration From | Target Version |
|----------|------------------------|----------------|
| v0.1.8   | v0.1.2, v0.1.6        | v0.1.8        |
| v0.2.0   | v0.1.2, v0.1.6, v0.1.8| v0.2.0        |

---

**Note**: All migration tools are designed to be safe with automatic backups and rollback capabilities. Always test migrations in non-production environments first.