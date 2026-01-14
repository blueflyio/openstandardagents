# OSSA Release Command

Manages OSSA releases and versioning.

## Usage
`/ossa-release [action]`

## Behavior
- Syncs versions across package.json, schemas, and docs
- Validates release readiness
- Checks milestone completion
- Ensures CI/CD compatibility

## Actions
- `sync` - Sync versions across project
- `validate` - Validate release readiness
- `check` - Check milestone status

## Example
```
/ossa-release sync
```

## Tool Usage
- Read File: Examine version files
- Terminal: Run sync commands
- Search: Find version references

