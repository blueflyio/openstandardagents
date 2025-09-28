import express from 'express';
import { rest-api-implementerHandler } from '../handlers/rest-api-implementer.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new rest-api-implementerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`rest-api-implementer agent listening on port ${port}`);
});
