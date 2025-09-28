import express from 'express';
import { lora-training-specialistHandler } from '../handlers/lora-training-specialist.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new lora-training-specialistHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`lora-training-specialist agent listening on port ${port}`);
});
