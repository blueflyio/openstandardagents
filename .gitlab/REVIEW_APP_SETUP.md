# Review App Setup for OrbStack

## Prerequisites
1. OrbStack running with Kubernetes enabled
2. kubectl configured for OrbStack context

## Setup Steps

### 1. Get your kubeconfig
```bash
kubectl config view --flatten --minify > /tmp/orbstack-kubeconfig
cat /tmp/orbstack-kubeconfig | base64
```

### 2. Add to GitLab CI/CD Variables
Go to: Settings → CI/CD → Variables

Add variable:
- **Key**: `KUBECONFIG_ORBSTACK`
- **Value**: (paste the base64 output from step 1)
- **Type**: Variable
- **Protected**: No
- **Masked**: Yes

### 3. Install nginx-ingress in OrbStack
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

### 4. Add DNS entry
Add to `/etc/hosts`:
```
127.0.0.1 ossa-mr-*.ossa.orb.local
```

Or use wildcard DNS with dnsmasq.

## Usage

1. Open any MR
2. Go to Deployments → Environments
3. Click "Deploy" on the review app
4. Access at: `https://ossa-mr-{MR_NUMBER}.ossa.orb.local`

## Cleanup

Review apps auto-stop after 1 day, or click "Stop" manually.
