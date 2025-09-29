import { opa-policyarchitectHandler } from '../../handlers/opa-policy-architect.handlers';

describe('OpaPolicyArchitectHandler', () => {
  let handler: opa-policyarchitectHandler;

  beforeEach(() => {
    handler = new opa-policyarchitectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(OpaPolicyArchitectHandler);
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
