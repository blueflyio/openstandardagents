import express from 'express';
import { istio-mesh-architectHandler } from '../handlers/istio-mesh-architect.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new istio-mesh-architectHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`istio-mesh-architect agent listening on port ${port}`);
});
