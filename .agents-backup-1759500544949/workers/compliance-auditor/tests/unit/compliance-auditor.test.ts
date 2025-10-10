import { ComplianceAuditorHandler } from '../../handlers/compliance-auditor.handlers';

describe('ComplianceAuditorHandler', () => {
  let handler: ComplianceAuditorHandler;

  beforeEach(() => {
    handler = new ComplianceAuditorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ComplianceAuditorHandler);
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
        agent: 'compliance-auditor',
        version: '1.0.0'
      })
    );
  });
});
