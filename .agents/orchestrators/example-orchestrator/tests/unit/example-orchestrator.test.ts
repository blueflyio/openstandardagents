import { exampleorchestratorHandler } from '../../handlers/example-orchestrator.handlers';

describe('ExampleOrchestratorHandler', () => {
  let handler: exampleorchestratorHandler;

  beforeEach(() => {
    handler = new exampleorchestratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ExampleOrchestratorHandler);
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
        agent: 'example-orchestrator',
        version: '1.0.0'
      })
    );
  });
});
