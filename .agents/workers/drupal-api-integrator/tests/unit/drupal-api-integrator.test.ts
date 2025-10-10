import { DrupalApiIntegratorHandler } from '../handlers/drupal-api-integrator.handlers';

describe('DrupalApiIntegratorHandler', () => {
  let handler: DrupalApiIntegratorHandler;

  beforeEach(() => {
    handler = new DrupalApiIntegratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(DrupalApiIntegratorHandler);
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
        agent: 'drupal-api-integrator',
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
