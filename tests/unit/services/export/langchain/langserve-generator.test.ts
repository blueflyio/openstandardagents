/**
 * LangServe Generator Tests
 */

import { LangServeGenerator } from '../../../../../src/services/export/langchain/langserve-generator.js';
import type { OssaAgent } from '../../../../../src/types/index.js';

describe('LangServeGenerator', () => {
  const mockManifest: OssaAgent = {
    apiVersion: 'ossa.ai/v0.4.1',
    kind: 'Agent',
    metadata: {
      name: 'test-agent',
      description: 'Test agent for LangServe',
      version: '1.0.0',
    },
    spec: {
      role: 'You are a test agent',
      llm: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
      },
      tools: [
        {
          name: 'test_tool',
          description: 'A test tool',
          parameters: {
            type: 'object',
            properties: {
              input: { type: 'string' },
            },
            required: ['input'],
          },
        },
      ],
    },
  };

  describe('generateApp', () => {
    it('should generate LangServe app with default config', () => {
      const generator = new LangServeGenerator();
      const app = generator.generateApp(mockManifest);

      expect(app).toContain('from langserve import add_routes');
      expect(app).toContain('from agent import create_agent');
      expect(app).toContain('test-agent - LangServe API');
      expect(app).toContain('path="/agent"');
      expect(app).toContain('enable_feedback_endpoint=True');
      expect(app).toContain('enable_public_trace_link_endpoint=True');
    });

    it('should generate app with custom route path', () => {
      const generator = new LangServeGenerator();
      const app = generator.generateApp(mockManifest, {
        routePath: '/custom',
      });

      expect(app).toContain('path="/custom"');
    });

    it('should generate app with custom port', () => {
      const generator = new LangServeGenerator();
      const app = generator.generateApp(mockManifest, {
        port: 3000,
      });

      expect(app).toContain('port = int(os.getenv("PORT", 3000))');
    });

    it('should disable feedback endpoint when configured', () => {
      const generator = new LangServeGenerator();
      const app = generator.generateApp(mockManifest, {
        enableFeedback: false,
      });

      expect(app).toContain('enable_feedback_endpoint=False');
    });

    it('should disable public trace link when configured', () => {
      const generator = new LangServeGenerator();
      const app = generator.generateApp(mockManifest, {
        enablePublicTraceLink: false,
      });

      expect(app).toContain('enable_public_trace_link_endpoint=False');
    });

    it('should include health check endpoint', () => {
      const generator = new LangServeGenerator();
      const app = generator.generateApp(mockManifest);

      expect(app).toContain('@app.get("/health")');
      expect(app).toContain('async def health_check()');
    });

    it('should include info endpoint', () => {
      const generator = new LangServeGenerator();
      const app = generator.generateApp(mockManifest);

      expect(app).toContain('@app.get("/info")');
      expect(app).toContain('async def get_info()');
    });
  });

  describe('generateDockerfile', () => {
    it('should generate Dockerfile with default Python version', () => {
      const generator = new LangServeGenerator();
      const dockerfile = generator.generateDockerfile();

      expect(dockerfile).toContain('FROM python:3.11-slim');
      expect(dockerfile).toContain('COPY requirements.txt');
      expect(dockerfile).toContain(
        'pip install --no-cache-dir -r requirements.txt'
      );
      expect(dockerfile).toContain('CMD ["python", "langserve_app.py"]');
    });

    it('should generate Dockerfile with custom Python version', () => {
      const generator = new LangServeGenerator();
      const dockerfile = generator.generateDockerfile('3.10');

      expect(dockerfile).toContain('FROM python:3.10-slim');
    });

    it('should include health check in Dockerfile', () => {
      const generator = new LangServeGenerator();
      const dockerfile = generator.generateDockerfile();

      expect(dockerfile).toContain('HEALTHCHECK');
      expect(dockerfile).toContain('/health');
    });
  });

  describe('generateDockerCompose', () => {
    it('should generate docker-compose.yaml', () => {
      const generator = new LangServeGenerator();
      const compose = generator.generateDockerCompose(mockManifest);

      expect(compose).toContain("version: '3.8'");
      expect(compose).toContain('test-agent:');
      expect(compose).toContain('build: .');
      expect(compose).toContain('OPENAI_API_KEY');
      expect(compose).toContain('ANTHROPIC_API_KEY');
      expect(compose).toContain('LANGCHAIN_TRACING_V2');
    });

    it('should use custom port', () => {
      const generator = new LangServeGenerator();
      const compose = generator.generateDockerCompose(mockManifest, {
        port: 3000,
      });

      expect(compose).toContain('"3000:8000"');
    });
  });

  describe('generateKubernetesManifests', () => {
    it('should generate deployment manifest', () => {
      const generator = new LangServeGenerator();
      const manifests = generator.generateKubernetesManifests(mockManifest);

      expect(manifests.deployment).toContain('kind: Deployment');
      expect(manifests.deployment).toContain('name: test-agent-langserve');
      expect(manifests.deployment).toContain('replicas: 2');
      expect(manifests.deployment).toContain('containerPort: 8000');
    });

    it('should generate service manifest', () => {
      const generator = new LangServeGenerator();
      const manifests = generator.generateKubernetesManifests(mockManifest);

      expect(manifests.service).toContain('kind: Service');
      expect(manifests.service).toContain('name: test-agent-langserve');
      expect(manifests.service).toContain('type: ClusterIP');
    });

    it('should generate ingress manifest', () => {
      const generator = new LangServeGenerator();
      const manifests = generator.generateKubernetesManifests(mockManifest);

      expect(manifests.ingress).toContain('kind: Ingress');
      expect(manifests.ingress).toContain('name: test-agent-langserve');
      expect(manifests.ingress).toContain('test-agent.example.com');
    });

    it('should include health probes in deployment', () => {
      const generator = new LangServeGenerator();
      const manifests = generator.generateKubernetesManifests(mockManifest);

      expect(manifests.deployment).toContain('livenessProbe:');
      expect(manifests.deployment).toContain('readinessProbe:');
    });
  });

  describe('generateRailwayConfig', () => {
    it('should generate railway.json', () => {
      const generator = new LangServeGenerator();
      const config = generator.generateRailwayConfig(mockManifest);

      expect(config).toContain('"builder": "DOCKERFILE"');
      expect(config).toContain('"startCommand": "python langserve_app.py"');
      expect(config).toContain('"healthcheckPath": "/health"');
    });
  });

  describe('generateRenderConfig', () => {
    it('should generate render.yaml', () => {
      const generator = new LangServeGenerator();
      const config = generator.generateRenderConfig(mockManifest);

      expect(config).toContain('type: web');
      expect(config).toContain('name: test-agent-langserve');
      expect(config).toContain('runtime: python');
      expect(config).toContain('startCommand: python langserve_app.py');
      expect(config).toContain('healthCheckPath: /health');
    });
  });

  describe('generateFlyConfig', () => {
    it('should generate fly.toml', () => {
      const generator = new LangServeGenerator();
      const config = generator.generateFlyConfig(mockManifest);

      expect(config).toContain('app = "test-agent-langserve"');
      expect(config).toContain('[build]');
      expect(config).toContain('dockerfile = "Dockerfile"');
      expect(config).toContain('path = "/health"');
    });

    it('should use custom port', () => {
      const generator = new LangServeGenerator();
      const config = generator.generateFlyConfig(mockManifest, {
        port: 3000,
      });

      expect(config).toContain('PORT = "3000"');
      expect(config).toContain('internal_port = 3000');
    });
  });

  describe('generateRequirements', () => {
    it('should generate requirements for LangServe', () => {
      const generator = new LangServeGenerator();
      const requirements = generator.generateRequirements();

      expect(requirements).toContain('langserve[all]>=0.0.30');
      expect(requirements).toContain('sse-starlette>=1.8.0');
    });
  });

  describe('generateDeploymentReadme', () => {
    it('should generate deployment README', () => {
      const generator = new LangServeGenerator();
      const readme = generator.generateDeploymentReadme(mockManifest);

      expect(readme).toContain('# test-agent - LangServe Deployment Guide');
      expect(readme).toContain('## LangServe Features');
      expect(readme).toContain('POST /agent/invoke');
      expect(readme).toContain('POST /agent/batch');
      expect(readme).toContain('POST /agent/stream');
      expect(readme).toContain('GET /agent/playground');
    });

    it('should include Docker deployment instructions', () => {
      const generator = new LangServeGenerator();
      const readme = generator.generateDeploymentReadme(mockManifest, {
        deploymentPlatforms: ['docker'],
      });

      expect(readme).toContain('### Docker');
      expect(readme).toContain('docker build');
      expect(readme).toContain('docker-compose up');
    });

    it('should include Kubernetes deployment instructions', () => {
      const generator = new LangServeGenerator();
      const readme = generator.generateDeploymentReadme(mockManifest, {
        deploymentPlatforms: ['kubernetes'],
      });

      expect(readme).toContain('### Kubernetes');
      expect(readme).toContain('kubectl apply');
    });

    it('should include Railway deployment instructions', () => {
      const generator = new LangServeGenerator();
      const readme = generator.generateDeploymentReadme(mockManifest, {
        deploymentPlatforms: ['railway'],
      });

      expect(readme).toContain('### Railway');
      expect(readme).toContain('railway up');
    });

    it('should include usage examples', () => {
      const generator = new LangServeGenerator();
      const readme = generator.generateDeploymentReadme(mockManifest);

      expect(readme).toContain('## Usage Examples');
      expect(readme).toContain('from langserve import RemoteRunnable');
      expect(readme).toContain('RemoteRunnable');
    });

    it('should include client library examples', () => {
      const generator = new LangServeGenerator();
      const readme = generator.generateDeploymentReadme(mockManifest);

      expect(readme).toContain('## Client Libraries');
      expect(readme).toContain('### Python');
      expect(readme).toContain('### JavaScript/TypeScript');
    });
  });
});
