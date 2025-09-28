import express from 'express';
import { openapi-3-1-generatorHandler } from '../handlers/openapi-3-1-generator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new openapi-3-1-generatorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`openapi-3-1-generator agent listening on port ${port}`);
});
