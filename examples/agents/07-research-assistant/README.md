# Research Assistant

Academic research agent with paper search and citation generation.

## Features

- Multi-database literature search (PubMed, arXiv, Semantic Scholar)
- Paper summarization
- Citation generation (APA, MLA, Chicago, BibTeX)
- Study comparison
- Summary memory for long sessions

## Quick Start

```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker-compose up -d

curl -X POST http://localhost:8086/v1/search \
  -d '{"query": "machine learning in healthcare", "databases": ["pubmed", "arxiv"]}'
```

## Export to LangChain

```bash
ossa export agent.ossa.yaml --platform langchain --output research_agent.py
```

## License

Apache-2.0
