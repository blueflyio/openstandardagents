import { cert-managerHandler } from '../../handlers/cert-manager.handlers';

describe('cert-managerHandler', () => {
  let handler: cert-managerHandler;

  beforeEach(() => {
    handler = new cert-managerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(cert-managerHandler);
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
        agent: 'cert-manager',
        version: '1.0.0'
      })
    );
  });
});
