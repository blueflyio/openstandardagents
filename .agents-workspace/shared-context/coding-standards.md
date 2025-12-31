# OSSA Coding Standards

Global conventions for all agents in this workspace.

## TypeScript/JavaScript

- Use strict TypeScript (`"strict": true`)
- Prefer `const` over `let`, never use `var`
- Use explicit return types on functions
- Use dependency injection (Inversify)
- Follow ESLint rules (run `npm run lint`)

## Code Style

```typescript
// Good: Explicit types, const, named exports
export const processAgent = async (manifest: OssaManifest): Promise<Result> => {
  const validated = await validateManifest(manifest);
  return { success: true, data: validated };
};

// Bad: Implicit types, let, default exports
export default async function(m) {
  let v = await validateManifest(m);
  return { success: true, data: v };
}
```

## YAML Manifests

- Use 2-space indentation
- Quote strings with special characters
- Use explicit types for ambiguous values
- Include `apiVersion` and `kind` as first fields

```yaml
# Good
apiVersion: ossa.dev/v1
kind: Agent
metadata:
  name: my-agent
  version: "1.0.0"

# Bad (missing apiVersion, unquoted version)
kind: Agent
metadata:
  name: my-agent
  version: 1.0.0
```

## Testing

- Write tests for all new functionality
- Use descriptive test names (`should_return_error_when_manifest_invalid`)
- Mock external services
- Achieve >80% coverage on new code

## Documentation

- Update AGENTS.md for capability changes
- Keep manifests in sync with actual agent capabilities
- Use JSDoc for public APIs
