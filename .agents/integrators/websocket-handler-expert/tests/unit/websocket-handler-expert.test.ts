import { websocket-handler-expertHandler } from '../../handlers/websocket-handler-expert.handlers';

describe('websocket-handler-expertHandler', () => {
  let handler: websocket-handler-expertHandler;

  beforeEach(() => {
    handler = new websocket-handler-expertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(websocket-handler-expertHandler);
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
