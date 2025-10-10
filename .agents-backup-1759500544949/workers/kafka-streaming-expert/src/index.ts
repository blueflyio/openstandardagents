import express from 'express';
import { kafka-streaming-expertHandler } from '../handlers/kafka-streaming-expert.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new kafka-streaming-expertHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`kafka-streaming-expert agent listening on port ${port}`);
});
