import { DataAgentHandler } from '../../handlers/data-agent.handlers';

describe('DataAgentHandler', () => {
  let handler: DataAgentHandler;

  beforeEach(() => {
    handler = new DataAgentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(DataAgentHandler);
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
