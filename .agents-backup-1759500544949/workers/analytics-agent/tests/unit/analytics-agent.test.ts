import { AnalyticsAgentHandler } from '../../handlers/analytics-agent.handlers';

describe('AnalyticsAgentHandler', () => {
  let handler: AnalyticsAgentHandler;

  beforeEach(() => {
    handler = new AnalyticsAgentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(AnalyticsAgentHandler);
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
