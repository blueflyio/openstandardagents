import { grpc-servicedesignerHandler } from '../../handlers/grpc-service-designer.handlers';

describe('GrpcServiceDesignerHandler', () => {
  let handler: grpc-servicedesignerHandler;

  beforeEach(() => {
    handler = new grpc-servicedesignerHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(GrpcServiceDesignerHandler);
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
