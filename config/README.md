# Configuration Files

This directory contains all project configuration files organized by category.

## Structure

```
config/
├── ossa/              # OSSA-specific configuration
│   └── .ossa.config.yaml
├── nginx/             # Nginx server configuration
│   └── nginx.conf
├── release/           # Release automation configuration
│   └── .releaserc.json
├── docs/              # Documentation tooling configuration
│   ├── .redocly.yaml
│   └── .wiki-config.json
├── linting/           # Linting and validation configuration
│   └── .spectral.yaml
├── messenger.yaml     # Messenger service configuration
├── services-messenger.yaml
└── devfile.yaml       # GitLab Workspaces devfile
```

## Tool compatibility (no symlinks)

Symlinks are not allowed per platform policy. Invoke tools with explicit config paths:

- OSSA config: `--config config/ossa/.ossa.config.yaml`
- Nginx: use `config/nginx/nginx.conf` in Docker/compose or copy into build context
- Devfile: `config/devfile.yaml`
- Redocly: `--config config/docs/.redocly.yaml` or equivalent
- Spectral: `--ruleset config/linting/.spectral.yaml`
- Release: `config/release/.releaserc.json` (or set in package.json / CI)
- Wiki: `config/docs/.wiki-config.json`

All configuration files live under `config/`; update only the files in this directory.
