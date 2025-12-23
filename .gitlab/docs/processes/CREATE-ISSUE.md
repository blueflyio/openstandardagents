# Create Milestone 3 Issue

## Quick Create (Once you have a valid token)

```bash
# Option 1: Using glab (easiest)
glab auth login
glab issue create \
  --title "Enhance OSSA CLI bin directory with utilities" \
  --description "$(cat .gitlab/ISSUE-BIN-ENHANCEMENT.md)" \
  --milestone 3 \
  --label "enhancement,cli,bin" \
  --repo blueflyio/openstandardagents

# Option 2: Using script with SERVICE_ACCOUNT_OSSA_TOKEN
export SERVICE_ACCOUNT_OSSA_TOKEN="your-token-here"
./scripts/create-issue-helper.sh

# Option 3: Using TypeScript script
export SERVICE_ACCOUNT_OSSA_TOKEN="your-token-here"
tsx scripts/create-milestone-issue.ts \
  "Enhance OSSA CLI bin directory with utilities" \
  3 \
  "enhancement,cli,bin" \
  .gitlab/ISSUE-BIN-ENHANCEMENT.md
```

## Manual Create

Go to: https://gitlab.com/blueflyio/openstandardagents/-/issues/new

- **Title**: Enhance OSSA CLI bin directory with utilities
- **Milestone**: #3
- **Labels**: enhancement, cli, bin
- **Description**: Copy content from `.gitlab/ISSUE-BIN-ENHANCEMENT.md`

