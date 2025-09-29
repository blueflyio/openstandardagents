import { api-gatewayconfiguratorHandler } from '../../handlers/api-gateway-configurator.handlers';

describe('ApiGatewayConfiguratorHandler', () => {
  let handler: api-gatewayconfiguratorHandler;

  beforeEach(() => {
    handler = new api-gatewayconfiguratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ApiGatewayConfiguratorHandler);
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
