import { AuditLoggerHandler } from '../../handlers/audit-logger.handlers';

describe('AuditLoggerHandler', () => {
  let handler: AuditLoggerHandler;

  beforeEach(() => {
    handler = new AuditLoggerHandler();
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
