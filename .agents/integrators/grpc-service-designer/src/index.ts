import express from 'express';
import { grpc-service-designerHandler } from '../handlers/grpc-service-designer.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new grpc-service-designerHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`grpc-service-designer agent listening on port ${port}`);
});
