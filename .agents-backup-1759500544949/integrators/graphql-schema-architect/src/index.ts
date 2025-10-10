import express from 'express';
import { graphql-schema-architectHandler } from '../handlers/graphql-schema-architect.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new graphql-schema-architectHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`graphql-schema-architect agent listening on port ${port}`);
});
