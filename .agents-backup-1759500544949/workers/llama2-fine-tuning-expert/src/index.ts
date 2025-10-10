import express from 'express';
import { llama2-fine-tuning-expertHandler } from '../handlers/llama2-fine-tuning-expert.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new llama2-fine-tuning-expertHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`llama2-fine-tuning-expert agent listening on port ${port}`);
});
