import express from 'express';
import { endpoint-testerHandler } from '../handlers/endpoint-tester.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new endpoint-testerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`endpoint-tester agent listening on port ${port}`);
});
