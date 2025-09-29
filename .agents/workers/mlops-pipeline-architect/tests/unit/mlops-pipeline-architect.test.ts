import { mlops-pipelinearchitectHandler } from '../../handlers/mlops-pipeline-architect.handlers';

describe('MlopsPipelineArchitectHandler', () => {
  let handler: mlops-pipelinearchitectHandler;

  beforeEach(() => {
    handler = new mlops-pipelinearchitectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(MlopsPipelineArchitectHandler);
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
