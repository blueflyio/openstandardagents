import { prometheus-metrics-specialistHandler } from '../../handlers/prometheus-metrics-specialist.handlers';

describe('prometheus-metrics-specialistHandler', () => {
  let handler: prometheus-metrics-specialistHandler;

  beforeEach(() => {
    handler = new prometheus-metrics-specialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(prometheus-metrics-specialistHandler);
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
