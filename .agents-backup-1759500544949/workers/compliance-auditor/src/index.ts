import express from 'express';
import { compliance-auditorHandler } from '../handlers/compliance-auditor.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new compliance-auditorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`compliance-auditor agent listening on port ${port}`);
});
