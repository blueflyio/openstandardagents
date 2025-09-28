import express from 'express';
import { mcp-enhancedHandler } from '../handlers/mcp-enhanced.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new mcp-enhancedHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`mcp-enhanced agent listening on port ${port}`);
});
