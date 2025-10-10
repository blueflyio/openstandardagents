import express from 'express';
import { audit-loggerHandler } from '../handlers/audit-logger.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new audit-loggerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`audit-logger agent listening on port ${port}`);
});
