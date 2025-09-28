import express from 'express';
import { mlops-pipeline-architectHandler } from '../handlers/mlops-pipeline-architect.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new mlops-pipeline-architectHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`mlops-pipeline-architect agent listening on port ${port}`);
});
