import { VaultSecretsExpertHandler } from '../../handlers/vault-secrets-expert.handlers';

describe('VaultSecretsExpertHandler', () => {
  let handler: VaultSecretsExpertHandler;

  beforeEach(() => {
    handler = new VaultSecretsExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(VaultSecretsExpertHandler);
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
