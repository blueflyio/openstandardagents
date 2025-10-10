import { WebsocketHandlerExpertHandler } from '../../handlers/websocket-handler-expert.handlers';

describe('WebsocketHandlerExpertHandler', () => {
  let handler: WebsocketHandlerExpertHandler;

  beforeEach(() => {
    handler = new WebsocketHandlerExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(WebsocketHandlerExpertHandler);
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
        agent: 'websocket-handler-expert',
        version: '1.0.0'
      })
    );
  });
});
