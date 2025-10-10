import { RbacConfiguratorHandler } from '../../handlers/rbac-configurator.handlers';

describe('RbacConfiguratorHandler', () => {
  let handler: RbacConfiguratorHandler;

  beforeEach(() => {
    handler = new RbacConfiguratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(RbacConfiguratorHandler);
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
        agent: 'rbac-configurator',
        version: '1.0.0'
      })
    );
  });
});
