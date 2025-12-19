# Changelog

All notable changes to OSSA (Open Standard for Scalable AI Agents) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-12-18

### Major Release - Unified Task Schema & Agent-to-Agent Messaging

This release introduces **three fundamental resource types** (Agent, Task, Workflow), **Agent-to-Agent (A2A) messaging**, and enterprise-grade features for production deployments.

### Added

#### Core Schema (Breaking Changes)
- **Unified Task Schema**: Three resource kinds - `Agent` (agentic LLM loops), `Task` (deterministic operations), `Workflow` (orchestrated compositions)
- **Agent-to-Agent Messaging**: Pub/sub messaging with `publishes`, `subscribes`, `commands`, and `reliability` configuration
- **Identity Block**: OpenTelemetry-compatible service identity (`service_name`, `service_namespace`, `service_version`)
- **Lifecycle Management**: Environment-specific configurations (dev/staging/prod) with dependency declarations
- **Compliance Profiles**: First-class SOC2, HIPAA, GDPR, FedRAMP framework support
- **State Management**: Persistent agent state with encryption (Redis, PostgreSQL, custom backends)

#### New Resource Types
- **Task Kind**: Deterministic, non-LLM workflow steps with `execution.type` (deterministic, idempotent, transactional)
- **Workflow Kind**: Multi-step orchestration with `steps`, `parallel`, `conditional`, and `foreach` constructs
- **RuntimeBinding**: Capability-to-implementation mappings for Tasks and Workflows

#### Schema Enhancements
- **20+ LLM Providers**: OpenAI, Anthropic, Azure, Bedrock, Ollama, Mistral, Cohere, Google, and more
- **MCP Tool Integration**: Native Model Context Protocol support for tool definitions
- **Execution Profiles**: Preset configurations (fast, balanced, thorough, critical) for different use cases
- **Resource Limits**: Kubernetes-style compute constraints (memory_mb, cpu_millicores, gpu_required)
- **Scheduling Configuration**: Priority levels, concurrency limits, timeout management

#### Runtime Adapters
- **Drupal Adapter**: ECA, Maestro, FlowDrop integration for OSSA Tasks
- **Symfony Adapter**: Messenger component integration for queue-based execution

#### CLI Enhancements
- **Type Generation**: `npm run gen:types` - Generate TypeScript types from schema
- **Zod Generation**: `npm run gen:zod` - Generate Zod validation schemas
- **Enhanced Validation**: Platform-specific validators (Cursor, OpenAI, Anthropic, LangChain, etc.)

### Fixed

- **ci**: Fix YAML syntax errors in multiline curl commands
- **ci**: Update all gitlab.bluefly.io and agent-platform paths
- **ci**: Update component paths to gitlab.com/blueflyio/gitlab_components
- **ci**: Use local runners when shared minutes exhausted

### Migration from v0.2.x

```yaml
# v0.2.x format
apiVersion: ossa/v0.2.9
kind: Agent

# v0.3.0 format (same structure, new features available)
apiVersion: ossa/v0.3.0
kind: Agent  # or Task, Workflow
```

All v0.2.x manifests remain valid. New features (messaging, state, compliance) are opt-in.
## [0.3.0-dev.12] - 2025-12-17

### Fixed

