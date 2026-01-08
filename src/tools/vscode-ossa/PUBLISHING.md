# Publishing Guide for OSSA VS Code Extension

This guide explains how to publish the OSSA Language Support extension to the VS Code Marketplace.

## Prerequisites

1. **Visual Studio Code Account**
   - Create an account at [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
   - Create a publisher account

2. **Personal Access Token (PAT)**
   - Go to [Azure DevOps](https://dev.azure.com/)
   - Create a PAT with `Marketplace (Manage)` scope

3. **vsce (VS Code Extension Manager)**
   ```bash
   npm install -g @vscode/vsce
   ```

## Pre-Publishing Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Add/update extension icon at `images/icon.png` (128x128px PNG)
- [ ] Test extension thoroughly in VS Code
- [ ] Run `npm run lint` and fix any issues
- [ ] Run `npm run compile` successfully
- [ ] Verify all snippets work correctly
- [ ] Test schema validation with sample OSSA files

## Building the Extension

### 1. Install Dependencies
```bash
cd /Users/flux423/Sites/LLM/openstandardagents/src/tools/vscode-ossa
npm install
```

### 2. Compile TypeScript
```bash
npm run compile
```

### 3. Package the Extension
```bash
npm run package
```

This creates `ossa-language-support-0.1.0.vsix` (version varies).

## Testing the Package Locally

### Install from VSIX
```bash
code --install-extension ossa-language-support-0.1.0.vsix
```

### Test in Development Mode
1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test all features:
   - Create new `.ossa.yaml` file
   - Test snippets (`ossa-agent`, `ossa-task`, etc.)
   - Test validation (add intentional errors)
   - Test commands (Cmd+Shift+P → "OSSA: ...")
   - Check status bar indicator

## Publishing to Marketplace

### Initial Setup (One-time)

1. **Create Publisher**
   ```bash
   vsce create-publisher bluefly
   ```

2. **Login**
   ```bash
   vsce login bluefly
   # Enter your PAT when prompted
   ```

### Publish the Extension

```bash
# Publish current version
vsce publish

# Or publish with version bump
vsce publish patch  # 0.1.0 → 0.1.1
vsce publish minor  # 0.1.0 → 0.2.0
vsce publish major  # 0.1.0 → 1.0.0

# Or publish specific version
vsce publish 0.2.0
```

### Verify Publication
- Check [VS Code Marketplace](https://marketplace.visualstudio.com/vscode)
- Search for "OSSA" or "bluefly.ossa-language-support"
- Install from marketplace and test

## Icon Requirements

The extension icon should be:
- **Size**: 128x128 pixels
- **Format**: PNG
- **Location**: `images/icon.png`
- **Design**: Related to OSSA branding
- **Background**: Transparent or solid color

### Create Icon Placeholder
```bash
mkdir -p images
# Add your icon.png here (128x128px)
```

For now, you can use a simple OSSA logo or text-based icon.

## Update Checklist for New Releases

### Before Publishing
1. Update version in `package.json`
2. Update `CHANGELOG.md` with new features/fixes
3. Test all features
4. Run linter: `npm run lint`
5. Compile: `npm run compile`
6. Package: `npm run package`
7. Test locally with VSIX

### Publishing
```bash
vsce publish patch  # or minor/major
```

### After Publishing
1. Create GitHub release tag
2. Attach VSIX file to release
3. Update documentation
4. Announce on Discord/Twitter

## Unpublishing (Emergency Only)

```bash
# Unpublish specific version
vsce unpublish bluefly.ossa-language-support@0.1.0

# Unpublish entire extension (⚠️ DANGEROUS)
vsce unpublish bluefly.ossa-language-support
```

## Extension Update Strategy

### Versioning
Follow semantic versioning:
- **Patch** (0.1.X): Bug fixes, minor improvements
- **Minor** (0.X.0): New features, backward compatible
- **Major** (X.0.0): Breaking changes, major redesign

### When to Release
- **Patch**: Bug fixes → Release immediately
- **Minor**: New features → Release monthly
- **Major**: Breaking changes → Release with OSSA spec updates

## Marketplace Optimization

### Keywords (package.json)
Already configured:
- ossa
- ai-agents
- kubernetes
- yaml
- json-schema
- openapi
- agent-manifest
- llm
- ai

### Categories
Already configured:
- Programming Languages
- Snippets
- Linters
- Formatters

### README Best Practices
- ✅ Clear feature list
- ✅ Screenshots/GIFs (add these!)
- ✅ Installation instructions
- ✅ Quick start guide
- ✅ Configuration options
- ✅ Link to documentation

### Add Screenshots
Create animated GIFs showing:
1. Snippet autocomplete in action
2. Schema validation catching errors
3. IntelliSense suggestions
4. Command palette usage

Tools: LICEcap (Mac/Win), peek (Linux), or VS Code built-in recording.

## Support and Maintenance

### Issue Tracking
- GitHub Issues: https://gitlab.com/blueflyio/ossa/openstandardagents/issues
- Label extension issues with `vscode-extension`

### User Support
- Marketplace Q&A section
- GitHub Discussions
- Discord channel (if available)

## CI/CD Integration

### Automated Publishing (Future)

Add to `.gitlab-ci.yml`:
```yaml
publish-vscode-extension:
  stage: publish
  only:
    - tags
  script:
    - cd src/tools/vscode-ossa
    - npm install
    - npm run compile
    - vsce publish -p $VSCE_PAT
  environment:
    name: vscode-marketplace
```

Set `VSCE_PAT` as CI/CD variable in GitLab.

## Troubleshooting

### "Publisher not found"
```bash
vsce create-publisher bluefly
vsce login bluefly
```

### "Extension already exists"
If name is taken, update `publisher` in `package.json` to your personal publisher ID.

### "Invalid icon"
Ensure `images/icon.png` is exactly 128x128px PNG format.

### "Compilation errors"
```bash
npm run clean
npm install
npm run compile
```

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)

## Next Steps

1. Create icon at `images/icon.png`
2. Add screenshots to `images/` directory
3. Update README with screenshot references
4. Test thoroughly
5. Publish to marketplace
6. Announce to OSSA community!
