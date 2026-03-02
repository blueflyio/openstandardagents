<!-- Generated from OSSA manifest - DO NOT EDIT MANUALLY -->

<!-- To update, modify the OSSA manifest and regenerate -->

# For AI assistants

- **Project deep dive and health:** GitLab Wiki page [Project-Deep-Dive](https://gitlab.com/blueflyio/ossa/openstandardagents/-/wikis/Project-Deep-Dive). Covers strengths, gaps (README vs code, DI resetContainer, skill wizard untested), and recommended next steps. Publish wiki from repo: `npm run wiki:publish` (needs GITLAB_TOKEN or GITLAB_PUSH_TOKEN).
- **Structure and patterns:** See `src/AGENTS.md` (adapters, DI, thin CLI, Zod). New services go in `src/di-container.ts`; if you add tests that call `resetContainer()`, either rebind all services there or document that reset is partial.
- **Skills:** `ossa skills wizard` creates SKILL.md (+ optional skill.ossa.yaml). `ossa skills list|validate|add|generate|export|...` use ClaudeSkillsService and skills-pipeline services from DI. Document `ossa skills wizard` in README Skills section.

# Dev environment tips

- Review the OSSA manifest for tool configurations
- Ensure all required dependencies are installed
- Configure environment variables as needed

# Testing instructions

- Run all tests before committing: `npm test`
- Ensure code coverage meets project standards
- Validate against OSSA schema: `ossa validate manifest.yaml`

# PR instructions

- Follow conventional commit format
- Include tests for new features
- Update documentation as needed
- Ensure CI passes before requesting review