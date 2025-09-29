import { redis-clusterarchitectHandler } from '../../handlers/redis-cluster-architect.handlers';

describe('RedisClusterArchitectHandler', () => {
  let handler: redis-clusterarchitectHandler;

  beforeEach(() => {
    handler = new redis-clusterarchitectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(RedisClusterArchitectHandler);
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
