import { minio-storage-expertHandler } from '../../handlers/minio-storage-expert.handlers';

describe('minio-storage-expertHandler', () => {
  let handler: minio-storage-expertHandler;

  beforeEach(() => {
    handler = new minio-storage-expertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(minio-storage-expertHandler);
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
