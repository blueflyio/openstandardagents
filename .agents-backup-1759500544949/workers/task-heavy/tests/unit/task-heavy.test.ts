import { TaskHeavyHandler } from '../../handlers/task-heavy.handlers';

describe('TaskHeavyHandler', () => {
  let handler: TaskHeavyHandler;

  beforeEach(() => {
    handler = new TaskHeavyHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(TaskHeavyHandler);
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
        agent: 'task-heavy',
        version: '1.0.0'
      })
    );
  });
});
