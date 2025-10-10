import { Neo4jGraphArchitectHandler } from '../../handlers/neo4j-graph-architect.handlers';

describe('Neo4jGraphArchitectHandler', () => {
  let handler: Neo4jGraphArchitectHandler;

  beforeEach(() => {
    handler = new Neo4jGraphArchitectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(Neo4jGraphArchitectHandler);
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
