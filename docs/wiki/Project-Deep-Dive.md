# OSSA Project Deep Dive

Honest technical assessment of the openstandardagents codebase. Source: repo `docs/wiki/Project-Deep-Dive.md`. Wiki updated via `npm run wiki:publish`.

---

## What the project is (and is not)

- **What it is:** OSSA = Open Standard for Software Agents. A spec + CLI + SDK layer: YAML manifests (like OpenAPI for APIs), validation, and export to many runtimes (Docker, K8s, LangChain, CrewAI, MCP, Claude Skills, kagent, etc.). One manifest, many targets. Published as `@bluefly/openstandardagents` on npm; source: GitLab `blueflyio/ossa/openstandardagents`.
- **What it is not:** Not an agent runtime; not a replacement for MCP or A2A. It is the packaging and deployment layer that consumes those protocols.

---

## Strengths

- **Surface area:** 22 export platforms, many CLI commands (wizard, validate, export, migrate, skills, agents-md, workspace, etc.), MCP server, TypeScript (and some Python/Go) SDKs. Single repo for spec, CLI, and adapters.
- **Quality gates:** Jest with coverage thresholds (80% global; 85% services; 90% utils; 100% errors). ESM + ts-jest, junit reporter. Pre-push runs validate/schema/examples. Serious setup.
- **Architecture:** Inversify in `di-container.ts`; CLI is thin over services. `src/AGENTS.md` documents adapters, DI-first, thin CLI, Zod at boundaries. Matches the code.
- **Honest status:** README has a Production Status table (production / beta / alpha) and "Honest Status Reporting." Rare and good.
- **Skills pipeline:** Skills research, generate, export, validate, sync, add, list, and **ossa skills wizard** are implemented. `ClaudeSkillsService` is bound in DI; skills commands use the container.

---

## Gaps and inconsistencies

### README vs reality

- **ossa skills wizard** is not mentioned in the main README. The wizard exists (`src/cli/skills-wizard/skill-wizard.ts`, registered in `skills.command.ts`). The Skills Pipeline section should add: `ossa skills wizard` — interactive creation of SKILL.md (and optional OSSA skill manifest).
- README claims "19 New Tests" and "100% passing" for the skills pipeline. There are skills-pipeline tests (e.g. `skills-research.service.test.ts`, `skills-export.service.test.ts`) but **no dedicated test for the skill wizard** (e.g. `runSkillWizard`, `writeSkillArtifacts`). The "19 tests" refer to the pipeline services, not the wizard; the wizard is currently untested.

### resetContainer() in DI

- `resetContainer()` in `src/di-container.ts` is used to reset the Inversify container (e.g. for tests). It **does not** rebind all services that the main `container` binds: e.g. `RepoAgentsMdService`, `TemplateProcessorService`, `AIArchitectService`, `ExtensionTeamKickoffService`, `TaxonomyService`, `KnowledgeService`, `TaxonomyValidatorService`, `TemplateService`, `RegistryService`, `WizardService`, `AgentTypeDetectorService`, and the `TYPES.*` aliases. Any test that calls `resetContainer()` then resolves one of these will get "No bindings found." No test in the repo currently calls `resetContainer()`, so this is latent: it will bite when someone adds a test that resets the container and then uses those services.

### Test layout

- Jest uses `roots: ['<rootDir>/tests']` and `**/*.test.ts` / `**/*.spec.ts`. There are unit tests, service tests (including skills-pipeline), e2e/smoke, and some specs under `src/` (e.g. MCP, a2a). Coverage is broad; the **skill wizard** has no unit or integration tests (e.g. for prompts, `writeSkillArtifacts`, frontmatter/SKILL.md generation).

---

## Code quality and debt

- **Size:** Large. `src/` spans many domains (adapters, api, cli, services, validation, mesh, mcp-server, sdks, tools, etc.). Navigation and ownership are non-trivial.
- **Two skills layers:** `services/skills/` (e.g. `ClaudeSkillsService` — discover, validate SKILL.md) and `services/skills-pipeline/` (research, generate, export, install). The CLI uses both. Naming is a bit redundant but not wrong.
- **Wizard and DI:** The wizard (`runSkillWizard`, `writeSkillArtifacts`) is not in the DI container; it is plain functions and inquirer. Fine for an interactive CLI; any future "service" that reuses wizard steps would call these functions.

---

## Summary table

| Area | Verdict | Notes |
|------|---------|--------|
| Product fit | Strong | Clear "define once, export everywhere" story. |
| CLI surface | Strong | Many commands; wizard exists but was undocumented in README. |
| DI / architecture | Good | DI-first, thin CLI; `resetContainer()` is incomplete (latent test bug). |
| Tests | Good | Thresholds and structure are serious; skill wizard has no tests. |
| Docs vs code | Minor | README was missing `ossa skills wizard`; "19 tests" is pipeline-only. |
| Skills | Good | Pipeline + wizard implemented; wizard was untested and undocumented. |

---

## Recommended next steps

1. **README:** In the Skills Pipeline section, add: `ossa skills wizard` — interactive creation of SKILL.md (and optional OSSA skill manifest).
2. **Tests:** Add a test file for the skill wizard (e.g. `tests/unit/cli/skill-wizard.test.ts`): test `writeSkillArtifacts` with a stub state (no inquirer) and assert shape of generated SKILL.md and optional manifest.
3. **DI:** Either make `resetContainer()` rebind every binding that the main `container` has (copy the full bind block into `resetContainer`), or document that `resetContainer()` is partial and only safe when tests do not use the missing services. Prefer full rebind so future tests do not break.
4. **Optional:** One E2E or smoke test that runs `ossa skills wizard` with `--help` or a non-interactive path (if added) so the subcommand is covered in CI.

---

## For AI assistants

- Before adding features: check `src/AGENTS.md` for structure and patterns; register new services in `di-container.ts`; keep CLI thin.
- When adding tests that reset the container: ensure all required services are rebound in `resetContainer()` or the test will fail with "No bindings found."
- Skills: `ossa skills wizard` creates SKILL.md (+ optional skill.ossa.yaml); `ossa skills list|validate|add|generate|export|...` use `ClaudeSkillsService` and skills-pipeline services from DI.
