import { PostgresqlLtreeSpecialistHandler } from '../../handlers/postgresql-ltree-specialist.handlers';

describe('PostgresqlLtreeSpecialistHandler', () => {
  let handler: PostgresqlLtreeSpecialistHandler;

  beforeEach(() => {
    handler = new PostgresqlLtreeSpecialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(PostgresqlLtreeSpecialistHandler);
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
