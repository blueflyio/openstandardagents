# Kubernetes Deployment for OrbStack

This directory contains Kubernetes manifests and scripts for deploying the OSSA website to OrbStack.

## Architecture

- **Main Site**: Deployed to `default` namespace, accessible at `http://ossa.orb.local`
- **Review Environments**: Deployed to `review-{MR_ID}` namespaces, accessible at `http://ossa-mr-{MR_ID}.ossa.orb.local`

## Main Site Deployment

Deploy the main website to OrbStack Kubernetes:

```bash
./k8s/local-deploy.sh
```

This will:
1. Deploy to `default` namespace
2. Create Deployment, Service, ConfigMap, and Ingress
3. Make site available at `http://ossa.orb.local`

## Review Environment Deployment

### Manual Deployment

Deploy a review environment for a specific MR:

```bash
./k8s/review-app-deploy.sh <MR_ID> <IMAGE_TAG>
```

Example:
```bash
./k8s/review-app-deploy.sh 169 registry.gitlab.com/blueflyio/openstandardagents.org:abc123
```

This will:
1. Create namespace `review-{MR_ID}`
2. Deploy review app with the specified image
3. Create Ingress at `http://ossa-mr-{MR_ID}.ossa.orb.local`

### Automatic Deployment (GitLab CI)

Review environments are automatically deployed via GitLab CI when:
- A merge request is created
- The pipeline includes the `review:deploy` job
- The GitLab Kubernetes Agent is configured

The CI job uses `.gitlab/ci/review-app.yml` which:
- Builds the website
- Builds Docker image
- Deploys to Kubernetes using the review-app.yaml template
- Creates environment at `http://ossa-mr-{MR_ID}.ossa.orb.local`

## Files

- `deployment.yaml` - Main site deployment (ossa.orb.local)
- `review-app.yaml` - Review environment template (uses envsubst variables)
- `local-deploy.sh` - Script to deploy main site
- `review-app-deploy.sh` - Script to deploy review environment

## URLs

- Main site: `http://ossa.orb.local`
- Review MR 169: `http://ossa-mr-169.ossa.orb.local`
- Review MR 170: `http://ossa-mr-170.ossa.orb.local`

## Prerequisites

1. OrbStack running with Kubernetes enabled
2. kubectl configured to connect to OrbStack cluster
3. nginx ingress controller installed in OrbStack

## Troubleshooting

### Check deployment status:
```bash
kubectl get pods -n default | grep ossa
kubectl get ingress -n default | grep ossa
```

### Check review environment:
```bash
kubectl get pods -n review-{MR_ID}
kubectl get ingress -n review-{MR_ID}
```

### View logs:
```bash
# Main site
kubectl logs -f deployment/ossa-website -n default

# Review environment
kubectl logs -f -n review-{MR_ID} -l app=ossa-review
```

### Delete review environment:
```bash
kubectl delete namespace review-{MR_ID}
```
