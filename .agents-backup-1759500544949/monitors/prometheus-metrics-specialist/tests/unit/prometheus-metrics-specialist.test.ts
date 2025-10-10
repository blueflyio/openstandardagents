import { PrometheusMetricsSpecialistHandler } from '../../handlers/prometheus-metrics-specialist.handlers';

describe('PrometheusMetricsSpecialistHandler', () => {
  let handler: PrometheusMetricsSpecialistHandler;

  beforeEach(() => {
    handler = new PrometheusMetricsSpecialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(PrometheusMetricsSpecialistHandler);
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
        agent: 'prometheus-metrics-specialist',
        version: '1.0.0'
      })
    );
  });
});
