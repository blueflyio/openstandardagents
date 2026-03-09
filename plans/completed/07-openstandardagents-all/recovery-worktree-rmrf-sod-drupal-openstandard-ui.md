# Recovery: worktree folder lost (rm -rf) — SOD + Drupal + openstandard-ui

**Context:** An agent ran `rm -rf` on the worktree folder and hours of work were lost. This document reconstructs what was done in the thread so it can be re-applied.

**Canonical todo location:** `~/.agent-platform/agent-buildkit/todo` (this file lives here).

---

## 1. Separation of duties (SOD) — Drupal consumption

**Authority:** AGENTS.md and wiki `architecture/separation-of-duties.md`.

**What was added to AGENTS.md** (in the Studio-UI / "2. Drupal custom modules" section):

- **New paragraph: "Drupal separation of duties (consumption)"**
  - Drupal MUST use platform packages only; no duplicate UI or API logic.
  - **(1) React/UI:** Use **@bluefly/studio-ui** only for all agent/OSSA UI components. Consume via npm (`npm install @bluefly/studio-ui`) and the studio-ui Drupal module (UMD bundle + Canvas/SDC components in `studio-ui/drupal-module/`). Do not add duplicate Button/Card/Badge/AgentCard components in Drupal custom code.
  - **(2) Creator/wizard/validate/export API:** Use **openstandard-ui** (ossa-ui.blueflyagents.com) only. Drupal backend (ai_agents_marketplace, ai_agents_ossa_sandbox) proxies to openstandard-ui API for validate, save, skills install, and export; do not reimplement creator or export pipelines in Drupal.
  - **(3) Spec/CLI:** Use **@bluefly/openstandardagents** for validation and export when running server-side (e.g. Drush or queue workers); openstandard-ui remains the hosted app.
  - **Clear separation:** studio-ui = components; openstandard-ui = app + API; openstandardagents = spec + CLI; Drupal = consumer of all three, no duplication.

**Where to add it in AGENTS.md:** Immediately after the paragraph that ends with "...studio-ui becomes the missing component library for Drupal and all other projects become consumers." and before "**2. Drupal custom modules (TESTING_DEMOS/.../web/modules/custom)** — Each must be thin...". Do not remove the "— Each must be thin..." part of that heading.

---

## 2. openstandard-ui website — fix @bluefly/studio-ui resolution

**Repo:** openstandard-ui (WORKING_DEMOs or worktree at `openstandard-ui/release-v0.4.x`).

**File:** `website/package.json`

**Change:** The website had `"@bluefly/studio-ui": "file:../../studio-ui"` which pointed to a path that does not exist (studio-ui lives at `WORKING_DEMOs/studio-ui/release-v0.1.x`).

- **From website/** the correct relative path to studio-ui package is: `../../../studio-ui/release-v0.1.x` (up to openstandard-ui, up to release-v0.4.x, up to WORKING_DEMOs, then studio-ui/release-v0.1.x).
- **Set:** `"@bluefly/studio-ui": "file:../../../studio-ui/release-v0.1.x"`

**Also add** to website `dependencies` so Next.js can resolve when bundling the linked package:
- `"@radix-ui/react-switch": "^1.1.2"`

---

## 3. studio-ui — missing dependency

**Repo:** studio-ui (WORKING_DEMOs or worktree at `studio-ui/release-v0.1.x`).

**File:** `package.json`

**Change:** `src/components/forms/Switch.tsx` uses `@radix-ui/react-switch` but it was not in dependencies. Add:
- `"@radix-ui/react-switch": "^1.1.2"` (with the other @radix-ui entries, e.g. after react-slot, before react-tabs).

---

## 4. Build order (to verify after re-applying)

1. **studio-ui:** `cd studio-ui/release-v0.1.x && npm install && npm run build` — must succeed so `dist/` exists.
2. **openstandard-ui:** `cd openstandard-ui/release-v0.4.x && pnpm install` — resolves file link to studio-ui.
3. **openstandard-ui website:** `pnpm --filter ossa-website build` — may still fail on other missing peer deps (e.g. recharts); if so, add those to website/package.json or fix studio-ui to list all deps.

---

## 5. Paths reference (WORKING_DEMOs layout)

- openstandard-ui: `WORKING_DEMOs/openstandard-ui/release-v0.4.x/` (or worktree equivalent).
- studio-ui: `WORKING_DEMOs/studio-ui/release-v0.1.x/` (package.json and dist/ live here; `WORKING_DEMOs/studio-ui/` has only subdir `release-v0.1.x`).
- From `openstandard-ui/release-v0.4.x/website/`, path to studio-ui package = `../../../studio-ui/release-v0.1.x`.

---

## 6. What NOT to do

- **NEVER** run `rm -rf` on worktrees or shared directories. Per .cursorrules: never stash, never reset --hard, never discard uncommitted work in a worktree.
- **NEVER** run `git stash` or `git reset --hard` in shared worktrees.

---

## 7. Recreate worktrees if needed

If worktrees were deleted, recreate from bare repos (no network needed for worktree add):

```bash
BARE_REPO_OSSA_UI="$HOME/Sites/blueflyio/__BARE_REPOS/ossa/lab/openstandard-ui.git"
BARE_REPO_STUDIO_UI="$HOME/Sites/blueflyio/__BARE_REPOS/agent-platform/infra/studio-ui.git"
# Or per AGENTS.md: agent-platform/tools/studio-ui in some refs

git --git-dir="$BARE_REPO_OSSA_UI" fetch origin
git --git-dir="$BARE_REPO_OSSA_UI" worktree add $HOME/Sites/blueflyio/worktrees/openstandard-ui/release-v0.4.x release/v0.4.x

git --git-dir="$BARE_REPO_STUDIO_UI" fetch origin
git --git-dir="$BARE_REPO_STUDIO_UI" worktree add $HOME/Sites/blueflyio/worktrees/studio-ui/release-v0.1.x release/v0.1.x
```

Then re-apply the changes above (AGENTS.md, website/package.json, studio-ui/package.json), commit, and push.

---

End of recovery document.
