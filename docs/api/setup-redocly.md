# OSSA API Documentation Setup

## Modern API Documentation with Redocly

### Quick Start

```bash
# Install Redocly CLI
npm install -g @redocly/cli

# Install in project
npm install --save-dev @redocly/cli

# Preview API docs locally
npx @redocly/cli preview-docs src/api/ossa-complete.openapi.yml

# Build static docs
npx @redocly/cli build-docs src/api/ossa-complete.openapi.yml --output=dist/api-docs.html

# Lint API specifications
npx @redocly/cli lint src/api/*.yml
```

### Development Server

Run the Redocly development server for live API documentation:

```bash
# Start dev server on port 8080
npx @redocly/cli preview-docs src/api/specification.openapi.yml --port 8080

# Or use Docker
docker run -p 8080:80 \
  -v $(pwd)/src/api:/spec \
  redocly/redoc \
  -spec /spec/ossa-complete.openapi.yml
```

### Access Points

- **Local Development**: http://localhost:8080
- **Docker Compose**: http://localhost:8081 (configured in infrastructure/docker/docker-compose.openapi.yml)

### Available API Specifications

1. **OSSA Complete** - `src/api/ossa-complete.openapi.yml`
2. **Core Specification** - `src/api/specification.openapi.yml`
3. **ACDL** - `src/api/acdl-specification.yml`
4. **Clean Architecture** - `src/api/clean-architecture.openapi.yml`
5. **MCP Infrastructure** - `src/api/mcp-infrastructure.openapi.yml`
6. **Orchestration** - `src/api/orchestration.openapi.yml`

### Features

- **Try It Out** - Interactive API testing
- **Code Samples** - Multiple languages
- **Search** - Full-text search
- **Download OpenAPI** - Export specification
- **Dark Mode** - Theme switching
- **Responsive** - Mobile-friendly

### Integration with Docker

The API docs are already integrated in our Docker setup:

```bash
cd infrastructure/docker
docker-compose -f docker-compose.openapi.yml up redocly
```

This serves the API documentation on port 8081 with hot-reload.
