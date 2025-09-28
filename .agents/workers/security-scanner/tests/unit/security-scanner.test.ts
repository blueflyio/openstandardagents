import { security-scannerHandler } from '../../handlers/security-scanner.handlers';

describe('security-scannerHandler', () => {
  let handler: security-scannerHandler;

  beforeEach(() => {
    handler = new security-scannerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(security-scannerHandler);
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
        agent: 'security-scanner',
        version: '1.0.0'
      })
    );
  });
});
