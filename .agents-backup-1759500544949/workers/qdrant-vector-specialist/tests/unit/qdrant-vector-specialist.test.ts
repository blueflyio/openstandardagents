import { QdrantVectorSpecialistHandler } from '../../handlers/qdrant-vector-specialist.handlers';

describe('QdrantVectorSpecialistHandler', () => {
  let handler: QdrantVectorSpecialistHandler;

  beforeEach(() => {
    handler = new QdrantVectorSpecialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(QdrantVectorSpecialistHandler);
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
        agent: 'qdrant-vector-specialist',
        version: '1.0.0'
      })
    );
  });
});
