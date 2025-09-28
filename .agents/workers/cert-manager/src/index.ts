import express from 'express';
import { cert-managerHandler } from '../handlers/cert-manager.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new cert-managerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`cert-manager agent listening on port ${port}`);
});
