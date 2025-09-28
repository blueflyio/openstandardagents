import { drools-rules-expertHandler } from '../../handlers/drools-rules-expert.handlers';

describe('drools-rules-expertHandler', () => {
  let handler: drools-rules-expertHandler;

  beforeEach(() => {
    handler = new drools-rules-expertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(drools-rules-expertHandler);
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
        agent: 'drools-rules-expert',
        version: '1.0.0'
      })
    );
  });
});
