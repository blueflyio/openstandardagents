import { openapi-3-1-generatorHandler } from '../../handlers/openapi-3-1-generator.handlers';

describe('openapi-3-1-generatorHandler', () => {
  let handler: openapi-3-1-generatorHandler;

  beforeEach(() => {
    handler = new openapi-3-1-generatorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(openapi-3-1-generatorHandler);
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
