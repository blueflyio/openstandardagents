import express from 'express';
import { api-connectorHandler } from '../handlers/api-connector.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new api-connectorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`api-connector agent listening on port ${port}`);
});
