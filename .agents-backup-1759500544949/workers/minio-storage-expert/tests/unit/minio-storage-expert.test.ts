import { MinioStorageExpertHandler } from '../../handlers/minio-storage-expert.handlers';

describe('MinioStorageExpertHandler', () => {
  let handler: MinioStorageExpertHandler;

  beforeEach(() => {
    handler = new MinioStorageExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(MinioStorageExpertHandler);
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
        agent: 'minio-storage-expert',
        version: '1.0.0'
      })
    );
  });
});
