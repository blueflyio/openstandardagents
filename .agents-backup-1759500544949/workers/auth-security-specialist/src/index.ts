import express from 'express';
import { auth-security-specialistHandler } from '../handlers/auth-security-specialist.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new auth-security-specialistHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`auth-security-specialist agent listening on port ${port}`);
});
