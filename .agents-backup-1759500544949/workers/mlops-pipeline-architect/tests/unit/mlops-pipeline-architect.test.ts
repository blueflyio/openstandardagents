import { MlopsPipelineArchitectHandler } from '../../handlers/mlops-pipeline-architect.handlers';

describe('MlopsPipelineArchitectHandler', () => {
  let handler: MlopsPipelineArchitectHandler;

  beforeEach(() => {
    handler = new MlopsPipelineArchitectHandler();
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
