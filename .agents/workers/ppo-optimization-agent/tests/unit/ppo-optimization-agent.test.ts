import { ppo-optimization-agentHandler } from '../../handlers/ppo-optimization-agent.handlers';

describe('ppo-optimization-agentHandler', () => {
  let handler: ppo-optimization-agentHandler;

  beforeEach(() => {
    handler = new ppo-optimization-agentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ppo-optimization-agentHandler);
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
