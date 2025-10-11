# OSSA Project Structure

## Directory Layout

```
OSSA/
├── .agents/              # Agent definitions and configurations
├── .buildkit/            # BuildKit configurations
├── .gitlab/              # GitLab CI/CD templates
├── dist/                 # Compiled TypeScript output
├── docs/                 # Documentation
│   ├── api/              # API documentation
│   ├── architecture/     # Architecture decisions
│   ├── governance/       # Governance documentation
│   ├── guides/           # User and developer guides
│   ├── roadmap/          # Roadmap specifications
│   └── specification/    # OSSA specification docs
├── examples/             # Usage examples
├── infrastructure/       # Infrastructure configurations
│   ├── docker/           # Docker configurations
│   ├── kubernetes/       # Kubernetes manifests
│   └── monitoring/       # Monitoring configs
├── public/               # Static files for web
│   ├── assets/           # CSS, images, fonts
│   └── docs/             # Generated documentation
├── scripts/              # Utility scripts
│   ├── deployment/       # Deployment scripts
│   ├── docs/             # Documentation scripts
│   ├── federation/       # Federation scripts
│   └── validation/       # Validation scripts
├── specs/                # OpenAPI specifications
├── src/                  # Source code
│   ├── adk/              # Agent Development Kit
│   ├── api/              # API implementations
│   ├── cli/              # CLI commands
│   ├── core/             # Core functionality
│   ├── mcp/              # Model Context Protocol
│   ├── protocols/        # Protocol definitions
│   ├── server/           # Server implementations
│   ├── services/         # Service layer
│   ├── specification/    # Specification engine
│   └── types/            # TypeScript types
└── tests/                # Test files

## Key Files

- `.gitlab-ci.yml` - GitLab CI/CD pipeline configuration
- `.redocly.yaml` - Redocly API documentation config
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - Docker services configuration
- `ROADMAP.md` - Project roadmap
- `README.md` - Project documentation

## Naming Conventions

### Branches
- `development` - Main development branch
- `feature/*` - Feature branches
- `bug/*` - Bug fix branches
- `hotfix/*` - Emergency fixes
- `chore/*` - Maintenance tasks

### Files
- OpenAPI specs: `*.openapi.yml`
- TypeScript: `*.ts`
- Documentation: `*.md`
- Configuration: `*.json`, `*.yaml`, `*.yml`

## Development Workflow

1. Branch from `development`
2. Make changes following TDD
3. Run tests: `npm test`
4. Validate specs: `npm run api:validate`
5. Build: `npm run build`
6. Push and create MR

## CI/CD Pipeline

The GitLab CI/CD pipeline includes:
- Linting and validation
- Unit and integration tests
- API documentation generation
- Docker image building
- GitLab Pages deployment
- Release management

## Environment Variables

See `.env.example` for required environment variables.

## Scripts

Key npm scripts:
- `npm run build` - Build TypeScript
- `npm run test` - Run tests
- `npm run api:validate` - Validate OpenAPI specs
- `npm run api:docs` - Generate API documentation
- `npm run serve` - Start development server