# v0.2.4 Release Process

## Current Status: Development (v0.2.4-dev)

We are currently in **development** phase for v0.2.4. The `spec/v0.2.4-dev/` directory contains the development version of the specification.

## Folder Naming Convention

### Development Versions
- **Format**: `spec/v0.2.X-dev/`
- **Example**: `spec/v0.2.4-dev/`
- **Purpose**: Active development, schema may change
- **Status**: Not stable, APIs may change

### Stable Releases
- **Format**: `spec/v0.2.X/`
- **Example**: `spec/v0.2.4/`
- **Purpose**: Stable, released specification
- **Status**: Frozen, no breaking changes

## Release Process (When Ready)

When v0.2.4 is ready for release:

### Step 1: Create Stable Directory
```bash
mkdir -p spec/v0.2.4
```

### Step 2: Copy and Prepare Files
```bash
# Copy all files from dev to stable
cp -r spec/v0.2.4-dev/* spec/v0.2.4/

# Rename schema files (remove -dev suffix)
cd spec/v0.2.4
mv ossa-0.2.4-dev.schema.json ossa-0.2.4.schema.json
mv ossa-0.2.4-dev.yaml ossa-0.2.4.yaml

# Update schema file contents
# - Change apiVersion pattern to accept ossa/v0.2.4 (without -dev)
# - Update $id and title to remove -dev
# - Update CHANGELOG.md to mark as stable release
```

### Step 3: Update References
- Update `package.json` exports to reference `spec/v0.2.4/ossa-0.2.4.schema.json`
- Update website version files
- Update documentation references
- Update examples to use `ossa/v0.2.4` (without -dev)

### Step 4: Handle Development Directory
**Option A: Keep for ongoing development**
- Keep `spec/v0.2.4-dev/` for patch development
- Create `spec/v0.2.5-dev/` for next minor version

**Option B: Rename for next version**
- Rename `spec/v0.2.4-dev/` to `spec/v0.2.5-dev/`
- Update all references to v0.2.5-dev

### Step 5: Update Schema Version Pattern
In `ossa-0.2.4.schema.json`, update apiVersion pattern:
```json
"pattern": "^ossa/v(0\\.2\\.[2-4]|1)(\\.[0-9]+)?(-[a-zA-Z0-9]+)?$"
```
Remove `-dev` from accepted versions for stable release.

## Current Structure

```
spec/
├── v0.2.3/              # Stable release
│   ├── ossa-0.2.3.schema.json
│   ├── ossa-0.2.3.yaml
│   ├── README.md
│   ├── CHANGELOG.md
│   └── migrations/
│
├── v0.2.4-dev/          # Development (current)
│   ├── ossa-0.2.4-dev.schema.json
│   ├── ossa-0.2.4-dev.yaml
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── migrations/
│   └── openapi/          # OpenAPI documentation
│       ├── README-0.2.4.md
│       ├── CHANGELOG-0.2.4.md
│       └── VERIFICATION-0.2.4.md
│
└── v0.2.5-dev/           # Future development
```

## After Release Structure

```
spec/
├── v0.2.3/              # Stable release
├── v0.2.4/              # NEW: Stable release (after release)
│   ├── ossa-0.2.4.schema.json  # No -dev suffix
│   ├── ossa-0.2.4.yaml
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── migrations/
│   └── openapi/
│
└── v0.2.4-dev/          # Keep for patches OR rename to v0.2.5-dev
```

## Decision: When to Create Stable Directory

**Create `spec/v0.2.4/` when:**
- ✅ All v0.2.4 milestone issues are complete
- ✅ All tests pass
- ✅ Schema is validated
- ✅ Documentation is complete
- ✅ Ready to tag and release

**Keep `spec/v0.2.4-dev/` for:**
- Ongoing development
- Patch releases (v0.2.4.1, v0.2.4.2, etc.)
- Or rename to v0.2.5-dev for next minor version

## OpenAPI Documentation

OpenAPI-related documentation for v0.2.4 is stored in:
- `spec/v0.2.4-dev/openapi/` (development)
- Will move to `spec/v0.2.4/openapi/` when released

This keeps all v0.2.4-related documentation together in the spec directory.

