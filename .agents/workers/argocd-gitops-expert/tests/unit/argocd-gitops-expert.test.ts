import { ArgocdGitopsExpertHandler } from '../handlers/argocd-gitops-expert.handlers';

describe('ArgocdGitopsExpertHandler', () => {
  let handler: ArgocdGitopsExpertHandler;

  beforeEach(() => {
    handler = new ArgocdGitopsExpertHandler();
  });

  test('should create handler instance', () => {
    expect(handler).toBeInstanceOf(ArgocdGitopsExpertHandler);
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
        agent: 'argocd-gitops-expert',
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
