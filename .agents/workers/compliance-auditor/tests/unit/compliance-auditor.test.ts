import { compliance-auditorHandler } from '../../handlers/compliance-auditor.handlers';

describe('compliance-auditorHandler', () => {
  let handler: compliance-auditorHandler;

  beforeEach(() => {
    handler = new compliance-auditorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(compliance-auditorHandler);
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
