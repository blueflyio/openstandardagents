# Scripts Directory

TypeScript-based automation scripts for openstandardagents.org project.

## Structure

```
scripts/
├── openapi/          # OpenAPI schema generation and validation
├── generators/       # Code and content generators
├── cli/              # CLI tools and utilities
├── utils/            # Shared utilities and helpers
└── website/          # Website-specific scripts
```

## Requirements

- Node.js >= 20.0.0
- TypeScript >= 5.0.0
- Zod for runtime validation
- All scripts must be typed and validated

## Adding New Scripts

1. Create TypeScript file in appropriate subdirectory
2. Add Zod schemas for input validation
3. Export functions, not just execute
4. Add to package.json scripts section
5. Document in this README
