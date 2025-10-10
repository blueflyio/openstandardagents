import express from 'express';
import { qdrant-vector-specialistHandler } from '../handlers/qdrant-vector-specialist.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new qdrant-vector-specialistHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`qdrant-vector-specialist agent listening on port ${port}`);
});
