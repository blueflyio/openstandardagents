## Website Changes

<!-- Template for changes to the OSSA website (Next.js/React) -->

## Website Information

| Field | Value |
|-------|-------|
| Area | `website/` |
| Components | |
| Pages Affected | |
| Breaking Visual Changes | Yes / No |

## Type of Change

- [ ] New page/route
- [ ] Component update
- [ ] Styling/CSS changes
- [ ] Content update
- [ ] SEO improvements
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Bug fix
- [ ] Build/tooling changes

## Related Issues

Closes #

## Changes Summary

<!-- Describe the visual/functional changes -->

## Agent Validation

### Enabled by Default
- [x] `@bot-mr-reviewer` - Code review

### Optional Agents
- [ ] `@bot-lighthouse` - Performance audit
- [ ] `@bot-a11y` - Accessibility audit

### Website Commands
```
/review full          - Comprehensive review
/lighthouse           - Run Lighthouse audit
/a11y check           - Accessibility check
/build verify         - Verify build succeeds
```

## Website Checklist

### Code Quality
- [ ] TypeScript types are correct
- [ ] No ESLint warnings
- [ ] Components follow project patterns
- [ ] No unused imports/variables

### Performance
- [ ] Images are optimized (WebP/AVIF)
- [ ] No large bundle size increases
- [ ] Dynamic imports used where appropriate
- [ ] No layout shifts (CLS)

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader tested

### SEO
- [ ] Meta tags updated (if new page)
- [ ] Open Graph tags present
- [ ] Canonical URLs correct
- [ ] Structured data valid

### Responsive Design
- [ ] Mobile view tested
- [ ] Tablet view tested
- [ ] Desktop view tested
- [ ] No horizontal scroll

### Testing
- [ ] Unit tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Visual regression checked
- [ ] Cross-browser tested

## Screenshots

### Before
<!-- Add screenshots of current state -->

### After
<!-- Add screenshots of new state -->

### Mobile View
<!-- Add mobile screenshots -->

## Build Verification

```bash
# Local build check
npm run build
npm run lint
npm run test
```

## Preview Environment

<!-- Link to preview deployment if available -->
Preview URL:

## Lighthouse Scores

<!-- Run lighthouse and document scores -->
| Metric | Score |
|--------|-------|
| Performance | |
| Accessibility | |
| Best Practices | |
| SEO | |

## Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

## Documentation

- [ ] Component documentation updated
- [ ] Storybook stories updated (if applicable)
- [ ] README updated (if new setup required)

/label ~website ~frontend ~needs-review ~agent-assisted
/assign_reviewer @bot-mr-reviewer
