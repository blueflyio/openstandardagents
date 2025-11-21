# OSSA Build Agent

## Purpose

Builds and packages OSSA projects for deployment. Handles TypeScript compilation, asset copying, and package creation.

## Capabilities

- **TypeScript Compilation** - Compiles TypeScript to JavaScript with type validation
- **Asset Management** - Copies schemas, docs, and configs to dist/
- **Package Creation** - Creates npm packages from build artifacts
- **Build Validation** - Validates build artifacts are complete and correct

## Usage

### In GitLab CI

```yaml
build:dist:
  script:
    - ossa run .gitlab/agents/build-agent/agent.ossa.yaml
```

### Standalone

```bash
ossa run .gitlab/agents/build-agent/agent.ossa.yaml --tool compile_typescript
```

## Tools

- `compile_typescript` - Compiles TypeScript source files
- `copy_assets` - Copies non-code assets to dist/
- `create_package` - Creates npm package tarball
- `validate_build` - Validates build artifacts

## Configuration

- **LLM**: OpenAI GPT-4 Turbo
- **State**: Stateless
- **Resources**: 2000m CPU, 2Gi memory
- **Performance**: Max 600s latency (for long builds)

## Related

- [Build Process](../../../.gitlab-ci.yml)
- [TypeScript Config](../../../tsconfig.json)

