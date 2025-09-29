import { openapi-3-1generatorHandler } from '../../handlers/openapi-3-1-generator.handlers';

describe('Openapi31GeneratorHandler', () => {
  let handler: openapi-3-1generatorHandler;

  beforeEach(() => {
    handler = new openapi-3-1generatorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(Openapi31GeneratorHandler);
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
        agent: 'openapi-3-1-generator',
        version: '1.0.0'
      })
    );
  });
});
