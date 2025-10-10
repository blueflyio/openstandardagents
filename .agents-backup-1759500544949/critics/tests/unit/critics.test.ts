import { CriticsHandler } from '../../handlers/critics.handlers';

describe('CriticsHandler', () => {
  let handler: CriticsHandler;

  beforeEach(() => {
    handler = new CriticsHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(CriticsHandler);
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
        agent: 'critics',
        version: '1.0.0'
      })
    );
  });
});
