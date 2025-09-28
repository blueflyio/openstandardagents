import express from 'express';
import { prometheus-metrics-specialistHandler } from '../handlers/prometheus-metrics-specialist.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new prometheus-metrics-specialistHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`prometheus-metrics-specialist agent listening on port ${port}`);
});
