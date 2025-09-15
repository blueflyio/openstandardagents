# 🌱 Branching Conventions & Semantic Release Guide

This document defines the branch naming rules, commit conventions, and release tagging practices.
It aligns with Conventional Commits, semantic-release, and Keep a Changelog.

---

## 🚦 Branch Naming Rules

- **Format:**
  ```
  prefix/scope-kebab-case[-issue123]
  ```
- **Allowed characters:** `[a-z0-9-]` only; no uppercase, no spaces.
- **Base branches:**
  - `development` → default base for new work.
  - `main` → production only (hotfixes, releases).
- **Branch lifecycle:**
  - Short-lived, single-topic branches.
  - Rebase/merge via MR/PR, never push directly to main.

---

## 🔖 Branch Prefixes & Their Release Semantics

| Branch Prefix | Purpose | Conventional Commit Types | Default Release Impact | Example Branch | Release Tag |
|---------------|---------|---------------------------|------------------------|----------------|-------------|
| `feature/` | New user-visible capability | `feat`, `build`, `ci`, `test`, `docs` (if relevant) | minor (x.y+1.0) unless BREAKING CHANGE → major | `feature/auth-oauth2-rotation-#742` | `vX.Y.0` |
| `bug/` or `fix/` | Bug fixes during dev | `fix`, `test`, `refactor` (non-breaking) | patch (x.y.z+1) | `bug/queue-deadletter-leak-#801` | `vX.Y.Z` |
| `docs/` | Documentation-only work | `docs` | No version bump | `docs/oss-compliance-guide` | — |
| `hotfix/` | Urgent production fix | `fix`, `revert` (breaking only if noted) | patch release to main, back-merge to development | `hotfix/cve-2025-xxxx` | `vX.Y.Z` |
| `refactor/` | Internal restructuring | `refactor` | No release (unless coupled with feature/fix) | `refactor/payment-service-extraction` | — |
| `perf/` | Performance improvements | `perf` | patch if no behavior change | `perf/cache-warmup-strategy` | `vX.Y.Z` |
| `test/` | New or improved tests | `test` | No release | `test/e2e-onboarding-flows` | — |
| `build/` | Build system, deps, toolchain | `build` | No release (unless runtime deps affect users) | `build/docker-slim-image` | — |
| `ci/` | CI/CD pipeline changes | `ci` | No release | `ci/semantic-release-dryrun` | — |
| `chore/` | Maintenance tasks | `chore` | No release | `chore/rename-modules-kebab-case` | — |
| `revert/` | Revert a previous change | `revert` | Mirrors reverted change impact | `revert/feat-auth-providers` | Matches reverted tag |
| `release/` | Stabilization branch for QA | mixed (avoid new feat) | No bump (used for release prep) | `release/1.4.x` | `v1.4.0-rc.N` |

---

## 📝 Commit Message Convention

- **Format:**
  ```
  <type>(<scope>): <short summary>
  ```
- **Examples:**
  - `feat(auth): support multiple OAuth issuers` → v1.2.0
  - `fix(queue): prevent dead-letter loop on 5xx` → v1.2.1
  - `docs(readme): add quickstart guide` → no release
  - ```
    feat!: rename AuthService
    
    BREAKING CHANGE: renamed `XService` to `AuthService`; update imports
    ```
    → v2.0.0

---

## 🏷 Release Tags

- **Format:**
  ```
  v<major>.<minor>.<patch>
  ```
- **Examples:**
  - `v1.2.0` → new feature release
  - `v1.2.1` → bug fix release
  - `v2.0.0` → breaking change release
- **Release candidates:**
  - `v1.4.0-rc.1`, `v1.4.0-rc.2`

---

## 📚 Changelog Standard

All releases must follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) format:

```markdown
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2025-09-14
### Fixed
- queue: prevent dead-letter loop on 5xx

## [1.2.0] - 2025-09-10
### Added
- auth: support multiple OAuth issuers
```

---

## ✅ Enforcement

- **Regex for branch names (CI rule):**
  ```regex
  ^(feature|bug|fix|docs|hotfix|refactor|perf|test|build|ci|chore|revert|release)\/[a-z0-9]+([a-z0-9-]*)(-\#?\d+)?$
  ```
- **semantic-release** runs on main (and optionally maintenance branches like 1.x).
- All PRs must have Conventional Commit messages and changelog-ready descriptions.

---

## OSSA-Specific Implementation

For the OSSA project:
- Base branch: `development`
- Production branch: `main`
- Current version: `v0.1.9`
- CI automatically creates tags and manages releases
- All feature branches auto-merge to `development` after passing CI
- Manual merge to `main` triggers semantic release