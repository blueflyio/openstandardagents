import express from 'express';
import { websocket-handler-expertHandler } from '../handlers/websocket-handler-expert.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new websocket-handler-expertHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`websocket-handler-expert agent listening on port ${port}`);
});
