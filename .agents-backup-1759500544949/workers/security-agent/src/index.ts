import express from 'express';
import { security-agentHandler } from '../handlers/security-agent.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new security-agentHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`security-agent agent listening on port ${port}`);
});
