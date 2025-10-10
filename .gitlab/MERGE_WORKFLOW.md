# OSSA Merge Workflow Guide

## Merge Strategy: Fast-Forward Only

OSSA uses **fast-forward merge** strategy to maintain a clean, linear Git history.

## Why Fast-Forward?

- **Clean History**: No merge commits cluttering the log
- **Easy Debugging**: Linear history makes `git bisect` simple
- **Clear Accountability**: Every commit is meaningful and tested
- **Specification Standard**: As a specification project, clarity is paramount

## Branch Workflow

```
main (protected)
  │
  ├── development (protected)
  │      │
  │      ├── feature/your-feature
  │      ├── bug/fix-something
  │      └── hotfix/urgent-fix
```

## Merge Process

### 1. Feature Development
```bash
git checkout development
git pull origin development
git checkout -b feature/your-feature
# Make changes
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

### 2. Before Creating MR
```bash
# Ensure branch is up to date
git checkout development
git pull origin development
git checkout feature/your-feature
git rebase development
git push --force-with-lease origin feature/your-feature
```

### 3. Merge Request Requirements

- Pipeline must pass
- Code review approval required
- All discussions resolved
- Branch must be up-to-date with target

### 4. Merge Train (High-Traffic Periods)

When enabled, merge trains will:
1. Queue your MR
2. Automatically rebase when it's your turn
3. Run pipeline with latest changes
4. Merge if successful
5. Move to next MR in queue

## Protected Branches

### main
- No direct pushes
- Requires successful pipeline
- Requires 2 approvals
- Only accepts fast-forward merges

### development
- No direct pushes
- Requires successful pipeline
- Requires 1 approval
- Fast-forward merges only

## Commit Message Convention

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Test additions
- `chore:` Maintenance

## Squashing Commits

Before merging, consider squashing related commits:

```bash
# Interactive rebase to squash last 3 commits
git rebase -i HEAD~3
# Mark commits to squash, then force push
git push --force-with-lease
```

## Troubleshooting

### "Cannot fast-forward merge"
Your branch is behind. Rebase on target:
```bash
git fetch origin
git rebase origin/development
git push --force-with-lease
```

### "Pipeline failed"
1. Check pipeline logs
2. Fix issues locally
3. Push fixes
4. Pipeline reruns automatically

### "Merge conflicts"
1. Rebase on target branch
2. Resolve conflicts locally
3. Test thoroughly
4. Force push with lease

## Best Practices

1. **Keep MRs Small**: Easier to review and merge
2. **Update Frequently**: Rebase daily on active branches
3. **Clean Commits**: Each commit should be functional
4. **Descriptive Messages**: Clear commit messages
5. **Test Locally**: Run tests before pushing

## GitLab Configuration

Project settings for fast-forward merge:
- Settings → General → Merge requests
- Merge method: Fast-forward merge
- Enable merge trains (optional)
- Delete source branch after merge

## Questions?

Contact the OSSA maintainers or refer to GitLab documentation on merge strategies.