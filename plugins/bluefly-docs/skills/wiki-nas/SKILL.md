---
name: wiki-nas
description: "GitLab Wiki management, NAS research library, local clones, sync procedures, Zotero, Obsidian."
triggers:
  - pattern: "wiki|documentation|nas.*library|research.*library"
    priority: critical
  - pattern: "zotero|obsidian|whitepaper|knowledge.*base"
    priority: high
  - pattern: "sync.*wiki|clone.*wiki|publish.*wiki"
    priority: medium
allowed-tools:
  - Read
  - Bash
  - WebFetch
---

# Wiki & NAS Knowledge Management

## Documentation Strategy

**Rule**: All documentation lives in GitLab Wikis. No `.md` files in repos (except CHANGELOG).

```
GitLab Wiki (source of truth)
    ↓ git clone
Local WIKIs/ directory (working copies)
    ↓ buildkit gitlab wiki publish
GitLab Wiki (updated)
```

## Wiki Repos (63 Total)

All wiki repos are accessible via git clone:
```bash
git clone git@gitlab.com:blueflyio/{project}.wiki.git
```

### Key Wiki Repos

| Wiki | GitLab Path | Content |
|------|-------------|---------|
| agent-buildkit | `blueflyio/agent-platform/agent-buildkit.wiki` | CLI docs, command reference |
| platform-agents | `blueflyio/platform-agents.wiki` | Agent manifests, OSSA spec |
| llm-platform | `blueflyio/agent-platform/llm-platform.wiki` | Drupal platform docs |
| technical-docs | `blueflyio/agent-platform/technical-docs.wiki` | Architecture, ADRs |
| gitlab_components | `blueflyio/gitlab_components.wiki` | CI/CD component docs |
| security-policies | `blueflyio/security-policies.wiki` | Cedar policies, SoD docs |

### Local Wiki Layout
```
WIKIs/
├── agent-buildkit.wiki/
├── platform-agents.wiki/
├── llm-platform.wiki/
├── technical-docs.wiki/
├── gitlab_components.wiki/
└── security-policies.wiki/
```

## Wiki Commands

```bash
# Via BuildKit (preferred)
buildkit gitlab wiki publish           # Push local changes
buildkit gitlab wiki search "topic"    # Search across all wikis
buildkit gitlab wiki list              # List all wiki repos
buildkit gitlab wiki clone <project>   # Clone a wiki locally

# Via git (manual)
cd WIKIs/technical-docs.wiki
git pull origin main
# Edit pages...
git add . && git commit -m "Update architecture docs"
git push origin main

# Via glab
glab api projects/:id/wikis
```

## Wiki Page Standards

```markdown
# Page Title

## Overview
Brief description of the topic.

## Details
Main content organized by sections.

## Related
- [[Link to related page]]
- [[Another related page]]

## Changelog
| Date | Change | Author |
|------|--------|--------|
| 2026-02-23 | Initial creation | thomas.scola |
```

## NAS Research Library

**Location**: Synology NAS at `192.168.68.54` / `blueflynas.tailcf98b3.ts.net`
**Path**: `/volume1/research/`
**MinIO Bucket**: `bluefly-research`

### Whitepapers

| Paper | Topic | Path |
|-------|-------|------|
| OSSA Specification v0.4 | Agent standard | `/research/ossa/spec-v0.4.pdf` |
| Cedar Policy Language | Authorization | `/research/cedar/cedar-reference.pdf` |
| A2A Protocol Design | Agent communication | `/research/a2a/protocol-design.pdf` |
| Fleet Control Plane | Change management | `/research/fleet/control-plane.pdf` |
| DORA Metrics Guide | DevOps performance | `/research/dora/metrics-guide.pdf` |
| Drupal OSSA Extension | CMS integration | `/research/drupal/ossa-extension.pdf` |
| MCP Server Patterns | Protocol design | `/research/mcp/server-patterns.pdf` |
| Zero Trust Agent Mesh | Security architecture | `/research/security/zero-trust-mesh.pdf` |

### Access Methods
```bash
# Via MinIO (S3 API)
mc ls nas/bluefly-research/
mc cp nas/bluefly-research/ossa/spec-v0.4.pdf ./

# Via NFS/SMB mount
mount -t nfs 192.168.68.54:/volume1/research /mnt/research

# Via HTTPS (MinIO browser)
https://storage.blueflyagents.com/browser/bluefly-research
```

## Zotero Integration

**Server**: Synology NAS port 5005 (`https://zotero.blueflyagents.com`)
**Sync**: WebDAV to NAS

### Collections
| Collection | Items | Focus |
|------------|-------|-------|
| Agent Architecture | ~45 | Multi-agent systems, OSSA, A2A protocols |
| DevSecOps | ~60 | CI/CD, SAST/DAST, supply chain security |
| Drupal Engineering | ~35 | Drupal architecture, performance, accessibility |
| AI/ML Operations | ~50 | LLM orchestration, RAG, fine-tuning |
| Cloud Native | ~40 | K8s, service mesh, observability |

### Commands
```bash
# Search Zotero via MCP
# (wikis MCP server includes Zotero search)

# Direct API
curl https://zotero.blueflyagents.com/api/items?q=ossa
```

## Obsidian Vault

**Sync**: CouchDB on NAS (port 5984) via Obsidian Livesync plugin
**Vault path**: `~/Documents/Obsidian/BlueflyVault/`

### Vault Structure
```
BlueflyVault/
├── daily/           → Daily notes
├── projects/        → Project-specific notes
├── meetings/        → Meeting notes
├── research/        → Research annotations
├── templates/       → Note templates
└── canvas/          → Visual boards
```

### CouchDB Sync
```bash
# Check CouchDB status
curl https://couchdb.blueflyagents.com/_up

# Database info
curl https://couchdb.blueflyagents.com/obsidian-livesync

# Replicate (manual)
curl -X POST https://couchdb.blueflyagents.com/_replicate \
  -H "Content-Type: application/json" \
  -d '{"source": "obsidian-livesync", "target": "obsidian-backup"}'
```

## GKG Integration

The Global Knowledge Graph indexes all wiki content:

```bash
# Search across all knowledge sources
buildkit research search "cedar policy gates"

# Ranked results from: wikis → whitepapers → Zotero → Obsidian → GKG

# GKG direct query
curl "https://gkg.blueflyagents.com/api/search?q=cedar+policy&types=Document,Agent"
```

## CI/CD Auto-Publish

The `wiki-publish` GitLab CI component auto-publishes wiki changes:

```yaml
include:
  - component: blueflyio/gitlab_components/wiki-publish@main

wiki-publish:
  stage: deploy
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - "docs/**"
```
