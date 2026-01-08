# OSSA Validate Command

Validates OSSA agent manifests against the schema.

## Usage
`/ossa-validate [path]`

## Behavior
- Uses only search tools to find OSSA manifests
- Validates against current OSSA schema version
- Reports validation errors with file paths and line numbers
- Does not make edits - read-only validation

## Example
```
/ossa-validate examples/agent-manifests/
```

## Tool Restrictions
- Use only: Read File, List Directory, Grep, Terminal (for running ossa validate)
- Do NOT: Edit files, Delete files, or make any changes

