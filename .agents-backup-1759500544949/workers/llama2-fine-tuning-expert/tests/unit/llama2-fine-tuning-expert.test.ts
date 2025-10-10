import { Llama2FineTuningExpertHandler } from '../../handlers/llama2-fine-tuning-expert.handlers';

describe('Llama2FineTuningExpertHandler', () => {
  let handler: Llama2FineTuningExpertHandler;

  beforeEach(() => {
    handler = new Llama2FineTuningExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(Llama2FineTuningExpertHandler);
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
        agent: 'llama2-fine-tuning-expert',
        version: '1.0.0'
      })
    );
  });
});
