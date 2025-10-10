import { TrainingDataCuratorHandler } from '../../handlers/training-data-curator.handlers';

describe('TrainingDataCuratorHandler', () => {
  let handler: TrainingDataCuratorHandler;

  beforeEach(() => {
    handler = new TrainingDataCuratorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(TrainingDataCuratorHandler);
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
        agent: 'training-data-curator',
        version: '1.0.0'
      })
    );
  });
});
