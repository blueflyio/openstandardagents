import { GpuClusterManagerHandler } from '../../handlers/gpu-cluster-manager.handlers';

describe('GpuClusterManagerHandler', () => {
  let handler: GpuClusterManagerHandler;

  beforeEach(() => {
    handler = new GpuClusterManagerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(GpuClusterManagerHandler);
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
        agent: 'gpu-cluster-manager',
        version: '1.0.0'
      })
    );
  });
});
