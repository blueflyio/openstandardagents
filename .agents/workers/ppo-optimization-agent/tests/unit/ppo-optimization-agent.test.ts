import { ppo-optimizationagentHandler } from '../../handlers/ppo-optimization-agent.handlers';

describe('PpoOptimizationAgentHandler', () => {
  let handler: ppo-optimizationagentHandler;

  beforeEach(() => {
    handler = new ppo-optimizationagentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(PpoOptimizationAgentHandler);
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
        agent: 'ppo-optimization-agent',
        version: '1.0.0'
      })
    );
  });
});
