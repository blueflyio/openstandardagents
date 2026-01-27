# OSSA v0.3.6 Features: Working Examples

This directory contains comprehensive working examples demonstrating the revolutionary features introduced in OSSA v0.3.6, including agent genetics, decentralized identity, economics, lifecycle management, and team collaboration.

## Overview

OSSA v0.3.6 transforms agent systems into a fully-realized ecosystem with:

- **🧬 Agent Genetics**: Breeding, evolution, and lineage tracking
- **🆔 Decentralized Identity**: W3C DID-based trust and reputation
- **💰 Agent Economics**: Marketplace, wallets, and smart contracts
- **📈 Agent Lifecycle**: Birth through retirement with legacy preservation
- **🤝 Team Collaboration**: Multi-agent coordination

## Agent Genetics Examples

### 1. Simple Two-Parent Breeding

**File**: [`genetics-breeding-simple.ossa.yaml`](./genetics-breeding-simple.ossa.yaml)

**Demonstrates**:
- Basic two-parent breeding
- Complementary trait inheritance
- Generation 1 agent creation
- Fitness evaluation fundamentals
- Breeding eligibility criteria

**Scenario**:
```yaml
Parent 1 (Fast Reviewer):     fitness 0.78 (speed: 0.92, accuracy: 0.73)
Parent 2 (Accurate Reviewer): fitness 0.81 (speed: 0.68, accuracy: 0.94)
Offspring (Balanced):         fitness 0.86 (speed: 0.85, accuracy: 0.87)
```

**Key Learning Points**:
- How to structure parent DIDs
- Trait attribution to specific parents
- Expression levels (0.0-1.0 scale)
- Calculating aggregate fitness scores

**Use This Example When**:
- Starting with agent genetics
- Learning basic breeding concepts
- Understanding trait inheritance
- Implementing simple fitness evaluation

---

### 2. Multi-Generation Evolution

**File**: [`genetics-breeding-advanced.ossa.yaml`](./genetics-breeding-advanced.ossa.yaml)

**Demonstrates**:
- Multi-generation breeding (Generation 5)
- Complete genealogical tree (62 ancestors)
- Beneficial mutations accumulation
- Fitness progression tracking
- Inbreeding analysis
- Elite breeding strategies

**Scenario**:
```yaml
Generation 0: 32 founder agents     (fitness: 0.65 average)
Generation 1: 16 first-gen agents   (fitness: 0.72 average)
Generation 2: 8 second-gen agents   (fitness: 0.79 average)
Generation 3: 4 third-gen agents    (fitness: 0.86 average)
Generation 4: 2 fourth-gen agents   (fitness: 0.91 average)
Generation 5: 1 elite agent         (fitness: 0.96)
```

**Key Learning Points**:
- How to track complete lineage
- Managing ancestor DIDs across generations
- Mutation tracking and retention
- Generational fitness progression
- Inbreeding coefficient calculation
- Elite selection strategies

**Use This Example When**:
- Implementing long-term evolution
- Optimizing agent populations
- Tracking genetic diversity
- Analyzing breeding programs
- Planning multi-generation strategies

---

### 3. Fitness-Based Selection

**File**: [`genetics-fitness-scoring.ossa.yaml`](./genetics-fitness-scoring.oss.yaml)

**Demonstrates**:
- Multi-dimensional fitness evaluation
- Custom domain-specific metrics
- Weighted aggregate scoring
- Population-relative performance
- Tournament selection strategy
- Pareto frontier analysis

**Scenario**:
```yaml
Standard Metrics:  speed (0.87), accuracy (0.92), efficiency (0.86), adaptability (0.88)
Custom Metrics:    statistical_rigor (0.93), model_accuracy (0.91), interpretability (0.88)
Aggregate Score:   0.89 (weighted average across 12 metrics)
Population Rank:   88th percentile (top 12% of 250 agents)
Pareto Optimal:    No (dominated by 1 agent with higher accuracy + efficiency)
```

**Key Learning Points**:
- How to define custom fitness metrics
- Weighted scoring methodology
- Population-relative percentile ranking
- Multi-objective optimization (Pareto)
- Tournament selection implementation
- Elite metric identification

**Use This Example When**:
- Designing fitness functions
- Implementing selection strategies
- Comparing agents in populations
- Optimizing for multiple objectives
- Analyzing breeding candidate quality

---

## Related Documentation

### Tutorials
- **[Agent Genetics Tutorial](../../docs/tutorials/v0.3.6-agent-genetics.md)**: Comprehensive guide to evolutionary AI in OSSA
  - Conceptual foundations (genetic algorithms, neuroevolution)
  - Schema deep-dive (parents, traits, fitness, eligibility)
  - Best practices for breeding programs
  - Academic context and references

