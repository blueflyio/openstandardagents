# OSSA Developer CLI

**Separate from npm package** - Only for developers working on OSSA itself.

## Purpose

- **Version Management**: One command to release (`ossa-dev version:release`)
- **Validation**: Validate version consistency (`ossa-dev version:validate`)
- **Audit**: Find all hardcoded versions (`ossa-dev version:audit`)
- **Spec Generation**: Generate spec in CI (`ossa-dev spec:generate`)

## Architecture

- **OpenAPI-First**: `openapi/dev-cli.openapi.yml` defines all commands
- **Zod Validation**: All inputs/outputs validated with Zod schemas
- **DRY**: Single source of truth (`.version.json`)
- **SOLID**: Each command is a separate service

## Commands

```bash
# Version Management
ossa-dev version:release [patch|minor|major]  # One command to release
ossa-dev version:validate                     # Validate consistency
ossa-dev version:audit                        # Find hardcoded versions
ossa-dev version:sync                         # Sync {{VERSION}} placeholders
ossa-dev version:replace <old> <new>         # Replace version in files

# Spec Generation (for CI)
ossa-dev spec:generate                        # Generate spec from source
ossa-dev spec:validate                        # Validate generated spec

# Workflow Help
ossa-dev workflow:release                     # Show release workflow
ossa-dev workflow:validate                    # Show validation workflow
```

## Installation

```bash
# Install dependencies
npm install

# Link locally
npm link

# Use
ossa-dev version:release patch
```

## CI Integration

The CI uses `ossa-dev spec:generate` to generate the spec from source, preventing local AI bots from breaking it.
