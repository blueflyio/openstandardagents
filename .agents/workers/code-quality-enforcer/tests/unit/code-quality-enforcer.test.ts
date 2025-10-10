import { CodeQualityEnforcerHandler } from '../handlers/code-quality-enforcer.handlers';

describe('CodeQualityEnforcerHandler', () => {
  let handler: CodeQualityEnforcerHandler;

  beforeEach(() => {
    handler = new CodeQualityEnforcerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(CodeQualityEnforcerHandler);
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
        agent: 'code-quality-enforcer',
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
