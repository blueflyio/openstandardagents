import { embeddings-model-trainerHandler } from '../../handlers/embeddings-model-trainer.handlers';

describe('embeddings-model-trainerHandler', () => {
  let handler: embeddings-model-trainerHandler;

  beforeEach(() => {
    handler = new embeddings-model-trainerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(embeddings-model-trainerHandler);
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
