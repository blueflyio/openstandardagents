import { KubernetesOrchestratorHandler } from '../../handlers/kubernetes-orchestrator.handlers';

describe('KubernetesOrchestratorHandler', () => {
  let handler: KubernetesOrchestratorHandler;

  beforeEach(() => {
    handler = new KubernetesOrchestratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(KubernetesOrchestratorHandler);
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
        agent: 'kubernetes-orchestrator',
        version: '1.0.0'
      })
    );
  });
});
