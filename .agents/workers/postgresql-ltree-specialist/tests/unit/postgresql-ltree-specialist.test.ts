import { postgresql-ltree-specialistHandler } from '../../handlers/postgresql-ltree-specialist.handlers';

describe('postgresql-ltree-specialistHandler', () => {
  let handler: postgresql-ltree-specialistHandler;

  beforeEach(() => {
    handler = new postgresql-ltree-specialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(postgresql-ltree-specialistHandler);
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
        agent: 'postgresql-ltree-specialist',
        version: '1.0.0'
      })
    );
  });
});
