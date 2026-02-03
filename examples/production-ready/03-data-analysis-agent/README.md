# Data Analysis Agent

Production data analysis agent exported as npm package.

## Features

- Load data from CSV, JSON, SQL, Parquet
- Statistical analysis (descriptive, correlation, regression, clustering, timeseries)
- Data visualization (charts, graphs, heatmaps)
- Automated insights generation
- Integration with pandas, numpy, scikit-learn

## Quick Start

```bash
# Install as npm package
npm install @company/data-analysis-agent

# Or run with Docker
docker-compose up -d

# Analyze data
curl -X POST http://localhost:8082/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "data": [...],
    "analysisType": "descriptive"
  }'
```

## Export to npm

```bash
ossa export agent.ossa.yaml --platform npm --output dist/

# Use in your project
import { DataAnalysisAgent } from '@company/data-analysis-agent';

const agent = new DataAnalysisAgent();
const results = await agent.analyze(data, 'correlation');
```

## API Endpoints

- `POST /v1/analyze` - Analyze dataset
- `POST /v1/visualize` - Create visualization
- `GET /v1/health` - Health check

## License

Apache-2.0
