import { grafana-dashboard-architectHandler } from '../../handlers/grafana-dashboard-architect.handlers';

describe('grafana-dashboard-architectHandler', () => {
  let handler: grafana-dashboard-architectHandler;

  beforeEach(() => {
    handler = new grafana-dashboard-architectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(grafana-dashboard-architectHandler);
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
        agent: 'grafana-dashboard-architect',
        version: '1.0.0'
      })
    );
  });
});
