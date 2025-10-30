# GitLab Wiki Content

This directory contains ready-to-use content for GitLab Wiki pages documenting OSSA OpenAPI Extensions.

## Files

### OpenAPI-Extensions.md
**Main wiki page** - Complete documentation for OSSA OpenAPI/Swagger Specification Extensions.

**How to use:**
1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis
2. Click "New Page"
3. Title: `OpenAPI Extensions`
4. Slug: `openapi-extensions`
5. Copy content from `OpenAPI-Extensions.md`
6. Paste into wiki editor
7. Save

### Quick-Reference.md
**Quick reference page** - Cheat sheet with extension examples.

**How to use:**
1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis
2. Click "New Page"
3. Title: `OpenAPI Extensions Quick Reference`
4. Slug: `openapi-extensions-quick-reference`
5. Copy content from `Quick-Reference.md`
6. Paste into wiki editor
7. Save
8. Link from main wiki home page

## Wiki Structure Recommendation

```
Home
├── OpenAPI Extensions (main page)
│   └── OpenAPI Extensions Quick Reference
├── Specification
│   ├── OSSA v0.2.2
│   └── Migration Guide
├── Examples
└── Tools & SDKs
```

## Content Updates

When updating the main documentation (`docs/openapi-extensions.md`), also update:
1. This wiki content (`docs/wiki/OpenAPI-Extensions.md`)
2. The quick reference (`docs/wiki/Quick-Reference.md`)
3. The Drupal website (run `docs/create-openapi-extensions-doc.php`)

## Notes

- Wiki pages use GitLab Flavored Markdown
- Code blocks should be formatted with language tags
- Links to repository files use GitLab blob URLs
- External links use full URLs

