import { security-agentHandler } from '../../handlers/security-agent.handlers';

describe('security-agentHandler', () => {
  let handler: security-agentHandler;

  beforeEach(() => {
    handler = new security-agentHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(security-agentHandler);
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
