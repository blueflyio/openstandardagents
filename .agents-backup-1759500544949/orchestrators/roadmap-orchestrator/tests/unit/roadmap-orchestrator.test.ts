import { RoadmapOrchestratorHandler } from '../../handlers/roadmap-orchestrator.handlers';

describe('RoadmapOrchestratorHandler', () => {
  let handler: RoadmapOrchestratorHandler;

  beforeEach(() => {
    handler = new RoadmapOrchestratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(RoadmapOrchestratorHandler);
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
