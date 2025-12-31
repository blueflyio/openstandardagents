# OSSA Security Guidelines

Security best practices for all agents in this workspace.

## Secrets Management

### Never Commit
- API keys
- Tokens (GitLab, GitHub, OpenAI, etc.)
- Private keys (.key, .pem)
- .env files with real values
- Credentials in any format

### Use Environment Variables
```bash
# Good: Use env vars
OSSA_API_KEY=${OSSA_API_KEY}

# Bad: Hardcoded
OSSA_API_KEY=sk-abc123...
```

### Token Storage
All tokens should be stored in `~/.tokens/`:
- `~/.tokens/gitlab` - GitLab PAT
- `~/.tokens/openai` - OpenAI API key
- `~/.tokens/anthropic` - Anthropic API key

## MCP Security

### Allowlist Only
Only use MCP servers listed in workspace policy:
- `filesystem` - File operations (scoped directories)
- `memory` - Knowledge graph persistence
- `git` - Git operations (read-only default)

### Denied Patterns
- `*shell*` - No direct shell access
- `*execute*` - No arbitrary execution
- `*eval*` - No dynamic code evaluation

## Input Validation

### Always Validate
- User inputs
- API responses
- File contents
- Configuration values

### Use Zod Schemas
```typescript
const InputSchema = z.object({
  path: z.string().regex(/^\.\/src\//),
  action: z.enum(['read', 'write', 'delete']),
});

const validated = InputSchema.parse(input);
```

## OWASP Top 10 Awareness

1. **Injection** - Validate all inputs
2. **Broken Authentication** - Use OAuth 2.1
3. **Sensitive Data Exposure** - Encrypt at rest
4. **XXE** - Disable external entities
5. **Broken Access Control** - Enforce boundaries
6. **Security Misconfiguration** - Use secure defaults
7. **XSS** - Sanitize outputs
8. **Insecure Deserialization** - Validate schemas
9. **Known Vulnerabilities** - Update dependencies
10. **Insufficient Logging** - Audit all operations

## Audit Requirements

| Risk Tier | Audit Level | Retention |
|-----------|-------------|-----------|
| High | Full trace | 90 days |
| Medium | Summary | 30 days |
| Low | None | 7 days |
