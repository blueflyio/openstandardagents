import express from 'express';
import { opa-policy-architectHandler } from '../handlers/opa-policy-architect.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new opa-policy-architectHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`opa-policy-architect agent listening on port ${port}`);
});
