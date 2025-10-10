import { MetricsDashboardDesignerHandler } from '../handlers/metrics-dashboard-designer.handlers';

describe('MetricsDashboardDesignerHandler', () => {
  let handler: MetricsDashboardDesignerHandler;

  beforeEach(() => {
    handler = new MetricsDashboardDesignerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(MetricsDashboardDesignerHandler);
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
        agent: 'metrics-dashboard-designer',
        type: 'worker',
        version: '1.0.0'
      })
    );
  });

  test('should handle task execution', async () => {
    const req = {
      body: {
        task: 'test-task',
        parameters: { test: true }
      }
    } as any;
    const res = {
      json: jest.fn()
    } as any;

    await handler.execute(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        result: expect.any(Object)
      })
    );
  });
});
