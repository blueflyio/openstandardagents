import { data-agentHandler } from '../../handlers/data-agent.handlers';

describe('data-agentHandler', () => {
  let handler: data-agentHandler;

  beforeEach(() => {
    handler = new data-agentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(data-agentHandler);
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
        agent: 'data-agent',
        version: '1.0.0'
      })
    );
  });
});
