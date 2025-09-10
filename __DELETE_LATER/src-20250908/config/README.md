# OSSA Configuration

This directory contains all configuration files for the OSSA project, organized by purpose.

## Directory Structure

```
config/
├── ci/           # CI/CD and development tools configuration
│   ├── .pre-commit-config.yaml
│   └── .tddai-branch-protection.json
├── ossa/         # OSSA specification configuration
│   ├── framework-compatibility-matrix.yml
│   └── profiles/
└── README.md     # This file
```

## Configuration Types

### CI/CD Configuration (`config/ci/`)
- **`.pre-commit-config.yaml`** - Pre-commit hooks for code quality
- **`.tddai-branch-protection.json`** - Branch protection rules

### OSSA Configuration (`config/ossa/`)
- **`framework-compatibility-matrix.yml`** - Framework compatibility definitions
- **`profiles/`** - OSSA conformance profiles

## Usage

### Pre-commit Hooks
```bash
# Install pre-commit hooks
pre-commit install --config config/ci/.pre-commit-config.yaml

# Run hooks manually
pre-commit run --all-files --config config/ci/.pre-commit-config.yaml
```

### OSSA Validation
```bash
# Validate against compatibility matrix
ossa validate --config config/ossa/framework-compatibility-matrix.yml
```

This organization eliminates confusion between GitLab-specific CI configs and OSSA specification configs.