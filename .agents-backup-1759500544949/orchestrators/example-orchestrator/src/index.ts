import express from 'express';
import { example-orchestratorHandler } from '../handlers/example-orchestrator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new example-orchestratorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`example-orchestrator agent listening on port ${port}`);
});
