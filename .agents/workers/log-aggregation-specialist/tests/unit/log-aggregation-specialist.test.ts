import { LogAggregationSpecialistHandler } from '../handlers/log-aggregation-specialist.handlers';

describe('LogAggregationSpecialistHandler', () => {
  let handler: LogAggregationSpecialistHandler;

  beforeEach(() => {
    handler = new LogAggregationSpecialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(LogAggregationSpecialistHandler);
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
        agent: 'log-aggregation-specialist',
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
