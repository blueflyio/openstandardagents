import express from 'express';
import { system-monitorHandler } from '../handlers/system-monitor.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new system-monitorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`system-monitor agent listening on port ${port}`);
});
