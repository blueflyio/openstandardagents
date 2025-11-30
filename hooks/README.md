# OSSA Git Hooks

This directory contains Git hooks to maintain quality and consistency in the OSSA project.

## Available Hooks

### `pre-commit`
Runs before each commit to validate OSSA manifests.

**What it does:**
- Validates all staged OSSA manifest files (`.yaml`, `.json`)
- Ensures manifests conform to OSSA schema
- Prevents committing invalid agent definitions

**Install:**
```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### `commit-msg`
Enforces Conventional Commits format for commit messages.

**What it does:**
- Validates commit message format
- Ensures type prefix (feat, fix, docs, etc.)
- Maintains consistent commit history

**Install:**
```bash
cp hooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

### `pre-push`
Runs comprehensive validation before pushing to remote.

**What it does:**
- Validates all OSSA manifests in the repository
- Checks for breaking changes
- Rebuilds knowledge graph

**Install:**
```bash
cp hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

### `post-merge`
Runs after merging to update dependencies.

**What it does:**
- Updates npm dependencies if package.json changed
- Warns about schema changes
- Provides guidance on required updates

**Install:**
```bash
cp hooks/post-merge .git/hooks/post-merge
chmod +x .git/hooks/post-merge
```

## Install All Hooks

```bash
#!/bin/bash
for hook in hooks/*; do
  if [ -f "$hook" ] && [ "$hook" != "hooks/README.md" ] && [ "$hook" != "hooks/*.sample" ]; then
    cp "$hook" ".git/hooks/$(basename $hook)"
    chmod +x ".git/hooks/$(basename $hook)"
    echo "✓ Installed $(basename $hook)"
  fi
done
```

## Bypassing Hooks

If you need to bypass hooks (not recommended):

```bash
git commit --no-verify
git push --no-verify
```

## Conventional Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style (formatting, missing semi-colons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD pipeline changes
- **build**: Build system changes

## Examples

```bash
# Good commit messages
git commit -m "feat: add autonomous agent example"
git commit -m "fix(schema): correct llm provider validation"
git commit -m "docs: update README with installation instructions"
git commit -m "refactor(tools): simplify HTTP tool configuration"

# Bad commit messages (will be rejected)
git commit -m "updated stuff"
git commit -m "fix bug"
git commit -m "WIP"
```
