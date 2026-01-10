# OSSA Generate Command

Generates OSSA agent manifests from templates.

## Usage
`/ossa-generate <type> [options]`

## Behavior
- Generates agent manifests using OSSA CLI
- Supports types: worker, chat, workflow, compliance, orchestrator
- Creates files in appropriate directories
- Validates generated output automatically

## Example
```
/ossa-generate worker --name "My Agent" --id my-agent
```

## Tool Usage
- Terminal: Run `ossa generate` commands
- Edit: Create new manifest files
- Search: Find template examples

