# OSSA Development Best Practices

## Core Principles

### 1. ROADMAP.md is Truth
- **ALWAYS** check ROADMAP.md before making changes
- **NEVER** create features not listed in the roadmap
- **UPDATE** ROADMAP.md when tasks are completed

### 2. Specification-First Development
- Write OpenAPI specs BEFORE implementation
- Validate all specs with `ossa spec validate`
- Keep specs in `specifications/` directory

### 3. Clear Separation of Concerns
- OSSA = Specifications and standards ONLY
- Implementation code goes to agent_buildkit
- No runtime code in OSSA (it's like OpenAPI)

## Command Structure

### DO 
```bash
ossa spec create --from-roadmap
ossa validate --compliance ISO-42001
ossa discover --capability [type]
```

### DON'T ❌
```bash
ossa-uap-spec-create  # Too many hyphens
ossa_spec_create      # No underscores
OSSA SPEC CREATE      # No all caps
```

## File Organization

### Correct Structure
```
OSSA/
├── specifications/     # OpenAPI specs
├── schemas/           # JSON schemas
├── protocols/         # Protocol definitions
├── docs/             # Documentation
└── ROADMAP.md        # Single source of truth
```

### What NOT to Put in OSSA
- Implementation code
- Runtime engines
- Docker files
- Deployment scripts
- Actual agent code

## Documentation Rules

### 1. Location Matters
- Project-specific docs in project's `/docs`
- Don't mix OSSA docs with BuildKit docs
- Keep README.md focused and concise

### 2. Naming Conventions
- Use clear acronyms that make sense
- Document what acronyms mean
- Keep command names simple and memorable

### 3. Version Everything
- Specifications use semantic versioning
- Tag releases properly
- Update ROADMAP.md version on completion

## Common Mistakes to Avoid

### 1. Over-Engineering
- ❌ Creating 500-line specs when 50 lines work
-  Start minimal, expand as needed

### 2. Wrong Repository
- ❌ Putting implementation in OSSA
-  OSSA = specs, BuildKit = implementation

### 3. Command Complexity
- ❌ `ossa-universal-agent-protocol-specification-create`
-  `ossa spec create`

### 4. Documentation Scatter
- ❌ Random docs everywhere
-  Organized /docs folder

## Quick Checklist Before Changes

- [ ] Is this in the ROADMAP.md?
- [ ] Am I in the right repository?
- [ ] Is this a spec (OSSA) or implementation (BuildKit)?
- [ ] Have I kept it simple?
- [ ] Will the command be easy to type?
- [ ] Is documentation in the right place?

## Remember

**OSSA** = The standard (like OpenAPI)
**BuildKit** = The implementation (like Express.js)
**ROADMAP.md** = The plan (always follow it)