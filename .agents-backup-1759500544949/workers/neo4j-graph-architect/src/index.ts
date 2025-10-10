import express from 'express';
import { neo4j-graph-architectHandler } from '../handlers/neo4j-graph-architect.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new neo4j-graph-architectHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`neo4j-graph-architect agent listening on port ${port}`);
});
