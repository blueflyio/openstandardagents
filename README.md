# openstandardagents.org

Official website and community platform for **OSSA** (Open Standard for Scalable AI Agents).

## 🌐 Live Site

- **Production**: https://openstandardagents.org
- **Staging**: https://staging.openstandardagents.org
- **GitLab Pages**: https://blueflyio.gitlab.io/openstandardagents.org

## 📦 What's Inside

This monorepo contains:

- **Website** (`website/`) - Next.js static site for OSSA documentation and community
- **Discord Bot** (`discord-bot/`) - Community Discord integration
- **Scripts** (`scripts/`) - Automation tools (spec sync, etc.)

## 🚀 Quick Start

```bash
# Clone repository
git clone https://gitlab.com/blueflyio/openstandardagents.org.git
cd openstandardagents.org

# Install dependencies
pnpm install

# Sync OSSA spec and examples
pnpm sync:spec

# Start development
pnpm website:dev
```

## 🔄 OSSA Spec Sync

The website automatically syncs the latest OSSA schema and examples from the `@bluefly/openstandardagents` npm package.

### Sync Commands

```bash
pnpm sync:spec              # Sync schema + examples
pnpm sync:schema            # Schema only
pnpm sync:examples          # Examples only
pnpm sync:spec --dry-run    # Preview changes
```

### What Gets Synced

```
@bluefly/openstandardagents package
├── spec/ → website/public/schemas/
│   ├── v0.3.3/              # Latest version with Skills extension
│   │   └── ossa-0.3.3.schema.json
│   ├── v0.3.2/
│   │   └── ossa-0.3.2.schema.json
│   ├── latest.json          # Points to v0.3.3
│   └── index.json
│
└── examples/ → website/public/examples/
    ├── agent-manifests/
    ├── bridges/
    ├── drupal/
    └── index.json
```

**See [SYNC_ARCHITECTURE.md](SYNC_ARCHITECTURE.md) for full details.**

## 📚 Documentation

- [SYNC_ARCHITECTURE.md](SYNC_ARCHITECTURE.md) - Spec sync architecture and design decisions
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Quick integration guide for developers
- [scripts/README.md](scripts/README.md) - Scripts documentation
- [OSSA Specification](https://openstandardagents.org) - Official OSSA spec site

## 🛠️ Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Available Scripts

```bash
# Development
pnpm dev                    # Start all workspaces
pnpm website:dev            # Website only
pnpm bot:dev                # Discord bot only

# Building
pnpm build                  # Build all workspaces
pnpm website:build          # Website only

# Testing
pnpm test                   # Run all tests
pnpm lint                   # Lint all workspaces

# Sync
pnpm sync:spec              # Sync OSSA spec and examples
```

### Project Structure

```
openstandardagents.org/
├── .github/
│   └── workflows/          # GitHub Actions (if mirrored)
├── .gitlab/
│   └── issue_templates/    # GitLab issue templates
├── scripts/
│   └── sync-spec.ts        # OSSA spec sync script
├── website/                # Next.js website (workspace)
│   ├── public/
│   │   ├── schema/         # Synced from @bluefly/openstandardagents
│   │   └── examples/       # Synced from @bluefly/openstandardagents
│   ├── src/
│   └── package.json
├── discord-bot/            # Discord bot (workspace)
│   └── package.json
├── package.json            # Monorepo root
├── pnpm-workspace.yaml
├── .gitlab-ci.yml          # CI/CD pipeline
└── README.md
```

## 🔧 Configuration

### Environment Variables

```bash
# Website (.env.local)
NEXT_PUBLIC_OSSA_VERSION=0.3.2
NEXT_PUBLIC_API_URL=https://api.openstandardagents.org

# Discord Bot (.env.local)
DISCORD_BOT_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id
```

### Package Management

This project uses **pnpm workspaces**. Install dependencies with:

```bash
pnpm install                # Install all workspaces
pnpm --filter website add X # Add dependency to website
pnpm --filter discord-bot add X # Add dependency to bot
```

## 🚢 Deployment

### GitLab CI/CD (Primary)

Automatic deployment on push to `main` or `development`:

```yaml
stages:
  - validate  # Lint and validate
  - build     # Sync spec + build
  - test      # Run tests
  - deploy    # Deploy to GitLab Pages / production
```

**Pipeline includes:**
1. ✅ Lint validation
2. 🔄 OSSA spec sync (`pnpm sync:spec`)
3. 🏗️ Website build
4. 🧪 Tests
5. 🚀 Deployment

### GitHub Actions (Alternative)

If mirrored to GitHub, uses `.github/workflows/sync-and-deploy.yml`:

- Syncs OSSA spec
- Builds website
- Deploys to GitHub Pages

## 📖 API Endpoints

After deployment, these static endpoints are available:

### Schema API

- `GET /schema/latest.json` - Latest OSSA schema
- `GET /schema/index.json` - List of all schema versions
- `GET /schema/v{version}/ossa-{version}.schema.json` - Specific version

### Examples API

- `GET /examples/index.json` - Examples catalog
- `GET /examples/{category}/{file}` - Specific example file

## 🔄 Updating OSSA Version

```bash
# Update to latest
cd website
pnpm update @bluefly/openstandardagents
pnpm sync:spec

# Update to specific version
pnpm add @bluefly/openstandardagents@0.3.2
pnpm sync:spec

# Commit and deploy
git add package.json pnpm-lock.yaml
git commit -m "chore: update OSSA to v0.3.2"
git push
```

## 🤝 Contributing

1. Create GitLab issue describing your change
2. Create branch from `development`: `git checkout -b feature/your-feature development`
3. Make changes and commit
4. Push and create merge request to `development`
5. Wait for CI/CD to pass
6. Request review

### Commit Convention

```bash
feat: add new feature
fix: fix bug
docs: update documentation
chore: update dependencies
ci: update CI/CD
test: add tests
```

## 📊 CI/CD Status

[![Pipeline](https://gitlab.com/blueflyio/openstandardagents.org/badges/main/pipeline.svg)](https://gitlab.com/blueflyio/openstandardagents.org/-/pipelines)
[![Coverage](https://gitlab.com/blueflyio/openstandardagents.org/badges/main/coverage.svg)](https://gitlab.com/blueflyio/openstandardagents.org/-/pipelines)

## 📝 License

Apache-2.0 - See [LICENSE](LICENSE) for details.

## 🔗 Links

- **OSSA Spec**: https://openstandardagents.org
- **npm Package**: [@bluefly/openstandardagents](https://www.npmjs.com/package/@bluefly/openstandardagents)
- **GitLab**: https://gitlab.com/blueflyio/openstandardagents.org
- **Issues**: https://gitlab.com/blueflyio/openstandardagents.org/-/issues
- **Discord**: https://discord.gg/openstandardagents (coming soon)

## 🛟 Support

- **Issues**: [GitLab Issues](https://gitlab.com/blueflyio/openstandardagents.org/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/blueflyio/openstandardagents.org/-/issues)
- **Email**: support@openstandardagents.org

---

**Maintained by BlueFly.io** | **OSSA v0.3.3** | **Last Updated: 2025-01-05**
