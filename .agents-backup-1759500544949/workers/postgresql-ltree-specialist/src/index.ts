import express from 'express';
import { postgresql-ltree-specialistHandler } from '../handlers/postgresql-ltree-specialist.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new postgresql-ltree-specialistHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`postgresql-ltree-specialist agent listening on port ${port}`);
});
