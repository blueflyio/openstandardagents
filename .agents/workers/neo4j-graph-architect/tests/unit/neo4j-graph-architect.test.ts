import { neo4j-graph-architectHandler } from '../../handlers/neo4j-graph-architect.handlers';

describe('neo4j-graph-architectHandler', () => {
  let handler: neo4j-graph-architectHandler;

  beforeEach(() => {
    handler = new neo4j-graph-architectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(neo4j-graph-architectHandler);
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
        agent: 'neo4j-graph-architect',
        version: '1.0.0'
      })
    );
  });
});
