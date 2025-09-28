import { grpc-service-designerHandler } from '../../handlers/grpc-service-designer.handlers';

describe('grpc-service-designerHandler', () => {
  let handler: grpc-service-designerHandler;

  beforeEach(() => {
    handler = new grpc-service-designerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(grpc-service-designerHandler);
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
        agent: 'grpc-service-designer',
        version: '1.0.0'
      })
    );
  });
});
