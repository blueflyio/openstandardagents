# OSSA Complete Workflow Demo - Quick Start

## One-Line Run

```bash
./demo-complete-workflow.mjs
```

## What You'll See

### Step 1: Agent Creation
```
📋 Step 1: Loading Agent Manifest
✓ Agent loaded: mr-reviewer v1.0.0
```

### Step 2: Multi-Platform Export (6 platforms)
```
📦 Step 2: Exporting to Multiple Platforms
✓ kagent: 10 files generated
✓ docker: 6 files generated
✓ kubernetes: 8 files generated
✓ langchain: 6 files generated
✓ npm: 7 files generated
✓ drupal: 9 files generated
```

### Step 3: GAID Generation
```
🆔 Step 3: Generating Global Agent ID (GAID)
✓ GAID generated: did:ossa:bluefly:00000000000000000000000044a94d0c
✓ Agent ID Card created (60+ metadata fields)
```

### Step 4: Validation
```
✅ Step 4: Validating Agent Compliance
✓ OSSA v0.4.1 compliance: 98.5%
✓ Test coverage: 92%
✓ Security score: 95%
```

### Step 5: Statistics
```
📊 Step 5: Export Statistics
Total files generated: 46
Total size: 3.6 KB
Platforms exported: 6
```

## Output Location

```bash
tmp/ossa-demo/
├── agent-card.json      # Agent identity (GAID + metadata)
├── summary.json         # Execution metrics
├── kagent/             # 10 Kubernetes files
├── docker/             # 6 Docker files
├── kubernetes/         # 8 Kustomize files
├── langchain/          # 6 Python files
├── npm/                # 7 Node.js files
└── drupal/             # 9 PHP files
```

## Key Metrics

- **Files**: 46 across 6 platforms
- **Time**: ~30ms
- **Speed**: 1,533 files/second
- **Quality**: 98.5% compliance

## Next Steps

```bash
# View results
cat tmp/ossa-demo/summary.json

# Explore exports
ls -R tmp/ossa-demo/

# Deploy to Kubernetes
ossa deploy examples/mr-reviewer-with-governance.ossa.yaml --platform kubernetes
```

## Requirements

- Node.js 18+
- Terminal with ANSI color support

## Documentation

- Full guide: `DEMO_WORKFLOW_README.md`
- Delivery summary: `DEMO_DELIVERY_SUMMARY.md`
- Script: `demo-complete-workflow.mjs`

---

**Run time**: 18 minutes to build | ~30ms to execute
