import { certmanagerHandler } from '../../handlers/cert-manager.handlers';

describe('CertManagerHandler', () => {
  let handler: certmanagerHandler;

  beforeEach(() => {
    handler = new certmanagerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(CertManagerHandler);
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
