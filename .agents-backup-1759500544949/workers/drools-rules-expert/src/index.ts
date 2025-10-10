import express from 'express';
import { drools-rules-expertHandler } from '../handlers/drools-rules-expert.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new drools-rules-expertHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`drools-rules-expert agent listening on port ${port}`);
});
