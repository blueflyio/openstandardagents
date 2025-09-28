import { criticsHandler } from '../../handlers/critics.handlers';

describe('criticsHandler', () => {
  let handler: criticsHandler;

  beforeEach(() => {
    handler = new criticsHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(criticsHandler);
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
        agent: 'critics',
        version: '1.0.0'
      })
    );
  });
});
