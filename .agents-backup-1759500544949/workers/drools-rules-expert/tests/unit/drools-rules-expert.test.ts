import { DroolsRulesExpertHandler } from '../../handlers/drools-rules-expert.handlers';

describe('DroolsRulesExpertHandler', () => {
  let handler: DroolsRulesExpertHandler;

  beforeEach(() => {
    handler = new DroolsRulesExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(DroolsRulesExpertHandler);
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
        agent: 'drools-rules-expert',
        version: '1.0.0'
      })
    );
  });
});
