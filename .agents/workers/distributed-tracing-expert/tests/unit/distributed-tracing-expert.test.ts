import { DistributedTracingExpertHandler } from '../handlers/distributed-tracing-expert.handlers';

describe('DistributedTracingExpertHandler', () => {
  let handler: DistributedTracingExpertHandler;

  beforeEach(() => {
    handler = new DistributedTracingExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(DistributedTracingExpertHandler);
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
        agent: 'distributed-tracing-expert',
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
