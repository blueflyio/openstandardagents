import express from 'express';
import { ppo-optimization-agentHandler } from '../handlers/ppo-optimization-agent.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new ppo-optimization-agentHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`ppo-optimization-agent agent listening on port ${port}`);
});
