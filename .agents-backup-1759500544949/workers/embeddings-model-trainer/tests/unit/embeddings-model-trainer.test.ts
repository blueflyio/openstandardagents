import { EmbeddingsModelTrainerHandler } from '../../handlers/embeddings-model-trainer.handlers';

describe('EmbeddingsModelTrainerHandler', () => {
  let handler: EmbeddingsModelTrainerHandler;

  beforeEach(() => {
    handler = new EmbeddingsModelTrainerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(EmbeddingsModelTrainerHandler);
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
        agent: 'embeddings-model-trainer',
        version: '1.0.0'
      })
    );
  });
});
