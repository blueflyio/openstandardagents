import { grafana-dashboardarchitectHandler } from '../../handlers/grafana-dashboard-architect.handlers';

describe('GrafanaDashboardArchitectHandler', () => {
  let handler: grafana-dashboardarchitectHandler;

  beforeEach(() => {
    handler = new grafana-dashboardarchitectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(GrafanaDashboardArchitectHandler);
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
