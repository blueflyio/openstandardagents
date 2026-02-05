import express, { Request, Response, NextFunction } from 'express';
import { VersionManager } from '../core/version-manager';

const app = express();
const versionManager = new VersionManager();

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ossa-version-management' });
});

// POST /api/v1/version/substitute
app.post(
  '/api/v1/version/substitute',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await versionManager.substitute(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/version/restore
app.post(
  '/api/v1/version/restore',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await versionManager.restore(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/version/detect
app.get(
  '/api/v1/version/detect',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await versionManager.detect({
        directory: req.query.directory as string | undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/version/validate
app.post('/api/v1/version/validate', (req: Request, res: Response) => {
  const result = versionManager.validate(req.body.version);
  res.json(result);
});

// POST /api/v1/version/bump
app.post(
  '/api/v1/version/bump',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { version, bump_type, prerelease_identifier } = req.body;
      const result = versionManager.bump(
        version,
        bump_type,
        prerelease_identifier
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    error: error.name,
    message: error.message,
    code: 'INTERNAL_ERROR',
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`OSSA Version Management API listening on port ${PORT}`);
  });
}

export default app;
