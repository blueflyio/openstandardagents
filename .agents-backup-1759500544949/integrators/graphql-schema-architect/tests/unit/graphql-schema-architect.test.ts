import { GraphqlSchemaArchitectHandler } from '../../handlers/graphql-schema-architect.handlers';

describe('GraphqlSchemaArchitectHandler', () => {
  let handler: GraphqlSchemaArchitectHandler;

  beforeEach(() => {
    handler = new GraphqlSchemaArchitectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(GraphqlSchemaArchitectHandler);
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
