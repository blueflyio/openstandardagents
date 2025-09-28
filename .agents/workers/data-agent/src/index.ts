import express from 'express';
import { data-agentHandler } from '../handlers/data-agent.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new data-agentHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`data-agent agent listening on port ${port}`);
});
