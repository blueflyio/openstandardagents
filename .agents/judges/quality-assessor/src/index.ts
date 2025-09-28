import express from 'express';
import { quality-assessorHandler } from '../handlers/quality-assessor.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new quality-assessorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`quality-assessor agent listening on port ${port}`);
});
