import express from 'express';
import { embeddings-model-trainerHandler } from '../handlers/embeddings-model-trainer.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new embeddings-model-trainerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`embeddings-model-trainer agent listening on port ${port}`);
});
