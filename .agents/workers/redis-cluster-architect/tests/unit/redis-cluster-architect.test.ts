import { redis-cluster-architectHandler } from '../../handlers/redis-cluster-architect.handlers';

describe('redis-cluster-architectHandler', () => {
  let handler: redis-cluster-architectHandler;

  beforeEach(() => {
    handler = new redis-cluster-architectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(redis-cluster-architectHandler);
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
        agent: 'redis-cluster-architect',
        version: '1.0.0'
      })
    );
  });
});
