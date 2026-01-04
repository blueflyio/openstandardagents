# DNS Migration Guide: openstandardagents.org
## GitLab Pages Domain Migration

**Project**: blueflyio/openstandardagents.org
**Domain**: openstandardagents.org
**Migration Type**: Zero-downtime DNS cutover
**Last Updated**: 2025-11-30

---

## Executive Summary

This document outlines the migration of openstandardagents.org from the old GitLab Pages project (`blueflyio/openstandardagents`) to the new project (`blueflyio/openstandardagents.org`).

**Current Setup**:
- Old Project: `blueflyio/openstandardagents`
- Old Pages URL: `blueflyio.gitlab.io/openstandardagents`
- Custom Domain: `openstandardagents.org` → Old Project

**Target Setup**:
- New Project: `blueflyio/openstandardagents.org`
- New Pages URL: `blueflyio.gitlab.io/openstandardagents.org`
- Custom Domain: `openstandardagents.org` → New Project

**Strategy**: Blue-green deployment with DNS cutover (zero-downtime)

---

## Pre-Migration Checklist

### Phase 1: Current State Documentation
- [ ] Document current DNS records in Cloudflare
- [ ] Verify current site is accessible at `openstandardagents.org`
- [ ] Verify old project Pages URL: `blueflyio.gitlab.io/openstandardagents`
- [ ] Screenshot current Cloudflare DNS settings
- [ ] Screenshot current GitLab Pages settings in old project
- [ ] Backup current DNS settings to JSON/CSV export from Cloudflare

### Phase 2: New Site Preparation
- [ ] Verify new project exists: `blueflyio/openstandardagents.org`
- [ ] Verify GitLab CI/CD pipeline is configured (`.gitlab-ci.yml`)
- [ ] Run initial pipeline to generate Pages artifacts
- [ ] Verify new site deploys successfully to `blueflyio.gitlab.io/openstandardagents.org`
- [ ] Test new site functionality on GitLab Pages subdomain
- [ ] Verify SSL certificate works on `blueflyio.gitlab.io/openstandardagents.org`

### Phase 3: Domain Verification Setup
- [ ] Access GitLab Project: Settings > Pages > New Domain
- [ ] Add `openstandardagents.org` (root domain)
- [ ] Add `www.openstandardagents.org` (www subdomain)
- [ ] Copy verification TXT record codes from GitLab
- [ ] Have Cloudflare account credentials ready
- [ ] Have GitLab project Maintainer/Owner access confirmed

### Phase 4: Content Verification
- [ ] Compare old site vs new site for content parity
- [ ] Test all critical user journeys on new site (via GitLab Pages URL)
- [ ] Verify analytics/tracking codes are present (if applicable)
- [ ] Test mobile responsiveness on new site
- [ ] Check for broken links, images, or assets

---

## Current DNS Configuration (Expected)

### Before Migration - Cloudflare DNS Records

**Assumed Current Setup** (verify before proceeding):

| Type  | Name | Content                               | Proxy Status | TTL  |
|-------|------|---------------------------------------|--------------|------|
| A     | @    | 35.185.44.232                         | Proxied      | Auto |
| AAAA  | @    | 2600:1901:0:7b8a::                   | Proxied      | Auto |
| CNAME | www  | blueflyio.gitlab.io                  | Proxied      | Auto |
| TXT   | _gitlab-pages-verification-code | `<old-verification-code>` | DNS Only | Auto |

**Note**: Actual records may differ. Document actual state before proceeding.

---

## Migration Steps

### Step 1: Add Domain to New GitLab Project

1. Navigate to GitLab:
   ```
   https://gitlab.com/blueflyio/openstandardagents.org/-/settings/pages
   ```

2. Click **"New Domain"**

