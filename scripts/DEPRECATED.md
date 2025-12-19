# Deprecated Scripts

These scripts are **DEPRECATED** and will be removed in the next major version.
All functionality has been consolidated into the OSSA CLI.

## Use CLI Instead

| Old Script | New CLI Command |
|------------|-----------------|
| `bump-version.ts` | `ossa release version bump <type>` |
| `sync-version.js` | `ossa release version sync` |
| `sync-version.ts` | `ossa release version sync` |
| `sync-versions.ts` | `ossa release version check` |
| `version-sync.ts` | `ossa release version sync` |
| `ci-version-sync.ts` | `ossa release version sync` |
| `enhanced-version-manager.ts` | `ossa release version bump` |
| `version-examples.ts` | `ossa release version examples` |
| `sync-example-versions.sh` | `ossa release version examples` |

## Quick Reference

```bash
# Check version status
ossa release version status

# Bump version
ossa release version bump patch     # 0.3.0 → 0.3.1
ossa release version bump minor     # 0.3.0 → 0.4.0
ossa release version bump major     # 0.3.0 → 1.0.0
ossa release version bump rc        # 0.3.0 → 0.3.1-RC
ossa release version bump release   # 0.3.1-RC → 0.3.1

# Sync version placeholders
ossa release version sync                    # Core files only
ossa release version sync --include-examples # Include examples

# Check version consistency
ossa release version check

# Update example apiVersions
ossa release version examples
ossa release version examples --target ossa/v0.4.0
```

## Scripts Safe to Delete

After confirming CLI works in CI:

```bash
rm scripts/bump-version.ts
rm scripts/sync-version.js
rm scripts/sync-version.ts
rm scripts/sync-versions.ts
rm scripts/version-sync.ts
rm scripts/ci-version-sync.ts
rm scripts/enhanced-version-manager.ts
rm scripts/version-examples.ts
rm scripts/sync-example-versions.sh
```

## Migration Date

Consolidated: 2025-12-19
Removal Target: v0.4.0 release