- **ci**: Detect PAT vs deploy token in CI_DEPLOY_OSSA ([2e29863](https://gitlab.com/blueflyio/openstandardagents/-/commit/2e29863c3a0cd02bfa4a317a30fd6f2d6860e758))
- **ci**: Check CI_DEPLOY_OSSA directly with debug output ([9d1d58f](https://gitlab.com/blueflyio/openstandardagents/-/commit/9d1d58f40dc5ae727ef5e834eaaabd9b3417d885))
- **ci**: Map CI_DEPLOY_OSSA group variable to GITLAB_PUSH_TOKEN ([c40709e](https://gitlab.com/blueflyio/openstandardagents/-/commit/c40709ec603c86de291df37bc7bcf9e00c7551e6))
- **ci**: Support deploy tokens (gldt-*) for git push auth ([9acd90f](https://gitlab.com/blueflyio/openstandardagents/-/commit/9acd90fe84e49d4f44d2444312c2c162b004df4a))
- **ci**: Refactor milestone detection to be read-only ([70ec64e](https://gitlab.com/blueflyio/openstandardagents/-/commit/70ec64e3e43e8c47ae3327c8c01021b1eddbd5f8))## [0.3.0-dev.11] - 2025-12-17

### Added

- **ci**: Add automatic GitLab Release creation from tags ([7d939eb](https://gitlab.com/blueflyio/openstandardagents/-/commit/7d939ebd5f1bf6900cd58bf91d7cf6f46ac723f5))
- **ci**: Add automatic GitLab Release creation from tags ([e1bef4f](https://gitlab.com/blueflyio/openstandardagents/-/commit/e1bef4f0e35fe20682046d6bc8e4978f950fdb8b))
### CI/CD

- Trigger v0.3.x dev tag creation ([c92e580](https://gitlab.com/blueflyio/openstandardagents/-/commit/c92e580ff47901519d3d1133293d43d60d91fe4c))

- Trigger dev tag creation [skip ci] ([f51c9bd](https://gitlab.com/blueflyio/openstandardagents/-/commit/f51c9bd7ffcaf50cd051b06d85bccea1f367d31d))

### Fixed

- **ci**: Handle no release tags case with pipefail ([7905d4d](https://gitlab.com/blueflyio/openstandardagents/-/commit/7905d4d3ced54c489387e04b77a09b1d5a04c5c9))
- **ci**: CRITICAL - use branch name for version, not milestones ([63cc109](https://gitlab.com/blueflyio/openstandardagents/-/commit/63cc109e4aec53dde06c770ed8e2a517027b900f))
- **ci**: Use JOB-TOKEN header for CI_JOB_TOKEN API calls ([7796994](https://gitlab.com/blueflyio/openstandardagents/-/commit/7796994f49f74203507e478d7cfcb74b1d9af75e))
- **ci**: Handle missing dev-tag.env in version sync ([6301b94](https://gitlab.com/blueflyio/openstandardagents/-/commit/6301b9453d1799fdb1d8e9177a633a89c89b931f))
- **ci**: Handle group milestones with CI_JOB_TOKEN ([38d55f4](https://gitlab.com/blueflyio/openstandardagents/-/commit/38d55f492dada77377017fedc92cfe29c06c2ca5))
- **ci**: Handle group milestones and unset variables - CRITICAL ([05bd63e](https://gitlab.com/blueflyio/openstandardagents/-/commit/05bd63eed555be1849b383247034c931a6f276b5))
- **ci**: Handle group milestones and unset variables - CRITICAL ([0340bf2](https://gitlab.com/blueflyio/openstandardagents/-/commit/0340bf2c0fd1e7f1ff6ff81ac435425b449b7ec2))
- **ci**: Handle group milestones and unset variables - CRITICAL ([a7fd368](https://gitlab.com/blueflyio/openstandardagents/-/commit/a7fd36841a278645d928976e1734df354fe6f390))
- **ci**: Handle group milestones and unset variables - CRITICAL ([b853e5b](https://gitlab.com/blueflyio/openstandardagents/-/commit/b853e5b96e05abf06aba48707c39d550a9528383))
- **ci**: Include release-workflow.yml - CRITICAL MISSING INCLUDE ([e79b017](https://gitlab.com/blueflyio/openstandardagents/-/commit/e79b017a2e170074985a88651aac17e7060ac75b))
- **ci**: Use GitLab shared runners - unblock v0.3.0 release ([9b1e1c1](https://gitlab.com/blueflyio/openstandardagents/-/commit/9b1e1c171354f013b45ce70bfb521a954d47fe8c))
- Resolve conflicts with main for MR !513 ([7090fbf](https://gitlab.com/blueflyio/openstandardagents/-/commit/7090fbfa5ef77346c31e8009402f28351b054c5c))

- Use GITLAB_TOKEN for milestone API calls ([acde568](https://gitlab.com/blueflyio/openstandardagents/-/commit/acde568781f4f7fcb4aa70e5635b845e0e516429))

- Make detect:version run in MR pipelines ([6e85136](https://gitlab.com/blueflyio/openstandardagents/-/commit/6e851366f43abe50f32551a4c147478965bc4764))

- Replace development branch refs with release branch strategy ([a3acb8c](https://gitlab.com/blueflyio/openstandardagents/-/commit/a3acb8c8c91da8e2c858d9f270bb0f4bf806e773))

### Miscellaneous

- Add .worktrees/ to .gitignore ([5c2c88a](https://gitlab.com/blueflyio/openstandardagents/-/commit/5c2c88aa48e230476c1faa8b0dc4294197e16997))

- Merge main into release/v0.3.x - resolve conflicts ([771d16d](https://gitlab.com/blueflyio/openstandardagents/-/commit/771d16da62644f63e229c08d9e7d18095472aeeb))
## [0.3.0-RC] - 2025-12-15

### Added

- **schema**: Add all missing LLM providers to enum ([6cb616b](https://gitlab.com/blueflyio/openstandardagents/-/commit/6cb616b63a2a52fa3ee0b2ed0ace3ab068b61730))
- **schema**: Implement v0.3.0 schema strengthening additions ([80074ce](https://gitlab.com/blueflyio/openstandardagents/-/commit/80074ceeba2127b438633596009b0b109ad7f392))
- **spec**: Add quick-win capabilities to OSSA v0.3.0 spec ([1ac59a8](https://gitlab.com/blueflyio/openstandardagents/-/commit/1ac59a82243e18b8b7079875ac28e42bd5d63124))
- Make release branch configuration dynamic for future versions ([0b65258](https://gitlab.com/blueflyio/openstandardagents/-/commit/0b652588644130ab439b147610f85de98650e72b))

- Make release branch configuration dynamic for future versions ([15c13cc](https://gitlab.com/blueflyio/openstandardagents/-/commit/15c13ccb272b71c6a0fe1b117c683a22ce5dc044))

### Documentation

- **messaging**: Audit confirms v0.3.0 messaging capability is complete ([a17227b](https://gitlab.com/blueflyio/openstandardagents/-/commit/a17227bc63abd2326c38f5cd48c4f8da40812c17))
### Fixed

- **ci**: Remove development branch requirement, use release/* workflow ([7898227](https://gitlab.com/blueflyio/openstandardagents/-/commit/7898227cae27ae01ab285307e8467ed4b58ff0e0))
- **ci**: Hotfix branches create dev tags only, not production releases ([93458ba](https://gitlab.com/blueflyio/openstandardagents/-/commit/93458bad444db5ef80c681bb7304f82109f7dda5))
- **codeowners**: Simplify root CODEOWNERS to single owner @bluefly ([1619682](https://gitlab.com/blueflyio/openstandardagents/-/commit/1619682694ca06d486fa263418262a92c126d5d7))
- **codeowners**: Simplify .gitlab/CODEOWNERS to single owner @bluefly ([06c72e2](https://gitlab.com/blueflyio/openstandardagents/-/commit/06c72e2f275d97086e760d5cbb36e5d93b45c0ed))
- **codeowners**: Set @bluefly as default owner to unblock releases ([2df9b59](https://gitlab.com/blueflyio/openstandardagents/-/commit/2df9b5995b138261e3a746ea85350c89ec657a20))
- Merge main into release/v0.3.x to fix MR !477 rebase ([151d5a5](https://gitlab.com/blueflyio/openstandardagents/-/commit/151d5a58081793b208b6d5860c3a6467b96a5116))

- Merge main into release/v0.3.x to resolve MR !477 conflicts ([78b9a3a](https://gitlab.com/blueflyio/openstandardagents/-/commit/78b9a3a575bcd4c40ca6fac20c4ce1e9ba31dc57))

- Resolve conflicts and fix ts:build:agent for release branch ([97c4e6a](https://gitlab.com/blueflyio/openstandardagents/-/commit/97c4e6ac1c87193837ead6b4e84b6d26db5e266b))

### Miscellaneous

- Merge latest main into release/v0.3.x for MR !477 ([3dce5fa](https://gitlab.com/blueflyio/openstandardagents/-/commit/3dce5faace32f71695a9bf3fe8f78a9f6acd84ec))

- Reorganize project structure for v0.3.0 release ([db5137a](https://gitlab.com/blueflyio/openstandardagents/-/commit/db5137a2849038ab71b4df9cd50593df941f78b4))
## [0.3.0-dev.1] - 2025-12-14

### Added

- **adapter**: Symfony Messenger OSSA Runtime Adapter ([40763e2](https://gitlab.com/blueflyio/openstandardagents/-/commit/40763e227e0eb19954de1160941e64a5560a4af5))
- **adapter**: Drupal ECA/Maestro/FlowDrop OSSA Runtime Adapter ([4ae3cac](https://gitlab.com/blueflyio/openstandardagents/-/commit/4ae3cacd31e8808e776df81ef97603ec5e6513a3))
- **adapter**: Symfony Messenger OSSA Runtime Adapter ([3320546](https://gitlab.com/blueflyio/openstandardagents/-/commit/3320546927092bf580f5bbe55b605529b4f2c001))
- **adapter**: Drupal ECA/Maestro/FlowDrop OSSA Runtime Adapter ([48ccd55](https://gitlab.com/blueflyio/openstandardagents/-/commit/48ccd55bfda4784729310640d77773dfb484b101))
- **adapter**: Add Symfony Messenger adapter ([51b5922](https://gitlab.com/blueflyio/openstandardagents/-/commit/51b592201c343a54d05cd13d26c330e0bfd41741))
- **adapter**: Add Drupal OSSA runtime adapter ([be7e4a5](https://gitlab.com/blueflyio/openstandardagents/-/commit/be7e4a56776ebf26c40b000cb7070c0a5dc2a088))
- **adapter**: Symfony Messenger OSSA Runtime Adapter ([258eadf](https://gitlab.com/blueflyio/openstandardagents/-/commit/258eadf841d98c7d722862a9ccdc8b328da0119d))
- **adapter**: Drupal ECA/Maestro/FlowDrop OSSA Runtime Adapter ([2d9bc01](https://gitlab.com/blueflyio/openstandardagents/-/commit/2d9bc014c0e142b58d1cd81ccdddc24fc7812f92))
- **adapter**: Symfony Messenger OSSA Runtime Adapter ([a14f795](https://gitlab.com/blueflyio/openstandardagents/-/commit/a14f7955e628d7bdf9d948b9af52eba2808016d1))
- **adapter**: Drupal ECA/Maestro/FlowDrop OSSA Runtime Adapter ([b49c0f1](https://gitlab.com/blueflyio/openstandardagents/-/commit/b49c0f1b7077c8e19b8bd4113242d70e7c5a1f65))
- **agent**: Pipeline auto-fix and GitOps deployer agents ([cd84221](https://gitlab.com/blueflyio/openstandardagents/-/commit/cd84221240527a598dc3459b3118d81dbf3e1978))
- **agent**: Implement dependency-healer agent ([8e7fa7a](https://gitlab.com/blueflyio/openstandardagents/-/commit/8e7fa7ab62aaf3975444c6538027c7de5bdeb35b))
- **agent**: Implement architecture-healer agent ([34d7afe](https://gitlab.com/blueflyio/openstandardagents/-/commit/34d7afe01a5f2c99b50a4df1b6652e509c1945f6))
- **agent**: Implement wiki-healer agent ([bb72e9a](https://gitlab.com/blueflyio/openstandardagents/-/commit/bb72e9a8ebbe62c8a74bc177523855cf94a49bc6))
- **agent**: Implement spec-healer agent ([61f5859](https://gitlab.com/blueflyio/openstandardagents/-/commit/61f5859edb7b51b337f8e34afb89fb7de06308ec))
- **agent**: Add security-healer and meta-orchestrator agents ([9a522ce](https://gitlab.com/blueflyio/openstandardagents/-/commit/9a522ce441442848c92027e641098a00bf97a65a))
- **agent**: Add security-healer and meta-orchestrator agents ([9f771e3](https://gitlab.com/blueflyio/openstandardagents/-/commit/9f771e3df0ab590398c1a97e07f839a138134507))
- **agent**: Implement dependency-healer agent ([f7eeb96](https://gitlab.com/blueflyio/openstandardagents/-/commit/f7eeb96e4628f20e4c05cc5b135bf71b42864d10))
- **agent**: Implement spec-healer agent ([5f4ddd2](https://gitlab.com/blueflyio/openstandardagents/-/commit/5f4ddd242991e23173a763acf9fe5deda943961d))
- **agent**: Implement architecture-healer agent ([107bb8a](https://gitlab.com/blueflyio/openstandardagents/-/commit/107bb8a2801b4b0c042aea70af7ec6aeb5ec6e56))
- **agent**: Implement wiki-healer agent ([1ff6f05](https://gitlab.com/blueflyio/openstandardagents/-/commit/1ff6f0586b24d0138a7093911923e85b422680c6))
- **agent**: Pipeline auto-fix and GitOps deployer agents ([c3f6e40](https://gitlab.com/blueflyio/openstandardagents/-/commit/c3f6e40983a0a533ad943fdecd1ba2a4c5aeda5b))
- **agent**: Implement dependency-healer agent ([21125bb](https://gitlab.com/blueflyio/openstandardagents/-/commit/21125bba4cafb5765a9c19c61080bc09e723f90b))
- **agent**: Implement architecture-healer agent ([f492bbe](https://gitlab.com/blueflyio/openstandardagents/-/commit/f492bbe71c743dca61883319f66b4e982bcc71a1))
- **agent**: Implement wiki-healer agent ([f660632](https://gitlab.com/blueflyio/openstandardagents/-/commit/f6606326b7040d588b1f998d67169cf86df87f61))
- **agent**: Implement spec-healer agent ([7438136](https://gitlab.com/blueflyio/openstandardagents/-/commit/74381367eecd7d85c677fc857531a6dbad414e4c))
- **agent**: Add security-healer and meta-orchestrator agents ([fb4cae0](https://gitlab.com/blueflyio/openstandardagents/-/commit/fb4cae000b84cc31cd5d014e598e3d7502797a4d))
- **agents**: 8 automation agents + GitLab Ultimate observability docs + CI fix ([eb3c92d](https://gitlab.com/blueflyio/openstandardagents/-/commit/eb3c92ddc70fee0bb979c8d2ceb44e24cdd3790f))
- **agents**: Release automation - validators, generators, real-world examples ([da22ea2](https://gitlab.com/blueflyio/openstandardagents/-/commit/da22ea2f65eced970827564991d780dd33460121))
- **agents**: Release automation - validators, generators, real-world examples ([83b705d](https://gitlab.com/blueflyio/openstandardagents/-/commit/83b705d4d2babaab5387e76ff8a6241d83d37ca5))
- **agents**: Enterprise webhook-triggered OSSA agents ([d28aa28](https://gitlab.com/blueflyio/openstandardagents/-/commit/d28aa2888a764eaf42abfd99a0080eaa3596e946))
- **audit**: Automated GitLab Ultimate compliance audit system ([#84](https://gitlab.com/blueflyio/openstandardagents/-/issues/84)) ([7ace3c8](https://gitlab.com/blueflyio/openstandardagents/-/commit/7ace3c8e3ca556609943254e32fc75fef4983495))
- **audit**: Automated GitLab Ultimate compliance audit system ([#84](https://gitlab.com/blueflyio/openstandardagents/-/issues/84)) ([3253726](https://gitlab.com/blueflyio/openstandardagents/-/commit/325372625b76e70804bcee8b93f791adb546dea9))
- **buildkit**: Automated GitLab Ultimate compliance audit system ([e47cfc6](https://gitlab.com/blueflyio/openstandardagents/-/commit/e47cfc636d5e012732118e4fd33833b41496bb91))
- **capabilities**: Add memory and ML capabilities for agent intelligence ([ce39eab](https://gitlab.com/blueflyio/openstandardagents/-/commit/ce39eab7f3b6946d7be6be65e0f6194a28782b64))
- **capabilities**: Add memory and ML capabilities for agent intelligence ([c2fa4e4](https://gitlab.com/blueflyio/openstandardagents/-/commit/c2fa4e45edd64422b2e7504fdc040cc145f61588))
- **capabilities**: Add memory and ML capabilities for agent intelligence ([943881b](https://gitlab.com/blueflyio/openstandardagents/-/commit/943881ba07bdc94d1e3ad827db60bc597cc6f6fa))
- **ci**: Automate version management with semantic-release ([f9d01a4](https://gitlab.com/blueflyio/openstandardagents/-/commit/f9d01a4303963060f1266c7d00da8c2da93db2ea))
- **ci**: Implement dynamic OSSA version management ([9679f84](https://gitlab.com/blueflyio/openstandardagents/-/commit/9679f8415ef0e06c62e0bf2e1e62df57ec29c1b5))
- **ci**: Tag-based release strategy and final audit items ([80d3db6](https://gitlab.com/blueflyio/openstandardagents/-/commit/80d3db62415ab80f15ea5d6502841dc511de2c32))
- **ci**: Add automated changelog generation with git-cliff ([b17727b](https://gitlab.com/blueflyio/openstandardagents/-/commit/b17727bb7741eec1a5e77671dbc07a6344915b50))
- **ci**: Automated changelog generation with git-cliff ([433b3bd](https://gitlab.com/blueflyio/openstandardagents/-/commit/433b3bd7a6cb5b11609f6487e7fe6c5e5325c550))
- **ci**: Dynamic version injection using npm version ([0ac0491](https://gitlab.com/blueflyio/openstandardagents/-/commit/0ac0491639b7055fd5626cb8f3dc84ac11028a2f))
- **ci**: Automated MR manager agent and release workflow ([#87](https://gitlab.com/blueflyio/openstandardagents/-/issues/87)) ([3f13e66](https://gitlab.com/blueflyio/openstandardagents/-/commit/3f13e66f4a06902ff90157a1fe9b892298803c67))
- **ci**: Add per-release environment tracking ([300ebda](https://gitlab.com/blueflyio/openstandardagents/-/commit/300ebda8fc98aaffe525a5713f80f1c0b087d2b4))
- **ci**: Add ossa-local GitLab Kubernetes agent config ([4591d3d](https://gitlab.com/blueflyio/openstandardagents/-/commit/4591d3d61831615d43f74c935da5b58c19247231))
- **ci**: Add per-release environment tracking ([776de2c](https://gitlab.com/blueflyio/openstandardagents/-/commit/776de2c588cd2d8b0fd354ce411ece1b5f264aba))
- **ci**: Add ossa-local GitLab Kubernetes agent config ([9565285](https://gitlab.com/blueflyio/openstandardagents/-/commit/95652856fd3503fa49e63974c3339d039fd598a5))
- **ci**: Add release automation with milestone-triggered release issues ([afef0fc](https://gitlab.com/blueflyio/openstandardagents/-/commit/afef0fc82489019c83066ca5bd31bc570d497a0b))
- **ci**: Implement merge train best practices and milestone-driven workflow ([58db14b](https://gitlab.com/blueflyio/openstandardagents/-/commit/58db14bd62325b01d792613fc207652d7eccc9d6))
- **ci**: Add automated documentation generation ([8d03303](https://gitlab.com/blueflyio/openstandardagents/-/commit/8d033039b0535a9080085b402d8ad3ceec4f8ccd))
- **ci**: Auto-close issues when MRs merge to release branches ([4970fc5](https://gitlab.com/blueflyio/openstandardagents/-/commit/4970fc5fad2fec4e10a6890786d514856012edf6))
- **ci**: Add milestone-based version detection for minor/patch releases ([c450570](https://gitlab.com/blueflyio/openstandardagents/-/commit/c450570a4751a6553ef4dc9b0b71fa558198d788))
- **ci**: Auto-close issues when MRs merge to release branches ([7efc33f](https://gitlab.com/blueflyio/openstandardagents/-/commit/7efc33fe930ee63c3d857fc9cdf16804e244d5ba))
- **ci**: Implement dynamic version injection using npm version ([20ab068](https://gitlab.com/blueflyio/openstandardagents/-/commit/20ab0683aed3574668de2c7c3b65762c17ecf42a))
- **ci**: Dynamic version injection using npm version ([c917883](https://gitlab.com/blueflyio/openstandardagents/-/commit/c91788374a8805e960739f242051ea6ca0d09e88))
- **ci**: Automated MR manager agent and release workflow ([#87](https://gitlab.com/blueflyio/openstandardagents/-/issues/87)) ([1e9caa8](https://gitlab.com/blueflyio/openstandardagents/-/commit/1e9caa8abcb08ccfb0b1be1d22908c26faf0f9a7))
- **ci**: Add per-release environment tracking ([ada0a1f](https://gitlab.com/blueflyio/openstandardagents/-/commit/ada0a1fe3b6f96a1ea107f90ea43cf521334b1a0))
- **ci**: Add ossa-local GitLab Kubernetes agent config ([1e268fd](https://gitlab.com/blueflyio/openstandardagents/-/commit/1e268fd84ea7169a846dc8958245c31773eee3b6))
- **ci**: Add release automation with milestone-triggered release issues ([c1bdc04](https://gitlab.com/blueflyio/openstandardagents/-/commit/c1bdc043c239981704dc947ac40443420f940ed7))
- **ci**: Implement merge train best practices and milestone-driven workflow ([7053f57](https://gitlab.com/blueflyio/openstandardagents/-/commit/7053f571d99242f915091572057048bf44b7ad86))
- **ci**: Enable GitLab Merge Trains for Protected Branches ([08f178d](https://gitlab.com/blueflyio/openstandardagents/-/commit/08f178d83b38d26e3eae947bdde82b2270efce46))
- **ci**: Create GitLab Releases with Changelog on npm Publish ([755cb9a](https://gitlab.com/blueflyio/openstandardagents/-/commit/755cb9adfa7a9eb68b4046bb9ec7e2c7bffb159b))
- **ci**: Enable GitLab Merge Trains for Protected Branches ([bef61ac](https://gitlab.com/blueflyio/openstandardagents/-/commit/bef61ac042e98ac35fa589478f92f961031d3f4d))
- **ci**: Automate Main→Development Branch Sync Post-Release ([b3d0de9](https://gitlab.com/blueflyio/openstandardagents/-/commit/b3d0de9cd4f70781b1a2ee666b1168c324cbb862))
- **ci**: Implement release/v0.3.x workflow with dev tag automation ([b394be9](https://gitlab.com/blueflyio/openstandardagents/-/commit/b394be9c0edcc21db8d9093db1a87e45bac0f5bb))
- **ci**: Implement release/v0.3.x workflow with dev tag automation ([033a4c1](https://gitlab.com/blueflyio/openstandardagents/-/commit/033a4c1c195e1b920ca23a8bc61e4a94837bc740))
- **dogfooding**: Add CI/CD optimization agent OSSA manifest ([e445b31](https://gitlab.com/blueflyio/openstandardagents/-/commit/e445b31a5bccb45f34bce71e2f67eb0d98dfb382))
- **examples**: Add Symfony Messenger adapter example ([da8ce01](https://gitlab.com/blueflyio/openstandardagents/-/commit/da8ce0129c602b889554b840e2ffc33dac3ff8a8))
- **extension**: Add Knowledge Sources Extension ([517edc8](https://gitlab.com/blueflyio/openstandardagents/-/commit/517edc8743b5411287d67fc8ff9e08c86d5bf51c))
- **extension**: Add Knowledge Sources extension ([7c54a7c](https://gitlab.com/blueflyio/openstandardagents/-/commit/7c54a7c94113a2bd9b71c169c1cf69bdb299d880))
- **extension**: Add Knowledge Sources Extension ([41c10d2](https://gitlab.com/blueflyio/openstandardagents/-/commit/41c10d231115d9d9fd22b14bdd03f5660dcd7e4b))
- **github**: Optimize GitHub mirror with OSSA-powered automation ([2da8236](https://gitlab.com/blueflyio/openstandardagents/-/commit/2da823655defb073a4043d2b31b50c5676d4c572))
- **github**: Optimize GitHub mirror with OSSA-powered automation ([e85c691](https://gitlab.com/blueflyio/openstandardagents/-/commit/e85c6912926efb273d2d130b4f9d98f303e77bfd))
- **gitlab**: Add pipeline auto-fix and GitOps integration ([649dad5](https://gitlab.com/blueflyio/openstandardagents/-/commit/649dad5cad4463327d483b5b67f9821f5d3654c6))
- **ossa**: Comprehensive v0.3.0 agent ecosystem with KAgent and GitLab Duo integration ([6671409](https://gitlab.com/blueflyio/openstandardagents/-/commit/66714095fad564e39633af49a7d94512f3a8faed))
- **release**: Milestone-gated releases with auto-close ([259a469](https://gitlab.com/blueflyio/openstandardagents/-/commit/259a469370d8796482f0d6654bc38dfc5d31d358))
- **release**: Milestone-gated releases with auto-close ([860fb76](https://gitlab.com/blueflyio/openstandardagents/-/commit/860fb768a0a527e50fda01a22b3ffd1aaa46b17c))
- **release-prep**: Implement critical audit recommendations for v0.3.x release ([596cf73](https://gitlab.com/blueflyio/openstandardagents/-/commit/596cf73c5eb51a40e3313518dd1e46b368633da0))
- **schema**: Implement v0.3.0 schema strengthening additions ([636b95c](https://gitlab.com/blueflyio/openstandardagents/-/commit/636b95ca60dba8d45e9b1e804f50873ac54498a4))
- **schema**: Add v0.3.0 schema strengthening definitions ([41bc128](https://gitlab.com/blueflyio/openstandardagents/-/commit/41bc12861a7d8ed1e14ca61188326f93e13afc34))
- **schema**: Enhance v0.3.0 schema for enterprise agent manifests ([73955a1](https://gitlab.com/blueflyio/openstandardagents/-/commit/73955a16f503687eca689ba2101dfc1af91f0718))
- **schema**: Enhance MCP extension with resources and prompts ([a3c5773](https://gitlab.com/blueflyio/openstandardagents/-/commit/a3c57739c224df89a7cd64e2869611cb8424421f))
- **schema**: Add encryption config to state storage ([1825e62](https://gitlab.com/blueflyio/openstandardagents/-/commit/1825e62a2ab54e4d6e6160f0ad7814c5280d429f))
- **schema**: Add A2A protocol extension ([a41a378](https://gitlab.com/blueflyio/openstandardagents/-/commit/a41a3786c9a217dc0c4a48b2386861edf57027fa))
- **schema**: Add runtimes configuration block for multi-platform execution ([d0e96b2](https://gitlab.com/blueflyio/openstandardagents/-/commit/d0e96b2551bf47b4f2c880ee64154bf5fe53a47c))
- **schema**: Add identity block and OpenTelemetry semantic conventions ([d3866e8](https://gitlab.com/blueflyio/openstandardagents/-/commit/d3866e81838705da23f6cdfa6126051d774d0cf4))
- **schema**: Add reasoning, prompts, and knowledge_graph blocks ([93576eb](https://gitlab.com/blueflyio/openstandardagents/-/commit/93576ebdc6435a3ca3b18f34a86dd51d1e1e93ed))
- **schema**: Add kind: Task for deterministic workflow steps ([0e2200b](https://gitlab.com/blueflyio/openstandardagents/-/commit/0e2200b4636e95c3e5be7f61516f7eabd0ee073f))
- **schema**: Add AgentTest schema ([af644c0](https://gitlab.com/blueflyio/openstandardagents/-/commit/af644c0a7a468a237e41129b199d7f6e046d1911))
- **schema**: Unified agent platform - OSSA + Duo + A2A + MCP ([32072c7](https://gitlab.com/blueflyio/openstandardagents/-/commit/32072c7efd5447f360d9f72740e12f4679c9b26c))
- **schema**: Add activity_stream config to observability ([4a15fe4](https://gitlab.com/blueflyio/openstandardagents/-/commit/4a15fe485b7ec4f73a04c00a5e2e0dd7d6a0e30a))
- **schema**: Add encryption config to state storage ([d46fb19](https://gitlab.com/blueflyio/openstandardagents/-/commit/d46fb190bb7cf7e66a82adc544ef502919e8b4e0))
- **schema**: Enhance MCP extension with resources and prompts ([a587530](https://gitlab.com/blueflyio/openstandardagents/-/commit/a5875309bdaf9fe95d7bd288b05e80c5be48721a))
- **schema**: Add reusable JSON Schema components ([ae8201f](https://gitlab.com/blueflyio/openstandardagents/-/commit/ae8201f66ae528b726d2e19540efe6a890dd3acd))
- **schema**: Enhance MCP extension with resources and prompts ([4b3da84](https://gitlab.com/blueflyio/openstandardagents/-/commit/4b3da84698397efb8fd882b909c9fa24fe1927ce))
- **schema**: Add encryption config to state storage ([d85ea20](https://gitlab.com/blueflyio/openstandardagents/-/commit/d85ea201f1558ca9ce74c0e520f06b28c2836fcf))
- **schema**: Add A2A protocol extension ([fb24327](https://gitlab.com/blueflyio/openstandardagents/-/commit/fb24327f6374e0672cc36b713e4a75aef432e40e))
- **schema**: Add runtimes configuration block for multi-platform execution ([9746a17](https://gitlab.com/blueflyio/openstandardagents/-/commit/9746a171d7d452ec5b1a4f163b2f778b273afd47))
- **schema**: Add identity block and OpenTelemetry semantic conventions ([4f795bb](https://gitlab.com/blueflyio/openstandardagents/-/commit/4f795bb1c0e569ef8762177a247265cc4ed6373b))
- **schema**: Add reasoning, prompts, and knowledge_graph blocks to OSSA v0.2.9 ([b022480](https://gitlab.com/blueflyio/openstandardagents/-/commit/b02248027e795b4fbde7ad6639053d697125d221))
- **sdk**: Add CloudEvents v1.0 compliant emitter ([070fa10](https://gitlab.com/blueflyio/openstandardagents/-/commit/070fa102a8e53b9bc55b8f5bafa0f42329dd5e9c))
- **sdk**: Add W3C Baggage support for multi-agent correlation ([10b88e6](https://gitlab.com/blueflyio/openstandardagents/-/commit/10b88e63a240879692cee68823223f8b1ffff96b))
- **sdk**: Add CloudEvents v1.0 compliant emitter ([311e6fd](https://gitlab.com/blueflyio/openstandardagents/-/commit/311e6fdaf3cd4a6ef40f8e238ee4d8f9d07231d3))
- **sdk**: Add W3C Baggage support for multi-agent correlation ([b4f5966](https://gitlab.com/blueflyio/openstandardagents/-/commit/b4f5966f44d26559f40859fce11578b13469fa08))
- **spec**: Add quick-win capabilities to OSSA v0.3.0 spec (spec-only, no infrastructure) ([dcde670](https://gitlab.com/blueflyio/openstandardagents/-/commit/dcde67098fe7521893920e2ce19d65371565a73d))
- **spec**: Add Agent-to-Agent Messaging Extension for OSSA v0.3.1 ([737968d](https://gitlab.com/blueflyio/openstandardagents/-/commit/737968d47c2c225e408ee9cc29989d20fcb319f2))
- **spec**: Add Agent-to-Agent Messaging Extension for OSSA v0.3.1 ([ee051cf](https://gitlab.com/blueflyio/openstandardagents/-/commit/ee051cf899eea3b9180c20a1aea65bb26948d33f))
- **spec**: Add Agent-to-Agent Messaging Extension for OSSA v0.3.1 ([eec5b81](https://gitlab.com/blueflyio/openstandardagents/-/commit/eec5b8118ec2fd89f80fb8b1f1aa8062b1c1f55b))
- **spec**: OSSA v0.3.1 Messaging Extension + Automated Patch Version Management ([24cef37](https://gitlab.com/blueflyio/openstandardagents/-/commit/24cef37716b70c4313389d68f5d0724d17799580))
- **spec**: Add Conformance Testing specification ([5c1594a](https://gitlab.com/blueflyio/openstandardagents/-/commit/5c1594a1e3f595d2ab044e75aad424415bd36230))
- **spec**: Add Capability Schema and Registry specification ([69d9463](https://gitlab.com/blueflyio/openstandardagents/-/commit/69d94638e0e12e78d6ce4e747c68b3cfdd9882df))
- **spec**: Formal Policy DSL Specification ([4af084b](https://gitlab.com/blueflyio/openstandardagents/-/commit/4af084b44b972c02f317a42b227599864ecd937e))
- **spec**: Capability Schema and Registry specification ([f80166c](https://gitlab.com/blueflyio/openstandardagents/-/commit/f80166c4b21babeecb3e5c342e0abd6f2117f072))
- **spec**: A2A Protocol + Agent Manifest specifications ([3e15678](https://gitlab.com/blueflyio/openstandardagents/-/commit/3e15678be27b5affd554017773d4d7c31dcf2fc5))
- **spec**: Security Model specification ([529d0e5](https://gitlab.com/blueflyio/openstandardagents/-/commit/529d0e555d10a8f125065fc46e2ddcd6c96247ff))
- **spec**: GitLab Duo Platform integration specification ([fae2f6b](https://gitlab.com/blueflyio/openstandardagents/-/commit/fae2f6bf3adc1e1b497c95ff00b1287e62a7ee7e))
- **spec**: Add runtime semantics, type system, and compliance profiles ([1e51650](https://gitlab.com/blueflyio/openstandardagents/-/commit/1e51650a9514f1c6c991c6d0128eab241c1ba74d))
- **spec**: Add GitLab Duo Platform integration specification ([8f87ede](https://gitlab.com/blueflyio/openstandardagents/-/commit/8f87ede6351a1b56c8f024e02b109d0864f18a48))
- **spec**: Add Conformance Testing specification ([fc34db2](https://gitlab.com/blueflyio/openstandardagents/-/commit/fc34db2f2452f7ff0e7df7e9b5feaf1072218060))
- **spec**: Add Capability Schema and Registry specification ([4d890c9](https://gitlab.com/blueflyio/openstandardagents/-/commit/4d890c9fbf6e5572dae9387d62de612c47dfbe7f))
- **spec**: OSSA v0.3.0 specification rollup ([35d6867](https://gitlab.com/blueflyio/openstandardagents/-/commit/35d68674c6b201858b1490155bcc016ac3f59ca1))
- **spec**: Add Conformance Testing specification ([486599d](https://gitlab.com/blueflyio/openstandardagents/-/commit/486599d379cb4244bf481bd74996d5ab04beb73d))
- **spec**: Add Capability Schema and Registry specification ([761e8c0](https://gitlab.com/blueflyio/openstandardagents/-/commit/761e8c0f07a6ac2b4259552a42264e02868810c3))
- **spec**: Capability Schema and Registry specification ([6cc3f94](https://gitlab.com/blueflyio/openstandardagents/-/commit/6cc3f94ce23bd71f01ebe7cdad5ea70a7f24b90f))
- **spec**: A2A Protocol + Agent Manifest specifications ([ffe6253](https://gitlab.com/blueflyio/openstandardagents/-/commit/ffe6253e27968df9bfaffcf6dc96fab33c77e2b6))
- **spec**: Conformance Testing specification ([0f3ecef](https://gitlab.com/blueflyio/openstandardagents/-/commit/0f3ecef2d17c96f33a85925b5ac98307fe505811))
- **spec**: Security Model specification ([38184d0](https://gitlab.com/blueflyio/openstandardagents/-/commit/38184d02dad497fb617e20fda3948f3a60d29dff))
- **spec**: GitLab Duo Platform integration specification ([d09ec9f](https://gitlab.com/blueflyio/openstandardagents/-/commit/d09ec9f9d4e84ca60d86208f4ab2351cc35b396c))
- **spec**: Add runtime semantics, type system, and compliance profiles ([c785b6d](https://gitlab.com/blueflyio/openstandardagents/-/commit/c785b6df4216cad094c66bdd98ff9f93061526c5))
- **spec**: Formal Policy DSL Specification ([82c0798](https://gitlab.com/blueflyio/openstandardagents/-/commit/82c079823e4414a46fc7d984a0f70e185285f1e8))
- **spec**: Formal Policy DSL Specification ([77d3ade](https://gitlab.com/blueflyio/openstandardagents/-/commit/77d3adef2ca82e308fd9c4f6761c6682946085d4))
- **v0.3.0**: Comprehensive quality improvements for public release ([cf47680](https://gitlab.com/blueflyio/openstandardagents/-/commit/cf47680eb5a0d475a99a7483a4e97aac3a39c3d0))
- Add OrbStack Kubernetes deployment manifests ([2503587](https://gitlab.com/blueflyio/openstandardagents/-/commit/25035872033c65e990586e32131383a835259cdb))

- Add OrbStack Kubernetes deployment manifests ([f2853e7](https://gitlab.com/blueflyio/openstandardagents/-/commit/f2853e708a740bf5d360c1b374728d54d3db8ca2))

- Add autonomous evolution system for self-updating OSSA standard ([72a9fcf](https://gitlab.com/blueflyio/openstandardagents/-/commit/72a9fcf4c2e39133692f5e0142b99ab2c6419014))

- Schema v0.3.0 - Add lifecycle, environments, and dependencies fields ([#151](https://gitlab.com/blueflyio/openstandardagents/-/issues/151)) ([278d59e](https://gitlab.com/blueflyio/openstandardagents/-/commit/278d59e4726c986e24af79e4df784063609545b8))

- Anthropic Runtime Adapter - Add Claude runtime support ([#153](https://gitlab.com/blueflyio/openstandardagents/-/issues/153)) ([9d2d0db](https://gitlab.com/blueflyio/openstandardagents/-/commit/9d2d0db5bea5f4e0309b9511043310f17fcf76d6))

- Deploy & Lifecycle Commands - Add ossa deploy and ossa status ([#154](https://gitlab.com/blueflyio/openstandardagents/-/issues/154)) ([b0ea4be](https://gitlab.com/blueflyio/openstandardagents/-/commit/b0ea4be241835f71d3c5bd40a3eeda656e9dabd5))

- Test Runner - Implement ossa test command ([#155](https://gitlab.com/blueflyio/openstandardagents/-/issues/155)) ([087ddd9](https://gitlab.com/blueflyio/openstandardagents/-/commit/087ddd96a389dea00e7511b7bd4f123390e609eb))

- Add ultimate GitLab Duo agent config ([9be01fe](https://gitlab.com/blueflyio/openstandardagents/-/commit/9be01fe1b7ae9a01f57726fe9a9309804e06a815))

- OSSA integration roadmap ([e268ad8](https://gitlab.com/blueflyio/openstandardagents/-/commit/e268ad82784f171c27eb11618aca89c011c9b380))

- GitHub mirror audit and management ([8b246f4](https://gitlab.com/blueflyio/openstandardagents/-/commit/8b246f4cf5b2f1bf487f3a532ac518824e45c713))

- Add automated MR manager agent ([c256545](https://gitlab.com/blueflyio/openstandardagents/-/commit/c2565459b33a1e19e553e7d5edc68324d2ee14a7))

- Complete release automation for solo developer ([639330b](https://gitlab.com/blueflyio/openstandardagents/-/commit/639330ba723f96cf09860296dbf4ae6ad345a426))

- Add version:examples script to sync example apiVersions ([659f3d1](https://gitlab.com/blueflyio/openstandardagents/-/commit/659f3d1b5b410b28a641748d8290cc0ccda58bbf))

- Add review app for OrbStack Kubernetes ([bbddbdf](https://gitlab.com/blueflyio/openstandardagents/-/commit/bbddbdfb12f19ca295fe0aa85ca7b233f91eb907))

- Enable GitLab Duo agent automation ([71d0ea1](https://gitlab.com/blueflyio/openstandardagents/-/commit/71d0ea12e56a5528f642b76c33c77d88101dd088))

- Automated GitLab Releases with Milestone Integration ([e69a11f](https://gitlab.com/blueflyio/openstandardagents/-/commit/e69a11fe1f9b6f68e84997fb71ed9c744fdf20d2))

- GitHub mirror audit and management ([172fdd2](https://gitlab.com/blueflyio/openstandardagents/-/commit/172fdd24fc2c9020911008c1ada176093e378d66))

- Update release workflow documentation ([581cc6f](https://gitlab.com/blueflyio/openstandardagents/-/commit/581cc6fd6b2442c7b4576f5914c419cf588b1a95))

- Add OSSA validator flow and trigger for GitLab Agent Platform ([04b63f1](https://gitlab.com/blueflyio/openstandardagents/-/commit/04b63f1a6d54cfeddbe48a1fc0065eda806feb34))

- Implement release/v0.3.x workflow with dev tag automation ([58b861c](https://gitlab.com/blueflyio/openstandardagents/-/commit/58b861c6f44b4eccf75795e435baed25dfa1e541))

### Changed

- **agents**: Optimize GitLab agents with fallbacks and health checks ([13eb498](https://gitlab.com/blueflyio/openstandardagents/-/commit/13eb498bfd7d70c6d64ab23ce712fff1d74db507))
- **agents**: Optimize GitLab agents with fallbacks and health checks ([3abd932](https://gitlab.com/blueflyio/openstandardagents/-/commit/3abd932cad4a9d392bd5da3e1f180866cf68b277))
### Documentation

- **readme**: Restructure for technical clarity and move links to bottom ([24bbb6b](https://gitlab.com/blueflyio/openstandardagents/-/commit/24bbb6b4c227a14095c0019b084ecf760013f188))
- **whitepaper**: Unified Task Schema White Paper ([c563abb](https://gitlab.com/blueflyio/openstandardagents/-/commit/c563abbd3c5e8f134c21bf34130500538a8db277))
- **whitepaper**: Unified Task Schema White Paper ([dfd8460](https://gitlab.com/blueflyio/openstandardagents/-/commit/dfd8460763775ce4915e540a53587819175de2a4))
- Add GitLab Ultimate observability integration guide ([8c57c6b](https://gitlab.com/blueflyio/openstandardagents/-/commit/8c57c6b77e720ef47c845d5654a8b8f0cccec717))

- Remove temporary status and audit documentation ([7033a9e](https://gitlab.com/blueflyio/openstandardagents/-/commit/7033a9efb25eee8dae883e5f067919f8ceb23580))

### Fixed

- **agents**: Update security-scanner manifest to comply with OSSA v0.3.0 schema ([48266e9](https://gitlab.com/blueflyio/openstandardagents/-/commit/48266e99d0c263af9d4fde2060b1b3a300651a10))
- **audit**: Replace deprecated Compliance Framework with Security Policies ([872a9bd](https://gitlab.com/blueflyio/openstandardagents/-/commit/872a9bd6744a6c483fac1020fe2be452b346489b))
- **ci**: Enable dev tag creation on release branches ([9a6f380](https://gitlab.com/blueflyio/openstandardagents/-/commit/9a6f3804cf57dd02330bd51eaf983f973f2cbb8b))
- **ci**: Add timeout and retry to build job ([c2b0f78](https://gitlab.com/blueflyio/openstandardagents/-/commit/c2b0f786dc8e63cfb2dc3b5f6e0ea0fc637ddf96))
- **ci**: Remove development branch requirement, use release/* workflow ([d6bc4a0](https://gitlab.com/blueflyio/openstandardagents/-/commit/d6bc4a0001dd2aa42fd51a558b5fc1f33ce2efd2))
- **ci**: Remove invalid 'required' key from component inputs ([d6cca8f](https://gitlab.com/blueflyio/openstandardagents/-/commit/d6cca8fde6a4b5ed71f0d5256f016f96aff76229))
- **ci**: Make code:review:agent exit successfully when skipping ([5ef2f2c](https://gitlab.com/blueflyio/openstandardagents/-/commit/5ef2f2c9f7941fa792fbdd1debe04970439c0701))
- **ci**: Make release creation failures fail pipeline instead of warning ([a4fa865](https://gitlab.com/blueflyio/openstandardagents/-/commit/a4fa86501b4ba465ec6a0cadea6e398fa0f3673f))
- **ci**: Resolve merge conflicts and include release-workflow for dev tag creation ([307c83b](https://gitlab.com/blueflyio/openstandardagents/-/commit/307c83b604e11c49b2245a0a746c5b90009e9cbe))
- **ci**: Allow release/* branches to merge to main ([1ab75be](https://gitlab.com/blueflyio/openstandardagents/-/commit/1ab75beba4880deafcc5612f42e6a762489a913a))
- **ci**: Allow feature branches to target release/* branches ([0ac3af2](https://gitlab.com/blueflyio/openstandardagents/-/commit/0ac3af29c95d9a0219d44b55cf0cbf43e4bbee07))
- **ci**: Update llms_txt2ctx CLI arguments ([e515e9e](https://gitlab.com/blueflyio/openstandardagents/-/commit/e515e9ef3d896bb1085420d5222eb36fce2519f7))
- **ci**: Simplify pre-merge validation to prevent timeouts ([d068622](https://gitlab.com/blueflyio/openstandardagents/-/commit/d068622f34dc6591feb8ae13764160c1ea1954c5))
- **ci**: Remove GitLab sync workflows, GitHub is primary repo ([933887d](https://gitlab.com/blueflyio/openstandardagents/-/commit/933887d84b4786e5e645de6a9485b206374d66df))
- **ci**: 100% autonomous release system with auto-tagging ([26dc8d7](https://gitlab.com/blueflyio/openstandardagents/-/commit/26dc8d708da6f42dcf7ed604471fe9d2d260d571))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([8accb76](https://gitlab.com/blueflyio/openstandardagents/-/commit/8accb76fe3100b16a7237bfba6afd2b2823cd536))
- **ci**: Remove GitLab sync workflows, GitHub is primary repo ([6c7fa51](https://gitlab.com/blueflyio/openstandardagents/-/commit/6c7fa5104eab660cdccf5ea6f0a4f22831798613))
- **ci**: 100% autonomous release system with auto-tagging ([5791e8c](https://gitlab.com/blueflyio/openstandardagents/-/commit/5791e8ca51302558dd5b98a7c4057e84a5158033))
- **ci**: Update llms_txt2ctx CLI arguments ([5d83d97](https://gitlab.com/blueflyio/openstandardagents/-/commit/5d83d97af9cb55dd4a5ce93271be721b7e5cf604))
- **ci**: Replace undefined AGENT_PLATFORM_GROUP with AGENT_PLATFORM_PROJECT ([0c7a17e](https://gitlab.com/blueflyio/openstandardagents/-/commit/0c7a17e2deff658229f72a62d90d89f6db4e2332))
- **ci**: Redesign release process with post-release cleanup ([f364e51](https://gitlab.com/blueflyio/openstandardagents/-/commit/f364e51374c12cd968447ba8121358c2f37933b7))
- **ci**: Remove invalid image+trigger combo in code:review:agent ([d22f5ba](https://gitlab.com/blueflyio/openstandardagents/-/commit/d22f5ba579928bcbc073c8f80a3f93ded417d9f1))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([51b7d46](https://gitlab.com/blueflyio/openstandardagents/-/commit/51b7d462aae9aaef2e89300cd89fecd1ccac8567))
- **ci**: Switch agent jobs from downstream triggers to local execution ([70d73c6](https://gitlab.com/blueflyio/openstandardagents/-/commit/70d73c6c546c4df9d249d4afe91f50a159680ecb))
- **ci**: Remove development, ONLY allow release/* → main ([2a71c43](https://gitlab.com/blueflyio/openstandardagents/-/commit/2a71c437915c79802766a1b56997d17e4b6e6164))
- **ci**: Allow release/* branches to merge to main ([cb0d999](https://gitlab.com/blueflyio/openstandardagents/-/commit/cb0d9995e6f86466a18fc123b73486e45adfea02))
- **ci**: Remove invalid image+trigger combo in code:review:agent ([2c617e0](https://gitlab.com/blueflyio/openstandardagents/-/commit/2c617e08b08c930982d4b2201b60d0b045f33015))
- **ci**: Remove development branch references, use release/* workflow ([ea6402c](https://gitlab.com/blueflyio/openstandardagents/-/commit/ea6402ccf528c1ffecc00b5548a2545f1a9ea425))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([7a91b19](https://gitlab.com/blueflyio/openstandardagents/-/commit/7a91b1912b302a9828889f899ed953fc18a5a2bb))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([f4a9ad9](https://gitlab.com/blueflyio/openstandardagents/-/commit/f4a9ad9fc504fc1bae279901f75cb49c72b422cc))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([04b2c6a](https://gitlab.com/blueflyio/openstandardagents/-/commit/04b2c6a8f84a5fa3d4be990bf4eb3fe6ca947eea))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([46c4066](https://gitlab.com/blueflyio/openstandardagents/-/commit/46c40666acae8746ad78228040d071a8694ebdfc))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([2aae351](https://gitlab.com/blueflyio/openstandardagents/-/commit/2aae351e999129af7c1b3f91660c3d2e9c76e8d5))
- **ci**: Allow feature branches to target release/* branches ([dbbb446](https://gitlab.com/blueflyio/openstandardagents/-/commit/dbbb446aad0111bd04ded6c1574a8e45ee5276e7))
- **ci**: Remove GitLab sync workflows, GitHub is primary repo ([ac77ab8](https://gitlab.com/blueflyio/openstandardagents/-/commit/ac77ab8e8ee0ab5fc792a6a478f48204112faf2d))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([9e0da43](https://gitlab.com/blueflyio/openstandardagents/-/commit/9e0da43b48a3ac3bec1305e3ccaa6e379fea9c57))
- **ci**: Sync milestone-workflow.yml to allow release/* targets ([574f5a6](https://gitlab.com/blueflyio/openstandardagents/-/commit/574f5a6f4bd9a026be98b76f21839b896ca93615))
- **ci**: Allow release/* branches to merge to main ([5814878](https://gitlab.com/blueflyio/openstandardagents/-/commit/581487820b73bbd2e9716450f711d95b38367fc4))
- **ci**: Allow feature branches to target release/* branches ([b439fad](https://gitlab.com/blueflyio/openstandardagents/-/commit/b439fad29035e6e8af898ab044600adf7807d917))
- **ci**: Update llms_txt2ctx CLI arguments ([719501b](https://gitlab.com/blueflyio/openstandardagents/-/commit/719501bc616b831b11f7c752839cbfce95b89d3a))
- **ci**: Simplify pre-merge validation to prevent timeouts ([5cf54aa](https://gitlab.com/blueflyio/openstandardagents/-/commit/5cf54aa5175a760cc379524148bb4ad63bd76a14))
- **ci**: Remove GitLab sync workflows, GitHub is primary repo ([a3763ce](https://gitlab.com/blueflyio/openstandardagents/-/commit/a3763ce737f81bc14d67facecc92f350581e64b2))
- **ci**: 100% autonomous release system with auto-tagging ([844a96e](https://gitlab.com/blueflyio/openstandardagents/-/commit/844a96ed0cab9de37cf811030f844fed8bdabc35))
- **ci**: Update llms_txt2ctx CLI arguments ([9e14edc](https://gitlab.com/blueflyio/openstandardagents/-/commit/9e14edcb2f20f56407b5fad41c1e16f4f2bd8364))
- **ci**: Replace undefined AGENT_PLATFORM_GROUP with AGENT_PLATFORM_PROJECT ([163f08a](https://gitlab.com/blueflyio/openstandardagents/-/commit/163f08a5448cc62cd8f0d51dd7d48001d9b44521))
- **ci**: Redesign release process with post-release cleanup ([51948c9](https://gitlab.com/blueflyio/openstandardagents/-/commit/51948c927ee4f3eae05eda7b640f24f1f8d33b8e))
- **ci**: Hardcode node:22-alpine image to avoid empty NODE_VERSION ([179d289](https://gitlab.com/blueflyio/openstandardagents/-/commit/179d2892b7bc55042f2148eafa0f037d127fb070))
- **ci**: Enable manual agent triggers via pipeline variables ([5358b2a](https://gitlab.com/blueflyio/openstandardagents/-/commit/5358b2a9d8f8dd3a4c184d3afe3002384927818b))
- **ci**: Correct job dependency reference in create-release-tag ([666ade7](https://gitlab.com/blueflyio/openstandardagents/-/commit/666ade7444cf1d3d58982c2bf32c92f712966e59))
- **ci**: Remove duplicate dev tag logic and make release-workflow generic ([526e9e9](https://gitlab.com/blueflyio/openstandardagents/-/commit/526e9e9d9a8a919834c07279af349ae05f2627a4))
- **ci**: Remove all development branch references and hardcoded values ([eeeaf39](https://gitlab.com/blueflyio/openstandardagents/-/commit/eeeaf393aa6e7a7ea29f9d3d1996330510bb40fa))
- **ci**: Remove all development branch references ([6ca6914](https://gitlab.com/blueflyio/openstandardagents/-/commit/6ca69140a60b0dafa864766379223a4315d4d0d0))
- **ci**: Allow release branches to target other release branches ([f403042](https://gitlab.com/blueflyio/openstandardagents/-/commit/f403042073a4287204e6e609ba9f9fc1bbaa64f7))
- **cli**: Auto-detect schema version from manifest apiVersion ([73b5c12](https://gitlab.com/blueflyio/openstandardagents/-/commit/73b5c12e3f67b7f8be6bc13f577a10d531c5012b))
- **codeowners**: Remove redundant docs/ rule covered by default owner ([dfd5ffe](https://gitlab.com/blueflyio/openstandardagents/-/commit/dfd5ffefa129ab669690f99ddf9fabff0323de36))
- **codeowners**: Replace @flux423 with @bluefly ([89809bd](https://gitlab.com/blueflyio/openstandardagents/-/commit/89809bdcafa5efae64e92790579634ca7e0a6d1d))
- **codeowners**: Simplify docs approval to @bluefly only ([7eedd6c](https://gitlab.com/blueflyio/openstandardagents/-/commit/7eedd6c36c94362e61952ce9403d849f23515190))
- **codeowners**: Replace @bluefly with @Branch for solo developer ([5cbb2c3](https://gitlab.com/blueflyio/openstandardagents/-/commit/5cbb2c35e27a3a228d04f255964007e8afa09619))
- **codeowners**: Ensure @Branch is owner for all paths ([b960db1](https://gitlab.com/blueflyio/openstandardagents/-/commit/b960db1a980289ac417a1e1840a5607771ac88e6))
- **codeowners**: Set solo developer @Branch as owner for all files ([b960429](https://gitlab.com/blueflyio/openstandardagents/-/commit/b9604294d2f2986de210474cc27d26d1ed1616c2))
- **codeowners**: Replace @flux423 with @bluefly ([fdf0a4d](https://gitlab.com/blueflyio/openstandardagents/-/commit/fdf0a4dcfae1008af00f657b10d0aa5f5bba0382))
- **codeowners**: Set solo developer @Branch as owner for all files ([af25220](https://gitlab.com/blueflyio/openstandardagents/-/commit/af252201c79ee5ce909238c0f3c1af1fe5fc7bd3))
- **docs**: Correct README to show GitHub as primary public repo ([4d7e22a](https://gitlab.com/blueflyio/openstandardagents/-/commit/4d7e22a9e34e37fbe42f866bf25cf1c3d92a37f6))
- **docs**: Correct README to show GitHub as primary public repo ([51f381c](https://gitlab.com/blueflyio/openstandardagents/-/commit/51f381c38370fbbdefd6e8d210a4fecffda08aa0))
- **docs**: Correct README to show GitHub as primary public repo ([264d48e](https://gitlab.com/blueflyio/openstandardagents/-/commit/264d48e7bc4d9081dde129cecdf08ff940f95108))
- **gitlab**: Restructure workflows to match GitLab Agent Platform schema ([86398bb](https://gitlab.com/blueflyio/openstandardagents/-/commit/86398bbf92ab1387e95797d7bd38034031635102))
- **release**: Clean v0.3.0 - remove premature v0.3.1 content ([e58faa1](https://gitlab.com/blueflyio/openstandardagents/-/commit/e58faa12189bd147fb454964b77ce9844b1b060c))
- **release**: Update ALL version references from 0.2.8 to 0.2.9 ([7b81abc](https://gitlab.com/blueflyio/openstandardagents/-/commit/7b81abc4dce1d13485d9cfefda42992a350a1968))
- **release**: Update ALL version references from 0.2.8 to 0.2.9 ([5346e24](https://gitlab.com/blueflyio/openstandardagents/-/commit/5346e24c1fd15d3362fb3bed0cc0c587e9ae1fb4))
- **schema**: Make apiVersion pattern future-proof and tests dynamic ([f78517d](https://gitlab.com/blueflyio/openstandardagents/-/commit/f78517d53f0686fb0d8167a6b1b76aa3643bc371))
- **schema**: Make apiVersion pattern future-proof and tests dynamic ([7d24622](https://gitlab.com/blueflyio/openstandardagents/-/commit/7d24622c9d25fe2aff92e7e6639adbca0908f963))
- **scripts**: Add missing lib utilities following DRY/Zod/OpenAPI principles ([be741fe](https://gitlab.com/blueflyio/openstandardagents/-/commit/be741fe4e563bb71e3eeafed937f6d9ca6db81aa))
- **security**: Replace hardcoded Slack webhook placeholder with env var ([840965e](https://gitlab.com/blueflyio/openstandardagents/-/commit/840965ed9732e9bec78ac6d48b58f9438e1d5909))
- **security**: Use safe YAML parsing to prevent code injection (CWE-502) ([a5a538d](https://gitlab.com/blueflyio/openstandardagents/-/commit/a5a538d685e27366412f535d4480ac650fb341ed))
- **types**: Resolve TypeScript build errors and merge conflicts ([9dfcf6e](https://gitlab.com/blueflyio/openstandardagents/-/commit/9dfcf6e8e8013f999c3519f3dd95fe39ff373f9b))
- **types**: Resolve merge conflicts in index.ts ([8c5992a](https://gitlab.com/blueflyio/openstandardagents/-/commit/8c5992a8df6fc592f1f71d8b5df1c7c5ca10fc58))
- **types**: Resolve TypeScript build errors ([bb5dcd3](https://gitlab.com/blueflyio/openstandardagents/-/commit/bb5dcd3cefe634452b393580fc23241b1ca6bf19))
- Git fetch authentication and release-version.env handling ([6508efc](https://gitlab.com/blueflyio/openstandardagents/-/commit/6508efc4529ffc03e4aa5f5bbe76189a3350f3e4))

- Resolve conflicts and TypeScript errors for MR 423 ([3f88283](https://gitlab.com/blueflyio/openstandardagents/-/commit/3f88283b81333c6fed99f08d0bfe969a9dd61888))

- Remove unsupported --task CLI option from agent jobs ([03fa291](https://gitlab.com/blueflyio/openstandardagents/-/commit/03fa291352a34844f7a50d976c3cbc1717d6aa9f))

- Merge main into release/0.3.0 (take release version for conflicts) ([985f038](https://gitlab.com/blueflyio/openstandardagents/-/commit/985f03840246f41278d47c4f0d393c1a6b68c113))

- Handle multi-document YAML validation and fix indentation ([1536abc](https://gitlab.com/blueflyio/openstandardagents/-/commit/1536abc296cd3086304c5a60b30684921cd35ae2))

- YAML syntax errors in examples ([03ad868](https://gitlab.com/blueflyio/openstandardagents/-/commit/03ad86883394b4d8043a1ed64d7847b8ada4af9d))

- Merge main into release/0.3.0 (take release version) ([3cb0f8d](https://gitlab.com/blueflyio/openstandardagents/-/commit/3cb0f8dbdba2e7aec094512e14e9724f9fa11b91))

- Add forward config to pass variables to triggered pipelines ([8d39d78](https://gitlab.com/blueflyio/openstandardagents/-/commit/8d39d788043c6d10185e03c84e760c8ce53f4f47))

- Simplify CODEOWNERS to master approver only ([162f33a](https://gitlab.com/blueflyio/openstandardagents/-/commit/162f33abdf7c237105b1d0690bf974d3cff7db20))

- Remove README.md from CODEOWNERS to unblock MRs ([c381a72](https://gitlab.com/blueflyio/openstandardagents/-/commit/c381a724e92520a4bc3dc781305d176cf8b07b9e))

- Remove README.md from CODEOWNERS ([f9bd123](https://gitlab.com/blueflyio/openstandardagents/-/commit/f9bd123fc83eeccd1654f467f1121fe009603600))

- Simplify root CODEOWNERS to match .gitlab/CODEOWNERS ([4f92de7](https://gitlab.com/blueflyio/openstandardagents/-/commit/4f92de791789f90eac21e6328812c67ea49104f1))

- Simplify CODEOWNERS to solo developer ([34556bc](https://gitlab.com/blueflyio/openstandardagents/-/commit/34556bc1b0a6b481fa076100b864bf11aa57a5f2))

- Simplify CODEOWNERS to solo developer ([62febb8](https://gitlab.com/blueflyio/openstandardagents/-/commit/62febb88251af86104aa81c3919e456059866f7a))

- Remove whitepaper from spec directory ([511ca91](https://gitlab.com/blueflyio/openstandardagents/-/commit/511ca918b778f7ac2cf4d37f6b410c6f5937169c))

- Remove non-existent version:examples from prebuild ([fce531d](https://gitlab.com/blueflyio/openstandardagents/-/commit/fce531d1ac1863335dcfb8627687f32692def477))

- Simplify root CODEOWNERS to match .gitlab/CODEOWNERS ([3639dcb](https://gitlab.com/blueflyio/openstandardagents/-/commit/3639dcb724d5ba2cd5866590a1bb0c2e08f57f9d))

- Simplify CODEOWNERS to solo developer ([6b99ad8](https://gitlab.com/blueflyio/openstandardagents/-/commit/6b99ad8d5a0891d62b7ad56fdd5f0f8f82aede6f))

- Merge main into release/0.3.0 to resolve conflicts ([97965e5](https://gitlab.com/blueflyio/openstandardagents/-/commit/97965e58f575e7e6296621d33cf61605e9c4e3e2))

- Remove whitepaper from spec directory ([9364c5b](https://gitlab.com/blueflyio/openstandardagents/-/commit/9364c5b058d8d5cadd0658b3f6d6b39be99329ec))

- Simplify CODEOWNERS to master approver only ([0e64743](https://gitlab.com/blueflyio/openstandardagents/-/commit/0e647437a58ce5c590e71f1dd9077b84830a80bc))

- Merge main into release/0.3.0 ([c4a9e5b](https://gitlab.com/blueflyio/openstandardagents/-/commit/c4a9e5b286b8d4c2a8e56346dd87eb7e5fc23c62))

- Rebase release/0.3.0 on main ([332b8d2](https://gitlab.com/blueflyio/openstandardagents/-/commit/332b8d2f596fd338638554f7b753e26569e447bc))

- Restore all missing files from release/0.3.0 ([61b6f7c](https://gitlab.com/blueflyio/openstandardagents/-/commit/61b6f7c3dbe6f562006a8f2564f448b62c966ec7))

- Restore spec/v0.3.0 directory from release/0.3.0 branch ([5c9d7ce](https://gitlab.com/blueflyio/openstandardagents/-/commit/5c9d7cef670a54af88d80468aa9503663494fe23))

### Miscellaneous

- **agents**: Migrate Claude agents to OSSA v0.3.0 schema ([1de1fd9](https://gitlab.com/blueflyio/openstandardagents/-/commit/1de1fd904a8b0ff7b77c037f3f0ecd5f057c7c29))
- **ci**: Remove release-v0.3.x workflow ([865f3aa](https://gitlab.com/blueflyio/openstandardagents/-/commit/865f3aabdd1356b388b68e6e69e51d5bccf935d3))
- **settings**: Configure Squash Merge as Default for Feature Branches ([105a235](https://gitlab.com/blueflyio/openstandardagents/-/commit/105a235830a333dcb9e220339cc24e323943545b))
- Remove obsolete files with hardcoded versions ([4c298ab](https://gitlab.com/blueflyio/openstandardagents/-/commit/4c298ab2c368097293749bfe27e5fa77b823411f))

- Merge main into release/0.3.0 (prefer release branch) ([442953a](https://gitlab.com/blueflyio/openstandardagents/-/commit/442953ad3c31d8e13373b6dc97b9b08d50385857))

- Remove temp swarm tasks file ([b32f608](https://gitlab.com/blueflyio/openstandardagents/-/commit/b32f6083ce1ef220ef306ad7560922fc9506bf71))

- Add swarm tasks v029 ([cf7d116](https://gitlab.com/blueflyio/openstandardagents/-/commit/cf7d116738abdeb7383d72fc7705c923d8248732))

- Remove temp swarm tasks file ([bede577](https://gitlab.com/blueflyio/openstandardagents/-/commit/bede577f1babd2d9651b9dd3513fa0c9643cea7e))

- Add swarm tasks v029 ([eae7bff](https://gitlab.com/blueflyio/openstandardagents/-/commit/eae7bffc1ec3dcfe466c5ffb3e2affdb2b57bb7e))

- Bump version to 0.3.0 ([95e450b](https://gitlab.com/blueflyio/openstandardagents/-/commit/95e450bf8378d137ac9d2db1c4d3c715b400a0a7))

- Sync release/0.3.0 changes into release/v0.3.0 ([23e1703](https://gitlab.com/blueflyio/openstandardagents/-/commit/23e17030237307d95e7328d2216ada43d3e2f2fa))

- Move whitepaper to spec/whitepaper/ to avoid CODEOWNERS approval block ([aa619f8](https://gitlab.com/blueflyio/openstandardagents/-/commit/aa619f8b9ebf8ef964cce5992d65dd4851e19caa))

- Remove temp swarm tasks file ([eb2c3a7](https://gitlab.com/blueflyio/openstandardagents/-/commit/eb2c3a7f5debebbf6f01b613f935599ae55ae7c0))

- Add swarm tasks v029 ([40bc1b7](https://gitlab.com/blueflyio/openstandardagents/-/commit/40bc1b7c64915bed1358f8a042342ea2ec8e5c46))

### Specification

- **extension**: Formalize extensions.drupal schema ([7ef59cb](https://gitlab.com/blueflyio/openstandardagents/-/commit/7ef59cbcc6badb6546793e371040799c01cd96e0))
- **schema**: Add activity_stream config component ([a6571e6](https://gitlab.com/blueflyio/openstandardagents/-/commit/a6571e6378ab91ffaa3f09b503e2b4d2ce19c77b))
- **schema**: Reusable JSON Schema components ([d96c8f9](https://gitlab.com/blueflyio/openstandardagents/-/commit/d96c8f936f2e781bb8219e6d6d9c74e72b3fea95))
- **schema**: Add kind: Workflow for mixed Task + Agent composition ([b679d9f](https://gitlab.com/blueflyio/openstandardagents/-/commit/b679d9fd351644e8d2854f0011be47c11e678d96))
- **schema**: Add kind: Workflow for mixed Task + Agent composition ([41a9dc1](https://gitlab.com/blueflyio/openstandardagents/-/commit/41a9dc19319982a06832708f4b4d3d014ae8e19c))
- **schema**: Add activity_stream config component ([77e8f11](https://gitlab.com/blueflyio/openstandardagents/-/commit/77e8f114cedf716c4c2baf3cd064d82330f4caec))
- **schema**: Reusable JSON Schema components ([6100dfc](https://gitlab.com/blueflyio/openstandardagents/-/commit/6100dfccc629fdb9b9f9038b16d7b224ad8e48fe))
- **schema**: Add kind: Workflow for mixed Task + Agent composition ([1dc0601](https://gitlab.com/blueflyio/openstandardagents/-/commit/1dc0601f5460fc9e5abe7e29b4feaf18137990a5))
- OSSA Testing Framework and AgentTest resource ([37a2bd8](https://gitlab.com/blueflyio/openstandardagents/-/commit/37a2bd813e828559883b3fccd2c52bdfb4200d10))

- OSSA Testing Framework and AgentTest resource ([886503b](https://gitlab.com/blueflyio/openstandardagents/-/commit/886503b6109ee95d52752c487d19bed64f3c9abc))
## [0.2.8] - 2025-12-02

### Added

- **brand**: Complete professional brand guide with downloadable assets ([3fafd85](https://gitlab.com/blueflyio/openstandardagents/-/commit/3fafd85d4365af1808fd2f753f248249f7afabac))
- **ci**: Add automated draft release MR creation ([108f17b](https://gitlab.com/blueflyio/openstandardagents/-/commit/108f17b7f35955248cd37dbe97421f2fb7e990c1))
- **ci**: Add OrbStack and MR review app environments ([1c4b99c](https://gitlab.com/blueflyio/openstandardagents/-/commit/1c4b99c1a7d0a2b910b53478b71588b410af6576))
- **cli**: Enhance OSSA CLI bin directory with utilities ([fd884bf](https://gitlab.com/blueflyio/openstandardagents/-/commit/fd884bf9a1e3fab773157383a98afd969e2f0bdf))
- **docs**: Implement llms.txt specification for LLM-friendly documentation ([7871839](https://gitlab.com/blueflyio/openstandardagents/-/commit/787183984a03b2d25dd41ab101cd8bbe4137bee3))
- **github-sync**: GitHub sync service implementation ([2125ecb](https://gitlab.com/blueflyio/openstandardagents/-/commit/2125ecbcb667fe5676c402987b003bfc86dc3c2a))
- **schema**: Make OSSA v0.2.8 schema comprehensive and enterprise-grade ([a61071f](https://gitlab.com/blueflyio/openstandardagents/-/commit/a61071fa3bd9830977d9a7d8d34f21f183622dd1))
- **schema**: Add Identity and ClaudeCodeExtension to OSSA v0.2.6 ([c1e37ac](https://gitlab.com/blueflyio/openstandardagents/-/commit/c1e37acac9e932b74c61942bef9bb4a2bf1ca502))
- **spec**: Prepare spec/v0.2.6-dev development structure ([53d136b](https://gitlab.com/blueflyio/openstandardagents/-/commit/53d136b7f46942ac7535fbeecb3a56995719446c))
- **spec**: Define AgentGraph resource type specification ([51a56d9](https://gitlab.com/blueflyio/openstandardagents/-/commit/51a56d9c5d999d6282271e8ae397c9cb8f66cb34))
- Add multi-agent examples ([e8a8737](https://gitlab.com/blueflyio/openstandardagents/-/commit/e8a8737aff2755cd244b968512325d145241fb0e))

- Create OSSA agent definitions for GitLab Ultimate automation ([376ddb0](https://gitlab.com/blueflyio/openstandardagents/-/commit/376ddb0a99556a417adf691f7beada1d47b39bc4))

- Add wiki configuration and documentation assets ([f4b894c](https://gitlab.com/blueflyio/openstandardagents/-/commit/f4b894c5eaebfed29de0453ecbff967abb9362c3))

- Scripts to src migration foundation ([f5a6f64](https://gitlab.com/blueflyio/openstandardagents/-/commit/f5a6f64d1e61ad60a7fd001989f7e8259ff51a57))

- Website design updates ([6c64b89](https://gitlab.com/blueflyio/openstandardagents/-/commit/6c64b89e005941cc7c59eba80c4e4215638d675d))

- Integrate GitHub sync CLI command ([201812c](https://gitlab.com/blueflyio/openstandardagents/-/commit/201812c9569d0877281071e723715ebfaf8bc1e0))

- Add brand guide and Claude runtime adapter ([24e05a5](https://gitlab.com/blueflyio/openstandardagents/-/commit/24e05a5eb6e49cdda8128e25239b072b2e0805e0))

- Website design system - header active states ([10d481b](https://gitlab.com/blueflyio/openstandardagents/-/commit/10d481b33c8d2814d740b5db30be0239c07c950c))

- Implement ossa run command with OpenAI adapter ([fd8c66a](https://gitlab.com/blueflyio/openstandardagents/-/commit/fd8c66ab560075ad338e8292745fe50daaddb8a7))

- Prepare spec/v0.2.6-dev structure ([5d4b33c](https://gitlab.com/blueflyio/openstandardagents/-/commit/5d4b33cee9ed265aef317ed46a741149b2a91e4c))

- Enterprise release automation strategy ([aee5000](https://gitlab.com/blueflyio/openstandardagents/-/commit/aee5000cc41a5a71b81d0ab543f34c3b410dc5b6))

- Enterprise release automation strategy ([cd2bb20](https://gitlab.com/blueflyio/openstandardagents/-/commit/cd2bb20d461a0ad8e21f8c15c62471f522ed3845))

- Merge release gate and 0.2.5-RC for milestone v0.2.5 ([12d6579](https://gitlab.com/blueflyio/openstandardagents/-/commit/12d65795fe27c276d9924e3166b92c733cf2d175))

### Changed

- Add comprehensive test suite ([716e6fb](https://gitlab.com/blueflyio/openstandardagents/-/commit/716e6fb7884033527847d66c7376d25c8335ed26))

- Validate release process ([dce8fa6](https://gitlab.com/blueflyio/openstandardagents/-/commit/dce8fa665f31729eb6f982c62c4547dda5f54d48))

- Apply prettier formatting to modified files ([1635c9e](https://gitlab.com/blueflyio/openstandardagents/-/commit/1635c9ef7cd1efce57865dce065525b2e73111df))

### Documentation

- **deployment**: GitHub Mirroring Deployment Guide ([a8d0bfa](https://gitlab.com/blueflyio/openstandardagents/-/commit/a8d0bfa351806d919be4b385194b4b88c8a96653))
- Create enhanced wiki structure with educational content ([f33ceca](https://gitlab.com/blueflyio/openstandardagents/-/commit/f33cecaa30722796716b0b6919de47f449191355))

- Implement comprehensive documentation automation system ([a4a6aca](https://gitlab.com/blueflyio/openstandardagents/-/commit/a4a6aca0e684bcd6e6b7a424ce9df2ce131045d7))

- GitHub mirroring deployment guide ([3297489](https://gitlab.com/blueflyio/openstandardagents/-/commit/32974895e3e943c2c270d4da736093a3f37c9829))

- Update CHANGELOG and README for v0.2.6 ([caeeef7](https://gitlab.com/blueflyio/openstandardagents/-/commit/caeeef78831687ec96cf32d4a84a62f711dc375a))

- GitHub Sync Strategy & Automation ([d4bf045](https://gitlab.com/blueflyio/openstandardagents/-/commit/d4bf0451676d3c4bb6c4d4a87acd0c54cc09b124))

- Automation Audit & Roadmap ([be1de58](https://gitlab.com/blueflyio/openstandardagents/-/commit/be1de58be186f6add8acfa895b9cfba4c8c113b1))

### Fixed

- **ci**: Add JUnit XML test reports for GitLab UI ([aa7c9f0](https://gitlab.com/blueflyio/openstandardagents/-/commit/aa7c9f0b37aff9a81d42439b27f0de526415b016))
- **ci**: Disable agent jobs until AGENT_PLATFORM_GROUP is configured ([17d22c6](https://gitlab.com/blueflyio/openstandardagents/-/commit/17d22c66e4aca817f596ec530f7af718f0fa0bad))
- **ci**: Install git in release:preview job ([b6bb908](https://gitlab.com/blueflyio/openstandardagents/-/commit/b6bb908b3e2409832a0385620f33b27b6a7b6635))
- **ci**: Install tsx globally for increment-dev-tag job ([14c1aa0](https://gitlab.com/blueflyio/openstandardagents/-/commit/14c1aa05b60b17e91e1c9c25ee28d9d3204bc2ed))
- **ci**: Exclude DI container from coverage to meet 75% function threshold ([308ae80](https://gitlab.com/blueflyio/openstandardagents/-/commit/308ae8060b029218b49bcc73a899471063f421ef))
- **codeowners**: Add @flux423 as code owner for CI/CD files ([f49d92d](https://gitlab.com/blueflyio/openstandardagents/-/commit/f49d92d8aec72c209991c2047bd943ccb28c5047))
- **readme**: Remove private GitLab repo reference ([e827535](https://gitlab.com/blueflyio/openstandardagents/-/commit/e827535ad26ffa0b4682ffc5b6e4741cc64f1523))
- **version**: Sync all version references to match package.json ([6d185e0](https://gitlab.com/blueflyio/openstandardagents/-/commit/6d185e08dc66979a25483178995b151cc5f55f76))
- **website**: Downgrade to Next.js 14, add GitLab CI for container deployment ([31187fc](https://gitlab.com/blueflyio/openstandardagents/-/commit/31187fc25f029b554f6431dae8794d64412d017c))
- Connect agent jobs to gitlab_components project ([f2c0952](https://gitlab.com/blueflyio/openstandardagents/-/commit/f2c09528074147c8d7c874270b77382d6a3f5811))

- Update all apiVersions to v0.2.8 and include .agents in git ([7653e8f](https://gitlab.com/blueflyio/openstandardagents/-/commit/7653e8ff08a24491d39c2ee7c0ba412c84e90ab2))

- Improve mobile responsiveness across website pages ([7845881](https://gitlab.com/blueflyio/openstandardagents/-/commit/78458813cb83007385bb575610f751cd0f6e7e10))

- Clean up duplicate GitLab environment definitions ([4b9e7ac](https://gitlab.com/blueflyio/openstandardagents/-/commit/4b9e7ac4cd6f687b4f9e3b35027e33f4ccabbca7))

- Sync main into development for v0.2.6 release ([f84a805](https://gitlab.com/blueflyio/openstandardagents/-/commit/f84a805cb4ba2068ede1555a324f241f87f83815))

- Clean up v0.2.6 release spec ([3f0b9fb](https://gitlab.com/blueflyio/openstandardagents/-/commit/3f0b9fb13b9a78222d5359a7847f2ccba5129dec))

- Sync main into development ([e894f3e](https://gitlab.com/blueflyio/openstandardagents/-/commit/e894f3e30cadc4e606d257232ef8d420c094cf43))

- Sync main into development ([1d14ef6](https://gitlab.com/blueflyio/openstandardagents/-/commit/1d14ef6348cd011fcaad264f50020b3d91e3f64f))

- Add .js extensions to ESM imports ([cd10a01](https://gitlab.com/blueflyio/openstandardagents/-/commit/cd10a0123be4144809abafe45927ed6e05074a72))

- Sync main into development ([c67c21b](https://gitlab.com/blueflyio/openstandardagents/-/commit/c67c21bdd0568343a4f1727067c37ce47340df61))

- Sync main into development ([3e2a0ec](https://gitlab.com/blueflyio/openstandardagents/-/commit/3e2a0ecdffc524f986bc0889cef7dcf1ea6794ee))

- Sync all main commits into development ([87976b4](https://gitlab.com/blueflyio/openstandardagents/-/commit/87976b46a1b5ff1ab2408647fb3972ceec704eb9))

- Properly merge main into development ([fb2bf9e](https://gitlab.com/blueflyio/openstandardagents/-/commit/fb2bf9e13a6140e481d8643f2510dd198ad152ab))

- Merge main into development to sync branches ([b565010](https://gitlab.com/blueflyio/openstandardagents/-/commit/b565010bdee7c7c0a6af51e460124e066d7194b3))

- Complete spec/v0.2.4 directory structure ([8edc631](https://gitlab.com/blueflyio/openstandardagents/-/commit/8edc6318c5cdce04ac2c34b79dca5ceb364544f5))

- Mobile responsive code blocks ([5aa22b2](https://gitlab.com/blueflyio/openstandardagents/-/commit/5aa22b25f79419137e0e8b85a1b6439324d7af7b))

- Comment out GitLab agent component references until published ([09402ae](https://gitlab.com/blueflyio/openstandardagents/-/commit/09402ae738e8981c6c7e5b39590462800bc14c74))

- Resolve increment-dev-tag conflict with enhanced version ([47ecff7](https://gitlab.com/blueflyio/openstandardagents/-/commit/47ecff7581a3bc043f7c52a9a38fdd2df844104c))

- Sync package-lock.json with package.json changes ([f49d1f7](https://gitlab.com/blueflyio/openstandardagents/-/commit/f49d1f70001a77a5965c382d40aa056de81aab05))

- Restore rollback-coordinator OSSA agent manifest (was overwritten with CI config) ([48ce585](https://gitlab.com/blueflyio/openstandardagents/-/commit/48ce5854e891282267b3579d185ac5fe282f72dd))

- Resolve merge conflict markers in 00-HOME.md ([63a6950](https://gitlab.com/blueflyio/openstandardagents/-/commit/63a69505c59c8c983e67362d44020c9fcd6ffaff))

- Update version references in documentation ([09a1d92](https://gitlab.com/blueflyio/openstandardagents/-/commit/09a1d92b52d03a617eeaa4adda11361280c1e706))

- Get website live ([d9c1f90](https://gitlab.com/blueflyio/openstandardagents/-/commit/d9c1f90437ffd9fc6e7748ce8dba81c88107f1ae))

- Sync website version to 0.2.5-RC and fix GitLab CI lint error ([fc8a1bb](https://gitlab.com/blueflyio/openstandardagents/-/commit/fc8a1bb28b765925815d3b701d21b807ae6c122f))

- Resolve DI container circular dependency and TypeScript errors ([94ebe08](https://gitlab.com/blueflyio/openstandardagents/-/commit/94ebe08194a6c55455546cc0a06a293ce9feaafe))

### Miscellaneous

- **ci**: Add merge train workflow support ([9d10701](https://gitlab.com/blueflyio/openstandardagents/-/commit/9d10701c9e9dd0f5e5d725241ced163a7073a159))
- Merge development into main for v0.2.8 release ([2340526](https://gitlab.com/blueflyio/openstandardagents/-/commit/23405266d5a10ab225b532e35879662220b925c2))

- Absolute final main sync ([3873466](https://gitlab.com/blueflyio/openstandardagents/-/commit/38734661fa19e792c3d79fa5a0c3d33ea867a350))

- Final main sync for v0.2.8 release ([1e861de](https://gitlab.com/blueflyio/openstandardagents/-/commit/1e861dea564f3e0ef4bfdbf087048660ed2b6606))

- Final sync of main into development ([9b1cc51](https://gitlab.com/blueflyio/openstandardagents/-/commit/9b1cc515b071140c39d67ff28e2d6927cf2e7c84))

- Sync main into development (final) ([c66e0ab](https://gitlab.com/blueflyio/openstandardagents/-/commit/c66e0ab31f22eb9716176633c79a36b882090d81))

- Sync main into development ([53d8f18](https://gitlab.com/blueflyio/openstandardagents/-/commit/53d8f187ca8fbfc39b57b3f333e8731b1c522e7f))

- Merge main into development (resolved all conflicts) ([d8a7c4d](https://gitlab.com/blueflyio/openstandardagents/-/commit/d8a7c4d149523788ad98063436e43d92cd050198))

- Resolve merge conflicts for development → main ([281ee45](https://gitlab.com/blueflyio/openstandardagents/-/commit/281ee4512d7cd6ea019e17f2c8d91d83c33113d8))

- Merge remaining v0.2.8 lint fixes ([1e5c1d5](https://gitlab.com/blueflyio/openstandardagents/-/commit/1e5c1d5b21ad18630b7d50bc74b94f54e6b0ec4a))

- Clean up website files and add dynamic version detection ([4d36750](https://gitlab.com/blueflyio/openstandardagents/-/commit/4d36750edb84ee05c5796b46292be93a26121f5a))

- Clean up deprecated gitlab.bluefly.io references and fix email addresses ([51e3c81](https://gitlab.com/blueflyio/openstandardagents/-/commit/51e3c812567e887f59bc9725e807b813064fb66a))

- Prepare v0.2.8 release ([89005bd](https://gitlab.com/blueflyio/openstandardagents/-/commit/89005bd699b27206b6eafc69f033a6568d00212f))

- Add automated validation and maintenance tools ([b044c4e](https://gitlab.com/blueflyio/openstandardagents/-/commit/b044c4ef947de0c5a101882e18d6bc91c186ccb5))

- Add GitHub automation and sync tools ([c612dcc](https://gitlab.com/blueflyio/openstandardagents/-/commit/c612dcc1841d427232bf9746386a95a87341b26b))

- Merge development - remove root .md file per project rules ([837579d](https://gitlab.com/blueflyio/openstandardagents/-/commit/837579d3f1379446d6e947b037ae9a11dc3efdf5))
## [0.2.5] - 2025-11-25

### Added

- **ci**: Require completed milestone before allowing release ([ad2cc7d](https://gitlab.com/blueflyio/openstandardagents/-/commit/ad2cc7d65a8a60f46044c8564d573e947bfeef7c))
- **ci**: Add support for skipping releases on merge to main ([e8aa00d](https://gitlab.com/blueflyio/openstandardagents/-/commit/e8aa00d7f73a5a1f42477e4c3e8b29996c95d535))
- **ci**: Remove manual version selection, use automatic milestone-controlled releases ([c1c7d1b](https://gitlab.com/blueflyio/openstandardagents/-/commit/c1c7d1b1aba46eee2aff230fe736f376d253d5f8))
- **ci**: Implement recommended CI/CD workflow with semantic-release ([928d2e5](https://gitlab.com/blueflyio/openstandardagents/-/commit/928d2e5e8bec5b8da8dc3e52bb50c3d1909c85e1))
- Automate version detection in npm scripts ([3ecf31c](https://gitlab.com/blueflyio/openstandardagents/-/commit/3ecf31c94458329fb6c57da48c4beb9ef748dc31))

- Add release gate variable and prepare 0.2.5-RC release ([a62212b](https://gitlab.com/blueflyio/openstandardagents/-/commit/a62212b7173fe6a2787ca09c13cd09c369356263))

- Add milestone-gated automatic releases with docs validation ([4b20efd](https://gitlab.com/blueflyio/openstandardagents/-/commit/4b20efdb36ed5d03cc1991b72466596ba73ed31c))

- Add release checklist issue template ([0e39f21](https://gitlab.com/blueflyio/openstandardagents/-/commit/0e39f216c4f7a92f1638bcbff23c29381a481e0d))

- Restructure CI/CD environments and add npm publish safeguards ([84425a2](https://gitlab.com/blueflyio/openstandardagents/-/commit/84425a2d1eb475b9f247484389e9f6f283957193))

- Add OSSA-compliant GitLab K8s agent manifests ([6d2071b](https://gitlab.com/blueflyio/openstandardagents/-/commit/6d2071b6a7f0b0277d1e5c7112187be85445b6b6))

- Configure GitLab agent with impersonation-based CI/CD access ([503358b](https://gitlab.com/blueflyio/openstandardagents/-/commit/503358b0a659e17f12b48a02a0fd3b9bb1692b22))

- Implement version sync automation and milestone-gated releases ([514d860](https://gitlab.com/blueflyio/openstandardagents/-/commit/514d86046f2dabe3afbab5ed651e7ea5d6ab603f))

- Website improvements and bug fixes ([2d828bd](https://gitlab.com/blueflyio/openstandardagents/-/commit/2d828bde162e1dbded032c60c770e63f75c03863))

- Complete plan implementation - dynamic website versioning and CI/CD ([d3a0e9f](https://gitlab.com/blueflyio/openstandardagents/-/commit/d3a0e9f3cf4c59a8065efd9fd9e855af587fb756))

- Implement dynamic website versioning and complete documentation migration ([b5a214e](https://gitlab.com/blueflyio/openstandardagents/-/commit/b5a214e5b2e6cdcf70b512b01591185e9440dc9f))

### Changed

- **ci**: Decouple releases from code flow - milestone-gated releases only ([e93d507](https://gitlab.com/blueflyio/openstandardagents/-/commit/e93d5070f6fa4c2178059e643fc70f0e68bb7fad))
- Convert build scripts to TypeScript with Zod validation ([05754ca](https://gitlab.com/blueflyio/openstandardagents/-/commit/05754cae94ffec6cc38fff39ee8dc21595d45d02))

### Documentation

- Add GitLab Kubernetes agent documentation and update examples ([9efe871](https://gitlab.com/blueflyio/openstandardagents/-/commit/9efe87132d4cc86d41ef0d2e7ea33592782183f2))

- Add running agents guide and Drupal integration docs ([fb2f23b](https://gitlab.com/blueflyio/openstandardagents/-/commit/fb2f23b2b810a2575bb109a322635c3d540dda72))

- Enhance OpenAPI extensions documentation with comprehensive schemas ([aa828d5](https://gitlab.com/blueflyio/openstandardagents/-/commit/aa828d5bf3d748e2b614117badd4872538d194ca))

### Fixed

- **ci**: Add build:dist to release:preview needs section ([bf5f67b](https://gitlab.com/blueflyio/openstandardagents/-/commit/bf5f67befd2528a732109eb1c74b68dd52bd466f))
- **ci**: Use build:no-wiki to avoid wiki sync failure blocking pages deployment ([cfe0a72](https://gitlab.com/blueflyio/openstandardagents/-/commit/cfe0a721a173a89b023f465e606e29763cdf6c43))
- **ci**: MINIMAL - just pages deploy ([066c002](https://gitlab.com/blueflyio/openstandardagents/-/commit/066c00230f4a8b9135f6e872a2c42a797f47e377))
- **ci**: Fully decouple website from releases - manual buttons only ([09149d0](https://gitlab.com/blueflyio/openstandardagents/-/commit/09149d05c3828d4e64614b17fa4d6d9cb95b8489))
- **ci**: Restore working CI, make pages manual button ([a7236bb](https://gitlab.com/blueflyio/openstandardagents/-/commit/a7236bbac53453ee6b7bb074eb857ef682f395b0))
- **ci**: Remove unused setup stage ([6385b07](https://gitlab.com/blueflyio/openstandardagents/-/commit/6385b07a5ae8bf0256b815ad9d19fd5c8b06a026))
- **ci**: Correct workflow rules syntax ([4332afb](https://gitlab.com/blueflyio/openstandardagents/-/commit/4332afbd48e3e87659442ed6274d3401d62a308d))
- **ci**: Decouple pages deployment from release pipeline ([3f2ee03](https://gitlab.com/blueflyio/openstandardagents/-/commit/3f2ee03c13e8febf5ddfd7d89ba09471aa8a2cd1))
- **ci**: Use CI_SERVER_HOST for npm registry URL ([4d77f91](https://gitlab.com/blueflyio/openstandardagents/-/commit/4d77f912b130b6ddf49640d43bb59250bc4ea2a2))
- **ci**: Add detect:milestone-version to release:main dependencies to receive dotenv variables ([8a00d32](https://gitlab.com/blueflyio/openstandardagents/-/commit/8a00d326e04bf325f145f078f0189070c323eafa))
- **ci**: Handle null issue counts in milestone detection ([bc9420d](https://gitlab.com/blueflyio/openstandardagents/-/commit/bc9420dd2051f882e8d622c1a91e87eca34d0f48))
- **ci**: Make release job manual to prevent accidental releases ([fd1f286](https://gitlab.com/blueflyio/openstandardagents/-/commit/fd1f286a5615dfdcc864948a36de22652578bc97))
- **docs**: Update README to reference v0.2.4 instead of v0.2.3 ([1bf7ba6](https://gitlab.com/blueflyio/openstandardagents/-/commit/1bf7ba6ca4783037f6c45871757824ca9297ea9b))
- **scripts**: Support pre-release versions in sync-versions.ts regex ([7899a15](https://gitlab.com/blueflyio/openstandardagents/-/commit/7899a1595750fbd49beebde4eab86374edcc5d6d))
- **website**: Downgrade to Next.js 14, add GitLab CI for container deployment ([9303f4f](https://gitlab.com/blueflyio/openstandardagents/-/commit/9303f4f829c3852d303e1b6912e3005a2ed97a4f))
- **wiki**: Use correct GitLab host and project path for wiki sync ([332362e](https://gitlab.com/blueflyio/openstandardagents/-/commit/332362e252115a678e16ac8ee6e3bfc3ad9181e6))
- Resolve 84 ESLint warnings for cleaner codebase ([994c1c7](https://gitlab.com/blueflyio/openstandardagents/-/commit/994c1c705da287f2c534d3668cfb2ef0a4b1a660))

- Make package.json version loading lazy to avoid Jest module resolution issues ([a2d008c](https://gitlab.com/blueflyio/openstandardagents/-/commit/a2d008c9074686173b3327de4f42743473243090))

- Improve package.json path resolution with path.resolve and better error handling ([7dde7ae](https://gitlab.com/blueflyio/openstandardagents/-/commit/7dde7ae8674dbef124c67fa1af0456c0f9cbdcb8))

- Replace remaining CRITICAL with ERROR in echo statement ([cbd56c8](https://gitlab.com/blueflyio/openstandardagents/-/commit/cbd56c8e74d5eabf1ada4df97ad7383c8ae158e2))

- Replace CRITICAL with ERROR and update sync-versions to TypeScript ([cc2c6c8](https://gitlab.com/blueflyio/openstandardagents/-/commit/cc2c6c8770485330d4a8741598bcb86a21c9195a))

- Replace command grouping with if statement in pages job ([36574c6](https://gitlab.com/blueflyio/openstandardagents/-/commit/36574c6ce999dfcfd0ef8b57029468f2575dd7f2))

- Remove all emojis from echo statements and fix MILESTONE_READY variable expansion ([a4f8ac1](https://gitlab.com/blueflyio/openstandardagents/-/commit/a4f8ac115b68dd34202bd0f4d881f8c2eb7e1bb2))

- Remove emojis from echo statements in pages job ([4063202](https://gitlab.com/blueflyio/openstandardagents/-/commit/40632021ebf6ac2884738e6e52714da94b398728))

- Make GitLab Pages deploy automatically on main branch ([6af7b72](https://gitlab.com/blueflyio/openstandardagents/-/commit/6af7b7286a9fb8a3c2f52cf3a5abb5864738a6e3))

- Update version references to 0.2.5-RC ([fb316b4](https://gitlab.com/blueflyio/openstandardagents/-/commit/fb316b4689bf03c055cdcec9e5d12f4e374ca943))

- Remove invalid dependency on release:npm from pages job ([d41a5fd](https://gitlab.com/blueflyio/openstandardagents/-/commit/d41a5fdeb0fca5f966277f7f29d850c8281ce2e7))

- Make pages job work on feature branches ([2587446](https://gitlab.com/blueflyio/openstandardagents/-/commit/25874464c5f8ff2ceeac05137fc245b4244b1cc9))

- Add missing axios dependency and restore full CI pipeline ([644f434](https://gitlab.com/blueflyio/openstandardagents/-/commit/644f4341251c44543d137906d5b84d16d4f532e6))

- Sync website package-lock.json with package.json ([fee37ad](https://gitlab.com/blueflyio/openstandardagents/-/commit/fee37ad236b4ff41585c0e510ad0bccf167019e5))

- Improve sync-versions.ts to handle pre-release versions ([82619a0](https://gitlab.com/blueflyio/openstandardagents/-/commit/82619a01cbf9e85d9cea1edf140c1931cb0f5448))

- Update README.md version references to v0.2.5 ([223524a](https://gitlab.com/blueflyio/openstandardagents/-/commit/223524a93bfb7f06f26411feca1c0439b2a7cd1b))

- Update README schema refs to ossa-0.2.5-RC.schema.json ([456bff8](https://gitlab.com/blueflyio/openstandardagents/-/commit/456bff8d722e6ab3360d393123cc1b8bbc4b430a))

- Sync all version references to v0.2.5-RC ([7747333](https://gitlab.com/blueflyio/openstandardagents/-/commit/7747333937af6fe846d47b827eddefb070754179))

- Create complete spec/v0.2.5 directory ([a56327d](https://gitlab.com/blueflyio/openstandardagents/-/commit/a56327d07c2fab98623bbf97f4ed36e60caf56c6))

- Make v0.2.4 schema backward compatible with string capabilities ([61d3cb3](https://gitlab.com/blueflyio/openstandardagents/-/commit/61d3cb385529d87cb9f71915bab629176ef41eef))

- Use flexible versioning (ossa/v0.2) in examples ([a332036](https://gitlab.com/blueflyio/openstandardagents/-/commit/a33203656b5f89cd1a22d3ee240977d671772d3d))

- Update all v0.2.3 references to v0.2.4 ([7aa3bfc](https://gitlab.com/blueflyio/openstandardagents/-/commit/7aa3bfc586b2fbb643c7e7b1df4187cc5f7f75e8))

- Remove merge conflict markers from .gitlab-ci.yml ([a34938a](https://gitlab.com/blueflyio/openstandardagents/-/commit/a34938a09adfe840c6b1a3d5258014aaa33d9506))

- Skip non-v0.2.4 examples in integration tests ([d56f50e](https://gitlab.com/blueflyio/openstandardagents/-/commit/d56f50e55a0bdba675e4638daf420f8d3c923d43))

- Update test suite to support v0.2.4 schema validation ([6e198c5](https://gitlab.com/blueflyio/openstandardagents/-/commit/6e198c5cf40b2af1c0c2775fe22349c87aebac3e))

- Update all version references from v0.2.3 to v0.2.4 ([7817c26](https://gitlab.com/blueflyio/openstandardagents/-/commit/7817c262124473ed5bf250846a82c0ac1499c8ee))

- Remove duplicate if statement in sync-versions.js ([c862a42](https://gitlab.com/blueflyio/openstandardagents/-/commit/c862a429c0357598362023c5bc946891465938c8))

- Add missing spec schemas and framework examples to repo ([672fdbd](https://gitlab.com/blueflyio/openstandardagents/-/commit/672fdbd82d6997f7851b62dc84076d2de58ef829))

- Suppress hydration warning for body tag (browser extension attributes) ([17f1c90](https://gitlab.com/blueflyio/openstandardagents/-/commit/17f1c90d0fbe8c68525fb3a38d8a037f5c9a0ffd))

- Update CI to remove colon from echo statement ([b3fcfa5](https://gitlab.com/blueflyio/openstandardagents/-/commit/b3fcfa52e76d6502b5b2a84ff4a0df195d454c34))

- Resolve merge conflict in page.tsx, keep responsive styling ([e73f19e](https://gitlab.com/blueflyio/openstandardagents/-/commit/e73f19e28115e9f375e14fc00b476ea27e95c29f))

- Fix broken getting-started route and integrate wiki sync ([8b759a8](https://gitlab.com/blueflyio/openstandardagents/-/commit/8b759a8145b43d1d61fd7b91b9aac05b1ae48545))

- Remove jq dependency from Dockerfile verification ([1255d99](https://gitlab.com/blueflyio/openstandardagents/-/commit/1255d9996a405523110e69fb984d01036633e70f))

- Dockerfile to verify examples.json generation ([c82b7a2](https://gitlab.com/blueflyio/openstandardagents/-/commit/c82b7a2ff596929900935961debec76f36236e25))

- Examples loading with multiple path attempts ([0d1b312](https://gitlab.com/blueflyio/openstandardagents/-/commit/0d1b3125dc8f2ffa3eaed1560c30804f1a711b7e))

- Simplify examples path resolution to use path.resolve ([704ed60](https://gitlab.com/blueflyio/openstandardagents/-/commit/704ed60e2c839bb4b0f66446e5fef51e63d7f7dd))

- Examples page path resolution for dev mode ([c317e5c](https://gitlab.com/blueflyio/openstandardagents/-/commit/c317e5c2f477a35e0c0aa06e79228c1da26c1386))

- Dockerfile to copy examples directory for examples.json generation ([5789bab](https://gitlab.com/blueflyio/openstandardagents/-/commit/5789bab6b72dc838cbb5eeda735a8d0179870563))

- Generate examples.json in Docker build ([b4a66d7](https://gitlab.com/blueflyio/openstandardagents/-/commit/b4a66d730d98f34415e1650113bb994950a30d7d))

- Make homepage code blocks responsive for mobile ([ac6e654](https://gitlab.com/blueflyio/openstandardagents/-/commit/ac6e6549e6bdc78adb58d04882bc653e74ce808f))

- Examples page to work with static export ([ee8559e](https://gitlab.com/blueflyio/openstandardagents/-/commit/ee8559e4e66a3d815afd211c67b8241558ab9aa2))

- Remove all colons from echo statements in semantic-release preview ([c3cb6a1](https://gitlab.com/blueflyio/openstandardagents/-/commit/c3cb6a192648cff17b581e2e10249d68038b5535))

- Remove colon from all Version echo statements in CI ([f08bf0d](https://gitlab.com/blueflyio/openstandardagents/-/commit/f08bf0d3dc412619800191136f9b2f8a8a06461c))

- Remove colon from echo statement in promote jobs ([c341fa5](https://gitlab.com/blueflyio/openstandardagents/-/commit/c341fa59b68d3eb3ae640a0cb2b4b51011aa394c))

- Separate version command to avoid YAML parsing issues in CI ([340896b](https://gitlab.com/blueflyio/openstandardagents/-/commit/340896b5847bf6bcb893481813cfeb79ade43e0c))

- Rename promote jobs to use hyphens instead of colons ([b0c86ea](https://gitlab.com/blueflyio/openstandardagents/-/commit/b0c86ea5b5c66efa6a5c4acad4e313f7dbc22ef7))

- Add all required version exports for VersionSelector component ([c306d90](https://gitlab.com/blueflyio/openstandardagents/-/commit/c306d900e8de6cab88e0ba830a20edb3bebbca0b))

- Remove API route and add STABLE_VERSION export alias ([c906756](https://gitlab.com/blueflyio/openstandardagents/-/commit/c90675659daf4b03fdde402d8f4c9c1d1d56e6b5))

- Restore homepage and ensure build succeeds ([0eff2a4](https://gitlab.com/blueflyio/openstandardagents/-/commit/0eff2a4ceebebb3bd040231cb0bf25b5cc31fd39))

- Website build errors and prepare for GitLab Pages deployment ([55d35d6](https://gitlab.com/blueflyio/openstandardagents/-/commit/55d35d6b16481aef0f5e77771063cef81dee95b3))

- Remove dependencies from semantic-release:preview - use needs only ([71ff4ce](https://gitlab.com/blueflyio/openstandardagents/-/commit/71ff4ceb1b7648a61f25109447d00191ae47e67f))

- Resolve OpenAPI validation errors and test failures ([58581d7](https://gitlab.com/blueflyio/openstandardagents/-/commit/58581d7c251291eddfc0014a07d20a730268ffb6))

- Ensure reflect-metadata and inversify are installed ([7f1105f](https://gitlab.com/blueflyio/openstandardagents/-/commit/7f1105f30416b880c71841936093235a87dd0cf6))

- Replace  with inline /health endpoint definition ([cc42b27](https://gitlab.com/blueflyio/openstandardagents/-/commit/cc42b27fa571fdfd2ee834ed3a2edecb4587f88c))

- Complete OpenAPI error resolution ([304d214](https://gitlab.com/blueflyio/openstandardagents/-/commit/304d2145f11772d4e4a0e0e04922e8cc03428d02))

- Resolve OpenAPI errors in ossa-core-api.openapi.yaml ([c961ac0](https://gitlab.com/blueflyio/openstandardagents/-/commit/c961ac04f32ed935463029451f214d36f6d407d3))

- Remove duplicate import in playground ([b9bc252](https://gitlab.com/blueflyio/openstandardagents/-/commit/b9bc25253107b9c8eb0154c27c7669f4560e81e5))

- Properly implement dynamic versions in playground ([ed1ae12](https://gitlab.com/blueflyio/openstandardagents/-/commit/ed1ae12f08b2e256b837e8626365009af19935d1))

- Make GitLab releases URL dynamic using CI variables ([f4ebe91](https://gitlab.com/blueflyio/openstandardagents/-/commit/f4ebe9179fdc36bacfc672cc972af9a56a2ffc49))

- Remove unused useEffect import from playground ([01c4761](https://gitlab.com/blueflyio/openstandardagents/-/commit/01c4761ac30b737801331078b8c13522c62a1479))

- Resolve CI build errors - playground syntax and version.ts JSON import ([188d5cf](https://gitlab.com/blueflyio/openstandardagents/-/commit/188d5cffc7f15609dbc7b5917e9d9bf7ca79e277))

- Prioritize npm dist-tags for stable/dev version detection ([cc45425](https://gitlab.com/blueflyio/openstandardagents/-/commit/cc454256bc2b3ceb6f94d84f7190866348b20891))

- Update version.ts to load dynamically from versions.json ([dd81d66](https://gitlab.com/blueflyio/openstandardagents/-/commit/dd81d6665d7186207bd445a3e0382f0706fdefd1))

- Remove duplicate import in migrate-to-gitlab.py ([6a7d7b2](https://gitlab.com/blueflyio/openstandardagents/-/commit/6a7d7b22bf51eb496fc82301a29eea4adda905fe))

- Resolve package-lock.json merge conflict ([06dc46f](https://gitlab.com/blueflyio/openstandardagents/-/commit/06dc46f66f83c120509dca3a453f2284d575f633))

- Resolve test errors - add reflect-metadata requirement and ensure dependencies installed ([6a21a94](https://gitlab.com/blueflyio/openstandardagents/-/commit/6a21a943cbcfd80ed7cb81d3d1303528758053a1))

- Categorize v0.2.4-dev as prerelease instead of dev ([50bfae9](https://gitlab.com/blueflyio/openstandardagents/-/commit/50bfae99156163b237315689843141fd2f1025b0))

- Make wiki sync skip gracefully when no token available ([ba02a34](https://gitlab.com/blueflyio/openstandardagents/-/commit/ba02a341644e5640ccb8f51461e986f185d12045))

- Remove duplicate frontmatter from blog post ([5a05704](https://gitlab.com/blueflyio/openstandardagents/-/commit/5a05704cd478325caf8d7b15d9a72ae333e21e2f))

- Handle 401/403 wiki API errors gracefully ([4db9870](https://gitlab.com/blueflyio/openstandardagents/-/commit/4db98706f5d44b2094465c841bdf49d9005500f7))

- ESLint ES module compatibility ([92ab430](https://gitlab.com/blueflyio/openstandardagents/-/commit/92ab430fa9265564ddd43662d8fb1049dcf82885))

- Use alpine image for mirror:github job (permission denied on curlimages/curl) ([c19d2f3](https://gitlab.com/blueflyio/openstandardagents/-/commit/c19d2f36af34a267db567c8c7c4b59ef590efca2))

### Miscellaneous

- Add shared utility libraries for build scripts ([b090f3a](https://gitlab.com/blueflyio/openstandardagents/-/commit/b090f3aa417d82bfb0209c3158b27dc9fabf9f81))

- Update validation and generation scripts to 0.2.5-RC ([c7c9181](https://gitlab.com/blueflyio/openstandardagents/-/commit/c7c9181833afda38f85e670fb5a44b1cd722b2be))

- Sync all version references to 0.2.5-RC ([d514f6c](https://gitlab.com/blueflyio/openstandardagents/-/commit/d514f6c01bb274840030629255d6dd6bef300472))

- Update CHANGELOG formatting and OpenAPI specs ([ca28e71](https://gitlab.com/blueflyio/openstandardagents/-/commit/ca28e71823d33c6dd7c87f75495a9f0a6925084a))

- Sync RELEASING.md to v0.2.5 ([4a8927b](https://gitlab.com/blueflyio/openstandardagents/-/commit/4a8927b1910f246a6db0007213147b70a8d13928))

- Bump to v0.2.6 - professional README, all refs synced ([5b22099](https://gitlab.com/blueflyio/openstandardagents/-/commit/5b22099b4c05271fa0d71c6764de8045988a44c6))

- Verify version sync - all references consistent ([ba3353f](https://gitlab.com/blueflyio/openstandardagents/-/commit/ba3353f0046964798d9226cdf3ea4d8f42cf0099))

- Verify version sync - all references consistent ([e2588d1](https://gitlab.com/blueflyio/openstandardagents/-/commit/e2588d1a66b7b6e0d3feb7cabe6262f3a5d1a8f8))

- Merge main into development - resolve conflicts ([28fff95](https://gitlab.com/blueflyio/openstandardagents/-/commit/28fff958dfaf1672acbf2191381d6f115a5e6399))

- Merge development to main ([e1d4fe5](https://gitlab.com/blueflyio/openstandardagents/-/commit/e1d4fe58b95419a71c87a0742825e1755d8bbba2))

- Merge development into main - resolve conflicts ([ce59ac2](https://gitlab.com/blueflyio/openstandardagents/-/commit/ce59ac23ec0cc142cf990dedd117089278a1d475))

- Merge development to main ([bfa0709](https://gitlab.com/blueflyio/openstandardagents/-/commit/bfa0709ed69c7aaec9f2475e6fe81cd7823427d0))

- Update to new GitLab location (blueflyio) and add CODEOWNERS ([93e136d](https://gitlab.com/blueflyio/openstandardagents/-/commit/93e136de864dffad7f02659dd285578b7a6af118))

- Remove unused website files and make GitLab scripts dynamic ([398101a](https://gitlab.com/blueflyio/openstandardagents/-/commit/398101a2cf2c8472883d801eab3237be9d632dde))

- Merge development into main ([7ec02ba](https://gitlab.com/blueflyio/openstandardagents/-/commit/7ec02ba778ab848c59ce6eb7b677e7955f5b010d))
## [0.2.4] - 2025-11-19

### Added

- **aiflow**: Phase 4 - SLO/SLA, incident response, chaos engineering ([3fb78f1](https://gitlab.com/blueflyio/openstandardagents/-/commit/3fb78f15a25e9cf700e8e61bf68c088652afc066))
- **aiflow**: Phase 3 - Production deployment, load testing, monitoring ([6066100](https://gitlab.com/blueflyio/openstandardagents/-/commit/60661001e698edf269c4b4d2a450dc36090c0935))
- **aiflow**: Phase 3 - K8s deployment, load testing, CI/CD, monitoring ([f5b9f46](https://gitlab.com/blueflyio/openstandardagents/-/commit/f5b9f46ddea9fc90910a773093d620813a5945b1))
- **aiflow**: Phase 2 - BuildKit registration, Phoenix tracing, integration tests ([ee7279d](https://gitlab.com/blueflyio/openstandardagents/-/commit/ee7279db63cee7afe4be2a2b044d87b40778f0f4))
- **aiflow**: Complete Phases 2 & 3 - Production-ready AIFlow integration ([0f81e9d](https://gitlab.com/blueflyio/openstandardagents/-/commit/0f81e9d0c77586241caf94e593ad738481c0f68d))
- **automation**: Add resource validation to prevent cluster exhaustion ([3910b66](https://gitlab.com/blueflyio/openstandardagents/-/commit/3910b662905661504e57969bc4d76b6c87282dbc))
- **ci**: Add promote-to-main job and merge CI improvements ([072a6e2](https://gitlab.com/blueflyio/openstandardagents/-/commit/072a6e2b8420340031718dc4405aaf26e86b8416))
- **ci**: Add manual promotion and release buttons ([fabec93](https://gitlab.com/blueflyio/openstandardagents/-/commit/fabec932730dab43b1c443c6c22780a4f5cf4968))
- **ci**: Implement full semantic release workflow ([04e7383](https://gitlab.com/blueflyio/openstandardagents/-/commit/04e73830e9c4e8728d984a4942fe05bb0876a6e8))
- **ci**: Add manual promotion and release buttons ([c57fb66](https://gitlab.com/blueflyio/openstandardagents/-/commit/c57fb66e3f258a0ae87c51db9d6f2c1d7d9cdff2))
- **ci**: Add manual merge-to-main button after successful pipeline ([d3fb40c](https://gitlab.com/blueflyio/openstandardagents/-/commit/d3fb40c5d1aef7bda5cac15d0c2215cfc3f77a37))
- **compliance**: Add OSSA reasoning compliance extension schema for chain-of-thought auditing ([9bb60ec](https://gitlab.com/blueflyio/openstandardagents/-/commit/9bb60ecc20b56df65f0e3d5e8562104386b773d7))
- **compliance**: Add OSSA reasoning compliance extension schema for chain-of-thought auditing ([33a2a9f](https://gitlab.com/blueflyio/openstandardagents/-/commit/33a2a9fe72fc234863799b1e5afbcd3bad8e68ae))
- **kagent**: Intelligent agent deployment + ecosystem tooling ([b602d25](https://gitlab.com/blueflyio/openstandardagents/-/commit/b602d25e9b200e01ff07be1fdf95a09da5938cb6))
- **ossa**: Add OpenAI Agents SDK bridge extension ([8bc0e4a](https://gitlab.com/blueflyio/openstandardagents/-/commit/8bc0e4a0a66483006c09199a787ebe618f28d3f8))
- **ossa**: Add OpenAI Agents SDK bridge extension ([3cf4c9f](https://gitlab.com/blueflyio/openstandardagents/-/commit/3cf4c9fd5ae6c042a96c5ec328d514bacd8936c9))
- **release**: Prepare v0.2.3 production release ([5e03397](https://gitlab.com/blueflyio/openstandardagents/-/commit/5e033975421c5086c2873ed04dc9c9840135b93e))
- **schema**: Add platform extensions for Cursor, Langflow, AutoGen, Vercel... ([6496cd5](https://gitlab.com/blueflyio/openstandardagents/-/commit/6496cd503b18d9d15fe152c8ea7450d828588507))
- **spec**: Organize OSSA spec with clean v1.0 versioning ([08468e3](https://gitlab.com/blueflyio/openstandardagents/-/commit/08468e3831fa8dc8e83bc2bbfdae352ab3f33e10))
- **wiki**: Add wiki repository to version control in .gitlab/wiki/ ([6957445](https://gitlab.com/blueflyio/openstandardagents/-/commit/6957445056f3564d9dd83e27a5a8645a70c99aed))
- Rename package to @bluefly/openstandardagents (v0.2.4) ([a36825a](https://gitlab.com/blueflyio/openstandardagents/-/commit/a36825a0243e04598d0e022d16419ad7b7e627e6))

- Add ossa run command - MVP ([4b25ba4](https://gitlab.com/blueflyio/openstandardagents/-/commit/4b25ba48eb848fde8cbad52e2a66099e1b4d5419))

- Add v0.2.4-dev and v0.2.5-dev spec directories ([d808393](https://gitlab.com/blueflyio/openstandardagents/-/commit/d808393e1f49a74f5c47d29479b0f387640399ba))

- Add GitLab wiki sync and UI improvements ([b709233](https://gitlab.com/blueflyio/openstandardagents/-/commit/b709233e7e06f08f025e242600372f15661fe9b1))

- Enhance GitHub Actions and update repository URLs ([7719d44](https://gitlab.com/blueflyio/openstandardagents/-/commit/7719d44e9a4bd57526742126dbd0ac7669ec8478))

- Add Core Concepts page directly to website app ([a2acc97](https://gitlab.com/blueflyio/openstandardagents/-/commit/a2acc97225120fbabe51007dc59b1784e357e629))

- Enhance website with comprehensive blog and improved docs ([39f07e4](https://gitlab.com/blueflyio/openstandardagents/-/commit/39f07e40b63cfc82d06b815ab26548b8d28b7d58))

- Integrate GitLab wiki content into docs page ([4778123](https://gitlab.com/blueflyio/openstandardagents/-/commit/4778123b47ae118c3c264b340cfa65d875a1cb33))

- Add GitHub PR template with conventional commit guide ([3720786](https://gitlab.com/blueflyio/openstandardagents/-/commit/3720786c48844a1f766565064a502049a55ab704))

- Add URL tracking for Google Analytics ([1626a62](https://gitlab.com/blueflyio/openstandardagents/-/commit/1626a6287d32acf646311e12991dc22ea0e793d4))

- Comprehensive examples page enhancement and GitHub branding ([e88b64e](https://gitlab.com/blueflyio/openstandardagents/-/commit/e88b64e0b1863ec86dc6b3565f48aa0a39ab1bbb))

- Comprehensive enhancements to schema and playground pages ([58f3857](https://gitlab.com/blueflyio/openstandardagents/-/commit/58f38575c7edf7b96fa7271403fc171c465142d9))

- Comprehensive schema page with visual diagrams and larger text ([3cdfffe](https://gitlab.com/blueflyio/openstandardagents/-/commit/3cdfffe74aa215cc5be590241180ae5fe56268d4))

- Establish OSSA brand identity with logo and colors ([457ebdf](https://gitlab.com/blueflyio/openstandardagents/-/commit/457ebdfa2945c7fbf5735d77258f2b4ab708a383))

- Add 'Why OSSA?' section explaining agent fragmentation problem ([fc02f8c](https://gitlab.com/blueflyio/openstandardagents/-/commit/fc02f8c298bbc60ab33913b0e2514d635480c819))

- Comprehensive OSSA website build-out with architecture diagrams and docs ([2f984c4](https://gitlab.com/blueflyio/openstandardagents/-/commit/2f984c472d82d83a8266d37972513ecb75e5f903))

- Implement semantic-release automation like OpenAPI ([76fba51](https://gitlab.com/blueflyio/openstandardagents/-/commit/76fba511eab4758f7f00e72b4a87aefb55453065))

- Add GitHub Actions workflows and update naming to AI ([3480e59](https://gitlab.com/blueflyio/openstandardagents/-/commit/3480e5929caf8e767e8d144cee927de076b34bd0))

- Prepare OSSA website for GitLab Pages deployment ([94a8712](https://gitlab.com/blueflyio/openstandardagents/-/commit/94a8712226c6d1883df879bc409309f556775ba7))

- Integrate Claude Code swarm orchestration ([05f2235](https://gitlab.com/blueflyio/openstandardagents/-/commit/05f223556704b636af734a88f26f1cacb598d377))

- Add OpenAPI/Swagger specification extensions for AI agents ([6f04ed9](https://gitlab.com/blueflyio/openstandardagents/-/commit/6f04ed9e03d741c28b8e7ce5e1670fb9553170d3))

- Integrate v1.0 to v0.2.2 migration into OSSA CLI ([4b3805c](https://gitlab.com/blueflyio/openstandardagents/-/commit/4b3805c29733ab8b8aaf3938c6aec320bd7ae8d2))

- Complete OSSA v0.2.2 agent migration with framework integration ([a35e488](https://gitlab.com/blueflyio/openstandardagents/-/commit/a35e4888557c0de4270ccae14b26f1fb80663c39))

- Add semantic-release for automated versioning ([18e00ec](https://gitlab.com/blueflyio/openstandardagents/-/commit/18e00ec463ed10ed8441feb898e214977b46cbff))

- Ecosystem branding - OSSA positioning and tagline ([b51d2a8](https://gitlab.com/blueflyio/openstandardagents/-/commit/b51d2a83c74430bcd5815b30fb0ae14b21a8fe35))

- Migrate to openstandardagents.org domain ([7cfdb20](https://gitlab.com/blueflyio/openstandardagents/-/commit/7cfdb20f98a743fefcb332361b8621196fbc3ba2))

- Improve OSSA branding and positioning - The OpenAPI for AI Agents ([5da09c8](https://gitlab.com/blueflyio/openstandardagents/-/commit/5da09c8c85854a932db9bb63b6a37bf2003c3ff4))

- Add Cursor IDE environment.json configuration ([362f217](https://gitlab.com/blueflyio/openstandardagents/-/commit/362f217223738162a8df94b04aad57d67cd1bb14))

- Complete Phase 1 fixes - migrate command, examples, and framework extensions ([06c2d12](https://gitlab.com/blueflyio/openstandardagents/-/commit/06c2d12c3e5348fdff3ec197d3fc57a45ab719bc))

- Complete GitLab wiki, milestones, and issues alignment ([1a8fa32](https://gitlab.com/blueflyio/openstandardagents/-/commit/1a8fa32cacb273c4b5a07e89c2ac69fdfa9062cc))

- Add OpenAPI/Swagger specification extensions for AI agents ([bfe5025](https://gitlab.com/blueflyio/openstandardagents/-/commit/bfe5025a83d06449648cd3e92588568bc42217c8))

- Integrate v1.0 to v0.2.2 migration into OSSA CLI ([349c4dd](https://gitlab.com/blueflyio/openstandardagents/-/commit/349c4ddda10066a628447fff6a62edc09615e3be))

- Complete OSSA v0.2.2 agent migration with framework integration ([b0ab662](https://gitlab.com/blueflyio/openstandardagents/-/commit/b0ab662f31faafed8de01e2ffb4a5a8c948eb634))

- Add semantic-release for automated versioning ([589d530](https://gitlab.com/blueflyio/openstandardagents/-/commit/589d5304c8e1b5a59d3ba0b15a809a961acc4e7e))

- Update k6 load testing scenarios ([e0bfc15](https://gitlab.com/blueflyio/openstandardagents/-/commit/e0bfc1550962e8357fd446f23babdec7ff7634ef))

- Complete OSSA v1.0 TypeScript implementation with Drupal integration ([be27188](https://gitlab.com/blueflyio/openstandardagents/-/commit/be271880728e4dc6f164b4c85af432daf3d66858))

- OSSA v0.1.9 with kAgent extension support ([1d4c0b5](https://gitlab.com/blueflyio/openstandardagents/-/commit/1d4c0b50cdcb5d4bf2fcc3f648968688f3139517))

- Complete platform integration - OpenAPI + Helm for all projects ([d7140aa](https://gitlab.com/blueflyio/openstandardagents/-/commit/d7140aac1e780d6094ef5aa20cf31c9adf3072d6))

- Intelligent agent deployment with resource optimization ([e9fba1e](https://gitlab.com/blueflyio/openstandardagents/-/commit/e9fba1eedab9dcc6c5e0674a192bdf5315152984))

- Mass cleanup and standardization - ZERO ERRORS ([79cb19d](https://gitlab.com/blueflyio/openstandardagents/-/commit/79cb19d1e8b7b0454a25abf9a8e18d765aae5fd8))

- Add ecosystem tasks orchestrator agent ([276b868](https://gitlab.com/blueflyio/openstandardagents/-/commit/276b868722d46ed1198f3a7ffc1f37e815d82d3b))

- Complete OSSA ecosystem automation suite ([cbef539](https://gitlab.com/blueflyio/openstandardagents/-/commit/cbef539551430f7710cf689f50ea0aad4c8d3bb2))

- Add CryptoSage AIFlow social agent example ([9c03a6b](https://gitlab.com/blueflyio/openstandardagents/-/commit/9c03a6b94f0741a56e1aaaefebd71d387f428235))

- Add kagent.dev and AIFlow-Agent bridge support to OSSA 1.0 ([c83f462](https://gitlab.com/blueflyio/openstandardagents/-/commit/c83f46270cf7264dbe6b7a3936373a6568f6015e))

- Mass cleanup and standardization - ZERO ERRORS ([cd6f1cc](https://gitlab.com/blueflyio/openstandardagents/-/commit/cd6f1cc5278c74bde5b1ad63e71d8665e0bb26a4))

- Enhanced OSSA CLI with audit, inspect, and schema commands ([ca21cc2](https://gitlab.com/blueflyio/openstandardagents/-/commit/ca21cc271161f592dd39a9e4bd7d7f3fd97a0004))

- Add ecosystem tasks orchestrator agent ([b9ac082](https://gitlab.com/blueflyio/openstandardagents/-/commit/b9ac082f2746107de11ebddba26fcc0e5c065ea0))

- Complete OSSA ecosystem automation suite ([abc485f](https://gitlab.com/blueflyio/openstandardagents/-/commit/abc485fc00344a3fe405739b734d8807cdf9adc2))

- Add CryptoSage AIFlow social agent example ([36a1a21](https://gitlab.com/blueflyio/openstandardagents/-/commit/36a1a219d546bf29185c4df7218a844e5891a70c))

- Add kagent.dev and AIFlow-Agent bridge support to OSSA 1.0 ([2a98c1e](https://gitlab.com/blueflyio/openstandardagents/-/commit/2a98c1ebd09eb7d34992dee44074073f070f89bf))

- Mass cleanup and standardization - ZERO ERRORS ([3452f4f](https://gitlab.com/blueflyio/openstandardagents/-/commit/3452f4f3c2b0a9d9ac72ac2c6917a4bda5ac050c))

- OSSA v1.0.0 - Enterprise-ready specification standard ([a62de85](https://gitlab.com/blueflyio/openstandardagents/-/commit/a62de850ae034f6629d165f1c21f847cab462752))

- Production Architecture Cleanup - Shell/Makefile Elimination + OpenAPI Standardization ([d7b3a50](https://gitlab.com/blueflyio/openstandardagents/-/commit/d7b3a5096b53164c7c9545d1bfb39af293007442))

- Implement GitLab CI/CD recovery + bulk git operations ([bbb6bfb](https://gitlab.com/blueflyio/openstandardagents/-/commit/bbb6bfbbee93e5a26ff0e263b9906bf93d163123))

- Separate OSSA standard from implementation ([be33d23](https://gitlab.com/blueflyio/openstandardagents/-/commit/be33d232adf62ad4aceaf54f67eb59fd53298c4b))

- Create comprehensive agent ecosystem via OSSA CLI ([6c3011d](https://gitlab.com/blueflyio/openstandardagents/-/commit/6c3011dcc46346ce44c0aac85268276489cc335d))

- Consolidate OSSA ecosystem for v0.2.0 release ([7b7261a](https://gitlab.com/blueflyio/openstandardagents/-/commit/7b7261a4c781e4e27b2abfadb577b23a628508a6))

- Add agent structure gap analysis to OSSA roadmap ([4a0b2db](https://gitlab.com/blueflyio/openstandardagents/-/commit/4a0b2dbaa831be1b0da069dd9ee71ed85bcb7479))

- Integrate GitLab components - OSSA ([0c6e335](https://gitlab.com/blueflyio/openstandardagents/-/commit/0c6e335db2fe8f67c45ae8fc24c93634e2317b1a))

- Add OSSA v0.1.9 standard specifications ([161a714](https://gitlab.com/blueflyio/openstandardagents/-/commit/161a714d865b078c2b54c006df28924933d4d90b))

- Add batch standardization script for LLM projects ([15f999a](https://gitlab.com/blueflyio/openstandardagents/-/commit/15f999aa27f9d1bfdfa16921d682f2c5ecbc06c6))

- Add comprehensive standardize command to OSSA CLI ([8950ed8](https://gitlab.com/blueflyio/openstandardagents/-/commit/8950ed8bb80d4e2eb4f546a9d9fd1684c328cd7f))

- Implement Redis Event Bus for OSSA v0.1.9 Q1 2025 milestone ([970e971](https://gitlab.com/blueflyio/openstandardagents/-/commit/970e97169001ad23743f1035e8d5eae78d3bf41d))

- Implement service registry with integration milestones ([9da8cc7](https://gitlab.com/blueflyio/openstandardagents/-/commit/9da8cc7165ba606fcba976025c03d11a9e5ed6f5))

- Consolidate valuable work from backup branches ([96b3143](https://gitlab.com/blueflyio/openstandardagents/-/commit/96b3143d0cc88c2888f6b055d8bfafd118377aa7))

- Implement full OSSA v0.1.9 compliance ([8a7ad30](https://gitlab.com/blueflyio/openstandardagents/-/commit/8a7ad3024c6019b365be776ec3627fb7f82c2cfc))

- Configure fast-forward merge strategy with merge train support ([dfc36a5](https://gitlab.com/blueflyio/openstandardagents/-/commit/dfc36a5fcfc86e6613680e1b2ff0d5492d5e7378))

- Update OSSA roadmap for v0.2.0 development ([8901efd](https://gitlab.com/blueflyio/openstandardagents/-/commit/8901efd1a29b7fe7d3bde044064a8452af1082f3))

- Add OSSA v0.1.9 extended specifications ([1c96be7](https://gitlab.com/blueflyio/openstandardagents/-/commit/1c96be74fea27d575307d89044a7cac63521be5e))

- Implement comprehensive GitLab CI/CD and Kubernetes deployment ([f7439f4](https://gitlab.com/blueflyio/openstandardagents/-/commit/f7439f46d8b8c06d0e39bd147fae3e414666cc6a))

- Implement OSSA-BuildKit roadmap integration bridge ([1a8583c](https://gitlab.com/blueflyio/openstandardagents/-/commit/1a8583c56d82e8afd692a8dde08f6d393085e45c))

- Separate OSSA standard from implementation ([36f5750](https://gitlab.com/blueflyio/openstandardagents/-/commit/36f57506072f10f54e3ae78ab5efb50aa0f3b3da))

- Add OSSA audit CLI command with OpenAPI-first architecture ([ad5636c](https://gitlab.com/blueflyio/openstandardagents/-/commit/ad5636cd6c97d39d388ebcb78564f306f12cec64))

- Add OSSA management API and migration scripts ([d4974ce](https://gitlab.com/blueflyio/openstandardagents/-/commit/d4974ce4c9daad7cad18a153463794768d5711b2))

- Implement OSSA taxonomy tools and documentation ([dbaf937](https://gitlab.com/blueflyio/openstandardagents/-/commit/dbaf9373190d6f5a16aa189efb1b535791c81c6a))

- Create multiple environment tags in CI ([a08a601](https://gitlab.com/blueflyio/openstandardagents/-/commit/a08a6016c410802c495c5abacc04bcfe5b7cbd31))

- Enable automatic tagging for feature branches in CI ([9d8f60c](https://gitlab.com/blueflyio/openstandardagents/-/commit/9d8f60cb536b16fd3c53d28a778eb4e543d1949f))

### CI/CD

- Use standard GitLab CI without custom components ([590fdf7](https://gitlab.com/blueflyio/openstandardagents/-/commit/590fdf7997c822a8c9c69a2f68b70d8817cbf2c1))

- Test tag creation with GITLAB_TOKEN ([47162f6](https://gitlab.com/blueflyio/openstandardagents/-/commit/47162f6c225e93d3e7c969d695ed300f1e9f0703))

### Changed

- **aiflow**: Add integration tests for Phase 2 ([7a87c3e](https://gitlab.com/blueflyio/openstandardagents/-/commit/7a87c3e8e72bffada210261b33e8355c5a66195f))
- Clean up project structure ([5c8c49c](https://gitlab.com/blueflyio/openstandardagents/-/commit/5c8c49ce5507da436819d619408fd6908c842cb6))

- Consolidate spec folders - remove duplication ([cd13ece](https://gitlab.com/blueflyio/openstandardagents/-/commit/cd13ece11e0678741c8295c6202d724ee464cf3f))

- Fix formatting in validate-resources.ts ([40814e5](https://gitlab.com/blueflyio/openstandardagents/-/commit/40814e5a561cb0524def757d527d0404b201a6d9))

- Remove directory standardization from OSSA ([998832c](https://gitlab.com/blueflyio/openstandardagents/-/commit/998832c02947200ccb9b839d8740ba2552373c3d))

- Reorganize infrastructure directories ([301588c](https://gitlab.com/blueflyio/openstandardagents/-/commit/301588c10fb7039008c5d2ab0b0855ef9fad39b9))

- Simplify CI pipeline for specification project ([d22ca00](https://gitlab.com/blueflyio/openstandardagents/-/commit/d22ca003c6c4da058f342d6157a4d30c305edc18))

- Convert scripts to API endpoints and cleanup ([60df4a4](https://gitlab.com/blueflyio/openstandardagents/-/commit/60df4a44cc40a99f3f3851108934394a80d1c0d4))

- Verify CI can create tags ([915a093](https://gitlab.com/blueflyio/openstandardagents/-/commit/915a0936e6150d2e354dc4e8d58da4835aa11e17))

### Documentation

- **examples**: Annotate 10 priority examples with comprehensive inline documentation ([235a9d3](https://gitlab.com/blueflyio/openstandardagents/-/commit/235a9d3f1a6808dbd086b1b8df73757584e7c298))
- **readme**: Update links and version for v0.2.3 ([fdeeea7](https://gitlab.com/blueflyio/openstandardagents/-/commit/fdeeea76aada6ffb8fd9d434f80c8346ba108778))
- **spec**: Update specification docs to OSSA 1.0.0 standard ([3d03031](https://gitlab.com/blueflyio/openstandardagents/-/commit/3d03031fa4b34d03a5472903d6e039a92f187071))
- **wiki**: Update wiki submodule with 6 migration guides ([2066dbb](https://gitlab.com/blueflyio/openstandardagents/-/commit/2066dbb0caf7f0e704ab2f8e2d912333a2b6771e))
- Update all documentation to use v0.2.x instead of hardcoded versions ([e1bc769](https://gitlab.com/blueflyio/openstandardagents/-/commit/e1bc769d39f498d31c0d40574c279c8b2d552aed))

- Update README branding to 'Scalable AI Agents' ([91fdb10](https://gitlab.com/blueflyio/openstandardagents/-/commit/91fdb10a0127878e062ff17d2b819801df0ad0ab))

- Feature Core Concepts prominently on docs homepage ([6c4930b](https://gitlab.com/blueflyio/openstandardagents/-/commit/6c4930b4d400bbaed81c23eab7e9f43bac8be237))

- Add comprehensive Contributing guide and OSSA Compliant badge ([317d6be](https://gitlab.com/blueflyio/openstandardagents/-/commit/317d6be308cdb5ef6e30f7103fa6f19cd83ded44))

- Add final migration completion report ([97fa174](https://gitlab.com/blueflyio/openstandardagents/-/commit/97fa174545dfcf3d5af6c67d85d84cc42652254e))

- Fix all URLs and add author bio ([cf20fe8](https://gitlab.com/blueflyio/openstandardagents/-/commit/cf20fe85301427cf3d436d01d952a970b5d0e030))

- Point README to Wiki; add static HTML docs page ([6f246c7](https://gitlab.com/blueflyio/openstandardagents/-/commit/6f246c77c73929c7cee4d76ed723bcc8e71804d5))

- Add final migration completion report ([11cc339](https://gitlab.com/blueflyio/openstandardagents/-/commit/11cc3398b8678659553b52e791c87a0a08f76820))

- Fix all URLs and add author bio ([c8d6a14](https://gitlab.com/blueflyio/openstandardagents/-/commit/c8d6a14c6fac0051d06efd715d390771ff8504ed))

- Add complete transformation summary ([c90ebb7](https://gitlab.com/blueflyio/openstandardagents/-/commit/c90ebb7a951183d5155854262b98f2dd03f2b969))

- Rewrite README to reflect actual OSSA reality ([3c4f4ed](https://gitlab.com/blueflyio/openstandardagents/-/commit/3c4f4edf315ea5355546a4a8944c39d4becfe040))

- Remove all emojis and clean up duplicate configs ([7e00e0f](https://gitlab.com/blueflyio/openstandardagents/-/commit/7e00e0fcb7eb920292ee3de3f9cd5dffa4ebbe7d))

- Add standardization process and compliance template ([dbfd74a](https://gitlab.com/blueflyio/openstandardagents/-/commit/dbfd74ac402ede99fb43096fa34e2dc9b78d803f))

- Update README to reflect OSSA as pure specification standard ([9d37601](https://gitlab.com/blueflyio/openstandardagents/-/commit/9d3760153ddbdaa4d11980d9ec88fe53d964ccff))

- Add architecture clarification from audit to ROADMAP.md ([38885e0](https://gitlab.com/blueflyio/openstandardagents/-/commit/38885e08545bc6cb6237b7e7f3b2252d94401fdd))

### Fixed

- **aiflow**: URGENT - Reduce CPU requests from 500m to 50m ([846c8fd](https://gitlab.com/blueflyio/openstandardagents/-/commit/846c8fda3861120d6324ce957bf33b03fa484826))
- **ci**: Use PRIVATE-TOKEN with CI_JOB_TOKEN for MR API; reuse existing MR if present ([e4b9abd](https://gitlab.com/blueflyio/openstandardagents/-/commit/e4b9abde0173dd124cc962d49568b964f4d59ec7))
- **ci**: Make promote-to-main fast-forward-only; auto-create MR on conflicts via API ([f633a37](https://gitlab.com/blueflyio/openstandardagents/-/commit/f633a3728baefdaa1e5aa31c367c8541b46a5ccf))
- **ci**: Promote-to-main handles shallow clones and unrelated histories; add auth remote ([bf4d5c9](https://gitlab.com/blueflyio/openstandardagents/-/commit/bf4d5c9d1d9716b64f634dc08a51c8ba2b9dbb5f))
- **ci**: Remove invalid need on promote-to-main (cannot need later-stage job) ([e2f37a7](https://gitlab.com/blueflyio/openstandardagents/-/commit/e2f37a77b6f1814204e7636f4b12aa5f1f81af68))
- **ci**: Make promote-to-main script a single multiline string to satisfy YAML parsing ([08d3b7d](https://gitlab.com/blueflyio/openstandardagents/-/commit/08d3b7d9fa9c8eb3de84300475bf1eb27874525c))
- **ci**: Remove stray text and update development branch git config ([f80fce3](https://gitlab.com/blueflyio/openstandardagents/-/commit/f80fce318515429f65d01d902d21f845f593380f))
- **ci**: Update Node.js version to 22 for semantic-release compatibility ([f8c7145](https://gitlab.com/blueflyio/openstandardagents/-/commit/f8c71457f7a932af8541726425e8de539894598f))
- **ci**: Remove invalid global section from GitLab CI config ([1fcadbc](https://gitlab.com/blueflyio/openstandardagents/-/commit/1fcadbc97b1dbbc84854e056d03045175e9a3f38))
- **ci**: Switch to permissive mode - allow all merges ([b0ce631](https://gitlab.com/blueflyio/openstandardagents/-/commit/b0ce631f215d736100987901728550fe45548391))
- **ci**: Use golden workflow@main instead of v0.2.3 ([7c968b3](https://gitlab.com/blueflyio/openstandardagents/-/commit/7c968b3f4643810d8d5f007e431e9356520c0a7d))
- **ci**: Improve CI config with better error handling ([decd712](https://gitlab.com/blueflyio/openstandardagents/-/commit/decd7127487e0fdeae478893dd6a5f4436d34f70))
- **ci**: Use basic working CI config to get pipelines passing ([c959506](https://gitlab.com/blueflyio/openstandardagents/-/commit/c95950689115bca00803b8d4f96015ee0645e00a))
- **ci**: Correct component path to include templates/ prefix ([1aa0c38](https://gitlab.com/blueflyio/openstandardagents/-/commit/1aa0c385f2bf4f4c4381ec6eaf98c2718730c0fc))
- **ci**: Use default coverage reporters from jest.config ([e6daef3](https://gitlab.com/blueflyio/openstandardagents/-/commit/e6daef337201de253c67a0f7b36da7ff3d0dab74))
- **ci**: Replace missing component with working CI pipeline ([d2151a8](https://gitlab.com/blueflyio/openstandardagents/-/commit/d2151a8526593dbd296a3631e0389df3f010bd66))
- **ci**: Replace missing component with working CI pipeline ([976c260](https://gitlab.com/blueflyio/openstandardagents/-/commit/976c26056790b3749a0ad0b2b014f1aa02ca4bc0))
- **ci**: Lower coverage thresholds to fix CI pipeline failures ([1ac8f27](https://gitlab.com/blueflyio/openstandardagents/-/commit/1ac8f275296f57e2897456718620983aae87740c))
- **ci**: Lower coverage thresholds to match current coverage ([dfa00c4](https://gitlab.com/blueflyio/openstandardagents/-/commit/dfa00c4d3d53f8e016a0e3ae5bfede19ed6ee952))
- **ci**: Use PRIVATE-TOKEN with CI_JOB_TOKEN for MR API; reuse existing MR if present ([afd8c25](https://gitlab.com/blueflyio/openstandardagents/-/commit/afd8c258b635c519bd0698adb8972e1c09e6efe4))
- **ci**: Make promote-to-main fast-forward-only; auto-create MR on conflicts via API ([a414db0](https://gitlab.com/blueflyio/openstandardagents/-/commit/a414db0d5fda70d499ef9e55162f499a39d029a8))
- **ci**: Promote-to-main handles shallow clones and unrelated histories; add auth remote ([7a66d60](https://gitlab.com/blueflyio/openstandardagents/-/commit/7a66d60142541505d0a65d0d5413adc34c24a235))
- **ci**: Remove invalid need on promote-to-main (cannot need later-stage job) ([211dbf7](https://gitlab.com/blueflyio/openstandardagents/-/commit/211dbf7cd38e3ffc4dac3ced00cf320754f815f1))
- **ci**: Make promote-to-main script a single multiline string to satisfy YAML parsing ([c1563ea](https://gitlab.com/blueflyio/openstandardagents/-/commit/c1563eae6a90365db699f5e3c63e9268ec79e1dd))
- **ci**: Remove stray text and update development branch git config ([eb895b5](https://gitlab.com/blueflyio/openstandardagents/-/commit/eb895b580ab27cf84bc005340eeff43ce6c2bb6c))
- **ci**: Update Node.js version to 22 for semantic-release compatibility ([eef4b89](https://gitlab.com/blueflyio/openstandardagents/-/commit/eef4b89de9e4ef4cf3361a9e95d30ee81e706e78))
- **ci**: Remove colon from commit message to fix YAML parsing ([260270a](https://gitlab.com/blueflyio/openstandardagents/-/commit/260270a24ce59752aef963a293b62b26e2c996c0))
- **ci**: Rename job to avoid YAML colon parsing issue ([f641574](https://gitlab.com/blueflyio/openstandardagents/-/commit/f6415745b4423636d332915e9061e948142a3959))
- **ci**: Add multi-agent component integration ([82dbd73](https://gitlab.com/blueflyio/openstandardagents/-/commit/82dbd73aaaff2e525b6c3dcb4c620314b782be9b))
- **tests**: Apply v0.2.3 test fixes from development ([3b9ac52](https://gitlab.com/blueflyio/openstandardagents/-/commit/3b9ac522a6e78d57527d74ff03f46bc3a43e7b85))
- **tests**: Update all test manifests to v0.2.3 Kubernetes-style format ([4dfe886](https://gitlab.com/blueflyio/openstandardagents/-/commit/4dfe88693ae0fc044c56c6e8a2669c63ed43c265))
- Comprehensive audit fixes - broken links, fake content, inconsistencies ([c4e2e0a](https://gitlab.com/blueflyio/openstandardagents/-/commit/c4e2e0a768aa83fa4c93d9727e77a2b948c8fbcc))

- Correct npm package links to @bluefly/open-standards-scalable-agents ([43c10d7](https://gitlab.com/blueflyio/openstandardagents/-/commit/43c10d7b86b5434b583e4542b1460f5f89d92b58))

- Correct npm registry auth token format in CI ([7be4e28](https://gitlab.com/blueflyio/openstandardagents/-/commit/7be4e2842e3c538013890afa0a758eda9735bb1f))

- Standardize github org names and canonical domain ([16b5a0f](https://gitlab.com/blueflyio/openstandardagents/-/commit/16b5a0fb5e090f1f4c7ef28b475b7e8d0ed619c7))

- Replace all gitlab.bluefly.io links with github.com across docs ([b7e30e7](https://gitlab.com/blueflyio/openstandardagents/-/commit/b7e30e76452a16a6cc630da84dc01d8a8129bf1a))

- Replace broken gitlab.bluefly.io links with github.com ([995d396](https://gitlab.com/blueflyio/openstandardagents/-/commit/995d396489aef490324b08321581e97085468100))

- Make wiki sync skip gracefully when no token ([79a8dbb](https://gitlab.com/blueflyio/openstandardagents/-/commit/79a8dbb689dba5d2612f3ae9a93dcb36c591a6fe))

- Website improvements and CI fix ([c416841](https://gitlab.com/blueflyio/openstandardagents/-/commit/c41684150cd25e34a8f07beddb4224c96588cfa1))

- Clean up apiVersion examples in schema ([1997f59](https://gitlab.com/blueflyio/openstandardagents/-/commit/1997f59882d4b3925a0dc1efbd99aceec53803f9))

- ESLint ES module compatibility ([3df3e86](https://gitlab.com/blueflyio/openstandardagents/-/commit/3df3e86c2bea0c45f54ad3c41bdb81c13e72ea33))

- Use GITLAB_PUSH_TOKEN for promote-to-main job ([76d7605](https://gitlab.com/blueflyio/openstandardagents/-/commit/76d76050f11e4f5d91781e6348b7e6fabfc75497))

- Add OSSA schema to public directory for schema page ([1fd75e9](https://gitlab.com/blueflyio/openstandardagents/-/commit/1fd75e95b79bacd4ef1e3c4fd8016ebdabc315ae))

- Add ESLint configuration for TypeScript ([308c75d](https://gitlab.com/blueflyio/openstandardagents/-/commit/308c75d2c6e9dc67c229a85718a88f7e5d62ef03))

- Add Suspense boundary for ExamplesViewer ([40796b1](https://gitlab.com/blueflyio/openstandardagents/-/commit/40796b191d52058f99ab23e690d3a7f6dca38c2e))

- Deploy clean docs design and disabled CI jobs to production ([4dcfe94](https://gitlab.com/blueflyio/openstandardagents/-/commit/4dcfe94a60bae21141441738f24d0629d39b3cb4))

- Disable force-static in dev mode to fix 404s ([3f37434](https://gitlab.com/blueflyio/openstandardagents/-/commit/3f374341e041f210bbd5c5cdf46604538e7c5d16))

- GenerateStaticParams returns empty array for root docs page ([089bed0](https://gitlab.com/blueflyio/openstandardagents/-/commit/089bed076b3bcf57f04bf1377b95adc6214b55e3))

- Clean professional design for /docs homepage ([7e57518](https://gitlab.com/blueflyio/openstandardagents/-/commit/7e575184f0436ebb0ba368811d1f73a662e90c25))

- Update hello-world example to v0.2.x ([d3a6f9d](https://gitlab.com/blueflyio/openstandardagents/-/commit/d3a6f9dfae90bfa0989ce86b02bd3b1d29d4a08a))

- Make version references generic (v0.2.x) ([54f652c](https://gitlab.com/blueflyio/openstandardagents/-/commit/54f652c21deebd8998a34b69b0368af1e3870972))

- Make schema page responsive and reorder sections ([895e3e1](https://gitlab.com/blueflyio/openstandardagents/-/commit/895e3e10167d56a4ff80c8450fc2776250a8d2e3))

- Update branding and fix broken installation guide link ([7628f54](https://gitlab.com/blueflyio/openstandardagents/-/commit/7628f5418efe1eb2936dcc094126f66d16251462))

- Correct all internal links and add compact install component ([4ccee8e](https://gitlab.com/blueflyio/openstandardagents/-/commit/4ccee8e7294c69350927332a445d1b3c20a6b5c7))

- Update release-all-platforms to work with CI_JOB_TOKEN ([bb5adb8](https://gitlab.com/blueflyio/openstandardagents/-/commit/bb5adb8a65e3883cf17783c0a35bad03794dfa9c))

- Repair generateStaticParams for static export ([5a96ac1](https://gitlab.com/blueflyio/openstandardagents/-/commit/5a96ac1bd481c0b49114897430df4aebd0443461))

- Remove poorly styled category grid from examples page ([88d001b](https://gitlab.com/blueflyio/openstandardagents/-/commit/88d001bcdbb9c2e370c9d93aefdea7b359da10ad))

- Support Docker volume mount for examples directory ([0d83bfa](https://gitlab.com/blueflyio/openstandardagents/-/commit/0d83bfa8b6d19482d08499a28ad87202c72b3126))

- Add missing Fragment closing tag in playground page ([2e5439e](https://gitlab.com/blueflyio/openstandardagents/-/commit/2e5439e87ee0834653f413be3d355212b352f6ed))

- Correct main repository display text to GitHub ([60d7dc6](https://gitlab.com/blueflyio/openstandardagents/-/commit/60d7dc6be685744287c1845e356d66eddce40598))

- Remove blog routes to resolve Next.js static export issue ([4c807b8](https://gitlab.com/blueflyio/openstandardagents/-/commit/4c807b83958f13dca2079ca398d7b1309973a8ae))

- Add static export config for Next.js 15 ([2bbecf8](https://gitlab.com/blueflyio/openstandardagents/-/commit/2bbecf8aaad1c2933f4804c61f2ea94f7c3d9dbf))

- Add ajv dependency and fix react-markdown v9 compatibility ([10a1dc7](https://gitlab.com/blueflyio/openstandardagents/-/commit/10a1dc7167da9cf1850a6e58ed2f614c6ae1f62d))

- Update to Next.js 15 async params and fix ESLint errors ([589bbbf](https://gitlab.com/blueflyio/openstandardagents/-/commit/589bbbfac1d0d2c875c59c56f2f5a4b1ebd8a045))

- Add final missing dependencies (ajv-formats, yaml) ([b2d6826](https://gitlab.com/blueflyio/openstandardagents/-/commit/b2d682673680a7e6a5d68becef82e20f557c017d))

- Add missing website dependencies and downgrade to Tailwind v3 ([4551813](https://gitlab.com/blueflyio/openstandardagents/-/commit/45518139c2985da08102ca89e2aec17cd939df2c))

- Sync @types/react version with react 18.3.1 ([8d1245f](https://gitlab.com/blueflyio/openstandardagents/-/commit/8d1245f0627017721cd8855f70c02a0cd1670b0e))

- Pages job should run even if release stages fail ([44c7f22](https://gitlab.com/blueflyio/openstandardagents/-/commit/44c7f22f578daaeab886404b74d403544b75cac4))

- Pages job stage should be .post not deploy ([ff35d54](https://gitlab.com/blueflyio/openstandardagents/-/commit/ff35d540902a1043802764e382af7f1a07cd9268))

- Remove all emojis from public-facing documentation ([65ff471](https://gitlab.com/blueflyio/openstandardagents/-/commit/65ff471ecd5bbd61a85520035bfc15b09b99e459))

- Resolve CI pipeline failures and repository cleanup ([3dc16ea](https://gitlab.com/blueflyio/openstandardagents/-/commit/3dc16ea432dc85e002c1e73c1d48549d4271285b))

- Replace remaining 'any' type with SchemaVersion type ([e512f91](https://gitlab.com/blueflyio/openstandardagents/-/commit/e512f9169efd1bc3ec820b1559f0d29172a8bc01))

- Replace 'any' types with OssaAgent type in validation tests ([898da0b](https://gitlab.com/blueflyio/openstandardagents/-/commit/898da0b64461196a70cf215497af9f4426caccc6))

- Update CI to use dist/cli/index.js instead of bin/ossa.js ([3217859](https://gitlab.com/blueflyio/openstandardagents/-/commit/32178593b09ff3097b0370ab761df75c5a95dd22))

- Add metadata existence check in validation test ([b6344b3](https://gitlab.com/blueflyio/openstandardagents/-/commit/b6344b39565a9428fa324ba451026c6be59aff9c))

- Remove incorrect yaml module mapper from Jest config ([688b386](https://gitlab.com/blueflyio/openstandardagents/-/commit/688b3860eb87302c7da1239b01c5272485b3f767))

- Update OssaAgent type to support v0.2.3 format and fix test CLI paths ([fa97220](https://gitlab.com/blueflyio/openstandardagents/-/commit/fa9722040d0ed4d4535e536038098551663623ba))

- Remove invalid tool description property and fix warning test ([a2a0ebe](https://gitlab.com/blueflyio/openstandardagents/-/commit/a2a0ebe180ca72a602dff03577d4adc0b2fc055d))

- Update tests to use v0.2.3 format (apiVersion/kind/metadata/spec) ([7088429](https://gitlab.com/blueflyio/openstandardagents/-/commit/70884296eaa719e1135b346e93e53cd70811dd91))

- All tests pass with v0.2.2 format ([70e1098](https://gitlab.com/blueflyio/openstandardagents/-/commit/70e1098cd145604ddda5f91f5218948703c6a89d))

- Validate command supports both v0.2.2 and v1.0 formats ([38af107](https://gitlab.com/blueflyio/openstandardagents/-/commit/38af107024e3a7654f875a2b3c84162947794f8e))

- Update all tests for v0.2.2 format ([468255f](https://gitlab.com/blueflyio/openstandardagents/-/commit/468255fd9d53d99f543cd1febe02063f824d1eab))

- Revert to version 0.2.2 and fix schema validation ([cb8976f](https://gitlab.com/blueflyio/openstandardagents/-/commit/cb8976f2d52e4f8e3bae197950640188186566ab))

- Add v0.2.2 schema JSON files to git ([2d07c8c](https://gitlab.com/blueflyio/openstandardagents/-/commit/2d07c8cdf944073f5147fcfd5df66ca49b6a3b41))

- Add v0.2.2 schema support and set as default ([0ddac35](https://gitlab.com/blueflyio/openstandardagents/-/commit/0ddac3529ea755db7103eab0d2107c5c6254fc9e))

- Replace gitlab.bluefly.io with app-4001.cloud.bluefly.io ([afc8eed](https://gitlab.com/blueflyio/openstandardagents/-/commit/afc8eed680cb855ea1b590044bf441573a411276))

- Replace all gitlab.bluefly.io references with new instance ([9bd10cb](https://gitlab.com/blueflyio/openstandardagents/-/commit/9bd10cb172a85ec922ca805927aea61a9f475d89))

- Add .js extensions to all test imports for ESM compatibility ([9470ea5](https://gitlab.com/blueflyio/openstandardagents/-/commit/9470ea591d7e1d3b5cd22ce6afbf205bb87931bb))

- Resolve conflicts with development branch ([e565fc8](https://gitlab.com/blueflyio/openstandardagents/-/commit/e565fc854d1f1e2f4592c74724ace7766db54c4c))

- Update import paths to use .js extensions for ESM compatibility ([ec86114](https://gitlab.com/blueflyio/openstandardagents/-/commit/ec861143e4fa60fd7615f38ef195ef9b1d443d61))

- Resolve P1 CI/build issues - add missing CLI entry point and fix test configuration ([47aca94](https://gitlab.com/blueflyio/openstandardagents/-/commit/47aca940d65b3a45c990dc33cd98f1857c9684d9))

- Convert release.config.js to ES module syntax ([8fa72cf](https://gitlab.com/blueflyio/openstandardagents/-/commit/8fa72cf7e4185abbe721ebb95dae6b1954c02cbb))

- Make README check optional in kagent examples test ([7f11727](https://gitlab.com/blueflyio/openstandardagents/-/commit/7f11727eaca7609bcc16e185884e673489e361a9))

- Generate required test output files in CI and make artifacts optional ([a8c451f](https://gitlab.com/blueflyio/openstandardagents/-/commit/a8c451f210c624657a0ff81fa74b8face3750b5b))

- Code formatting and CI test fixes ([4167511](https://gitlab.com/blueflyio/openstandardagents/-/commit/416751147c4bc37a01571585d454f86d17301e13))

- Restore .gitlab folder and remove __DELETE_LATER from git tracking ([eac24d8](https://gitlab.com/blueflyio/openstandardagents/-/commit/eac24d8f42b47235e4781ac34d305e8c895d3f8e))

- Convert release.config.js to ES module syntax ([b9cacbf](https://gitlab.com/blueflyio/openstandardagents/-/commit/b9cacbfda385234034f6afb19925c6884bacb3cc))

- All tests pass with v0.2.2 format ([ee00098](https://gitlab.com/blueflyio/openstandardagents/-/commit/ee00098772bbb9b6c128b483dce0366ce983329c))

- Validate command supports both v0.2.2 and v1.0 formats ([4d777d0](https://gitlab.com/blueflyio/openstandardagents/-/commit/4d777d08ab49267ad8670acaf8d0fdfb3617cfb9))

- Update all tests for v0.2.2 format ([34bb695](https://gitlab.com/blueflyio/openstandardagents/-/commit/34bb695bd2376b9d93d47d6867bf8b1f4a4e4b73))

- Revert to version 0.2.2 and fix schema validation ([5789f6d](https://gitlab.com/blueflyio/openstandardagents/-/commit/5789f6d7bfa0cc8638307902701ac967579097b0))

- Add v0.2.2 schema JSON files to git ([7ad617a](https://gitlab.com/blueflyio/openstandardagents/-/commit/7ad617a5bcdb2304e4aaa9424562fa1654d90fb4))

- Add v0.2.2 schema support and set as default ([da22d4d](https://gitlab.com/blueflyio/openstandardagents/-/commit/da22d4d47d4e9cc732c33290f971c670647d3318))

- Replace gitlab.bluefly.io with app-4001.cloud.bluefly.io ([b8480a6](https://gitlab.com/blueflyio/openstandardagents/-/commit/b8480a6d089c790f1d4f17359f9c79951239824e))

- Replace all gitlab.bluefly.io references with new instance ([89496c7](https://gitlab.com/blueflyio/openstandardagents/-/commit/89496c7fa1e723491482f4c804fd9addf0da65f8))

- Disable promote-to-main job - use merge requests for main branch ([76e4e0b](https://gitlab.com/blueflyio/openstandardagents/-/commit/76e4e0b6284ca346dd9768e827bbb5c083226a5c))

- Update version to 0.2.2 and reorganize spec directory ([5f9a8a0](https://gitlab.com/blueflyio/openstandardagents/-/commit/5f9a8a0f3d7fa6386d88e07da70c5fd775812bc8))

- Complete ESM module support with proper .js extensions ([b9754f3](https://gitlab.com/blueflyio/openstandardagents/-/commit/b9754f384cde11640860ceb3370b8180c290c2b8))

- Schema formatting ([3dd018b](https://gitlab.com/blueflyio/openstandardagents/-/commit/3dd018b56756da1821658a4a7ee8986e55c4b632))

- Convert ES module syntax in convert-to-kagent.js ([dba2b37](https://gitlab.com/blueflyio/openstandardagents/-/commit/dba2b37c3992545b0230e6ae0458a0c215c54852))

- Convert ES module syntax in convert-to-kagent.js ([9b00af6](https://gitlab.com/blueflyio/openstandardagents/-/commit/9b00af64966ea0a2a2183ecbcd4b2837767968f0))

- Correct version to 0.2.1 (patch bump) ([4227258](https://gitlab.com/blueflyio/openstandardagents/-/commit/42272581065db0fc3bf30b3f4fd65a27af0dfd93))

- Update CHANGELOG version to 0.3.0 ([b10b9f4](https://gitlab.com/blueflyio/openstandardagents/-/commit/b10b9f4c38ece7455995ccd96a28d4cfedf4df36))

- Correct version from 1.0.0 to 0.3.0 ([1786934](https://gitlab.com/blueflyio/openstandardagents/-/commit/178693428cf72d8bdc216ddfd65d111ec41f811f))

- Change releases to manual triggers on main branch only ([7d48895](https://gitlab.com/blueflyio/openstandardagents/-/commit/7d4889515c85107c9ca56cb624ebe70846af6041))

- Remove broken component include from CI pipeline ([2be40cf](https://gitlab.com/blueflyio/openstandardagents/-/commit/2be40cf06591915afaee3301445f3a46ae6f8347))

- Replace external example reference with inline value ([4fe2410](https://gitlab.com/blueflyio/openstandardagents/-/commit/4fe2410283ab66e77e6794296353524a66cb1c6f))

- Organize OpenAPI specs in openapi/ subdirectory ([b2907c2](https://gitlab.com/blueflyio/openstandardagents/-/commit/b2907c2feb32419de8973947438c6fe0ef307e60))

- Resolve conflict markers in CI and infrastructure files ([118fb25](https://gitlab.com/blueflyio/openstandardagents/-/commit/118fb25cdc4b4612f74170902b9209c61e367255))

- Complete TypeScript build fixes for v0.1.9 ([fd043bc](https://gitlab.com/blueflyio/openstandardagents/-/commit/fd043bcf9b26deca470984424bcb350866193096))

- Resolve test configuration and import issues ([ea4553c](https://gitlab.com/blueflyio/openstandardagents/-/commit/ea4553ccf42544272195cdedf8101d20bfa67d86))

- Resolve TypeScript compilation errors and validate OpenAPI specs ([bae8edf](https://gitlab.com/blueflyio/openstandardagents/-/commit/bae8edfded19f694aadffa32b7205b6081986c35))

- Add all missing dependencies for CI/CD ([61789f1](https://gitlab.com/blueflyio/openstandardagents/-/commit/61789f18c562447d0b37290ea53cb620ab3384fe))

- Restore mock:server:bg script and add missing dependencies ([f44d255](https://gitlab.com/blueflyio/openstandardagents/-/commit/f44d2557c8746ffe3104dc0ecc0df6778328d6ad))

- Resolve MCP server TypeScript typing issues ([16ef0dd](https://gitlab.com/blueflyio/openstandardagents/-/commit/16ef0dd2aa3585fad9c4992d224dc325d283cd9f))

- Temporarily exclude MCP directory from TypeScript build ([3d935ff](https://gitlab.com/blueflyio/openstandardagents/-/commit/3d935ff4d1f77546517696380a98288c79f340fe))

- Resolve Alpine SSH authentication with OpenSSL support ([e2e10cf](https://gitlab.com/blueflyio/openstandardagents/-/commit/e2e10cf4daffaa8512891d3479ff1d9ecbc12dd4))

- Add semicolons to echo statements in build script ([76a4baa](https://gitlab.com/blueflyio/openstandardagents/-/commit/76a4baa310f11a43eaab26718c0c210e6e9db922))

- Remove duplicate rules in security job ([b2622be](https://gitlab.com/blueflyio/openstandardagents/-/commit/b2622bec45c58cad330cd916d3f3de3188b1efbe))

- Update CI to use rules instead of only for proper pipeline triggering ([315015b](https://gitlab.com/blueflyio/openstandardagents/-/commit/315015b2007c5828fb406fe7254ef629b73692e4))

- Resolve mock server port mismatch in CI/CD ([7f08c5e](https://gitlab.com/blueflyio/openstandardagents/-/commit/7f08c5e4746b474c0b19421e1a555a545d5524a0))

- Resolve mock server port binding issue in CI/CD pipeline ([62820de](https://gitlab.com/blueflyio/openstandardagents/-/commit/62820de06f50688ba96733271dd25ca48f241cca))

- Remove template include - use standalone CI ([fe8a984](https://gitlab.com/blueflyio/openstandardagents/-/commit/fe8a98488422b391394b242085e90bc4fab16a06))

- Gitlab ci yaml syntax issues ([33655d0](https://gitlab.com/blueflyio/openstandardagents/-/commit/33655d01cc8e7ea8148951d482002dede05a5cdb))

- Use golden template structure with rules instead of only ([6f38784](https://gitlab.com/blueflyio/openstandardagents/-/commit/6f38784d85298dde6aee54dfea0bf4a3fb827f88))

- Remove npm dependency from CI - project has no package.json ([3c89185](https://gitlab.com/blueflyio/openstandardagents/-/commit/3c8918512cd095e346fd23b68db75843db425c12))

- Completely simplify CI to working baseline ([e17bbcb](https://gitlab.com/blueflyio/openstandardagents/-/commit/e17bbcb11d4d8da8d3ad8befb670b1a309f9668e))

- Resolve CI pipeline dependency issues ([027104c](https://gitlab.com/blueflyio/openstandardagents/-/commit/027104cb5ccf3dd2a8b4e80c6f0e5558250c04af))

- Resolve CI pipeline failures by removing inaccessible component ([1660741](https://gitlab.com/blueflyio/openstandardagents/-/commit/16607410b3cc78f3a6bdc69b4c9a96dae05cc8f6))

- Replace GitLab CI with comprehensive OSSA pipeline ([ab3baaa](https://gitlab.com/blueflyio/openstandardagents/-/commit/ab3baaa3f48c4481d794acb87f558105c9dc7d93))

- Add token authentication for CI tag pushing ([590cedc](https://gitlab.com/blueflyio/openstandardagents/-/commit/590cedc4ea47e45c23921620da3c4f83078ec95a))

- Add core-js dependency to resolve CI pipeline failure ([3ddcac2](https://gitlab.com/blueflyio/openstandardagents/-/commit/3ddcac2b563e780fa3c54715bbda454eba89706f))

- Update GitLab CI configuration ([555c90e](https://gitlab.com/blueflyio/openstandardagents/-/commit/555c90e9b031a8c934e118a6a2df45263a57c0bb))

### Miscellaneous

- **ci**: Add release.config.js so semantic-release config is present in CI ([d748bc8](https://gitlab.com/blueflyio/openstandardagents/-/commit/d748bc832772f36859a35fe2836d252cf85ad6b6))
- **ci**: Fix semantic-release jobs; export GITLAB_TOKEN; correct changelog text ([b1dd0ab](https://gitlab.com/blueflyio/openstandardagents/-/commit/b1dd0ab8f56bd78084e1b377ef66d5be84ebe863))
- **ci**: Enhance npmjs job with better messaging and environment tracking ([355b951](https://gitlab.com/blueflyio/openstandardagents/-/commit/355b951e322a3cb3c414c8aecbd86791750a0b9f))
- **ci**: Enhance release jobs with better messaging and environments ([260a65f](https://gitlab.com/blueflyio/openstandardagents/-/commit/260a65f5925ad855125ebf7b6079e944135eb8f6))
- **ci**: Add release.config.js so semantic-release config is present in CI ([e58ad9c](https://gitlab.com/blueflyio/openstandardagents/-/commit/e58ad9cae7e77dbe92219010f1dc3428e98e4261))
- **ci**: Fix semantic-release jobs; export GITLAB_TOKEN; correct changelog text ([eebc0af](https://gitlab.com/blueflyio/openstandardagents/-/commit/eebc0afba47738f92e2c380e7a89c56980f75dc9))
- **ci**: Enhance npmjs job with better messaging and environment tracking ([11ec0e2](https://gitlab.com/blueflyio/openstandardagents/-/commit/11ec0e2fc4ae8d15e245caf61591f6189c1c11da))
- **ci**: Enhance release jobs with better messaging and environments ([376e7cb](https://gitlab.com/blueflyio/openstandardagents/-/commit/376e7cbc27c25f489a717e747deca9dd4119a954))
- **cleanup**: Quarantine local markdown docs into __DELETE_LATER per policy ([25eb461](https://gitlab.com/blueflyio/openstandardagents/-/commit/25eb461f005449ae49083404df15ee9d1bfb0a40))
- Merge development to main ([5722e45](https://gitlab.com/blueflyio/openstandardagents/-/commit/5722e4547eb0f7a634f322741f262ff037987890))

- Drupal standards cleanup + minimal CI ([2760b0d](https://gitlab.com/blueflyio/openstandardagents/-/commit/2760b0dd09bd6c6333461036e7089ac8c0a2ae88))

- Update wiki submodule reference ([2c78354](https://gitlab.com/blueflyio/openstandardagents/-/commit/2c783547a27876628685ecbe9eba7978cfa2738e))

- Sync development to main ([7e319da](https://gitlab.com/blueflyio/openstandardagents/-/commit/7e319da2e5b262e9a7590910439c1db36bcebf75))

- Major project structure cleanup and organization ([426e850](https://gitlab.com/blueflyio/openstandardagents/-/commit/426e8508a75d9fc1f8313362e54a57a5431ab4a2))

- Update all public-facing links from GitLab to GitHub ([9b668aa](https://gitlab.com/blueflyio/openstandardagents/-/commit/9b668aa7539d6ed0548a61e44772926a448098ef))

- Cleanup uncommitted changes ([aa06a6a](https://gitlab.com/blueflyio/openstandardagents/-/commit/aa06a6a607e754541f2a78747890f138ceeee78c))

- Remove unnecessary files from merge ([427b1d4](https://gitlab.com/blueflyio/openstandardagents/-/commit/427b1d4b92348458cae46594495485a8948f0491))

- Add OpenAPI extensions to package exports and build ([b6a7923](https://gitlab.com/blueflyio/openstandardagents/-/commit/b6a7923944a5183ffee6ef24d59087afeffd5ada))

- Remove empty schemas/ directory (duplicate of spec/) ([5f87a49](https://gitlab.com/blueflyio/openstandardagents/-/commit/5f87a49bdab3572f3476861bfd2868a06098a231))

- Merge fix/remove-old-gitlab-urls - resolve conflicts favoring development ([b7de30f](https://gitlab.com/blueflyio/openstandardagents/-/commit/b7de30f93a77d9fc9c344793138f2cf5f4d6f0b4))

- Clean up and ensure MR ready ([3e6e9b6](https://gitlab.com/blueflyio/openstandardagents/-/commit/3e6e9b64d21b0da2e5763195446372882a71aeee))

- Remove website directory (moved to separate repo) ([f029498](https://gitlab.com/blueflyio/openstandardagents/-/commit/f029498e112109fec0f8b90487ad74109c8e2b0c))

- Merge main (v0.2.3) into development ([70a09f0](https://gitlab.com/blueflyio/openstandardagents/-/commit/70a09f076157249eaeb5d40634b35102d51309c4))

- Prepare for npm publish (v0.2.3) ([b26e85a](https://gitlab.com/blueflyio/openstandardagents/-/commit/b26e85ac9d96e745eb268fbbbf811c62711d17ef))

- Massive cleanup - remove legacy code and fix documentation ([8022c78](https://gitlab.com/blueflyio/openstandardagents/-/commit/8022c78b1ce26c68874ae5678da9b8c5d4d12646))

- Update gitignore and package-lock after npm install ([bc613f6](https://gitlab.com/blueflyio/openstandardagents/-/commit/bc613f64427c42e6e7ea82ad9816059370b27dc9))

- Merge main (v2.0.0) into development ([e2ba28b](https://gitlab.com/blueflyio/openstandardagents/-/commit/e2ba28ba4bcb01a49e0622063929cbf31f018533))

- Remove forbidden shell script and finalize website changes ([e408c2e](https://gitlab.com/blueflyio/openstandardagents/-/commit/e408c2e042526e7017cedcf642ae9e212bdbf8ed))

- Merge CI improvements ([74097a1](https://gitlab.com/blueflyio/openstandardagents/-/commit/74097a140615b2da6004fa563a53289b8f60092d))

- Update CI to use gitlab_components@v0.2.1 ([028fbe2](https://gitlab.com/blueflyio/openstandardagents/-/commit/028fbe2f8aca4b788aed1859436a89d57810a921))

- Remove README.md from examples/kagent per project policy (docs in GitLab Wiki) ([f692ea3](https://gitlab.com/blueflyio/openstandardagents/-/commit/f692ea30ca836c699ae486d19df8fec236c0be02))

- Bump version to 0.2.3 ([ddfe0c4](https://gitlab.com/blueflyio/openstandardagents/-/commit/ddfe0c416d73200270d6be143bea5c3ed63c095d))

- Migrate to GitLab Components and remove Makefiles/shell scripts ([316deb4](https://gitlab.com/blueflyio/openstandardagents/-/commit/316deb40a7af53ea45c21119b47b9b672a6632dd))

- Migrate to GitLab Components and remove Makefiles/shell scripts ([7793cc3](https://gitlab.com/blueflyio/openstandardagents/-/commit/7793cc3b851006bb458203c5306cb90aea55ae16))

- Add infrastructure ([735db0a](https://gitlab.com/blueflyio/openstandardagents/-/commit/735db0a7073b4932c619b6500b4e5f7ee8f217e8))

- Deploy standardized lefthook configuration and enforce GitLab-first workflow ([3d053ae](https://gitlab.com/blueflyio/openstandardagents/-/commit/3d053ae5fa2cbe4508b0434b993227e6d6d1c292))

- Ignore worktrees and demo directories ([54fca29](https://gitlab.com/blueflyio/openstandardagents/-/commit/54fca2969ed50996b7c9b70528f241aace737522))

- Remove __DELETE_LATER from tracking and update .gitignore ([9d65295](https://gitlab.com/blueflyio/openstandardagents/-/commit/9d6529545848cc5fba400e1c411e713a165fe8d5))

- Remove .gitlab folder from git tracking ([50b0b73](https://gitlab.com/blueflyio/openstandardagents/-/commit/50b0b731222ad185b18deaa39527dd7fcda82ef8))

- Add OpenAPI extensions to package exports and build ([fb13e66](https://gitlab.com/blueflyio/openstandardagents/-/commit/fb13e6675c6166ed66b1456204904efb1dc73034))

- Remove empty schemas/ directory (duplicate of spec/) ([7ae0925](https://gitlab.com/blueflyio/openstandardagents/-/commit/7ae0925bbb593946e7e07b6dd37bbbd3f8b40646))

- Clean up OSSA for npm publication ([f6d2c27](https://gitlab.com/blueflyio/openstandardagents/-/commit/f6d2c27b3ac972cf065bfe4d67cf1d9e51f47b51))

- Sync latest changes ([082166f](https://gitlab.com/blueflyio/openstandardagents/-/commit/082166f546c6ed72da26d5db79664139ac937a2c))

- Cleanup documentation and add examples ([9a17629](https://gitlab.com/blueflyio/openstandardagents/-/commit/9a176296c1fd68507708f27578e6001fe6e06463))

- Clean up markdown files and organize tools ([c4cd165](https://gitlab.com/blueflyio/openstandardagents/-/commit/c4cd16553e81dc08a3f1e3923e6eaa1cd62ae8eb))

- Trigger CI pipeline ([ca8f383](https://gitlab.com/blueflyio/openstandardagents/-/commit/ca8f3839fe91c5343a0e5149239c8e6effeca27e))

- Trigger CI pipeline ([fc97a2b](https://gitlab.com/blueflyio/openstandardagents/-/commit/fc97a2b9884e7ca60087506497ef978bbda706f3))

- Remove temp scripts and text files ([b314676](https://gitlab.com/blueflyio/openstandardagents/-/commit/b31467661502693c48d4d5287efda0cba9b909c3))

- Sync changes from agent development ([9661c5a](https://gitlab.com/blueflyio/openstandardagents/-/commit/9661c5a2a22da91ea2e36964a8896a6a11c904db))

- Trigger CI pipeline ([968a1f2](https://gitlab.com/blueflyio/openstandardagents/-/commit/968a1f268935442fb4a60e4d5e7ae1d85959c154))

- Sync latest changes ([905e4c9](https://gitlab.com/blueflyio/openstandardagents/-/commit/905e4c9f8d03b633ce3de71ce565fa51fa47eced))

- Cleanup failed agent experiments ([ea3e3b3](https://gitlab.com/blueflyio/openstandardagents/-/commit/ea3e3b3dd5572ac7b2d90f237f9cb291008abf2c))

- Remove markdown dumps per governance rules ([594e77f](https://gitlab.com/blueflyio/openstandardagents/-/commit/594e77f574b56a6153db207ab435a250b5cfe2f1))

- Add ecosystem cleanup orchestrator and health scan ([aedbf5b](https://gitlab.com/blueflyio/openstandardagents/-/commit/aedbf5b1d8bf68a79203bf8ddce1a439b8651351))

- Remove temp scripts and text files ([80a2e88](https://gitlab.com/blueflyio/openstandardagents/-/commit/80a2e8892ea0d9e6ce1241fdf4e243b6575a85ed))

- Sync changes from agent development ([197286d](https://gitlab.com/blueflyio/openstandardagents/-/commit/197286dc81127d35984138337acff8a6d37dcaea))

- Trigger CI pipeline ([ace1aaf](https://gitlab.com/blueflyio/openstandardagents/-/commit/ace1aaf4d9c18bf1a571c926a044aeef666ec243))

- Sync latest changes ([4c974a9](https://gitlab.com/blueflyio/openstandardagents/-/commit/4c974a9833a3c83de318ee21218dc101d5b7596d))

- Remove shell script ([e919147](https://gitlab.com/blueflyio/openstandardagents/-/commit/e919147b92b83ce929567ea4bd30f24cd6eb2b9b))

- Remove docs-to-migrate folder ([83bcfeb](https://gitlab.com/blueflyio/openstandardagents/-/commit/83bcfeb03dd8cc4b979f284ec0d82c30812dbeea))

- Clean up root directory ([8a9d2fb](https://gitlab.com/blueflyio/openstandardagents/-/commit/8a9d2fbf36d0794756235071e0937d3df6f1c2ef))

- Sync local changes ([b750d0b](https://gitlab.com/blueflyio/openstandardagents/-/commit/b750d0b4335aacde96b43f7c0619dda403bdb5f4))

- Add .claude-agents/ to gitignore to prevent IDE-specific agent definitions ([56d4ebd](https://gitlab.com/blueflyio/openstandardagents/-/commit/56d4ebd29a198f1fb211bdb131db806ecbf17930))

- Resolve main merge conflicts - keep v0.2.0 changes ([1642d92](https://gitlab.com/blueflyio/openstandardagents/-/commit/1642d92c44c128f38d3bce03dc2ac0faff25a608))

- Resolve merge conflicts for v0.2.0 release ([c1c338e](https://gitlab.com/blueflyio/openstandardagents/-/commit/c1c338ec07a4cf8b96a72a01fbab1fe69009b303))

- Release v0.2.0 - major consolidation and standards compliance ([70bddf8](https://gitlab.com/blueflyio/openstandardagents/-/commit/70bddf8b45888cf1856538a3b87e609b746a8d7b))

- Clean up root directory - remove emojis, backups, and reorganize files ([27e2fd1](https://gitlab.com/blueflyio/openstandardagents/-/commit/27e2fd1aba2419c9034d1d582537b265c998b6c8))

- Update package-lock after npm install ([85361ed](https://gitlab.com/blueflyio/openstandardagents/-/commit/85361edd5fc4145d933d0dd75ebc390ac2eab4de))

- Clean up unused GitLab CI files ([26931d3](https://gitlab.com/blueflyio/openstandardagents/-/commit/26931d3f2afac3bca82f0891e8f4d8e61762eea1))

### Security

- Complete OSSA implementation before standard separation ([deec80e](https://gitlab.com/blueflyio/openstandardagents/-/commit/deec80eb79ed25c19fb4796c6a2549f037e4b7e9))
---
Generated by [git-cliff](https://git-cliff.org/)
