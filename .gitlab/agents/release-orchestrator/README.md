# Release Orchestrator Agent

**Version**: 1.0.0  
**Type**: Orchestrator  
**Domain**: Release Automation

## Overview

Autonomous AI agent powered by GitLab Duo that executes production releases with zero human intervention.

## Activation

Close a milestone matching pattern `vX.Y.Z` with all issues closed.

## Workflow

1. Validate milestone (all issues closed)
2. Generate release notes
3. Update CHANGELOG.md
4. Create release MR with auto-merge
5. Publish to npm
6. Create GitLab Release
7. Tag issues/MRs
8. Close milestone
9. Create next milestone
10. Sync branches

## Usage

```bash
# Close milestone - agent handles the rest
glab milestone close "v0.3.0 - Release & Polish"
```

See full documentation in this directory.
