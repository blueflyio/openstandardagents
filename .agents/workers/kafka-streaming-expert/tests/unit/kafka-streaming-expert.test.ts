import { kafka-streaming-expertHandler } from '../../handlers/kafka-streaming-expert.handlers';

describe('kafka-streaming-expertHandler', () => {
  let handler: kafka-streaming-expertHandler;

  beforeEach(() => {
    handler = new kafka-streaming-expertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(kafka-streaming-expertHandler);
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
