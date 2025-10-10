import { MiddlewareDeveloperHandler } from '../../handlers/middleware-developer.handlers';

describe('MiddlewareDeveloperHandler', () => {
  let handler: MiddlewareDeveloperHandler;

  beforeEach(() => {
    handler = new MiddlewareDeveloperHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(MiddlewareDeveloperHandler);
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
        agent: 'middleware-developer',
        version: '1.0.0'
      })
    );
  });
});
