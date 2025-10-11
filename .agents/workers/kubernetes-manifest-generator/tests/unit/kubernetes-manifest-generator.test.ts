import { KubernetesManifestGeneratorHandler } from '../handlers/kubernetes-manifest-generator.handlers';

describe('KubernetesManifestGeneratorHandler', () => {
  let handler: KubernetesManifestGeneratorHandler;

  beforeEach(() => {
    handler = new KubernetesManifestGeneratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(KubernetesManifestGeneratorHandler);
  });

  test('should handle health check', async () => {
    const req = {} as any;
    const res = {
      json: jest.fn()
    } as any;

    await handler.health(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'healthy',
        agent: 'kubernetes-manifest-generator',
        type: 'worker',
        version: '1.0.0'
      })
    );
  });

  test('should handle task execution', async () => {
    const req = {
      body: {
        task: 'test-task',
        parameters: { test: true }
      }
    } as any;
    const res = {
      json: jest.fn()
    } as any;

    await handler.execute(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        result: expect.any(Object)
      })
    );
  });
});
