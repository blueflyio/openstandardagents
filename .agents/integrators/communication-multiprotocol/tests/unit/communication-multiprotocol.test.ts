import { communicationmultiprotocolHandler } from '../../handlers/communication-multiprotocol.handlers';

describe('CommunicationMultiprotocolHandler', () => {
  let handler: communicationmultiprotocolHandler;

  beforeEach(() => {
    handler = new communicationmultiprotocolHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(CommunicationMultiprotocolHandler);
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
        agent: 'communication-multiprotocol',
        version: '1.0.0'
      })
    );
  });
});
