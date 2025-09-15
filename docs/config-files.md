{
  "name": "@ossa/mcp-server",
  "version": "1.0.0",
  "description": "OSSA MCP Server for Claude Desktop - Complete agent development integration",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "package": "npm run build && pkg . --targets node18-macos-x64,node18-win-x64,node18-linux-x64",
    "docker:build": "docker build -t ossa-mcp-server .",
    "docker:run": "docker run -p 3000:3000 ossa-mcp-server"
  },
  "keywords": [
    "ossa",
    "mcp",
    "claude",
    "ai-agents",
    "orchestration",
    "gitlab",
    "drupal",
    "bluefly"
  ],
  "author": "Bluefly.io <support@bluefly.io>",
  "license": "Apache-2.0",
  "dependencies": {
    "@modelcontextprotocol/server": "^0.1.0",
    "@modelcontextprotocol/transport-sse": "^0.1.0",
    "@ossa/core": "^1.0.0",
    "@ossa/voice": "^1.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "uuid": "^9.0.1",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "node-cache": "^5.1.2",
    "p-queue": "^7.4.1",
    "chokidar": "^3.5.3",
    "yaml": "^2.3.4",
    "semver": "^7.5.4",
    "@octokit/rest": "^20.0.2",
    "@gitlab/node": "^3.0.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/ws": "^8.5.10",
    "@types/uuid": "^9.0.7",
    "@types/jest": "^29.5.11",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3",
    "pkg": "^5.8.1"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": [
      "<rootDir>/src",
      "<rootDir>/tests"
    ],
    "testMatch": [
      "**/__tests__/**/*.ts",
      "**/?(*.)+(spec|test).ts"
    ],
    "transform": {
      "^.+\\.ts$": "ts-jest"
    },
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts"
    ]
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/bluefly-io/ossa-claude-desktop.git"
  },
  "bugs": {
    "url": "https://github.com/bluefly-io/ossa-claude-desktop/issues"
  },
  "homepage": "https://ossa.dev"
}

---

# tsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "types": ["node", "jest", "express"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests",
    "**/*.spec.ts",
    "**/*.test.ts"
  ]
}

---

# .env.example

# OSSA MCP Server Configuration
OSSA_MODE=development
OSSA_PROJECT_ROOT=/path/to/your/project
OSSA_SCHEMA_VERSION=1.0.0
OSSA_REGISTRY=https://registry.ossa.dev

# Server Configuration
MCP_PORT=3000
HEALTH_PORT=3001
WS_PORT=3002

# GitLab Configuration
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your-gitlab-token
GITLAB_PROJECT_ID=your-project-id

# GitHub Configuration (optional)
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo

# Agent Configuration
AGENT_DEFAULT_TIMEOUT=30
AGENT_MAX_RETRIES=3
AGENT_HEALTH_INTERVAL=60

# Security
SIGNING_KEY=your-signing-key
ENCRYPTION_KEY=your-encryption-key

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
ENABLE_TRACING=false
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Development
DEBUG=ossa:*
LOG_LEVEL=debug
PRETTY_LOGS=true

---

# Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose ports
EXPOSE 3000 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the server
CMD ["node", "dist/index.js"]

---

# docker-compose.yml

version: '3.8'

services:
  ossa-mcp-server:
    build: .
    container_name: ossa-mcp-server
    ports:
      - "3000:3000"  # MCP SSE endpoint
      - "3001:3001"  # Health endpoint
      - "3002:3002"  # WebSocket endpoint
      - "9090:9090"  # Metrics endpoint
    environment:
      - OSSA_MODE=production
      - OSSA_PROJECT_ROOT=/workspace
      - NODE_ENV=production
    volumes:
      - ./workspace:/workspace
      - ./config:/app/config
    networks:
      - ossa-network
    restart: unless-stopped

  gitlab-runner:
    image: gitlab/gitlab-runner:latest
    container_name: ossa-gitlab-runner
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - gitlab-runner-config:/etc/gitlab-runner
    networks:
      - ossa-network
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: ossa-prometheus
    ports:
      - "9091:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - ossa-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: ossa-grafana
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=redis-datasource
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - ossa-network
    restart: unless-stopped

networks:
  ossa-network:
    driver: bridge

volumes:
  gitlab-runner-config:
  prometheus-data:
  grafana-data:

---

# .gitlab-ci.yml

stages:
  - validate
  - build
  - test
  - security
  - package
  - deploy

variables:
  OSSA_VERSION: "1.0.0"
  NODE_VERSION: "20"
  DOCKER_REGISTRY: "registry.gitlab.com"
  IMAGE_NAME: "$CI_PROJECT_PATH/ossa-mcp-server"

# Cache node_modules across jobs
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

before_script:
  - npm ci --cache .npm --prefer-offline

# Validation Stage
validate:schema:
  stage: validate
  image: node:${NODE_VERSION}
  script:
    - npm run lint
    - npx ossa validate schema --strict
  only:
    changes:
      - src/schemas/**/*
      - "*.json"

validate:typescript:
  stage: validate
  image: node:${NODE_VERSION}
  script:
    - npx tsc --noEmit
  only:
    changes:
      - src/**/*.ts
      - tsconfig.json

# Build Stage
build:application:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm run build
    - npm run test:coverage
  artifacts:
    paths:
      - dist/
      - coverage/
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    expire_in: 1 week

build:docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${CI_COMMIT_SHA} .
    - docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${CI_COMMIT_SHA} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
  only:
    - main
    - tags

# Test Stage
test:unit:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm test
  coverage: '/Lines\s+:\s+(\d+\.\d+)%/'

