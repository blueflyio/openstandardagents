import { schema-validatorHandler } from '../../handlers/schema-validator.handlers';

describe('schema-validatorHandler', () => {
  let handler: schema-validatorHandler;

  beforeEach(() => {
    handler = new schema-validatorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(schema-validatorHandler);
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
        agent: 'schema-validator',
        version: '1.0.0'
      })
    );
  });
});
