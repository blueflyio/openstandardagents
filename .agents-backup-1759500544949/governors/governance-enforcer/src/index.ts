import express from 'express';
import { governance-enforcerHandler } from '../handlers/governance-enforcer.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new governance-enforcerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`governance-enforcer agent listening on port ${port}`);
});
