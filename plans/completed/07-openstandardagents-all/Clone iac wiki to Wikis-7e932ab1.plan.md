<!-- 7e932ab1-a082-4fcc-b76a-990573b2b8c5 -->
# Clone iac wiki to /Volumes/AgentPlatform/applications/Wikis

## Identified

- **Project:** `blueflyio/agent-platform/infra/iac` (source: `worktrees/iac/main/package.json` repo URL).
- **Wiki clone URL:** `https://gitlab.com/blueflyio/agent-platform/infra/iac.wiki.git`
- **Target path:** `/Volumes/AgentPlatform/applications/Wikis/iac.wiki`

## Steps

1. **Ensure Wikis directory exists**
   - Create `/Volumes/AgentPlatform/applications/Wikis` if it does not exist (e.g. NAS not mounted or first clone).

2. **Clone the iac wiki**
   - Run:
     ```bash
     git clone https://gitlab.com/blueflyio/agent-platform/infra/iac.wiki.git /Volumes/AgentPlatform/applications/Wikis/iac.wiki
     ```
   - If the wiki is empty on GitLab, the clone will still succeed and produce an empty repo (standard GitLab wiki behavior).

3. **Optional check**
   - List `/Volumes/AgentPlatform/applications/Wikis` and confirm `iac.wiki` is present; `ls` inside `iac.wiki` to see any existing wiki pages.

## Notes

- Private repo: ensure `GITLAB_TOKEN` or `GITLAB_TOKEN_PAT` is set (e.g. from `/Volumes/AgentPlatform/.env.local`) or that the clone URL uses a credential helper so the clone can authenticate.
- If `iac.wiki` already exists at that path (e.g. from a previous clone), either remove it and re-clone or run `git pull` inside it to update; the plan assumes a fresh clone into a non-existing directory.
