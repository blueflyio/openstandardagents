/**
 * LangServe Deployment Generator
 *
 * Generates production-ready LangServe applications for deploying LangChain agents
 * as REST APIs with:
 * - LangServe routes with invoke/batch/stream/stream_log endpoints
 * - Interactive playground UI
 * - Docker deployment configs
 * - Kubernetes manifests
 * - Cloud platform configs (Railway, Render, Fly.io)
 *
 * SOLID: Single Responsibility - LangServe deployment generation
 * DRY: Reusable deployment templates
 * API-First: Auto-generates REST endpoints from agent
 */

import type { OssaAgent } from '../../../types/index.js';

/**
 * LangServe configuration options
 */
export interface LangServeConfig {
  /**
   * Enable feedback endpoint
   */
  enableFeedback?: boolean;

  /**
   * Enable public trace link endpoint
   */
  enablePublicTraceLink?: boolean;

  /**
   * Enable playground UI
   */
  enablePlayground?: boolean;

  /**
   * Custom route path (default: /agent)
   */
  routePath?: string;

  /**
   * API port
   */
  port?: number;

  /**
   * Include deployment configs
   */
  includeDeployment?: boolean;

  /**
   * Cloud platforms to generate configs for
   */
  deploymentPlatforms?: (
    | 'docker'
    | 'kubernetes'
    | 'railway'
    | 'render'
    | 'fly'
  )[];
}

/**
 * LangServe Generator
 */
export class LangServeGenerator {
  /**
   * Generate LangServe FastAPI application
   */
  generateApp(manifest: OssaAgent, config: LangServeConfig = {}): string {
    const agentName = manifest.metadata?.name || 'agent';
    const description = manifest.metadata?.description || 'AI Agent';
    const version = manifest.metadata?.version || '1.0.0';
    const routePath = config.routePath || '/agent';
    const enableFeedback = config.enableFeedback !== false;
    const enablePublicTraceLink = config.enablePublicTraceLink !== false;
    const enablePlayground = config.enablePlayground !== false;

    return `"""
LangServe Deployment for ${agentName}

${description}

This LangServe application provides production-ready REST API endpoints:
- POST ${routePath}/invoke - Synchronous agent invocation
- POST ${routePath}/batch - Batch invocation for multiple inputs
- POST ${routePath}/stream - Streaming responses with Server-Sent Events
- POST ${routePath}/stream_log - Stream with intermediate steps and tokens
${enablePlayground ? `- GET ${routePath}/playground - Interactive playground UI` : ''}
${enableFeedback ? `- POST ${routePath}/feedback - Submit feedback for traces` : ''}
${enablePublicTraceLink ? `- GET ${routePath}/public_trace_link - Get public trace link` : ''}

OpenAPI documentation available at /docs
LangServe playground available at ${routePath}/playground
"""

from typing import Any, Dict, List, Optional, Union
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from langchain.schema.runnable import RunnableConfig
import uvicorn
import os

from agent import create_agent

# Initialize FastAPI app
app = FastAPI(
    title="${agentName} - LangServe API",
    description="${description}",
    version="${version}",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create agent instance
agent = create_agent()

# Add LangServe routes
# This automatically generates:
# - POST ${routePath}/invoke - Single invocation
# - POST ${routePath}/batch - Batch processing
# - POST ${routePath}/stream - Streaming responses
# - POST ${routePath}/stream_log - Detailed streaming with intermediate steps
# - GET ${routePath}/playground - Interactive UI (if enabled)
add_routes(
    app,
    agent,
    path="${routePath}",
    enabled_endpoints=["invoke", "batch", "stream", "stream_log", "playground"],
    enable_feedback_endpoint=${enableFeedback ? 'True' : 'False'},
    enable_public_trace_link_endpoint=${enablePublicTraceLink ? 'True' : 'False'},
    playground_type="default",  # or "chat" for chat-style UI
)


@app.get("/")
async def redirect_to_docs():
    """
    Redirect root to API documentation
    """
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring
    """
    return {
        "status": "healthy",
        "agent": "${agentName}",
        "version": "${version}",
        "langserve_endpoints": {
            "invoke": "${routePath}/invoke",
            "batch": "${routePath}/batch",
            "stream": "${routePath}/stream",
            "stream_log": "${routePath}/stream_log",
            "playground": "${routePath}/playground",
        }
    }


@app.get("/info")
async def get_info():
    """
    Get agent information and capabilities
    """
    return {
        "name": "${agentName}",
        "description": "${description}",
        "version": "${version}",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "agent_invoke": "${routePath}/invoke",
            "agent_batch": "${routePath}/batch",
            "agent_stream": "${routePath}/stream",
            "agent_stream_log": "${routePath}/stream_log",
            "playground": "${routePath}/playground",
        },
        "features": {
            "streaming": True,
            "batch_processing": True,
            "feedback": ${enableFeedback ? 'True' : 'False'},
            "public_traces": ${enablePublicTraceLink ? 'True' : 'False'},
            "playground": ${enablePlayground ? 'True' : 'False'},
        }
    }


if __name__ == "__main__":
    # Get configuration from environment
    port = int(os.getenv("PORT", ${config.port || 8000}))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"Starting ${agentName} LangServe API on {host}:{port}")
    print(f"API Documentation: http://{host}:{port}/docs")
    print(f"Interactive Playground: http://{host}:{port}${routePath}/playground")

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
    )
`;
  }

