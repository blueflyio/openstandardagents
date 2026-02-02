# BlueFly.io Projects - Claude Code Instructions

---
**⚠️ READ AGENTS.md FIRST**

This file is supplementary. Start with `AGENTS.md` for complete workflow, rules, and context.

---

> **AUTHORITATIVE SOURCE**: Complete documentation on NAS at `[PATH-WIKIS-BASE]`
> - **AGENTS.md** - MASTER FILE (read this first)
> - **CLAUDE.md** (wiki version) - Full AI assistant instructions
> - **CLAUDE_CODE_USAGE.md** - Dedicated Claude Code CLI reference guide
> - **technical-docs.wiki/** - Complete platform documentation
> - **ai_assets.json** - Single source of truth for all paths, IPs, URLs, ports
>
> This file is a local working copy with core instructions merged from all sources.
>
> **All variable references like [PATH-*], [IP-*], [URL-*], [PORT-*] resolve to values in `[PATH-AI-ASSETS-JSON]`**

## Project Context

This workspace contains GitLab projects from https://gitlab.com/blueflyio

## Directory Structure

```
blueflyio/
├── .claude/                    # Project-specific Claude configuration
├── .worktrees/                # Local git worktrees (date-organized)
│   └── YYYY-MM-DD/            # Today's worktrees
│       └── project-name/      # Project worktrees
└── CLAUDE.md                   # This file

# NAS INFRASTRUCTURE (DATA ONLY):
[PATH-NAS-MOUNT]/
├── docker/                    # Docker compose files and volumes
├── wikis/blueflyio/          # GitLab Wiki repositories ([PATH-WIKIS-BASE])
│   ├── technical-docs.wiki/  # Agent Platform technical docs ([PATH-WIKI-TECH-DOCS])
│   ├── api_normalization.wiki # API Normalization project ([PATH-WIKI-API-NORM])
│   └── ai_assets.json        # Single source of truth ([PATH-AI-ASSETS-JSON])
└── data/                     # Databases, volumes, storage
```

**CRITICAL: GITLAB-FIRST WORKFLOW (SIMPLIFIED 2026-01-28)**

**Git Flow - Simple and Fast:**

```
GitLab (source of truth - accessible from anywhere)
  ↓
Local worktree (fast development)
  ↓
Push to GitLab frequently
  ↓
Other devices pull from GitLab
```

**Rules:**
- ✅ **GitLab = Single Source of Truth** (always)
- ✅ **Local worktrees ONLY** (`~/Sites/blueflyio/.worktrees/`)
- ✅ **Push frequently** (committed changes that aren't pushed don't exist)
- ✅ **Multi-device via GitLab** (accessible via Tailscale from anywhere)
- ❌ **NO NAS bare repos** (deleted - added complexity without benefit)
- ❌ **NO NAS worktrees** (too slow for development)

**Worktree Organization** (Local Only):
- **Path**: `~/Sites/blueflyio/.worktrees/YYYY-MM-DD/project-name/branch-name/`
- **Date-based** for easy cleanup and tracking
- **One worktree per branch**
- **Delete after 7 days** (after verifying pushed to GitLab)

## GitLab Integration

**Organization**: https://gitlab.com/blueflyio
**Projects**: Multiple repositories under the blueflyio group

### Accessing Projects

**All projects on GitLab - Clone locally for development**

```bash
# List available projects
glab repo list --group blueflyio

# View specific project
glab repo view blueflyio/agent-platform/agent-buildkit
```

## Worktree Workflow

**SIMPLE**: Clone from GitLab → Create local worktrees → Push to GitLab

**All work** happens in local worktrees at: `~/Sites/blueflyio/.worktrees/`

**Example paths**:
- `~/Sites/blueflyio/.worktrees/2026-01-28/agent-buildkit/main/`
- `~/Sites/blueflyio/.worktrees/2026-01-28/agent-buildkit/845-auth-fix/`
- `~/Sites/blueflyio/.worktrees/2026-01-28/compliance-engine/release-v0.1.x/`

### Starting Work

**Option 1: Using /dev:start-issue (Recommended)**

```bash
# Start work on a GitLab issue (creates branch + worktree automatically)
/dev:start-issue 845

# This will:
# 1. Create/fetch branch from GitLab: "845-issue-title-slug"
# 2. Create local worktree: ~/.worktrees/YYYY-MM-DD/project-name/845-issue-title-slug/
# 3. Switch to worktree
```

**Option 2: Manual Worktree Creation**

```bash
# 1. Clone project from GitLab (first time only)
cd ~/Sites/blueflyio
glab repo clone blueflyio/agent-platform/agent-buildkit

# 2. Create local worktree for branch
WORKTREE="$HOME/Sites/blueflyio/.worktrees/$(date +%Y-%m-%d)/agent-buildkit/branch-name"
git -C ~/Sites/blueflyio/agent-buildkit worktree add "$WORKTREE" branch-name

# 3. Work in worktree
cd "$WORKTREE"
# Make changes, commit, push
```

**Benefits:**
- ✅ Fast local development (no NAS I/O)
- ✅ Simple: Clone → Work → Push
- ✅ GitLab accessible via Tailscale (multi-device)
- ✅ Mobile: Use GitLab Web IDE (no local clones needed)

### DISCIPLINE: Handling Uncommitted Changes

**NEVER leave uncommitted changes or stashes sitting around. NEVER BE LAZY.**

Before switching tasks or creating new worktrees:

```bash
# Check status
git status

# If uncommitted changes exist:
# 1. Evaluate what they are
git diff
git diff --cached

# 2. Make a decision (choose ONE):

# Option A: Changes are good → Commit and push
git add .
git commit -m "fix: description of changes"
git push

# Option B: Changes are experimental → Create feature branch and push
git checkout -b experiment/describe-experiment
git add .
git commit -m "experiment: description"
git push -u origin experiment/describe-experiment

# Option C: Changes are garbage → Clean them
git reset --hard
git clean -fd

# Option D: Not sure → Ask for review, DON'T just stash
# Add a comment in the code explaining what you don't understand
# Or ask the user for clarification
# NEVER stash and forget

# If stashes exist (CHECK FIRST):
git stash list

# Evaluate each stash:
git stash show -p stash@{0}

# Then either:
git stash pop    # Apply and remove
git stash drop   # Just remove

# NEVER leave stashes - they rot and become useless
```

**DISCIPLINE RULES**:

1. **DON'T BE LAZY** - Clean up your mess before moving on
2. **NO STASHES** - Commit, branch, or clean. Never stash and forget.
3. **REMOVE SHIT YOU DON'T UNDERSTAND** - If you don't understand code:
   - Ask the user for clarification
   - Add a comment explaining why it's confusing
   - Don't leave mystery code sitting around
4. **ALWAYS PUSH** - Committed changes that aren't pushed don't exist
5. **CLEAN WORKTREES** - Before cleanup, verify no uncommitted changes
6. **FETCH BEFORE WORK** - Always `git fetch --prune origin` before starting
7. **ONE TASK, ONE WORKTREE** - Don't juggle multiple tasks in one worktree

**Goal**: Build the best possible project and code. That requires discipline.

### After MR Merges (Cleanup Workflow)

**MANDATORY cleanup checklist:**

```bash
# 1. Verify MR is merged
glab mr view 845

# 2. Go to worktree (local)
cd ~/Sites/blueflyio/.worktrees/2026-01-28/[project]/[branch]

# 3. CHECK FOR UNCOMMITTED CHANGES (CRITICAL)
git status

# If changes exist - STOP and handle them:
#   - Commit and push if valuable
#   - Reset --hard if garbage
#   - NEVER leave uncommitted work

# 4. CHECK FOR STASHES (NEVER LEAVE STASHES)
git stash list
# If stashes exist: pop or drop them NOW

# 5. Remove worktree
cd ~/Sites/blueflyio/[project]
git worktree remove ~/Sites/blueflyio/.worktrees/2026-01-28/[project]/[branch]

# 6. Update main repo
git fetch --prune origin

# Or use slash command (handles all of above)
/dev:cleanup-issue 845
```

**CRITICAL**: Never delete worktrees with uncommitted changes or stashes. Handle them first.

**Automated Cleanup** (delete old worktrees):
```bash
# Delete worktrees older than 7 days (after verifying pushed)
find ~/Sites/blueflyio/.worktrees -name "2026-*" -type d -mtime +7 -exec rm -rf {} \;
```

## NAS Infrastructure Structure

**AgentPlatform Volume** (`[PATH-NAS-MOUNT]`):
- **Docker**: `[PATH-DOCKER]`
  - docker-compose.yml (all services)
  - Service volumes and configs
  - Databases, caches, logs
- **Wikis**: `[PATH-WIKIS-BASE]`
  - technical-docs.wiki
  - api_normalization.wiki
  - ai_assets.json (single source of truth)
- **Data**: Persistent storage
  - PostgreSQL, TimescaleDB, ClickHouse
  - Redis, Qdrant, MinIO
  - Agent state and logs

**NAS Role** (Data & Services ONLY):
- ✅ **Lightweight services** (agent-mesh, agent-protocol, mcp)
- ✅ **Databases** (PostgreSQL, TimescaleDB, ClickHouse)
- ✅ **Storage** (MinIO, Qdrant, Redis)
- ✅ **Wikis** (read/edit only, auto-sync to GitLab)
- ❌ **NO git repositories** (deleted - use GitLab instead)
- ❌ **NO development worktrees** (too slow - use local instead)

**Access**:
- Tailscale: Always accessible via VPN ([TAILSCALE-NETWORK])
- Cloudflare Tunnel: External access via [DOMAIN]
- NFS mount: `[NFS-MOUNT-PATH]`

**Docker Services on NAS**:
```bash
# View running services
docker ps

# Access service logs
docker logs agent-mesh

# docker-compose location
cd /Volumes/AgentPlatform/docker
docker-compose ps
```

**Wiki Repositories** (NAS ONLY - No Local Copies):

🚨 **CRITICAL: WIKIS AUTO-SYNC - DO NOT TOUCH GIT** 🚨

**All paths in [PATH-AI-ASSETS-JSON]** (`/Volumes/AgentPlatform/wikis/blueflyio/ai_assets.json`)

```bash
# All wikis are on NAS - accessible from ANY device
WIKI_PATH="[PATH-WIKI-TECH-DOCS]"
API_WIKI="[PATH-WIKI-API-NORM]"

# ❌ NEVER run git commands in wikis
# ❌ NEVER: git pull, git commit, git push, git add
# ❌ Wikis auto-sync from GitLab - they are READ/EDIT ONLY

# ✅ CORRECT: Edit files directly (no git operations)
cd "$WIKI_PATH"
# Edit files as needed - they sync automatically to GitLab
vim some-file.md

# Wiki access from ANY device:
# - Mac M4/M3: [PATH-WIKIS-BASE]/[wiki-name]/
# - code-server: /workspace/wikis/[wiki-name]/ (NAS mount)
# - iPhone/iPad: via code-server browser
# - NO local copies - everything on NAS

# Available wikis:
# - technical-docs.wiki (Agent Platform documentation)
# - api_normalization.wiki (API Normalization project)
```

## BlueFly.io Architecture Principles

### API-First Development (100% Adoption)

**Status**: ✅ Active - Pattern implemented across critical modules

**Master Registry**: `api-schema-registry` serves as the central authority for all 138+ platform service specifications
- **Location**: `agent-platform/api-schema-registry`
- **MR**: #29, Issue #76
- **Impact**: CRITICAL - All platform modules depend on this registry for API types
- **Published as**: `@bluefly/api-schema-registry`

**Core Principles**:
1. **OpenAPI 3.1 as Single Source of Truth**
   - All API contracts defined in OpenAPI specifications
   - Types auto-generated using `openapi-typescript`
   - Runtime validation via `express-openapi-validator`
   - Zero manual type definitions (DRY)

2. **Type Generation Workflow**
   ```bash
   # 1. Edit OpenAPI spec
   vim openapi/<service>/openapi.yaml

   # 2. Validate spec
   npm run openapi:validate

   # 3. Generate TypeScript types
   npm run generate:types

   # 4. Verify setup
   npm run api-first:check
   ```

3. **Consumption Pattern**
   ```typescript
   // Import from master registry
   import { AgentProtocol, ComplianceEngine } from '@bluefly/api-schema-registry';

   // Use auto-generated types
   type MCPServer = AgentProtocol.components['schemas']['MCPServer'];
   type CedarPolicy = ComplianceEngine.components['schemas']['CedarPolicy'];
   ```

4. **Benefits**
   - Zero type drift (guaranteed)
   - Cascading updates to all modules
   - Compile-time safety
   - Auto-generated documentation

**Implemented Modules**:
- ✅ **compliance-engine** (MR #44, 2026-01-19)
- ✅ **api-schema-registry** (MR #29, Issue #76, 2026-01-20)

**Documentation**: See `_WIKI/technical-docs.wiki/architecture/patterns/api-first-pattern.md`

### Agent-Driven Development

**Agent System**: BlueFly platform is built on autonomous agent architecture
- **Agent Definitions**: OSSA v0.3.0 manifests in `platform-agents` repository
- **Agent Types**: See `AGENT_PLATFORM.md` for complete agent reference
- **Orchestration**: `agent-buildkit` CLI for agent management
- **Execution**: Issue-driven workflows with agent automation
- **Per-Repository**: Each repository has `AGENTS.md` following https://agents.md standard

**Key Agents**:
- KAGENT (Kubernetes operations)
- GitLab agents (CI/CD automation)
- Claude Code agents (AI code analysis)
- Cursor agents (IDE workspace sync)
- Platform agents (OSSA orchestration)

**Documentation**: See `AGENTS.md` in this directory

### Project Standards

- **Language**: TypeScript (strict mode)
- **API Contracts**: OpenAPI 3.1 specifications
- **Type Generation**: `openapi-typescript` (auto-generated)
- **Runtime Validation**: `express-openapi-validator`
- **Schema Validation**: Zod for additional validation
- **Testing**: Full CRUD coverage required
- **CI/CD**: GitLab CI Components
- **Architecture**: DRY, SOLID, API-First principles
- **Dependency Versioning**: Use caret ranges for current minor version (e.g., `"^0.1.0"`, `"^1.2.0"`)
  - Allows patch updates automatically
  - Locks to current minor version
  - Prevents breaking changes from major/minor bumps

### File Organization

```
project-name/
├── openapi/                   # OpenAPI 3.1 specifications
│   └── openapi.yaml          # Service API specification
├── src/
│   ├── api/                  # API route handlers
│   ├── cli/                  # CLI tools (replaces .sh scripts)
│   ├── generated/            # Auto-generated types (DO NOT EDIT)
│   │   └── types.ts          # Generated from OpenAPI
│   ├── schemas/              # Zod schemas (additional validation)
│   ├── services/             # Business logic
│   ├── types/                # Type exports
│   │   └── openapi.ts        # Exported OpenAPI types
│   └── tools/                # Development utilities
├── .husky/                   # Git hooks (JS/TS only)
└── package.json              # npm scripts for automation
```

**Important Directories**:
- `openapi/` - Single source of truth for API contracts
- `src/generated/` - Auto-generated, DO NOT manually edit
- `src/types/` - Exported types for consumption

## Best Practices & Discipline

### DON'T BE LAZY - Build the Best Possible Code

**Core Principles**:

1. **ALWAYS FETCH FIRST**
   ```bash
   git fetch --prune origin  # BEFORE every worktree creation
   ```

2. **NO UNCOMMITTED CHANGES LEFT BEHIND**
   - Before switching tasks: commit, push, or clean
   - Check: `git status` should always be clean when done
   - NO EXCEPTIONS

3. **NEVER USE STASH**
   - Stashes rot and become useless
   - Commit to a branch instead
   - If unsure: ask, don't stash
   - Check before cleanup: `git stash list` should be empty

4. **REMOVE CODE YOU DON'T UNDERSTAND**
   - Don't leave mystery code
   - If unclear: ASK the user
   - Add comments explaining confusion
   - Never commit code you don't understand

5. **ALWAYS PUSH AFTER COMMIT**
   - Committed but not pushed = doesn't exist
   - Push immediately after committing
   - Verify: `git status` shows "up to date with origin"

6. **CLEAN WORKTREES IMMEDIATELY AFTER MERGE**
   - Don't let worktrees pile up
   - Remove within same session as merge
   - Check for uncommitted changes first
   - Prune stale worktrees: `git worktree prune`

7. **ONE TASK PER WORKTREE**
   - Don't juggle multiple tasks in one worktree
   - Create new worktree for each issue/branch
   - Keep work isolated and clean

8. **PROFESSIONAL COMMITS**
   - Clear, descriptive messages
   - No "WIP", "temp", "asdf" commits
   - Follow conventional commits format
   - No AI attribution or emoji

### Evaluation Workflow (When You Don't Know)

```bash
# Found code you don't understand?
# 1. Add a comment with your question
# TODO: [Your Name] - What does this do? Why is X needed?

# 2. Ask the user (don't assume)
# "I found this code at file.ts:123 - can you explain its purpose?"

# 3. Document the answer in code
# Add clear comments explaining the logic

# Found uncommitted changes you're unsure about?
# 1. Review the diff
git diff

# 2. Ask yourself:
#    - Is this valuable work? → Commit and push
#    - Is this experimental? → Branch and push
#    - Is this garbage? → Clean it
#    - Not sure? → Ask user, don't stash

# 3. Take action - don't leave it sitting
```

### Goal: Best Possible Project

We're not here to write quick hacks. We're building:
- Clean, maintainable code
- Professional git history
- Documented decisions
- Zero technical debt from laziness

**If you're tempted to be lazy - STOP. Do it right.**

## Pre-Commit Validation

Pre-commit hooks will BLOCK:
- Working outside of worktrees
- Direct commits to main/development
- Any .sh or .md file additions (except this CLAUDE.md)
- Commits to bare repos (all work in worktrees only)
- Commits with uncommitted changes in other files

## GitLab CLI Commands

```bash
# List your assigned issues
glab issue list --assignee @me

# View specific issue
glab issue view 845

# List open MRs
glab mr list --assignee @me

# View MR details
glab mr view 123
```

## Claude Code Usage

### Quick Start

```bash
# Interactive mode (full terminal UI)
claude

# Non-interactive mode (for scripts/pipes)
claude --print "your prompt here"

# Continue last conversation
claude --continue

# Resume specific session
claude --resume <session-id>
```

### MCP Server Status

✅ **Connected:**
- agent-protocol (Platform agents, GitLab Knowledge Graph)
- agent-brain (Qdrant vector database on NAS)
- agent-router (Vast.ai GPU models)
- filesystem (File operations)
- memory (Memory storage)
- sequential-thinking (Reasoning)
- gitlab (GitLab integration)
- github (GitHub integration)
- postgres (PostgreSQL database)

### MCP Configuration

```bash
# Use workspace .mcp.json (automatic)
claude --print "test"

# Explicitly specify config
claude --mcp-config .mcp.json --print "test"

# Multiple configs
claude --mcp-config .mcp.json ~/.claude/mcp_servers.d/llm-platform.json --print "test"

# Strict mode (only use specified configs)
claude --strict-mcp-config --mcp-config .mcp.json --print "test"
```

**Configuration Files:**
- **Workspace MCP Config:** `~/Sites/LLM/.mcp.json`
- **Global MCP Config:** `~/.claude/mcp_servers.d/llm-platform.json`
- **Settings:** `~/.claude/settings.json` (if exists)

### Platform Agents

```bash
# List platform agents
claude --print "List all my platform agents from the registry"

# Use specific agent
claude --agent @vuln-scanner --print "Scan my codebase"

# Custom agents
claude --agents '{"reviewer": {"description": "Code reviewer", "prompt": "You review code"}}' --agent reviewer --print "Review this code"
```

### Qdrant Vector Search (Agent Brain)

```bash
# Search vector database
claude --print "Search Qdrant for: machine learning models"

# Store memory
claude --print "Remember this: [your information]"
```

### Vast.ai Models (Agent Router)

```bash
# Route to Vast.ai GPU
claude --print "Use Vast.ai to generate embeddings for: test text"
```

### GitLab Integration

```bash
# Query GitLab knowledge graph
claude --print "What issues are open in my GitLab projects?"

# GitLab operations
claude --print "Create a GitLab issue for: bug description"
```

### Advanced Options

**Model Selection:**
```bash
claude --model opus --print "test"
claude --model sonnet --print "test"
claude --model "claude-sonnet-4-5-20250929" --print "test"
```

**Output Formats:**
```bash
# JSON output
claude --output-format json --print "test"

# Streaming JSON
claude --output-format stream-json --print "test"
```

**Permissions & Security:**
```bash
# Permission modes
claude --permission-mode default --print "test"
claude --permission-mode acceptEdits --print "test"
claude --permission-mode bypassPermissions --print "test"

# Allow specific tools
claude --allowed-tools "Bash(git:*),Edit" --print "test"

# Disallow tools
claude --disallowed-tools "Bash(rm:*)" --print "test"
```

**Budget & Limits:**
```bash
# Set budget limit
claude --max-budget-usd 10.00 --print "test"
```

### Debugging

```bash
# Debug MCP servers
claude --debug mcp --print "test"

# Debug API calls
claude --debug api --print "test"

# Debug specific categories
claude --debug "mcp,api" --print "test"

# Exclude categories
claude --debug "!statsig,!file" --print "test"
```

### MCP Management

```bash
# List MCP servers
claude mcp list

# Check MCP server health
claude mcp list

# Configure MCP servers
claude mcp
```

### Troubleshooting

**MCP Server Not Connecting:**
```bash
# Check server status
claude mcp list

# Debug MCP
claude --debug mcp --print "test"

# Check logs
tail -f ~/Library/Logs/Claude/claude_vm_node.log
```

**VM Download Issues:**
```bash
# Check VM status
claude doctor

# Update Claude Code
claude update
```

## Quick Reference

**MANDATORY workflow (NO shortcuts, NO laziness):**

1. Find issue: `glab issue list --assignee @me`

2. Start work on issue (recommended):
   ```bash
   /dev:start-issue 845
   # This creates worktree automatically at:
   # ~/Sites/blueflyio/.worktrees/YYYY-MM-DD/[project]/[branch]
   ```

3. OR create worktree manually:
   ```bash
   # Clone project from GitLab (first time only)
   cd ~/Sites/blueflyio
   glab repo clone blueflyio/agent-platform/agent-buildkit

   # Create local worktree
   WORKTREE="$HOME/Sites/blueflyio/.worktrees/$(date +%Y-%m-%d)/agent-buildkit/[branch]"
   git -C ~/Sites/blueflyio/agent-buildkit worktree add "$WORKTREE" [branch]
   cd "$WORKTREE"
   ```

4. Work with discipline:
   ```bash
   # Make changes
   # DON'T leave uncommitted changes or stashes
   git add .
   git commit -m "fix: clear description"
   git push
   ```

5. Cleanup (NEVER skip):
   ```bash
   # VERIFY no uncommitted changes first
   git status
   git stash list  # Should be empty

   # Then remove worktree
   cd ~/Sites/blueflyio/[project]
   git worktree remove ~/Sites/blueflyio/.worktrees/YYYY-MM-DD/[project]/[branch]

   # OR use slash command
   /dev:cleanup-issue 845
   ```

**Path Examples** (Local Worktrees):
```bash
# Today's worktrees
cd ~/Sites/blueflyio/.worktrees/$(date +%Y-%m-%d)/

# Specific worktree
cd ~/Sites/blueflyio/.worktrees/2026-01-28/agent-buildkit/845-fix-auth/

# List all worktrees for a project
cd ~/Sites/blueflyio/agent-buildkit
git worktree list

# Cleanup old worktrees (older than 7 days)
find ~/Sites/blueflyio/.worktrees -name "2026-*" -type d -mtime +7 -exec rm -rf {} \;
```

## AGENTS.md Standard

**All repositories MUST include AGENTS.md following https://agents.md standard.**

### Generating AGENTS.md

Use the buildkit CLI command:

```bash
# Generate AGENTS.md for a single repository
buildkit agents-md-llmstxt agents-md generate /path/to/project --overwrite

# Generate for all repositories
buildkit agents-md-llmstxt sync all --overwrite

# Validate existing AGENTS.md
buildkit agents-md-llmstxt agents-md validate /path/to/project

# List all AGENTS.md files
buildkit agents-md-llmstxt agents-md list
```

**Options**:
- `--overwrite` - Overwrite existing file
- `--no-rules` - Exclude rules section
- `--no-commands` - Exclude commands section
- `--no-structure` - Exclude structure section

**Template**: `AGENTS.md.template` in workspace root

### Manual Creation

If buildkit command is unavailable, use the template:

```bash
cp AGENTS.md.template path/to/project/AGENTS.md
# Edit to match project specifics
```

**Required Sections** (following agents.md standard):
- Project Overview
- Build Commands
- Testing Commands
- Code Style Guidelines
- Development Workflow
- Important Rules (DO/DON'T)
- Troubleshooting
- Security Considerations

## Related Documentation

### Project Documentation

**ALL DOCUMENTATION ON NAS** (`[PATH-WIKIS-BASE]`)

- **ai_assets.json** - Single source of truth for paths, IPs, URLs, ports ([PATH-AI-ASSETS-JSON])
- **AGENT_PLATFORM.md** - Comprehensive agent platform reference
- **AGENTS.md** - Per-repository agent guidance (https://agents.md standard)
- **AGENTS.md.template** - Template for manual AGENTS.md creation
- **technical-docs.wiki/** - Platform technical documentation ([PATH-WIKI-TECH-DOCS])
  - `architecture/patterns/api-first-pattern.md` - API-First implementation guide
  - `architecture/specifications/openapi-specifications.md` - OpenAPI specs reference
  - `architecture/overview/platform-overview.md` - Platform status and capabilities
  - `architecture/decisions/worktree-strategy-nas-centralized.md` - NAS worktree strategy (APPROVED)
  - `action-items/` - Completed and active work items
- **api_normalization.wiki/** - API Normalization project ([PATH-WIKI-API-NORM])

### Key Resources

- **GitLab Organization**: https://gitlab.com/blueflyio
- **Master Registry**: https://gitlab.com/blueflyio/agent-platform/api-schema-registry
- **Platform Agents**: https://gitlab.com/blueflyio/platform-agents
- **Agent BuildKit**: https://gitlab.com/blueflyio/agent-buildkit

## Notes

### Workflow (GitLab-First - SIMPLIFIED 2026-01-28)
- **GitLab = source of truth** (always)
- **Local worktrees only** (`~/Sites/blueflyio/.worktrees/`)
- **NO NAS bare repos** (deleted - added complexity without benefit)
- **NO NAS worktrees** (too slow for development)
- **Wikis on NAS**: `[PATH-WIKIS-BASE]` (read/edit only, auto-sync to GitLab)
- **Single source of truth**: `[PATH-AI-ASSETS-JSON]` for all paths/IPs/URLs/ports
- **Push frequently** to GitLab (committed changes that aren't pushed don't exist)
- GitLab creates branches automatically from issues
- MRs auto-link to issues
- **Benefits**:
  - Fast local development (no NAS I/O)
  - Simple workflow (Clone → Work → Push)
  - Multi-device via GitLab (accessible via Tailscale)
  - Mobile: GitLab Web IDE (no local clones needed)
- **NAS role**: Data/volumes/services only (no git repos)

### Code Quality
- Professional commit messages (no AI attribution, no emoji)
- All APIs follow API-First pattern (OpenAPI 3.1)
- Types imported from `@bluefly/api-schema-registry`
- **Dependency versions**: Always use caret ranges (e.g., `"^0.1.0"`, `"^1.2.0"`)
  - See `_WIKI/technical-docs.wiki/standards/code/packageJsonStandards.md`
- **DON'T BE LAZY** - do it right the first time
- Remove code you don't understand (ask first)
- Never leave uncommitted changes or stashes
- Build the best possible code, not quick hacks
