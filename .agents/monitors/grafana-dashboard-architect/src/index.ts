import express from 'express';
import { grafana-dashboard-architectHandler } from '../handlers/grafana-dashboard-architect.handlers';

const app = express();
const port = process.env.PORT || 3000;
const handler = new grafana-dashboard-architectHandler();

app.use(express.json());

// Health check endpoint
app.get('/health', handler.health.bind(handler));

// Main processing endpoint
app.post('/process', handler.process.bind(handler));

app.listen(port, () => {
  console.log(`grafana-dashboard-architect agent listening on port ${port}`);
});
