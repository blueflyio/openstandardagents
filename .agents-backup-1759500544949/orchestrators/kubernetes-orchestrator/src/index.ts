import express from 'express';
import { kubernetes-orchestratorHandler } from '../handlers/kubernetes-orchestrator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new kubernetes-orchestratorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`kubernetes-orchestrator agent listening on port ${port}`);
});
