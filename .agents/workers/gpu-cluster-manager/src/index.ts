import express from 'express';
import { gpu-cluster-managerHandler } from '../handlers/gpu-cluster-manager.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new gpu-cluster-managerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`gpu-cluster-manager agent listening on port ${port}`);
});
