import express from 'express';
import { communication-multiprotocolHandler } from '../handlers/communication-multiprotocol.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new communication-multiprotocolHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`communication-multiprotocol agent listening on port ${port}`);
});
