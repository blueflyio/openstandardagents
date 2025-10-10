import express from 'express';
import { roadmap-orchestratorHandler } from '../handlers/roadmap-orchestrator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new roadmap-orchestratorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`roadmap-orchestrator agent listening on port ${port}`);
});
