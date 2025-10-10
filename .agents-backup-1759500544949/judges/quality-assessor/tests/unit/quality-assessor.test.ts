import { QualityAssessorHandler } from '../../handlers/quality-assessor.handlers';

describe('QualityAssessorHandler', () => {
  let handler: QualityAssessorHandler;

  beforeEach(() => {
    handler = new QualityAssessorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(QualityAssessorHandler);
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
        agent: 'quality-assessor',
        version: '1.0.0'
      })
    );
  });
});
