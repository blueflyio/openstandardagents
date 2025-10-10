import { KnowledgeDistillationExpertHandler } from '../../handlers/knowledge-distillation-expert.handlers';

describe('KnowledgeDistillationExpertHandler', () => {
  let handler: KnowledgeDistillationExpertHandler;

  beforeEach(() => {
    handler = new KnowledgeDistillationExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(KnowledgeDistillationExpertHandler);
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
        agent: 'knowledge-distillation-expert',
        version: '1.0.0'
      })
    );
  });
});
