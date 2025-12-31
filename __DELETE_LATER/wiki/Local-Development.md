# Local Development Setup

## Quick Start

The OSSA website runs locally at:
- **Development**: http://localhost:3000 (Next.js dev server)
- **OrbStack**: http://ossa.orb.local (Kubernetes deployment)

## Local Development Server

```bash
cd website
npm run dev
```

Access at http://localhost:3000

## OrbStack Deployment

The site is deployed to OrbStack Kubernetes and accessible at http://ossa.orb.local

### Architecture
- **Namespace**: `default`
- **Deployment**: `ossa-website`
- **Service**: `ossa-website` (ClusterIP)
- **Ingress**: `ossa-website` (nginx)
- **ConfigMap**: `ossa-site` (contains built static files)

### Update Deployment

```bash
# 1. Build the site
cd website
npm run build

# 2. Update ConfigMap
kubectl delete configmap ossa-site -n default
kubectl create configmap ossa-site --from-file=./out -n default

# 3. Restart deployment
kubectl rollout restart deployment/ossa-website -n default
```

### Check Status

```bash
# Check pods
kubectl get pods -n default | grep ossa

# Check service
kubectl get svc ossa-website -n default

# Check ingress
kubectl get ingress ossa-website -n default

# View logs
kubectl logs -f deployment/ossa-website -n default
```

## Domain Configuration

The domain `ossa.orb.local` is configured in `/etc/hosts`:

```
192.168.139.2 ossa.orb.local
```

This points to OrbStack's Kubernetes ingress controller.

## Related Domains

See the technical docs wiki for a complete list of all local development domains.

### Key OSSA Domains
- `ossa.orb.local` - Main website (this deployment)
- `ossa.local.bluefly.io` - OSSA Framework services
- `gateway.ossa-prod.local.bluefly.io` - Production gateway

## Build Process

### Development Build
```bash
npm run dev
```
- Hot reload enabled
- Source maps included
- Not optimized

### Production Build
```bash
npm run build
```
- Optimized bundle
- Static export to `out/`
- Ready for deployment

### Build Scripts
- `npm run fetch-spec` - Fetch OpenAPI specs from GitLab
- `npm run fetch-examples` - Fetch example files
- `npm run fetch-versions` - Generate version metadata
- `npm run sync-version` - Sync package version
- `npm run sync-wiki` - Sync GitLab wiki pages

## Environment Variables

No environment variables required for local development. All configuration is in:
- `next.config.js` - Next.js configuration
- `lib/versions.json` - Version metadata
- `public/examples.json` - Example files

## Troubleshooting

### Site not accessible at ossa.orb.local

1. Check OrbStack is running:
   ```bash
   docker ps
   ```

2. Check deployment:
   ```bash
   kubectl get deployment ossa-website -n default
   ```

3. Check ingress:
   ```bash
   kubectl get ingress ossa-website -n default
   ```

4. Check hosts file:
   ```bash
   grep ossa.orb.local /etc/hosts
   ```

### Build fails

1. Clear cache:
   ```bash
   rm -rf .next out node_modules
   npm install
   ```

2. Check Node version:
   ```bash
   node --version  # Should be 20.x
   ```

### ConfigMap too large

If the ConfigMap exceeds Kubernetes limits:

1. Use a different deployment method (Docker image)
2. Or split into multiple ConfigMaps
3. Or use a PersistentVolume

## CI/CD Pipeline

The GitLab CI pipeline automatically:
1. Builds the site on every push
2. Creates review apps for merge requests
3. Deploys to staging (development branch)
4. Manual deploy to production (main branch)

See `.gitlab-ci.yml` for full pipeline configuration.

## Next Steps

- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Documentation](../docs/architecture/)
- [API Documentation](../docs/api/)
