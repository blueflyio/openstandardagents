import { SchemaValidatorHandler } from '../../handlers/schema-validator.handlers';

describe('SchemaValidatorHandler', () => {
  let handler: SchemaValidatorHandler;

  beforeEach(() => {
    handler = new SchemaValidatorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(SchemaValidatorHandler);
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
