import express from 'express';
import { rbac-configuratorHandler } from '../handlers/rbac-configurator.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new rbac-configuratorHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`rbac-configurator agent listening on port ${port}`);
});
