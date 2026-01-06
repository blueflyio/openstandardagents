# OSSA Wiki Content

This directory contains source content for the OSSA GitLab wiki.

## Publishing to Wiki

```bash
# Clone wiki repo
git clone https://gitlab.com/blueflyio/openstandardagents.wiki.git

# Copy content
cp -r .gitlab/wiki-content/* openstandardagents.wiki/

# Commit and push
cd openstandardagents.wiki
git add .
git commit -m "docs: update wiki"
git push
```

## File Standards

All files include description headers with purpose, audience, and educational focus.

## Educational Focus

Position OSSA as **the OpenAPI for AI agents** - a standard, not a framework.
