import express from 'express';
import { schema-validatorHandler } from '../handlers/schema-validator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new schema-validatorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`schema-validator agent listening on port ${port}`);
});
