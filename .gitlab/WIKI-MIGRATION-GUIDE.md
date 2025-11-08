# GitLab Wiki Migration Guide

This guide explains how to migrate the wiki content from `.gitlab/wiki-content/` to GitLab Wiki.

## Overview

The wiki content has been structured in `.gitlab/wiki-content/` directory and needs to be migrated to GitLab Wiki.

## Directory Structure

```
.gitlab/wiki-content/
├── 00-HOME.md                    # Wiki home page
├── Getting-Started/
│   ├── 5-Minute-Overview.md
│   ├── Installation.md
│   ├── Hello-World.md
│   └── First-Agent.md
├── For-Audiences/
│   ├── Students-Researchers.md
│   ├── Developers.md
│   ├── Architects.md
│   └── Enterprises.md
├── Technical/
│   └── (to be created)
├── Examples/
│   └── Migration-Guides.md
└── Ecosystem/
    └── (to be created)
```

## Migration Steps

### Step 1: Access GitLab Wiki

1. Navigate to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis
2. Click "New page" or edit existing pages

### Step 2: Create Wiki Structure

Create pages in this order:

1. **Home** (00-HOME.md → Home)
   - Copy content from `.gitlab/wiki-content/00-HOME.md`
   - This becomes the wiki home page

2. **Getting Started Section**
   - Create page: "Getting-Started/5-Minute-Overview"
   - Copy from: `.gitlab/wiki-content/Getting-Started/5-Minute-Overview.md`
   - Repeat for all Getting-Started pages

3. **For Audiences Section**
   - Create page: "For-Audiences/Students-Researchers"
   - Copy from corresponding .md files
   - Repeat for all audience pages

4. **Technical Section**
   - Create technical documentation pages
   - Link to schema reference
   - Add API documentation

5. **Examples Section**
   - Create examples documentation
   - Link to repository examples
   - Add migration guides

6. **Ecosystem Section**
   - Document ecosystem components
   - Link to agent-buildkit
   - Add community resources

### Step 3: Update Links

After creating pages, update internal links:

- GitLab Wiki uses different link syntax
- Update markdown links to GitLab wiki format
- Test all links

### Step 4: Add Navigation

Create navigation structure:

- Use GitLab wiki sidebar
- Add table of contents to home page
- Link related pages

## GitLab Wiki Link Format

### Internal Links

```markdown
[Link Text](page-name)
[Link Text](section/page-name)
```

### External Links

```markdown
[Link Text](https://example.com)
```

### Repository Links

```markdown
[File Link](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/blob/main/path/to/file)
```

## Page Naming Convention

Use these page names in GitLab Wiki:

- `Home` (home page)
- `Getting-Started/5-Minute-Overview`
- `Getting-Started/Installation`
- `Getting-Started/Hello-World`
- `Getting-Started/First-Agent`
- `For-Audiences/Students-Researchers`
- `For-Audiences/Developers`
- `For-Audiences/Architects`
- `For-Audiences/Enterprises`
- `Technical/Specification-Deep-Dive`
- `Technical/Schema-Reference`
- `Examples/Migration-Guides`
- `Ecosystem/OSSA-Standard`

## Content Updates Needed

### Replace Local Paths

Replace local file paths with GitLab links:

**Before**:
```markdown
[examples/getting-started/hello-world-complete.ossa.yaml](examples/getting-started/hello-world-complete.ossa.yaml)
```

**After**:
```markdown
[examples/getting-started/hello-world-complete.ossa.yaml](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/blob/main/examples/getting-started/hello-world-complete.ossa.yaml)
```

### Update Cross-References

Update all cross-references to use GitLab wiki page names:

**Before**:
```markdown
[Hello World Tutorial](Hello-World)
```

**After**:
```markdown
[Hello World Tutorial](Getting-Started/Hello-World)
```

## Verification Checklist

After migration:

- [ ] All pages created
- [ ] All links work
- [ ] Navigation structure clear
- [ ] Content matches source files
- [ ] Examples link to repository
- [ ] Cross-references work
- [ ] Home page has proper navigation

## Maintenance

### Updating Wiki Content

1. Update source files in `.gitlab/wiki-content/`
2. Copy changes to GitLab Wiki
3. Test links and formatting
4. Update related pages if needed

### Adding New Pages

1. Create source file in `.gitlab/wiki-content/`
2. Create corresponding GitLab Wiki page
3. Update navigation/home page
4. Add cross-references

## Related

- [Issue Templates](../.gitlab/issue_templates/)
- [Milestones](../.gitlab/milestones/)
- [Labels Structure](../.gitlab/labels-structure.md)

