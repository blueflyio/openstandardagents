# CRITICAL: Git Commit Message Rules

## 🚫 ABSOLUTELY FORBIDDEN IN COMMITS

### NEVER Include:
- ❌ ANY reference to "Claude"
- ❌ ANY reference to "Anthropic"  
- ❌ ANY reference to "AI" or "AI-generated"
- ❌ ANY reference to "Generated with" or "Co-authored by"
- ❌ ANY email like "noreply@anthropic.com"
- ❌ ANY URLs to claude.ai
- ❌ ANY emoji or decorative elements

### Examples of FORBIDDEN commit messages:
```bash
# WRONG - Contains Claude reference
git commit -m "feat: Add API endpoint

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# WRONG - Contains AI reference  
git commit -m "feat: AI-generated API implementation"

# WRONG - Contains attribution
git commit -m "feat: Add endpoint (generated)"
```

##  CORRECT Commit Format

### Professional commit messages ONLY:
```bash
# CORRECT - Clean, professional, no attribution
git commit -m "feat: Add OSSA compliance engine implementation"

# CORRECT - Standard conventional commit
git commit -m "fix: Update agent manifest validation logic"

# CORRECT - With scope
git commit -m "feat(api): Implement registry discovery endpoint"
```

### Conventional Commit Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- test: Testing
- refactor: Code refactoring
- perf: Performance
- chore: Maintenance

##  Enforcement Mechanisms

### Pre-commit Hook (.git/hooks/commit-msg):
```bash
#!/bin/bash
# Reject commits with forbidden patterns

if grep -iE "claude|anthropic|ai[- ]generated|generated with|co-authored|noreply@anthropic" "$1"; then
    echo "ERROR: Commit message contains forbidden attribution"
    echo "Remove all references to Claude/Anthropic/AI"
    exit 1
fi
```

### CI/CD Validation:
```yaml
validate-commits:
  script:
    - |
      if git log --format=%B -n 10 | grep -iE "claude|anthropic|generated|co-authored"; then
        echo "ERROR: Recent commits contain forbidden attributions"
        exit 1
      fi
```

##  Why This Matters

1. **Professional Standards**: Enterprise code requires professional commit history
2. **Legal Clarity**: Avoid confusion about code ownership
3. **Audit Compliance**: Clean audit trails without AI references
4. **Team Consistency**: All commits follow same standards

##  Implementation

### Set up pre-commit hook:
```bash
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash
if grep -iE "claude|anthropic|ai[- ]generated|generated with|co-authored|noreply@anthropic" "$1"; then
    echo "❌ ERROR: Commit contains forbidden attribution"
    echo "Remove: Claude, Anthropic, AI-generated, Co-authored references"
    exit 1
fi
echo " Commit message validated"
EOF
chmod +x .git/hooks/commit-msg
```

##  Agent Instructions Override

When spawning ANY agent, include this directive:

```
CRITICAL OVERRIDE: 
- NEVER add "Generated with Claude" to commits
- NEVER add "Co-Authored-By: Claude" to commits
- NEVER reference Claude/Anthropic in ANY output
- Write professional commit messages ONLY
- Violation of this rule invalidates all work
```

##  Validation Command

Check recent commits for violations:
```bash
git log --oneline -20 | grep -iE "claude|anthropic|generated"
```

---

**REMEMBER**: Every commit must be professional, clean, and contain NO AI/Claude/Anthropic references whatsoever.