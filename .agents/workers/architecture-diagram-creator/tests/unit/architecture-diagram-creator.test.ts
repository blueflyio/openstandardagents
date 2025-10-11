import { ArchitectureDiagramCreatorHandler } from '../handlers/architecture-diagram-creator.handlers';

describe('ArchitectureDiagramCreatorHandler', () => {
  let handler: ArchitectureDiagramCreatorHandler;

  beforeEach(() => {
    handler = new ArchitectureDiagramCreatorHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ArchitectureDiagramCreatorHandler);
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
        agent: 'architecture-diagram-creator',
        type: 'worker',
        version: '1.0.0'
      })
    );
  });

  test('should handle task execution', async () => {
    const req = {
      body: {
        task: 'test-task',
        parameters: { test: true }
      }
    } as any;
    const res = {
      json: jest.fn()
    } as any;

    await handler.execute(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        result: expect.any(Object)
      })
    );
  });
});
