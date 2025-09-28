import { api-connectorHandler } from '../../handlers/api-connector.handlers';

describe('api-connectorHandler', () => {
  let handler: api-connectorHandler;

  beforeEach(() => {
    handler = new api-connectorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(api-connectorHandler);
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