3. Add **Root Domain**:
   - Domain: `openstandardagents.org`
   - Automatic certificate management: **Enabled** (Let's Encrypt)
   - Click **"Create New Domain"**

4. Copy the verification TXT record value:
   ```
   Record name: _gitlab-pages-verification-code.openstandardagents.org
   Record value: gitlab-pages-verification-code=<NEW-CODE>
   ```

5. Add **WWW Subdomain**:
   - Domain: `www.openstandardagents.org`
   - Automatic certificate management: **Enabled**
   - Click **"Create New Domain"**

6. Copy the WWW verification TXT record value:
   ```
   Record name: _gitlab-pages-verification-code.www.openstandardagents.org
   Record value: gitlab-pages-verification-code=<NEW-WWW-CODE>
   ```

---

### Step 2: Prepare DNS Records in Cloudflare (Do Not Apply Yet)

**IMPORTANT**: Prepare these records but DO NOT save/apply until Step 4.

Login to Cloudflare Dashboard:
```
https://dash.cloudflare.com/
```

Navigate to: **DNS > Records**

#### A. Add New Verification TXT Records

**Root Domain Verification**:
- Type: `TXT`
- Name: `_gitlab-pages-verification-code`
- Content: `gitlab-pages-verification-code=<NEW-CODE>` (from Step 1.4)
- TTL: `Auto`
- Proxy status: `DNS only`

**WWW Subdomain Verification**:
- Type: `TXT`
- Name: `_gitlab-pages-verification-code.www`
- Content: `gitlab-pages-verification-code=<NEW-WWW-CODE>` (from Step 1.6)
- TTL: `Auto`
- Proxy status: `DNS only`

#### B. Prepare Updated DNS Records (Stage for Application)

**Keep these staged in notepad/text editor for quick application in Step 4**:

| Type  | Name | Content                               | Proxy Status | TTL  | Action |
|-------|------|---------------------------------------|--------------|------|--------|
| A     | @    | 35.185.44.232                         | Proxied      | Auto | Update |
| AAAA  | @    | 2600:1901:0:7b8a::                   | Proxied      | Auto | Update |
| CNAME | www  | blueflyio.gitlab.io                  | Proxied      | Auto | Keep   |
| TXT   | _gitlab-pages-verification-code | `<NEW-ROOT-CODE>` | DNS Only | Auto | Add    |
| TXT   | _gitlab-pages-verification-code.www | `<NEW-WWW-CODE>` | DNS Only | Auto | Add    |

**Note**: The A/AAAA records point to GitLab Pages IPs and won't change. The CNAME for www also stays the same.

---

### Step 3: Verify Domain Ownership in GitLab

1. Add ONLY the verification TXT records in Cloudflare (Step 2A)
2. Wait for DNS propagation (check with `dig` or `nslookup`):
   ```bash
   # Check root domain verification
   dig TXT _gitlab-pages-verification-code.openstandardagents.org +short

   # Check www subdomain verification
   dig TXT _gitlab-pages-verification-code.www.openstandardagents.org +short
   ```

3. Return to GitLab Pages settings:
   ```
   https://gitlab.com/blueflyio/openstandardagents.org/-/settings/pages
   ```

4. For each domain, click **"Retry verification"** (may take up to 24 hours for DNS propagation)

5. Wait for **"Verified"** status on both domains

6. Verify SSL certificate is issued automatically by Let's Encrypt

---

### Step 4: DNS Cutover (Zero-Downtime)

**Prerequisites**:
- [ ] GitLab domains verified (Step 3)
- [ ] SSL certificates issued
- [ ] New site fully tested on `blueflyio.gitlab.io/openstandardagents.org`

**Execution Window**: Choose low-traffic period if possible (optional, migration is zero-downtime)

#### 4.1. Test New Site Before Cutover

Test that the new GitLab Pages site is accessible via its default URL:
```bash
curl -I https://blueflyio.gitlab.io/openstandardagents.org
```

Expected: `200 OK` with valid SSL certificate

#### 4.2. Remove Domain from Old Project (Optional - Can do after cutover)

This step can be performed after cutover to avoid any race conditions:
1. Navigate to old project: `https://gitlab.com/blueflyio/openstandardagents/-/settings/pages`
2. Find `openstandardagents.org` domain
3. Click **"Remove"** (Do this AFTER confirming new site works)

#### 4.3. DNS Records Are Already Correct!

**Good News**: Since GitLab Pages uses the same IP addresses and `blueflyio.gitlab.io` namespace for all projects, your existing DNS records should already work once GitLab verification is complete.

**Current DNS** (what you likely have):
```
A     @ -> 35.185.44.232
AAAA  @ -> 2600:1901:0:7b8a::
CNAME www -> blueflyio.gitlab.io
```

**These point to GitLab's infrastructure, not a specific project.**

GitLab's routing layer uses the `Host:` header to determine which project serves the content. Once the domain is verified in the NEW project, GitLab will automatically route traffic there.

#### 4.4. Cutover is Automatic After Verification

Once GitLab verifies your domain in the NEW project:
1. GitLab updates its routing tables
2. Traffic to `openstandardagents.org` is routed to `blueflyio/openstandardagents.org`
3. Old project no longer serves the domain (even if domain is still configured there)

**No DNS changes needed!** (unless your current DNS differs from standard GitLab Pages setup)

---

### Step 5: Verification and Testing

#### 5.1. DNS Propagation Check
```bash
# Check A record
dig A openstandardagents.org +short

# Check AAAA record
dig AAAA openstandardagents.org +short

# Check WWW CNAME
dig CNAME www.openstandardagents.org +short

# Check TXT verification records
dig TXT _gitlab-pages-verification-code.openstandardagents.org +short
dig TXT _gitlab-pages-verification-code.www.openstandardagents.org +short
```

#### 5.2. Site Accessibility Tests
```bash
# Test root domain
curl -I https://openstandardagents.org
curl -L https://openstandardagents.org | head -n 20

# Test www subdomain
curl -I https://www.openstandardagents.org
curl -L https://www.openstandardagents.org | head -n 20

# Test SSL certificate
openssl s_client -connect openstandardagents.org:443 -servername openstandardagents.org < /dev/null 2>/dev/null | openssl x509 -noout -text | grep -A2 "Issuer"
```

#### 5.3. Browser Testing
- [ ] Visit `https://openstandardagents.org` in incognito/private mode
- [ ] Visit `https://www.openstandardagents.org` in incognito/private mode
- [ ] Verify SSL certificate shows "Let's Encrypt" or custom cert
- [ ] Test all major pages/routes
- [ ] Test on mobile devices
- [ ] Clear browser cache and test again

#### 5.4. Monitoring
- [ ] Check GitLab Pages analytics (if enabled)
- [ ] Monitor error logs in GitLab CI/CD
- [ ] Check Cloudflare analytics for traffic patterns
- [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)

---

## Rollback Plan

### Immediate Rollback (Within 5 Minutes of Issues)

If critical issues arise immediately after cutover:

#### Option 1: Remove Domain from New Project (Fastest)
1. Navigate to: `https://gitlab.com/blueflyio/openstandardagents.org/-/settings/pages`
2. Click **"Remove"** next to `openstandardagents.org`
3. Traffic will fall back to old project if domain is still configured there

#### Option 2: Re-add Domain to Old Project
1. Navigate to: `https://gitlab.com/blueflyio/openstandardagents/-/settings/pages`
2. Click **"New Domain"**
3. Add `openstandardagents.org`
4. Domain verification should still be valid (same TXT record)
5. GitLab will route traffic back to old project

**Rollback Time**: 5-10 minutes (no DNS changes needed, GitLab routing only)

### DNS Rollback (If Needed)

**Note**: Unlikely to be needed since we're not changing DNS records.

If you modified DNS records and need to revert:
1. Log in to Cloudflare
2. Restore previous DNS records from backup (Step 2, Pre-Migration Checklist)
3. Wait for DNS propagation (5-60 minutes depending on TTL)

---

## Post-Migration Tasks

### Immediate (Within 24 Hours)
- [ ] Monitor site availability and performance
- [ ] Check SSL certificate auto-renewal is configured
- [ ] Verify analytics/tracking is working
- [ ] Test all forms and interactive features
- [ ] Update any documentation referencing old project URL

### Short-term (Within 1 Week)
- [ ] Remove domain configuration from old project (if not already done)
- [ ] Archive or delete old project: `blueflyio/openstandardagents` (if no longer needed)
- [ ] Update any external links to point to new project
- [ ] Configure redirect rules in GitLab (if old URLs need to redirect)
- [ ] Set up automated monitoring/alerting

### Long-term (Within 1 Month)
- [ ] Review and optimize Cloudflare caching rules
- [ ] Enable Cloudflare features (e.g., minification, Brotli, HTTP/3)
- [ ] Set up custom error pages in GitLab Pages
- [ ] Document lessons learned
- [ ] Update runbooks and disaster recovery procedures

---

## Technical Reference

### GitLab Pages IPs (As of 2025-11-30)
```
IPv4: 35.185.44.232
IPv6: 2600:1901:0:7b8a::
```

**Source**: https://docs.gitlab.com/ee/user/project/pages/custom_domains_ssl_tls_certification/

**Note**: These IPs may change. Always verify current IPs in GitLab documentation before migration.

### DNS Propagation Check Tools
- `dig` (command-line): `dig A openstandardagents.org`
- `nslookup` (command-line): `nslookup openstandardagents.org`
- Online tools:
  - https://www.whatsmydns.net/
  - https://dnschecker.org/
  - https://mxtoolbox.com/SuperTool.aspx

### GitLab Pages Documentation
- Custom Domains: https://docs.gitlab.com/ee/user/project/pages/custom_domains_ssl_tls_certification/
- GitLab Pages: https://docs.gitlab.com/ee/user/project/pages/
- Let's Encrypt Integration: https://docs.gitlab.com/ee/user/project/pages/custom_domains_ssl_tls_certification/#lets-encrypt-integration

### Cloudflare DNS Documentation
- DNS Records: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
- Proxied vs DNS-only: https://developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/

---

## Troubleshooting

### Issue: Domain verification fails in GitLab

**Symptoms**: "Details Unverified" status on domain in GitLab Pages settings

**Causes**:
1. TXT record not propagated yet
2. Incorrect TXT record value
3. TXT record has wrong name

**Solutions**:
```bash
# Verify TXT record is correct
dig TXT _gitlab-pages-verification-code.openstandardagents.org +short

# Expected output:
# "gitlab-pages-verification-code=<CODE>"

# If empty or incorrect, update in Cloudflare and wait 5-60 minutes
```

---

### Issue: SSL certificate not issued

**Symptoms**: Certificate status shows "Pending" or "Failed"

**Causes**:
1. Domain not verified yet
2. Let's Encrypt rate limit hit
3. DNS not pointing to GitLab Pages

**Solutions**:
1. Ensure domain is verified first
2. Wait 1 hour and retry (rate limit may be temporary)
3. Verify A/AAAA records point to GitLab Pages IPs:
   ```bash
   dig A openstandardagents.org +short
   # Should return: 35.185.44.232
   ```

---

### Issue: Site shows old content after migration

**Symptoms**: Browser shows cached version of old site

**Causes**:
1. Browser cache
2. Cloudflare cache
3. DNS cache on local machine

**Solutions**:
```bash
# 1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

# 2. Purge Cloudflare cache
# Navigate to: Cloudflare Dashboard > Caching > Purge Everything

# 3. Clear local DNS cache
# macOS:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux:
sudo systemd-resolve --flush-caches

# Windows (PowerShell as Admin):
ipconfig /flushdns
```

---

### Issue: www subdomain not working

**Symptoms**: `www.openstandardagents.org` returns error or wrong site

**Causes**:
1. CNAME record incorrect
2. www domain not verified in GitLab
3. SSL certificate not issued for www

**Solutions**:
```bash
# 1. Verify CNAME record
dig CNAME www.openstandardagents.org +short
# Should return: blueflyio.gitlab.io

# 2. Check www domain verification in GitLab
# Navigate to: Settings > Pages
# Ensure www.openstandardagents.org shows "Verified"

# 3. Wait for SSL certificate issuance (up to 1 hour)
```

---

### Issue: Mixed content warnings (HTTP/HTTPS)

**Symptoms**: Browser console shows "Mixed Content" warnings

**Causes**:
1. Some assets loaded over HTTP instead of HTTPS
2. Hard-coded HTTP URLs in HTML/CSS/JS

**Solutions**:
1. Update all asset URLs to use HTTPS or protocol-relative URLs (`//example.com/asset.js`)
2. Enable "Force HTTPS" in GitLab Pages settings:
   ```
   Settings > Pages > Force HTTPS via redirect
   ```
3. Add Content Security Policy headers to enforce HTTPS

---

## Appendix A: Example DNS Record Export (JSON)

```json
{
  "records": [
    {
      "type": "A",
      "name": "@",
      "content": "35.185.44.232",
      "proxied": true,
      "ttl": 1
    },
    {
      "type": "AAAA",
      "name": "@",
      "content": "2600:1901:0:7b8a::",
      "proxied": true,
      "ttl": 1
    },
    {
      "type": "CNAME",
      "name": "www",
      "content": "blueflyio.gitlab.io",
      "proxied": true,
      "ttl": 1
    },
    {
      "type": "TXT",
      "name": "_gitlab-pages-verification-code",
      "content": "gitlab-pages-verification-code=XXXXXXXXXXXXXXXX",
      "proxied": false,
      "ttl": 1
    },
    {
      "type": "TXT",
      "name": "_gitlab-pages-verification-code.www",
      "content": "gitlab-pages-verification-code=YYYYYYYYYYYYYYYY",
      "proxied": false,
      "ttl": 1
    }
  ]
}
```

---

## Appendix B: Migration Timeline Example

| Time  | Task                                      | Duration | Owner        |
|-------|-------------------------------------------|----------|--------------|
| T-48h | Pre-migration checklist                   | 2 hours  | DevOps       |
| T-24h | New site verification and testing         | 4 hours  | QA/DevOps    |
| T-2h  | Final content verification                | 1 hour   | Product Team |
| T-1h  | Add verification TXT records              | 15 min   | DevOps       |
| T-30m | Wait for DNS propagation and verify       | 30 min   | DevOps       |
| T-0   | Verify domain in GitLab (automatic route) | 5 min    | DevOps       |
| T+5m  | Verification tests                        | 10 min   | QA/DevOps    |
| T+15m | Browser testing                           | 15 min   | QA Team      |
| T+1h  | Monitor traffic and errors                | 1 hour   | DevOps       |
| T+24h | Post-migration tasks                      | 2 hours  | DevOps       |

**Total Active Time**: ~4 hours
**Total Elapsed Time**: 48 hours (mostly waiting/monitoring)

---

## Contact and Support

**Project Owner**: BlueFly.io
**GitLab Project**: https://gitlab.com/blueflyio/openstandardagents.org
**GitLab Issues**: https://gitlab.com/blueflyio/openstandardagents.org/-/issues

**Emergency Contacts**:
- DNS/Cloudflare Issues: [Add contact]
- GitLab Pages Issues: [Add contact]
- Technical Lead: [Add contact]

**External Support**:
- GitLab Support: https://about.gitlab.com/support/
- Cloudflare Support: https://support.cloudflare.com/

---

**Document Version**: 1.0
**Last Reviewed**: 2025-11-30
**Next Review**: 2026-02-28
