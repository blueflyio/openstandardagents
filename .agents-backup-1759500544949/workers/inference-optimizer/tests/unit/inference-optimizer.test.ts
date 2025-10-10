import { InferenceOptimizerHandler } from '../../handlers/inference-optimizer.handlers';

describe('InferenceOptimizerHandler', () => {
  let handler: InferenceOptimizerHandler;

  beforeEach(() => {
    handler = new InferenceOptimizerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(InferenceOptimizerHandler);
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
        agent: 'inference-optimizer',
        version: '1.0.0'
      })
    );
  });
});
