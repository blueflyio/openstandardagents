import { AuthSecuritySpecialistHandler } from '../../handlers/auth-security-specialist.handlers';

describe('AuthSecuritySpecialistHandler', () => {
  let handler: AuthSecuritySpecialistHandler;

  beforeEach(() => {
    handler = new AuthSecuritySpecialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(AuthSecuritySpecialistHandler);
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
        agent: 'auth-security-specialist',
        version: '1.0.0'
      })
    );
  });
});