### Specification
- **[v0.3.6 Features Overview](../../docs/v0.3.6-features.md)**: Complete feature specification
- **[Migration Guide](../../spec/v0.3/MIGRATION-v0.3.5-to-v0.3.6.md)**: Upgrading from v0.3.5
- **[Schema Reference](../../spec/v0.3/ossa-0.3.6.schema.json)**: JSON Schema definitions

### Other v0.3.6 Examples
- **[Full-Featured Agent](./full-featured-v0.3.6.ossa.yaml)**: All v0.3.6 features in one manifest
- **[Economics Example](../economics/)**: Marketplace, wallets, contracts
- **[Lifecycle Example](../lifecycle/)**: Birth through retirement
- **[Swarm Example](../swarm/)**: Multi-agent coordination

---

## Quick Start

### 1. Validate Examples

```bash
# Validate simple breeding example
ossa validate examples/v0.3.6-features/genetics-breeding-simple.ossa.yaml

# Validate all genetics examples
ossa validate examples/v0.3.6-features/genetics-*.ossa.yaml
```

### 2. Inspect Genetics

```bash
# Show genetics information
ossa inspect genetics-breeding-simple.ossa.yaml --section genetics

# Analyze lineage
ossa lineage --agent genetics-breeding-advanced.ossa.yaml --show-tree

# Calculate inbreeding
ossa lineage --agent genetics-breeding-advanced.ossa.yaml --inbreeding
```

### 3. Compare Fitness

```bash
# Compare two agents
ossa fitness compare \
  genetics-breeding-simple.ossa.yaml \
  genetics-fitness-scoring.ossa.yaml

# Analyze population
ossa fitness population examples/v0.3.6-features/genetics-*.ossa.yaml
```

### 4. Simulate Breeding

```bash
# Breed two agents (simulation)
ossa breed \
  --parent1 genetics-breeding-simple.ossa.yaml \
  --parent2 genetics-fitness-scoring.ossa.yaml \
  --output offspring-gen4.ossa.yaml

# Evaluate offspring
ossa evaluate offspring-gen4.ossa.yaml --dataset validation-set.json
```

---

## Breeding Strategies Comparison

| Strategy | Selection Method | Diversity | Convergence | Use Case |
|----------|-----------------|-----------|-------------|----------|
| **Elite** | Top N agents | Low | Fast | Final optimization |
| **Tournament** | Random subsets | Medium | Medium | Ongoing evolution |
| **Roulette** | Fitness-proportionate | High | Slow | Early exploration |
| **Rank-based** | Rank ordering | Medium | Medium | Varied populations |

**Implemented in Examples**:
- `genetics-breeding-simple.ossa.yaml`: Complementary selection (manual)
- `genetics-breeding-advanced.ossa.yaml`: Elite selection (top performers)
- `genetics-fitness-scoring.ossa.yaml`: Tournament selection (k=5)

---

## Fitness Metrics Catalog

### Standard Metrics (OSSA Core)

| Metric | Range | Description | Measurement |
|--------|-------|-------------|-------------|
| `speed` | 0.0-1.0 | Task completion velocity | Tasks/hour vs baseline |
| `accuracy` | 0.0-1.0 | Correctness of outputs | Precision & recall |
| `efficiency` | 0.0-1.0 | Resource utilization | 1 - (cost / baseline) |
| `adaptability` | 0.0-1.0 | Novel task performance | Performance on unseen data |

### Custom Metrics (Domain-Specific)

**Security Agents**:
- `vulnerability_detection_rate`: 0.0-1.0 (TP rate)
- `false_positive_rate`: 0.0-1.0 (invert: 1 - FP rate)
- `exploit_generation_quality`: 0.0-1.0 (expert ratings)

**Code Review Agents**:
- `bug_detection_accuracy`: 0.0-1.0 (validated bugs found)
- `review_thoroughness`: 0.0-1.0 (code coverage)
- `comment_helpfulness`: 0.0-1.0 (developer ratings)

**Data Analysis Agents** (see `genetics-fitness-scoring.ossa.yaml`):
- `statistical_rigor`: 0.0-1.0 (methodology soundness)
- `model_accuracy`: 0.0-1.0 (R², F1, AUC-ROC)
- `interpretability`: 0.0-1.0 (clarity of insights)

---

## Breeding Best Practices

### 1. Define Clear Fitness Metrics

✅ **Good**:
```yaml
fitness:
  score: 0.89
  metrics:
    speed: 0.87          # Tasks/hour measured consistently
    accuracy: 0.92       # F1 score on validation set
  custom_metrics:
    domain_metric: 0.85  # Well-defined domain measure
```

