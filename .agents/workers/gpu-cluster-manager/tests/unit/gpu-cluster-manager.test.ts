import { gpu-cluster-managerHandler } from '../../handlers/gpu-cluster-manager.handlers';

describe('gpu-cluster-managerHandler', () => {
  let handler: gpu-cluster-managerHandler;

  beforeEach(() => {
    handler = new gpu-cluster-managerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(gpu-cluster-managerHandler);
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
