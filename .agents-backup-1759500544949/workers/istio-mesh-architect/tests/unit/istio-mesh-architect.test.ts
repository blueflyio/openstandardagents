import { IstioMeshArchitectHandler } from '../../handlers/istio-mesh-architect.handlers';

describe('IstioMeshArchitectHandler', () => {
  let handler: IstioMeshArchitectHandler;

  beforeEach(() => {
    handler = new IstioMeshArchitectHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(IstioMeshArchitectHandler);
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
        agent: 'istio-mesh-architect',
        version: '1.0.0'
      })
    );
  });
});
