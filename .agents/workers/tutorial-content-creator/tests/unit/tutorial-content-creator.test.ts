import { TutorialContentCreatorHandler } from '../handlers/tutorial-content-creator.handlers';

describe('TutorialContentCreatorHandler', () => {
  let handler: TutorialContentCreatorHandler;

  beforeEach(() => {
    handler = new TutorialContentCreatorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(TutorialContentCreatorHandler);
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
        agent: 'tutorial-content-creator',
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
