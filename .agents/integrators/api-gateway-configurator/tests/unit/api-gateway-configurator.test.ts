import { api-gateway-configuratorHandler } from '../../handlers/api-gateway-configurator.handlers';

describe('api-gateway-configuratorHandler', () => {
  let handler: api-gateway-configuratorHandler;

  beforeEach(() => {
    handler = new api-gateway-configuratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(api-gateway-configuratorHandler);
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
        agent: 'api-gateway-configurator',
        version: '1.0.0'
      })
    );
  });
});
