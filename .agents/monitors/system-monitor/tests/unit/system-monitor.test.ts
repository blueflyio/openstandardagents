import { system-monitorHandler } from '../../handlers/system-monitor.handlers';

describe('system-monitorHandler', () => {
  let handler: system-monitorHandler;

  beforeEach(() => {
    handler = new system-monitorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(system-monitorHandler);
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
        agent: 'system-monitor',
        version: '1.0.0'
      })
    );
  });
});
