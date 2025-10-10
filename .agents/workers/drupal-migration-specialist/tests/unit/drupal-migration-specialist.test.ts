import { DrupalMigrationSpecialistHandler } from '../handlers/drupal-migration-specialist.handlers';

describe('DrupalMigrationSpecialistHandler', () => {
  let handler: DrupalMigrationSpecialistHandler;

  beforeEach(() => {
    handler = new DrupalMigrationSpecialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(DrupalMigrationSpecialistHandler);
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
        agent: 'drupal-migration-specialist',
        type: 'worker',
        version: '1.0.0'
      })
    );
  });

  test('should handle task execution', async () => {
    const req = {
      body: {
        task: 'test-task',
        parameters: { test: true }
      }
    } as any;
    const res = {
      json: jest.fn()
    } as any;

    await handler.execute(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        result: expect.any(Object)
      })
    );
  });
});
