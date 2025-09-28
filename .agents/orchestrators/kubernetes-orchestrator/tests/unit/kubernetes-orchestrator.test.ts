import { kubernetes-orchestratorHandler } from '../../handlers/kubernetes-orchestrator.handlers';

describe('kubernetes-orchestratorHandler', () => {
  let handler: kubernetes-orchestratorHandler;

  beforeEach(() => {
    handler = new kubernetes-orchestratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(kubernetes-orchestratorHandler);
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
