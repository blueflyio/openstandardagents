import express from 'express';
import { training-data-curatorHandler } from '../handlers/training-data-curator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new training-data-curatorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`training-data-curator agent listening on port ${port}`);
});
