import { graphql-schema-architectHandler } from '../../handlers/graphql-schema-architect.handlers';

describe('graphql-schema-architectHandler', () => {
  let handler: graphql-schema-architectHandler;

  beforeEach(() => {
    handler = new graphql-schema-architectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(graphql-schema-architectHandler);
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
        agent: 'graphql-schema-architect',
        version: '1.0.0'
      })
    );
  });
});