❌ **Bad**:
```yaml
fitness:
  score: 0.89  # Unclear how calculated, no breakdown
```

### 2. Maintain Genetic Diversity

- Use **tournament selection** (k=5-10) for balanced exploration/exploitation
- Monitor **inbreeding coefficient** (keep < 0.2)
- Introduce **outcrossing** every 3-5 generations
- Limit **generation depth** (max 10-15 for most applications)

### 3. Track Lineage Properly

```yaml
# Always include complete lineage
genetics:
  generation: 3
  parent_dids: [...]          # Direct parents
  ancestor_dids: [...]        # All ancestors (2^(g+1) - 2)
  inherited_traits: [...]     # Attributed to parents
```

### 4. Document Mutations

```yaml
mutations:
  - mutation_type: capability_enhancement
    description: "Specific capability added"
    beneficial: true
    generation_introduced: 3
    introduced_by: "did:ossa:breeder-agent"
```

### 5. Validate on Holdout Data

```python
# Prevent overfitting
training_fitness = evaluate(agent, training_set)
validation_fitness = evaluate(agent, validation_set)

if training_fitness - validation_fitness > 0.15:
    warnings.warn("Agent may be overfitted")
```

---

## Common Patterns

### Pattern 1: Complementary Trait Breeding

**Goal**: Combine strengths from two specialists

```yaml
# Parent 1: Fast but less accurate
# Parent 2: Accurate but slower
# Offspring: Balanced (inherits best of both)
```

**Example**: `genetics-breeding-simple.ossa.yaml`

### Pattern 2: Multi-Generation Optimization

**Goal**: Continuously improve over many generations

```yaml
# Gen 0 → Gen 1 → Gen 2 → ... → Gen N
# Each generation selects top performers as parents
# Track fitness progression: 0.65 → 0.72 → 0.79 → 0.86 → 0.91 → 0.96
```

**Example**: `genetics-breeding-advanced.ossa.yaml`

### Pattern 3: Tournament Selection

**Goal**: Maintain diversity while selecting for fitness

```bash
# 1. Randomly sample k agents from population
# 2. Select the fittest from the k agents
# 3. Repeat to get second parent
# 4. Breed the two selected parents
```

**Example**: `genetics-fitness-scoring.ossa.yaml`

### Pattern 4: Pareto Optimization

**Goal**: Optimize for multiple conflicting objectives

```yaml
# Objectives: accuracy (maximize), efficiency (maximize)
# Find agents on Pareto frontier (no dominated solutions)
# Trade-offs: High accuracy + low efficiency vs. Low accuracy + high efficiency
```

**Example**: `genetics-fitness-scoring.ossa.yaml` (Pareto analysis section)

---

## Troubleshooting

### Issue: Fitness Stagnates After Few Generations

**Symptoms**: Fitness stops improving after Gen 3-5

**Causes**:
- Genetic bottleneck (too few parents)
- Premature convergence (elite selection too aggressive)
- Local optimum (insufficient exploration)

**Solutions**:
- Increase population size
- Use tournament selection instead of elite selection
- Introduce mutations (5-10% mutation rate)
- Outcross with unrelated agents

### Issue: High Inbreeding Coefficient

**Symptoms**: `inbreeding_coefficient > 0.3`

**Causes**:
- Small founding population
- Repeated breeding of same elite agents
- Insufficient genetic diversity

**Solutions**:
- Introduce new founder agents
- Use larger tournament sizes (k=10+)
- Enforce minimum genetic distance between parents
- Outcross every 3 generations

### Issue: Overfitting to Training Data

**Symptoms**: High training fitness, low validation fitness

**Causes**:
- Breeding optimized for training set only
- Lack of diversity in breeding tasks
- Too many generations without fresh data

**Solutions**:
- Validate on holdout datasets
- Use cross-validation for fitness evaluation
- Introduce novel tasks periodically
- Track `adaptability` metric explicitly

---

## Academic References

- **Eiben & Smith (2015)**: *Introduction to Evolutionary Computing* - Foundational text
- **Deb et al. (2002)**: NSGA-II algorithm for multi-objective optimization
- **Stanley & Miikkulainen (2002)**: NEAT (NeuroEvolution of Augmenting Topologies)
- **Koza (1992)**: *Genetic Programming* - Evolving programs through selection

See **[Agent Genetics Tutorial](../../docs/tutorials/v0.3.6-agent-genetics.md)** for complete references.

---

## Contributing

Found an issue or have a suggestion? Open an issue at:
https://gitlab.com/blueflyio/openstandardagents/-/issues

---

**License**: MIT License — Copyright © 2026 Bluefly IO

**Version**: OSSA v0.3.6

**Last Updated**: 2026-01-27
