import express from 'express';
import { knowledge-distillation-expertHandler } from '../handlers/knowledge-distillation-expert.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new knowledge-distillation-expertHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`knowledge-distillation-expert agent listening on port ${port}`);
});
