import { McpEnhancedHandler } from '../../handlers/mcp-enhanced.handlers';

describe('McpEnhancedHandler', () => {
  let handler: McpEnhancedHandler;

  beforeEach(() => {
    handler = new McpEnhancedHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(McpEnhancedHandler);
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
