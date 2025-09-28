import express from 'express';
import { middleware-developerHandler } from '../handlers/middleware-developer.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new middleware-developerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`middleware-developer agent listening on port ${port}`);
});
