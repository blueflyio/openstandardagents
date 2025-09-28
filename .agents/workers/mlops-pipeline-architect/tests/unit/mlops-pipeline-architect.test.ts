import { mlops-pipeline-architectHandler } from '../../handlers/mlops-pipeline-architect.handlers';

describe('mlops-pipeline-architectHandler', () => {
  let handler: mlops-pipeline-architectHandler;

  beforeEach(() => {
    handler = new mlops-pipeline-architectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(mlops-pipeline-architectHandler);
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
        agent: 'mlops-pipeline-architect',
        version: '1.0.0'
      })
    );
  });
});
