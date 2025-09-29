import { auditloggerHandler } from '../../handlers/audit-logger.handlers';

describe('AuditLoggerHandler', () => {
  let handler: auditloggerHandler;

  beforeEach(() => {
    handler = new auditloggerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(AuditLoggerHandler);
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
        agent: 'audit-logger',
        version: '1.0.0'
      })
    );
  });
});
