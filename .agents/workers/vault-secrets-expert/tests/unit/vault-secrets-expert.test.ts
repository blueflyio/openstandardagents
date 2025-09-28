import { vault-secrets-expertHandler } from '../../handlers/vault-secrets-expert.handlers';

describe('vault-secrets-expertHandler', () => {
  let handler: vault-secrets-expertHandler;

  beforeEach(() => {
    handler = new vault-secrets-expertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(vault-secrets-expertHandler);
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
        agent: 'vault-secrets-expert',
        version: '1.0.0'
      })
    );
  });
});
