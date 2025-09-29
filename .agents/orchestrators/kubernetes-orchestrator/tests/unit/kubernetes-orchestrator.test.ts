import { kubernetesorchestratorHandler } from '../../handlers/kubernetes-orchestrator.handlers';

describe('KubernetesOrchestratorHandler', () => {
  let handler: kubernetesorchestratorHandler;

  beforeEach(() => {
    handler = new kubernetesorchestratorHandler();
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
