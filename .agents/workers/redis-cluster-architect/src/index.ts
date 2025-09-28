import express from 'express';
import { redis-cluster-architectHandler } from '../handlers/redis-cluster-architect.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new redis-cluster-architectHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`redis-cluster-architect agent listening on port ${port}`);
});