  /**
   * Generate Dockerfile for LangServe
   */
  generateDockerfile(pythonVersion: string = '3.11'): string {
    return `# LangServe Deployment Dockerfile
FROM python:${pythonVersion}-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose LangServe port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run LangServe app
CMD ["python", "langserve_app.py"]
`;
  }

  /**
   * Generate docker-compose.yaml for LangServe
   */
  generateDockerCompose(
    manifest: OssaAgent,
    config: LangServeConfig = {}
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const port = config.port || 8000;

    return `version: '3.8'

services:
  ${agentName}:
    build: .
    container_name: ${agentName}-langserve
    ports:
      - "${port}:8000"
    environment:
      # LLM API Keys
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}

      # LangServe Configuration
      - PORT=8000
      - HOST=0.0.0.0

      # LangSmith (Optional - for tracing and debugging)
      - LANGCHAIN_TRACING_V2=\${LANGCHAIN_TRACING_V2:-false}
      - LANGCHAIN_API_KEY=\${LANGCHAIN_API_KEY:-}
      - LANGCHAIN_PROJECT=\${LANGCHAIN_PROJECT:-default}
      - LANGCHAIN_ENDPOINT=\${LANGCHAIN_ENDPOINT:-https://api.smith.langchain.com}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      # Mount for development (optional)
      - ./logs:/app/logs
    networks:
      - langserve-network

networks:
  langserve-network:
    driver: bridge
`;
  }

  /**
   * Generate Kubernetes deployment manifests
   */
  generateKubernetesManifests(
    manifest: OssaAgent,
    config: LangServeConfig = {}
  ): {
    deployment: string;
    service: string;
    ingress: string;
  } {
    const agentName = manifest.metadata?.name || 'agent';
    const appLabel = `${agentName}-langserve`;
    const port = config.port || 8000;

    const deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appLabel}
  labels:
    app: ${appLabel}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${appLabel}
  template:
    metadata:
      labels:
        app: ${appLabel}
    spec:
      containers:
      - name: ${agentName}
        image: ${appLabel}:latest
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: PORT
          value: "8000"
        - name: HOST
          value: "0.0.0.0"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${appLabel}-secrets
              key: openai-api-key
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${appLabel}-secrets
              key: anthropic-api-key
              optional: true
        - name: LANGCHAIN_API_KEY
          valueFrom:
            secretKeyRef:
              name: ${appLabel}-secrets
              key: langchain-api-key
              optional: true
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
`;

    const service = `apiVersion: v1
kind: Service
metadata:
  name: ${appLabel}
  labels:
    app: ${appLabel}
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
    name: http
  selector:
    app: ${appLabel}
`;

    const ingress = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${appLabel}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ${agentName}.example.com
    secretName: ${appLabel}-tls
  rules:
  - host: ${agentName}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${appLabel}
            port:
              number: 80
`;

