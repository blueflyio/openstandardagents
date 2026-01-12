# OSSA Migrate Command

Migrates OSSA manifests between versions.

## Usage
`/ossa-migrate <source> [target-version]`

## Behavior
- Migrates OSSA manifests from older versions to current
- Preserves agent functionality while updating schema
- Creates backup of original files
- Validates migrated output

## Example
```
/ossa-migrate examples/agent-manifests/old-agent.yml 0.2.6
```

## Tool Usage
- Read File: Examine source manifests
- Edit: Update manifest files
- Terminal: Run migration commands
- Search: Find migration patterns

