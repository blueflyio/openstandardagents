import { EndpointTesterHandler } from '../../handlers/endpoint-tester.handlers';

describe('EndpointTesterHandler', () => {
  let handler: EndpointTesterHandler;

  beforeEach(() => {
    handler = new EndpointTesterHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(EndpointTesterHandler);
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
        agent: 'endpoint-tester',
        version: '1.0.0'
      })
    );
  });
});
