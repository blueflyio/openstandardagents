import express from 'express';
import { analytics-agentHandler } from '../handlers/analytics-agent.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new analytics-agentHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`analytics-agent agent listening on port ${port}`);
});
