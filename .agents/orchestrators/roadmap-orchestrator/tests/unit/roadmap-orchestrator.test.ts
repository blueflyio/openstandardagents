import { roadmap-orchestratorHandler } from '../../handlers/roadmap-orchestrator.handlers';

describe('roadmap-orchestratorHandler', () => {
  let handler: roadmap-orchestratorHandler;

  beforeEach(() => {
    handler = new roadmap-orchestratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(roadmap-orchestratorHandler);
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
        agent: 'roadmap-orchestrator',
        version: '1.0.0'
      })
    );
  });
});
