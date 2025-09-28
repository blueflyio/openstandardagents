import express from 'express';
import { vault-secrets-expertHandler } from '../handlers/vault-secrets-expert.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new vault-secrets-expertHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`vault-secrets-expert agent listening on port ${port}`);
});
