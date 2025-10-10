import express from 'express';
import { inference-optimizerHandler } from '../handlers/inference-optimizer.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new inference-optimizerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`inference-optimizer agent listening on port ${port}`);
});
