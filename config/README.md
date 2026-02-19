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

## Symlinks

The following files are symlinked from the project root for tool compatibility:

- `.ossa.config.yaml` → `config/ossa/.ossa.config.yaml`
- `nginx.conf` → `config/nginx/nginx.conf`
- `devfile.yaml` → `config/devfile.yaml`
- `.redocly.yaml` → `config/docs/.redocly.yaml`
- `.spectral.yaml` → `config/linting/.spectral.yaml`
- `.releaserc.json` → `config/release/.releaserc.json`
- `.wiki-config.json` → `config/docs/.wiki-config.json`

## Notes

- Tools that expect config files in root will work via symlinks
- All actual configuration files are stored here for organization
- Update files in `config/` directory, not the symlinks
