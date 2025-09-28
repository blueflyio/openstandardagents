import { opa-policy-architectHandler } from '../../handlers/opa-policy-architect.handlers';

describe('opa-policy-architectHandler', () => {
  let handler: opa-policy-architectHandler;

  beforeEach(() => {
    handler = new opa-policy-architectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(opa-policy-architectHandler);
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
        agent: 'opa-policy-architect',
        version: '1.0.0'
      })
    );
  });
});