    return { deployment, service, ingress };
  }

  /**
   * Generate Railway configuration
   */
  generateRailwayConfig(
    manifest: OssaAgent,
    config: LangServeConfig = {}
  ): string {
    const port = config.port || 8000;

    return `# Railway deployment configuration
# railway.json

{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "python langserve_app.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "env": {
    "PORT": "${port}",
    "HOST": "0.0.0.0"
  }
}
`;
  }

  /**
   * Generate Render configuration
   */
  generateRenderConfig(
    manifest: OssaAgent,
    config: LangServeConfig = {}
  ): string {
    const agentName = manifest.metadata?.name || 'agent';

    return `# Render deployment configuration
# render.yaml

services:
  - type: web
    name: ${agentName}-langserve
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: python langserve_app.py
    envVars:
      - key: PORT
        value: 8000
      - key: HOST
        value: 0.0.0.0
      - key: OPENAI_API_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: LANGCHAIN_API_KEY
        sync: false
    healthCheckPath: /health
    autoDeploy: true
    scaling:
      minInstances: 1
      maxInstances: 3
`;
  }

  /**
   * Generate Fly.io configuration
   */
  generateFlyConfig(manifest: OssaAgent, config: LangServeConfig = {}): string {
    const agentName = manifest.metadata?.name || 'agent';
    const port = config.port || 8000;

    return `# Fly.io deployment configuration
# fly.toml

app = "${agentName}-langserve"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "${port}"
  HOST = "0.0.0.0"

[http_service]
  internal_port = ${port}
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [http_service.concurrency]
    type = "requests"
    hard_limit = 25
    soft_limit = 20

[[services]]
  protocol = "tcp"
  internal_port = ${port}
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "requests"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "get"
    path = "/health"
    protocol = "http"

[deploy]
  release_command = "python -c \\"print('Deployment starting...')\\"
`;
  }

  /**
   * Generate LangServe requirements additions
   */
  generateRequirements(): string {
    return `# LangServe Deployment
langserve[all]>=0.0.30
sse-starlette>=1.8.0
`;
  }

  /**
   * Generate deployment README
   */
  generateDeploymentReadme(
    manifest: OssaAgent,
    config: LangServeConfig = {}
  ): string {
    const agentName = manifest.metadata?.name || 'agent';
    const routePath = config.routePath || '/agent';
    const platforms = config.deploymentPlatforms || [
      'docker',
      'kubernetes',
      'railway',
      'render',
      'fly',
    ];

    let readme = `# ${agentName} - LangServe Deployment Guide

This guide covers deploying your LangChain agent using LangServe.

## LangServe Features

Your agent is deployed with the following endpoints:

- **POST ${routePath}/invoke** - Synchronous invocation
- **POST ${routePath}/batch** - Batch processing (multiple inputs)
- **POST ${routePath}/stream** - Streaming responses (Server-Sent Events)
- **POST ${routePath}/stream_log** - Detailed streaming with intermediate steps
- **GET ${routePath}/playground** - Interactive playground UI
- **GET /docs** - OpenAPI documentation
- **GET /health** - Health check endpoint

## Quick Start

### Local Development

\`\`\`bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"

# Run LangServe app
python langserve_app.py

# Access playground
open http://localhost:8000${routePath}/playground
\`\`\`

## Usage Examples

### Invoke Endpoint (Synchronous)

\`\`\`bash
curl -X POST "http://localhost:8000${routePath}/invoke" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "What is LangServe?"}'
\`\`\`

### Batch Endpoint (Multiple Inputs)

\`\`\`bash
curl -X POST "http://localhost:8000${routePath}/batch" \\
  -H "Content-Type: application/json" \\
  -d '{"inputs": ["Question 1?", "Question 2?", "Question 3?"]}'
\`\`\`

### Stream Endpoint (Server-Sent Events)

\`\`\`bash
curl -X POST "http://localhost:8000${routePath}/stream" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Tell me a story"}' \\
  --no-buffer
\`\`\`

### Stream Log Endpoint (Detailed Streaming)

\`\`\`bash
curl -X POST "http://localhost:8000${routePath}/stream_log" \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Explain LangChain"}' \\
  --no-buffer
\`\`\`

### Interactive Playground

Visit: http://localhost:8000${routePath}/playground

## Deployment Options

`;

    if (platforms.includes('docker')) {
      readme += `### Docker

\`\`\`bash
# Build image
docker build -t ${agentName}-langserve .

# Run container
docker run -p 8000:8000 \\
  -e OPENAI_API_KEY=your-key \\
  -e ANTHROPIC_API_KEY=your-key \\
  ${agentName}-langserve

# Or use docker-compose
docker-compose up
\`\`\`

`;
    }

    if (platforms.includes('kubernetes')) {
      readme += `### Kubernetes

\`\`\`bash
# Create secrets
kubectl create secret generic ${agentName}-langserve-secrets \\
  --from-literal=openai-api-key=your-key \\
  --from-literal=anthropic-api-key=your-key

# Deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -l app=${agentName}-langserve
kubectl logs -f deployment/${agentName}-langserve
\`\`\`

`;
    }

    if (platforms.includes('railway')) {
      readme += `### Railway

\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add environment variables
railway variables set OPENAI_API_KEY=your-key
railway variables set ANTHROPIC_API_KEY=your-key

# Deploy
railway up
\`\`\`

`;
    }

    if (platforms.includes('render')) {
      readme += `### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your Git repository
3. Render will auto-detect the \`render.yaml\` configuration
4. Add environment variables in Render dashboard:
   - \`OPENAI_API_KEY\`
   - \`ANTHROPIC_API_KEY\`
5. Deploy

`;
    }

    if (platforms.includes('fly')) {
      readme += `### Fly.io

\`\`\`bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set OPENAI_API_KEY=your-key
fly secrets set ANTHROPIC_API_KEY=your-key

# Deploy
fly deploy

# Open app
fly open
\`\`\`

`;
    }

    readme += `## Observability

### LangSmith Integration

Enable LangSmith tracing for debugging:

\`\`\`bash
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=your-langsmith-key
export LANGCHAIN_PROJECT=my-project
\`\`\`

View traces at: https://smith.langchain.com

### Health Monitoring

\`\`\`bash
# Check health
curl http://localhost:8000/health

# Get agent info
curl http://localhost:8000/info
\`\`\`

## Client Libraries

### Python

\`\`\`python
from langserve import RemoteRunnable

agent = RemoteRunnable("http://localhost:8000${routePath}")

# Invoke
result = agent.invoke("Hello!")
print(result)

# Stream
for chunk in agent.stream("Tell me a story"):
    print(chunk, end="", flush=True)

# Batch
results = agent.batch(["Question 1?", "Question 2?"])
\`\`\`

### JavaScript/TypeScript

\`\`\`typescript
import { RemoteRunnable } from "@langchain/core/runnables/remote";

const agent = new RemoteRunnable({
  url: "http://localhost:8000${routePath}"
});

// Invoke
const result = await agent.invoke("Hello!");

// Stream
const stream = await agent.stream("Tell me a story");
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
\`\`\`

## Troubleshooting

### Check Logs

\`\`\`bash
# Docker
docker logs ${agentName}-langserve

# Kubernetes
kubectl logs -f deployment/${agentName}-langserve

# Railway
railway logs

# Fly.io
fly logs
\`\`\`

### Common Issues

1. **502 Bad Gateway**: Check if the app is running and health check passes
2. **Timeout**: Increase timeout settings in your load balancer
3. **Out of Memory**: Increase container memory limits
4. **API Key Errors**: Verify environment variables are set correctly

## Performance Tips

1. **Enable Streaming**: Use \`/stream\` endpoint for better UX
2. **Batch Requests**: Use \`/batch\` for multiple inputs
3. **Caching**: Implement Redis for response caching
4. **Rate Limiting**: Add rate limiting for production
5. **Monitoring**: Set up health checks and metrics

## Security

1. **API Keys**: Never commit API keys to git
2. **CORS**: Configure CORS for production domains
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting
5. **Authentication**: Add auth middleware for production

## Resources

- [LangServe Documentation](https://python.langchain.com/docs/langserve)
- [LangChain Documentation](https://python.langchain.com/)
- [OpenAPI Spec](/docs)
- [Interactive Playground](${routePath}/playground)
`;

    return readme;
  }
}
