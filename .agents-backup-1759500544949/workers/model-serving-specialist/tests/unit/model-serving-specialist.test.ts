import { ModelServingSpecialistHandler } from '../../handlers/model-serving-specialist.handlers';

describe('ModelServingSpecialistHandler', () => {
  let handler: ModelServingSpecialistHandler;

  beforeEach(() => {
    handler = new ModelServingSpecialistHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ModelServingSpecialistHandler);
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
        agent: 'model-serving-specialist',
        version: '1.0.0'
      })
    );
  });
});
