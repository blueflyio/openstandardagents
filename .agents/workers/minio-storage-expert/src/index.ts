import express from 'express';
import { minio-storage-expertHandler } from '../handlers/minio-storage-expert.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new minio-storage-expertHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`minio-storage-expert agent listening on port ${port}`);
});
