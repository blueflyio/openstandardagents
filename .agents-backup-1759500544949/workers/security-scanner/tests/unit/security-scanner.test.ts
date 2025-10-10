import { SecurityScannerHandler } from '../../handlers/security-scanner.handlers';

describe('SecurityScannerHandler', () => {
  let handler: SecurityScannerHandler;

  beforeEach(() => {
    handler = new SecurityScannerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(SecurityScannerHandler);
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
