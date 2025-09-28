import { quality-assessorHandler } from '../../handlers/quality-assessor.handlers';

describe('quality-assessorHandler', () => {
  let handler: quality-assessorHandler;

  beforeEach(() => {
    handler = new quality-assessorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(quality-assessorHandler);
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
        agent: 'quality-assessor',
        version: '1.0.0'
      })
    );
  });
});
