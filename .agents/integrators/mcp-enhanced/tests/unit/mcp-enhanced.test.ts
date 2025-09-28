import { mcp-enhancedHandler } from '../../handlers/mcp-enhanced.handlers';

describe('mcp-enhancedHandler', () => {
  let handler: mcp-enhancedHandler;

  beforeEach(() => {
    handler = new mcp-enhancedHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(mcp-enhancedHandler);
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
        agent: 'mcp-enhanced',
        version: '1.0.0'
      })
    );
  });
});
