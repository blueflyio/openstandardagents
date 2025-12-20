<!--
OSSA Architecture Documentation
Purpose: Explain OSSA system design and components
Audience: Developers and architects
Educational Focus: How OSSA works internally
-->

# Architecture

## Overview

OSSA is built on three core principles:

1. **JSON Schema-based** - Leverage proven validation technology
2. **CLI-first** - Command-line tools for automation
3. **Library-second** - Programmatic access for integration

## Components

### 1. Schema Definition
JSON Schema files defining OSSA structure.

```
spec/
├── v0.3.0/
│   ├── ossa-0.3.0.schema.json
│   └── components/
```

### 2. Validation Engine
Validates agent definitions against schema.

```typescript
ValidationService
├── validate()
├── validateStrict()
└── validateSchemas()
```

### 3. Code Generator
Generates types and clients from definitions.

```typescript
GenerationService
├── generateTypes()
├── generateDocs()
└── generateClient()
```

### 4. Migration Tool
Migrates between OSSA versions.

```typescript
MigrationService
├── migrate()
├── detectVersion()
└── applyTransforms()
```

### 5. CLI
Command-line interface wrapping services.

```
bin/
├── ossa
├── ossa-validate
└── ossa-generate
```

## Data Flow

```
Agent Definition (JSON)
    ↓
Validation Service
    ↓
[Valid] → Generation Service → Types/Docs
    ↓
[Invalid] → Error Report
```

## Extension Points

- Custom validators
- Custom generators
- Custom migration transforms
- Plugin system (planned)

---

**Next**: [Contributing](contributing.md) to contribute
