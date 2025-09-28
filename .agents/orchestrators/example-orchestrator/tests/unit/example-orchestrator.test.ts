import { example-orchestratorHandler } from '../../handlers/example-orchestrator.handlers';

describe('example-orchestratorHandler', () => {
  let handler: example-orchestratorHandler;

  beforeEach(() => {
    handler = new example-orchestratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(example-orchestratorHandler);
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
