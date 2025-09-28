import express from 'express';
import { api-gateway-configuratorHandler } from '../handlers/api-gateway-configurator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new api-gateway-configuratorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`api-gateway-configurator agent listening on port ${port}`);
});
