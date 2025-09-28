import { audit-loggerHandler } from '../../handlers/audit-logger.handlers';

describe('audit-loggerHandler', () => {
  let handler: audit-loggerHandler;

  beforeEach(() => {
    handler = new audit-loggerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(audit-loggerHandler);
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
