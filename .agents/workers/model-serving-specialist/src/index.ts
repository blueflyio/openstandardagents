import express from 'express';
import { model-serving-specialistHandler } from '../handlers/model-serving-specialist.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new model-serving-specialistHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`model-serving-specialist agent listening on port ${port}`);
});
