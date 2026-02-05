/**
 * LangServe Export Integration Test
 */

import { LangChainExporter } from '../../src/services/export/langchain/index.js';
import type { OssaAgent } from '../../src/types/index.js';

describe('LangServe Export Integration', () => {
  const mockManifest: OssaAgent = {
    apiVersion: 'ossa.ai/v0.4.1',
    kind: 'Agent',
    metadata: {
      name: 'integration-test-agent',
      description: 'Integration test agent',
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

  it('should export LangChain with LangServe support', async () => {
    const exporter = new LangChainExporter();

    const result = await exporter.export(mockManifest, {
      includeLangServe: true,
      langserve: {
        enableFeedback: true,
        enablePublicTraceLink: true,
        enablePlayground: true,
        routePath: '/agent',
        includeDeployment: true,
        deploymentPlatforms: ['docker', 'kubernetes'],
      },
    });

    expect(result.success).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);

    // Verify LangServe app was generated
    const langserveApp = result.files.find(
      (f) => f.path === 'langserve_app.py'
    );
    expect(langserveApp).toBeDefined();
    expect(langserveApp?.content).toContain('from langserve import add_routes');
    expect(langserveApp?.content).toContain(
      'integration-test-agent - LangServe API'
    );

    // Verify deployment configs were generated
    const dockerfileLangserve = result.files.find(
      (f) => f.path === 'Dockerfile.langserve'
    );
    expect(dockerfileLangserve).toBeDefined();

    const dockerComposeLangserve = result.files.find(
      (f) => f.path === 'docker-compose.langserve.yaml'
    );
    expect(dockerComposeLangserve).toBeDefined();

    const deploymentReadme = result.files.find(
      (f) => f.path === 'DEPLOYMENT.md'
    );
    expect(deploymentReadme).toBeDefined();

    // Verify Kubernetes manifests
    const k8sDeployment = result.files.find(
      (f) => f.path === 'k8s/deployment.yaml'
    );
    expect(k8sDeployment).toBeDefined();

    const k8sService = result.files.find((f) => f.path === 'k8s/service.yaml');
    expect(k8sService).toBeDefined();

    const k8sIngress = result.files.find((f) => f.path === 'k8s/ingress.yaml');
    expect(k8sIngress).toBeDefined();

    // Verify requirements include LangServe
    const requirements = result.files.find(
      (f) => f.path === 'requirements.txt'
    );
    expect(requirements).toBeDefined();
    expect(requirements?.content).toContain('langserve[all]>=0.0.30');
  });

  it('should export without LangServe when not enabled', async () => {
    const exporter = new LangChainExporter();

    const result = await exporter.export(mockManifest, {
      includeLangServe: false,
    });

    expect(result.success).toBe(true);

    // Verify LangServe files were NOT generated
    const langserveApp = result.files.find(
      (f) => f.path === 'langserve_app.py'
    );
    expect(langserveApp).toBeUndefined();

    const dockerfileLangserve = result.files.find(
      (f) => f.path === 'Dockerfile.langserve'
    );
    expect(dockerfileLangserve).toBeUndefined();

    // Verify requirements don't include LangServe
    const requirements = result.files.find(
      (f) => f.path === 'requirements.txt'
    );
    expect(requirements).toBeDefined();
    expect(requirements?.content).not.toContain('langserve[all]');
  });

  it('should support selective deployment platforms', async () => {
    const exporter = new LangChainExporter();

    const result = await exporter.export(mockManifest, {
      includeLangServe: true,
      langserve: {
        includeDeployment: true,
        deploymentPlatforms: ['railway', 'fly'],
      },
    });

    expect(result.success).toBe(true);

    // Should have Railway config
    const railwayConfig = result.files.find((f) => f.path === 'railway.json');
    expect(railwayConfig).toBeDefined();

    // Should have Fly.io config
    const flyConfig = result.files.find((f) => f.path === 'fly.toml');
    expect(flyConfig).toBeDefined();

    // Should NOT have Kubernetes manifests
    const k8sDeployment = result.files.find(
      (f) => f.path === 'k8s/deployment.yaml'
    );
    expect(k8sDeployment).toBeUndefined();

    // Should NOT have Docker configs
    const dockerfileLangserve = result.files.find(
      (f) => f.path === 'Dockerfile.langserve'
    );
    expect(dockerfileLangserve).toBeUndefined();
  });
});
