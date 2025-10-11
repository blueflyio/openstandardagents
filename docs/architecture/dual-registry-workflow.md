# OSSA Dual Registry Publishing Workflow

##  Overview

OSSA uses a dual registry publishing strategy:
- **Development versions** → `https://gitlab.bluefly.io/api/v4/projects/1553/packages/npm/` (GitLab Package Registry)
- **Production releases** → `https://www.npmjs.com/` (public registry via CI)

##  Registry Configuration

### Package Configuration (`package.json`)
```json
{
  "publishConfig": {
    "registry": "https://gitlab.bluefly.io/api/v4/projects/1553/packages/npm/"
  },
  "scripts": {
    "publish:private": "npm publish --registry https://gitlab.bluefly.io/api/v4/projects/1553/packages/npm/",
    "publish:public": "npm publish --registry https://registry.npmjs.org/",
    "publish:safe": "npm run publish:private"
  }
}
```

### Available Commands
- `npm run publish:private` - Publish to Bluefly private registry
- `npm run publish:public` - Publish to npmjs.org public registry  
- `npm run publish:safe` - Safe publish (defaults to private registry)

##  Publishing Workflows

### 1. Development Publishing (Manual)

For development versions like `0.1.8`, `0.1.9-alpha`, etc.:

```bash
# Authenticate to private registry (one-time setup)
npm adduser --registry https://npm.bluefly.io/

# Publish development version
npm run publish:private
```

**Result**: Package available at `https://npm.bluefly.io/@bluefly/open-standards-scalable-agents`

### 2. Production Publishing (Automated via CI)

For production releases when code is merged to `main`:

```bash
# Create and push tag on main branch
git checkout main
git pull origin main
git tag -a 0.1.9 -m "OSSA 0.1.9 production release"
git push origin 0.1.9
```

**GitLab CI Process**:
1. Tag detected on `main` branch
2. Manual approval required for public registry
3. Publishes to `https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents`

##  CI/CD Configuration

### GitLab CI Publishing Jobs

```yaml
# Private Registry (Automatic for any tagged branch except main)
publish:private:
  stage: publish
  script:
    - npm run publish:private
  rules:
    - if: $CI_COMMIT_TAG && $CI_COMMIT_REF_NAME != "main"

# Public Registry (Manual approval for main branch tags)
publish:public:
  stage: publish
  script:
    - npm run publish:public
  rules:
    - if: $CI_COMMIT_TAG && $CI_COMMIT_REF_NAME == "main"
  when: manual
```

### Environment Variables Required
- `NPM_TOKEN` - npmjs.org authentication token (set in GitLab CI/CD variables)

## 📋 Publishing Checklist

### Before Publishing Development Version
- [ ] Version updated in `package.json`
- [ ] CHANGELOG.md updated with changes
- [ ] All tests passing (`npm test`)
- [ ] Clean build successful (`npm run build`)
- [ ] Authenticated to private registry (`npm whoami --registry https://npm.bluefly.io/`)

### Before Production Release
- [ ] Code merged to `main` branch
- [ ] All CI checks passing
- [ ] Production testing completed
- [ ] Release notes prepared
- [ ] NPM_TOKEN configured in GitLab CI

## 🛠 Manual Authentication Setup

### GitLab Package Registry
```bash
# Create GitLab Personal Access Token at:
# https://gitlab.bluefly.io/-/profile/personal_access_tokens
# (requires 'api' or 'write_repository' scope)

# Configure npm with token
npm config set @bluefly:registry https://gitlab.bluefly.io/api/v4/projects/1553/packages/npm/
npm config set //gitlab.bluefly.io/api/v4/projects/1553/packages/npm/:_authToken <YOUR_GITLAB_TOKEN>

# Or create .npmrc file:
cp .npmrc.example .npmrc
# Edit .npmrc and replace <YOUR_GITLAB_TOKEN>

# Verify authentication
npm whoami --registry https://gitlab.bluefly.io/api/v4/projects/1553/packages/npm/
```

### Public Registry (npmjs.org)
```bash
# Login to public registry  
npm adduser --registry https://registry.npmjs.org/

# Verify authentication
npm whoami --registry https://registry.npmjs.org/
```

##  Current Status

| Version | Registry | Status | URL |
|---------|----------|--------|-----|
| 0.1.7 | npmjs.org |  Published | https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents |
| 0.1.8 | npm.bluefly.io |  Ready to publish | Awaiting authentication |

##  Troubleshooting

### Authentication Issues
```bash
# Clear npm cache and re-authenticate
npm cache clean --force
npm adduser --registry https://npm.bluefly.io/
```

### Registry Switching
```bash
# Temporary registry override
npm publish --registry https://npm.bluefly.io/

# Check current registry
npm config get registry

# Reset to default
npm config delete registry
```

### Version Conflicts
```bash
# Check existing versions
npm view @bluefly/open-standards-scalable-agents versions --registry https://npm.bluefly.io/
npm view @bluefly/open-standards-scalable-agents versions --registry https://registry.npmjs.org/
```

## 📈 Usage for Consumers

### Installing from Private Registry
```bash
# Install from private registry
npm install @bluefly/open-standards-scalable-agents --registry https://npm.bluefly.io/

# Or set registry for @bluefly scope
npm config set @bluefly:registry https://npm.bluefly.io/
npm install @bluefly/open-standards-scalable-agents
```

### Installing from Public Registry
```bash
# Install from public registry (default)
npm install @bluefly/open-standards-scalable-agents
```

---

##  Next Steps

1. **Authenticate to private registry**: `npm adduser --registry https://npm.bluefly.io/`
2. **Publish 0.1.8**: `npm run publish:private`
3. **Set up GitLab NPM_TOKEN** for automated public publishing
4. **Create main branch tag** when ready for public release

This dual registry approach provides controlled development iteration while maintaining stable public releases.