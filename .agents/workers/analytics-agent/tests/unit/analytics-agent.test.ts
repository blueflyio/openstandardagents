import { analytics-agentHandler } from '../../handlers/analytics-agent.handlers';

describe('analytics-agentHandler', () => {
  let handler: analytics-agentHandler;

  beforeEach(() => {
    handler = new analytics-agentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(analytics-agentHandler);
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
        agent: 'analytics-agent',
        version: '1.0.0'
      })
    );
  });
});
