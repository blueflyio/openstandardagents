import express from 'express';
import { criticsHandler } from '../handlers/critics.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new criticsHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`critics agent listening on port ${port}`);
});
