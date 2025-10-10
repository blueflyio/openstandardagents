import { GrafanaDashboardArchitectHandler } from '../../handlers/grafana-dashboard-architect.handlers';

describe('GrafanaDashboardArchitectHandler', () => {
  let handler: GrafanaDashboardArchitectHandler;

  beforeEach(() => {
    handler = new GrafanaDashboardArchitectHandler();
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
