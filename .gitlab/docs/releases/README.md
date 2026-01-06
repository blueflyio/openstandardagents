# Release Management

Internal documentation for OSSA release processes and versioning.

## Release Process

1. **Milestone Planning** - See milestone organization docs
2. **Development** - Feature branches → development branch
3. **Release Candidate** - Create RC tag, test, validate
4. **Production Release** - Merge to main, publish to npm, deploy website
5. **Post-Release** - Announcements, documentation updates

## Documents

- `milestone-organization-v0.2.4.md` - Milestone structure and organization
- `v0.2.4-release-checklist.md` - Release checklist template

## Automation

Release automation is configured in `.gitlab/release-automation/`:
- Milestone webhooks
- Auto-increment dev tags
- RC creation
- Manual release buttons

See `.gitlab/release-automation/START_HERE.md` for details.
