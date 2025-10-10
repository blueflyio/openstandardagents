import { GovernanceEnforcerHandler } from '../../handlers/governance-enforcer.handlers';

describe('GovernanceEnforcerHandler', () => {
  let handler: GovernanceEnforcerHandler;

  beforeEach(() => {
    handler = new GovernanceEnforcerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(GovernanceEnforcerHandler);
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
        agent: 'governance-enforcer',
        version: '1.0.0'
      })
    );
  });
});
