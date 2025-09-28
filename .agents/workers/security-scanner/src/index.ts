import express from 'express';
import { security-scannerHandler } from '../handlers/security-scanner.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new security-scannerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`security-scanner agent listening on port ${port}`);
});
