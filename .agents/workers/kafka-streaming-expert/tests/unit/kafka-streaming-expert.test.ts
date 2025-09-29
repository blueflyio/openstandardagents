import { kafka-streamingexpertHandler } from '../../handlers/kafka-streaming-expert.handlers';

describe('KafkaStreamingExpertHandler', () => {
  let handler: kafka-streamingexpertHandler;

  beforeEach(() => {
    handler = new kafka-streamingexpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(KafkaStreamingExpertHandler);
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
        agent: 'kafka-streaming-expert',
        version: '1.0.0'
      })
    );
  });
});
