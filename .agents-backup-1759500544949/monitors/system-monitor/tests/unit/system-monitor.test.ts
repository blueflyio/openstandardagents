import { SystemMonitorHandler } from '../../handlers/system-monitor.handlers';

describe('SystemMonitorHandler', () => {
  let handler: SystemMonitorHandler;

  beforeEach(() => {
    handler = new SystemMonitorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(SystemMonitorHandler);
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