test:integration:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - postgres:14
    - redis:7
  variables:
    POSTGRES_DB: ossa_test
    POSTGRES_USER: ossa
    POSTGRES_PASSWORD: test123
    REDIS_HOST: redis
  script:
    - npm run test:integration

test:e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  script:
    - npm ci
    - npm run build
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/
    expire_in: 1 week

# Security Stage
security:dependencies:
  stage: security
  image: node:${NODE_VERSION}
  script:
    - npm audit --production
  allow_failure: true

security:secrets:
  stage: security
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog filesystem . --json --fail --no-update
  allow_failure: true

security:sast:
  stage: security
  image: returntocorp/semgrep:latest
  script:
    - semgrep --config=auto --json --output=sast-report.json .
  artifacts:
    reports:
      sast: sast-report.json
  allow_failure: true

# Package Stage
package:npm:
  stage: package
  image: node:${NODE_VERSION}
  script:
    - npm version ${CI_COMMIT_TAG:-patch}
    - npm pack
  artifacts:
    paths:
      - "*.tgz"
    expire_in: 1 month
  only:
    - tags

package:binaries:
  stage: package
  image: node:${NODE_VERSION}
  script:
    - npm run package
  artifacts:
    paths:
      - binaries/
    expire_in: 1 month
  only:
    - tags

package:extension:
  stage: package
  image: node:${NODE_VERSION}
  script:
    - cd extension
    - npm run build
    - npm run package
  artifacts:
    paths:
      - extension/build/*.dxt
    expire_in: 1 month
  only:
    - tags

# Deploy Stage
deploy:npm:
  stage: deploy
  image: node:${NODE_VERSION}
  script:
    - echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
    - npm publish --access public
  only:
    - tags
  when: manual

deploy:docker:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${CI_COMMIT_SHA}
    - docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
  only:
    - main
    - tags

deploy:github-release:
  stage: deploy
  image: golang:latest
  script:
    - go install github.com/github-release/github-release@latest
    - |
      github-release release \
        --user bluefly-io \
        --repo ossa-claude-desktop \
        --tag ${CI_COMMIT_TAG} \
        --name "OSSA MCP Server ${CI_COMMIT_TAG}" \
        --description "Release ${CI_COMMIT_TAG}"
    - |
      for file in extension/build/*.dxt binaries/*; do
        github-release upload \
          --user bluefly-io \
          --repo ossa-claude-desktop \
          --tag ${CI_COMMIT_TAG} \
          --name $(basename $file) \
          --file $file
      done
  only:
    - tags
  when: manual

# Notification job
notify:slack:
  stage: .post
  image: appropriate/curl:latest
  script:
    - |
      curl -X POST ${SLACK_WEBHOOK_URL} \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"Pipeline ${CI_PIPELINE_STATUS} for ${CI_PROJECT_NAME} - ${CI_COMMIT_REF_NAME}\"}"
  when: always
  only:
    variables:
      - $SLACK_WEBHOOK_URL

---

# README.md

# OSSA MCP Server for Claude Desktop

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![CI/CD](https://gitlab.com/bluefly-io/ossa-claude-desktop/badges/main/pipeline.svg)](https://gitlab.com/bluefly-io/ossa-claude-desktop/-/pipelines)
[![Coverage](https://gitlab.com/bluefly-io/ossa-claude-desktop/badges/main/coverage.svg)](https://gitlab.com/bluefly-io/ossa-claude-desktop/-/graphs/main/charts)
[![npm version](https://badge.fury.io/js/%40ossa%2Fmcp-server.svg)](https://www.npmjs.com/package/@ossa/mcp-server)

Complete OSSA (Open Standard for Structured Agents) integration for Claude Desktop using the Model Context Protocol (MCP).

## 🚀 Quick Start

### Install via Claude Desktop Extension (Recommended)

1. Download the latest `.dxt` file from [Releases](https://github.com/bluefly-io/ossa-claude-desktop/releases)
2. Open Claude Desktop
3. Go to Settings → Extensions → Install Extension
4. Select the downloaded `ossa.dxt` file
5. Restart Claude Desktop

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/bluefly-io/ossa-claude-desktop
cd ossa-claude-desktop

# Install dependencies
npm install

# Build the project
npm run build

# Start the MCP server
npm start
```

Then add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "ossa": {
      "command": "node",
      "args": ["/path/to/ossa-claude-desktop/dist/index.js"],
      "env": {
        "OSSA_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

## 📚 Documentation

Full documentation is available at [docs.ossa.dev](https://docs.ossa.dev)

### Key Features

- **Agent Generation**: Create voice, critic, monitor, and orchestrator agents
- **Schema Validation**: Validate agents against OSSA schema
- **GitLab CI/CD**: Automatic pipeline generation
- **Real-time Monitoring**: WebSocket-based lifecycle events
- **Project Templates**: Quick project initialization

### Available Commands

In Claude Desktop, you can use natural language or specific commands:

```
> Create a voice assistant for customer service
> ossa generate agent --name customer-voice --type voice
> Validate all agents in the project
> Set up GitLab CI for the project
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional)
- GitLab account (for CI/CD features)

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Project Structure

```
ossa-claude-desktop/
├── src/                 # TypeScript source code
├── dist/               # Compiled JavaScript
├── extension/          # Claude Desktop extension
├── templates/          # Project templates
├── tests/              # Test files
└── docs/               # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OSSA Community](https://ossa.dev) for the specification
- [Anthropic](https://anthropic.com) for Claude Desktop and MCP
- [GitLab](https://gitlab.com) for CI/CD infrastructure

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/bluefly-io/ossa-claude-desktop/issues)
- **Discord**: [OSSA Community](https://discord.gg/ossa)
- **Email**: support@bluefly.io

---

Built with ❤️ by [Bluefly.io](https://bluefly.io)