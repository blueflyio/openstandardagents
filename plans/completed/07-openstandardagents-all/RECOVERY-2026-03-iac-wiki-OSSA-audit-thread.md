# Recovery: This thread — iac wiki clone + OSSA Architecture Audit (March 2026)

**Context:** An agent ran `rm -rf` on the worktrees folder. This doc captures everything done in the thread that touched iac, Wikis, and the OSSA Architecture Audit so it can be re-found or re-done.

**Canonical todo:** `~/.agent-platform/agent-buildkit/todo` (this file).

---

## 1. iac wiki clone (DONE — on NAS)

- **What:** Cloned the GitLab wiki for the iac project into the canonical Wikis directory.
- **Wiki clone URL:** `https://gitlab.com/blueflyio/agent-platform/infra/iac.wiki.git`
- **Target path (Mac):** `/Volumes/AgentPlatform/applications/Wikis/iac.wiki`
- **Command used:**
  ```bash
  git clone https://gitlab.com/blueflyio/agent-platform/infra/iac.wiki.git /Volumes/AgentPlatform/applications/Wikis/iac.wiki
  ```
- **Status:** Clone was created successfully. The wiki repo had no commits yet (empty wiki on GitLab), so the local folder only has `.git`. To add pages later: edit in that folder, commit, push.
- **If you need to re-clone:** Run the command above. If the directory already exists, remove it first or run `git pull` inside it.

---

## 2. OSSA Architecture Audit & BuildKit Alignment Plan (DONE — on GitLab Wikis)

- **What:** A full audit plan (categorized changes, gap table, Phase 1/2 remediation, risks, CI/CD work items) was written and published to GitLab Wikis.
- **Important:** The plan was published to **five** places:
  1. **technical-docs** (first; user later asked why it was there instead of OSSA wikis)
  2. **openstandardagents** — https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/OSSA-Architecture-Audit-BuildKit-Alignment
  3. **openstandardagents.org** — https://gitlab.com/blueflyio/ossa/openstandardagents.org/-/wikis/OSSA-Architecture-Audit-BuildKit-Alignment
  4. **openstandard-ui** — https://gitlab.com/blueflyio/ossa/lab/openstandard-ui/-/wikis/OSSA-Architecture-Audit-BuildKit-Alignment
  5. **openstandard-generated-agents** — https://gitlab.com/blueflyio/ossa/lab/openstandard-generated-agents/-/wikis/OSSA-Architecture-Audit-BuildKit-Alignment

- **Source file (LOST if worktrees was rm -rf):** It lived at  
  `worktrees/agent-buildkit/config-templates/wiki-OSSA-Architecture-Audit-BuildKit-Alignment.md`  
  If worktrees were destroyed, that file is gone. **Recover the content from any of the five wiki URLs above** (open any link, copy the markdown or "Edit" and copy source), then save back into agent-buildkit `config-templates/wiki-OSSA-Architecture-Audit-BuildKit-Alignment.md` once you recreate the agent-buildkit worktree.

- **To republish after editing:** From agent-buildkit root:
  ```bash
  for proj in blueflyio/ossa/openstandardagents blueflyio/ossa/openstandardagents.org blueflyio/ossa/lab/openstandard-ui blueflyio/ossa/lab/openstandard-generated-agents; do
    buildkit gitlab wiki publish --project "$proj" --slug OSSA-Architecture-Audit-BuildKit-Alignment --title "OSSA Architecture Audit & BuildKit Alignment Plan" --file config-templates/wiki-OSSA-Architecture-Audit-BuildKit-Alignment.md
  done
  ```

- **Plan contents (summary):** Thin-client shift (.org proxies to ossa-ui), UADP discovery pipeline, API parity (persona, autonomy), execution delegation, studio-ui enforcement, security (no bash on .org). Gaps: UI component parity (persona/autonomy forms), export polling for pipeline status, BuildKit alignment (MRs, NAS runners, Drupal recipes). Phase 1: frontend alignment + export polling. Phase 2: CI unblock MRs (!78, !60, !24, !449), NAS runners, Drupal demo spawn. Risks: UADP state sync (ping mesh on export?), 202 Accepted + polling for CI. Work items: Jest/Playwright proxy tests, UADP discovery schema in developer-guides, openstandard-ui CI matrix (docker, kubernetes, crewai).

---

## 3. iac checklist (user said completed — for reference)

- Add projects to iac `package.json` and create a projects registry.
- Copy key config templates from agent-buildkit to iac.
- Add security-policies integration for iac paths.
- Add iac sync-oracle command and tunnel config sync.
- agent-buildkit pointing deploy-services and endpoints at iac.

(If any of this was only in a destroyed worktree, re-implement from AGENTS.md/CLAUDE.md and the iac repo on GitLab.)

---

## 4. Where things live (not in worktrees)

- **Wikis (Mac):** `/Volumes/AgentPlatform/applications/Wikis/` — one folder per project, e.g. `iac.wiki`, `openstandard-ui.wiki`. Clone pattern: `git clone https://gitlab.com/blueflyio/<group>/<project>.wiki.git /Volumes/AgentPlatform/applications/Wikis/<project>.wiki`
- **Bare repos (for re-adding worktrees):** `/Users/flux423/Sites/blueflyio/__BARE_REPOS/` — e.g. `__BARE_REPOS/agent-platform/infra/iac.git`, `__BARE_REPOS/agent-platform/tools/agent-buildkit.git`.
- **OSSA plan on GitLab:** Use the five wiki links in section 2 to read or re-export the full audit plan.

---

## 5. Recreate agent-buildkit worktree (if needed)

If `worktrees/agent-buildkit` was destroyed:

```bash
cd /Users/flux423/Sites/blueflyio
mkdir -p worktrees
git --git-dir=__BARE_REPOS/agent-platform/tools/agent-buildkit.git fetch origin
git --git-dir=__BARE_REPOS/agent-platform/tools/agent-buildkit.git worktree add worktrees/agent-buildkit release/v0.1.x
cd worktrees/agent-buildkit && npm install
```

Then recover the OSSA audit markdown from one of the five wiki pages (Edit → copy source) into `config-templates/wiki-OSSA-Architecture-Audit-BuildKit-Alignment.md`.

---

## 6. Prevention

- **NEVER** run `rm -rf` on `worktrees/` or any path containing multiple project checkouts. Per .cursorrules: never stash, never reset --hard, never discard uncommitted work in shared worktrees.

---

*Recovery doc from thread: iac wiki clone + OSSA Architecture Audit. Save and keep in todo; consider publishing to agent-buildkit wiki so it survives.*
