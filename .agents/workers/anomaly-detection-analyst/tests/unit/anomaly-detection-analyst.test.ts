import { AnomalyDetectionAnalystHandler } from '../handlers/anomaly-detection-analyst.handlers';

describe('AnomalyDetectionAnalystHandler', () => {
  let handler: AnomalyDetectionAnalystHandler;

  beforeEach(() => {
    handler = new AnomalyDetectionAnalystHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(AnomalyDetectionAnalystHandler);
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
        agent: 'anomaly-detection-analyst',
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
