import { DrupalModuleAnalyzerHandler } from '../handlers/drupal-module-analyzer.handlers';

describe('DrupalModuleAnalyzerHandler', () => {
  let handler: DrupalModuleAnalyzerHandler;

  beforeEach(() => {
    handler = new DrupalModuleAnalyzerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(DrupalModuleAnalyzerHandler);
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
        agent: 'drupal-module-analyzer',
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
