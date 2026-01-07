# Development Documentation

Internal development workflows and standards for OSSA project contributors.

## Version Management

**CRITICAL**: Never manually update version numbers.

See [VERSIONING.md](./VERSIONING.md) for complete automation workflow.

**Quick reference:**
```bash
# Bump version (auto-syncs everything)
npm run version:bump rc        # Create release candidate
npm run version:bump patch     # Patch release
npm run version:bump minor     # Minor release
npm run version:bump major     # Major release
npm run version:bump release   # RC → stable

# Manual sync (if needed)
npm run version:sync           # Sync version to all files
npm run docs:process           # Process 0.3.2 placeholders
```

**Single source of truth**: `.version.json`

All version references automatically sync from this file to:
- package.json files
- README badges
- Documentation
- Spec directories

## Documents

- `VERSIONING.md` - Complete version management automation guide
