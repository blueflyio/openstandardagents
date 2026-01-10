# DNS Migration Quick Start Guide

## TL;DR - Zero-Downtime Migration

**Good News**: No DNS changes needed! GitLab Pages uses the same IPs for all projects. Migration happens at GitLab's routing layer.

---

## 5-Minute Migration Checklist

### Step 1: Verify New Site Works (2 min)
```bash
# Test new site on GitLab Pages URL
curl -I https://blueflyio.gitlab.io/openstandardagents.org
```

### Step 2: Add Domain in GitLab (1 min)
1. Go to: https://gitlab.com/blueflyio/openstandardagents.org/-/settings/pages
2. Click "New Domain"
3. Add `openstandardagents.org`
4. Copy verification TXT record code

### Step 3: Add Verification TXT Record in Cloudflare (1 min)
1. Log in to Cloudflare DNS dashboard
2. Add TXT record:
   - Name: `_gitlab-pages-verification-code`
   - Value: `gitlab-pages-verification-code=<CODE-FROM-STEP-2>`

### Step 4: Wait & Verify (1-60 min)
```bash
# Check DNS propagation
dig TXT _gitlab-pages-verification-code.openstandardagents.org +short

# In GitLab, click "Retry verification" when DNS is propagated
```

### Step 5: Done!
- Traffic automatically routes to new project once verified
- SSL certificate auto-issued by Let's Encrypt
- Old site no longer serves domain

---

## Why No DNS Changes?

Your current DNS likely already points to GitLab Pages:
```
A    @ -> 35.185.44.232 (GitLab Pages IP)
CNAME www -> blueflyio.gitlab.io (GitLab namespace)
```

These are shared IPs/domains for ALL GitLab Pages sites. GitLab uses the `Host:` header (domain name) to route requests to the correct project.

**Current flow**:
```
openstandardagents.org -> GitLab Pages IP -> GitLab routes to blueflyio/openstandardagents
```

**After migration**:
```
openstandardagents.org -> GitLab Pages IP -> GitLab routes to blueflyio/openstandardagents.org
```

**No DNS change needed!** Just verify domain ownership in the new project.

---

## Rollback (If Needed)

Remove domain from new project in GitLab Pages settings. Traffic falls back to old project (if still configured).

**Rollback time**: 5 minutes

---

## Full Documentation

See `DNS_MIGRATION.md` for:
- Detailed troubleshooting
- Pre-migration checklist
- DNS record reference
- Post-migration tasks
