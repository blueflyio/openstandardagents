# OSSA Schema Command

Works with OSSA schema definitions and validation.

## Usage
`/ossa-schema [action]`

## Behavior
- Validates schema JSON files
- Generates TypeScript types from schema
- Generates Zod validators from schema
- Syncs schema versions across project

## Actions
- `validate` - Validate schema files
- `gen-types` - Generate TypeScript types
- `gen-zod` - Generate Zod validators
- `sync` - Sync versions across project

## Example
```
/ossa-schema gen-types
```

## Tool Usage
- Read File: Examine schema files
- Terminal: Run generation commands
- Edit: Update generated files if needed

