import { apiconnectorHandler } from '../../handlers/api-connector.handlers';

describe('ApiConnectorHandler', () => {
  let handler: apiconnectorHandler;

  beforeEach(() => {
    handler = new apiconnectorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ApiConnectorHandler);
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
        agent: 'api-connector',
        version: '1.0.0'
      })
    );
  });
});
