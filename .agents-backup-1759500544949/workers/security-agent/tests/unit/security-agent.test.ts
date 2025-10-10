import { SecurityAgentHandler } from '../../handlers/security-agent.handlers';

describe('SecurityAgentHandler', () => {
  let handler: SecurityAgentHandler;

  beforeEach(() => {
    handler = new SecurityAgentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(SecurityAgentHandler);
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
        agent: 'security-agent',
        version: '1.0.0'
      })
    );
  });
});
