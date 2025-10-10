# Three-Tier Action Item Standard

**Version**: 1.0.0  
**Status**: Draft  
**Last Updated**: 2024-09-26

## 1. Abstract

This specification defines the standard three-tier classification system for action items in OSSA-compliant systems, enabling consistent routing, escalation, and management across different implementations.

## 2. Tier Definitions

### 2.1 Tier Classification

```typescript
enum ActionItemTier {
  STRATEGIC = 'strategic',     // Organization-wide initiatives
  TECHNICAL = 'technical',     // Implementation specifications
  OPERATIONAL = 'operational'  // Immediate tasks and issues
}
```

### 2.2 Tier Characteristics

| Tier | Scope | Visibility | Review | Update Frequency | Automation |
|------|-------|------------|--------|------------------|------------|
| Strategic | Organization-wide | Public | Required | Weekly/Monthly | Semi-automated |
| Technical | Team/System | Team | Recommended | Daily/Weekly | Mixed |
| Operational | Task/Issue | Project | Optional | Real-time | Fully automated |

## 3. Action Item Model

### 3.1 Base Action Item Structure

```typescript
interface ActionItem {
  // Identity
  id: string;
  tier: ActionItemTier;
  
  // Content
  title: string;
  description: string;
  type: ActionItemType;
  
  // Classification
  severity?: Severity;
  priority?: Priority;
  impact?: ImpactLevel;
  scope?: ScopeLevel;
  
  // Metadata
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  status: ActionItemStatus;
  
  // Relationships
  parentId?: string;
  childIds?: string[];
  dependencies?: string[];
  
  // Estimates
  estimatedEffort?: number; // hours
  estimatedCost?: number; // currency
  deadline?: string;
}
```

### 3.2 Type Definitions

```typescript
enum ActionItemType {
  // Strategic Types
  MILESTONE = 'milestone',
  INITIATIVE = 'initiative',
  OBJECTIVE = 'objective',
  
  // Technical Types
  ARCHITECTURE = 'architecture',
  INTEGRATION = 'integration',
  SPECIFICATION = 'specification',
  
  // Operational Types
  BUG = 'bug',
  TASK = 'task',
  FEATURE = 'feature',
  INCIDENT = 'incident'
}

enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

enum Priority {
  P0 = 'p0', // Immediate
  P1 = 'p1', // Within 24 hours
  P2 = 'p2', // Within week
  P3 = 'p3', // Within month
  P4 = 'p4'  // When possible
}

enum ImpactLevel {
  ORGANIZATION = 'organization',
  CROSS_TEAM = 'cross_team',
  TEAM = 'team',
  LOCAL = 'local'
}

enum ScopeLevel {
  STRATEGIC = 'strategic',
  SYSTEM = 'system',
  COMPONENT = 'component',
  FUNCTION = 'function'
}

enum ActionItemStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

## 4. Routing Rules

### 4.1 Tier Determination Logic

```typescript
interface RoutingRules {
  // Strategic tier criteria
  strategic: {
    criteria: [
      'impact === ImpactLevel.ORGANIZATION',
      'scope === ScopeLevel.STRATEGIC',
      'estimatedEffort > 500',
      'estimatedCost > 50000',
      'type === ActionItemType.MILESTONE',
      'type === ActionItemType.INITIATIVE'
    ];
    operator: 'OR';
  };
  
  // Technical tier criteria
  technical: {
    criteria: [
      'requiresSpecification === true',
      'scope === ScopeLevel.COMPONENT',
      'type === ActionItemType.ARCHITECTURE',
      'type === ActionItemType.INTEGRATION',
      'dependencies.length > 2',
      'estimatedEffort > 40 && estimatedEffort <= 500'
    ];
    operator: 'OR';
  };
  
  // Operational tier criteria (default)
  operational: {
    criteria: [
      'type === ActionItemType.BUG',
      'type === ActionItemType.TASK',
      'severity === Severity.CRITICAL',
      'estimatedEffort <= 40',
      'impact === ImpactLevel.LOCAL'
    ];
    operator: 'OR';
  };
}
```

### 4.2 Routing Interface

```typescript
interface ActionItemRouter {
  // Determine appropriate tier
  route(item: ActionItem): Promise<RoutingDecision>;
  
  // Validate tier placement
  validate(item: ActionItem, currentTier: ActionItemTier): Promise<ValidationResult>;
  
  // Escalate between tiers
  escalate(item: ActionItem, fromTier: ActionItemTier, toTier: ActionItemTier, reason: string): Promise<void>;
  
  // Get routing statistics
  getStatistics(): Promise<RoutingStatistics>;
}

interface RoutingDecision {
  tier: ActionItemTier;
  confidence: number; // 0-1
  reasoning: string[];
  alternativeTiers?: ActionItemTier[];
}

interface ValidationResult {
  isValid: boolean;
  recommendedTier?: ActionItemTier;
  reasons: string[];
}
```

## 5. Escalation Protocol

### 5.1 Escalation Triggers

```typescript
interface EscalationTriggers {
  // Operational to Technical
  operationalToTechnical: [
    'recurring_pattern_detected',
    'multiple_components_affected',
    'requires_architectural_change',
    'performance_impact > 20%',
    'affects_multiple_users'
  ];
  
  // Technical to Strategic
  technicalToStrategic: [
    'cross_team_coordination_required',
    'budget_requirement > 10000',
    'timeline_impact > 1_month',
    'strategic_goal_alignment',
    'compliance_requirement'
  ];
  
  // Automatic escalation thresholds
  thresholds: {
    duplicateCount: 5; // Same issue reported 5+ times
    blockedDuration: 72; // Blocked for 72+ hours
    impactGrowth: 3; // Impact level increased 3x
  };
}
```

### 5.2 Escalation Process

```typescript
interface EscalationProcess {
  // Initiate escalation
  initiateEscalation(item: ActionItem, reason: EscalationReason): Promise<EscalationRequest>;
  
  // Review escalation
  reviewEscalation(request: EscalationRequest): Promise<EscalationDecision>;
  
  // Execute escalation
  executeEscalation(decision: EscalationDecision): Promise<void>;
  
  // Track escalation
  trackEscalation(item: ActionItem): Promise<EscalationHistory>;
}

interface EscalationReason {
  trigger: string;
  evidence: any[];
  urgency: 'immediate' | 'high' | 'normal';
  requestedBy: string;
}
```

## 6. Cross-Tier Synchronization

### 6.1 Synchronization Requirements

```typescript
interface SynchronizationRequirements {
  // Linking relationships
  linking: {
    strategicToTechnical: 'one-to-many';
    technicalToOperational: 'one-to-many';
    bidirectional: true;
  };
  
  // Update propagation
  propagation: {
    statusChanges: 'upward'; // Operational -> Technical -> Strategic
    priorityChanges: 'downward'; // Strategic -> Technical -> Operational
    blockingIssues: 'immediate';
  };
  
  // Consistency checks
  consistency: {
    orphanDetection: true;
    circularDependencyCheck: true;
    hierarchyValidation: true;
  };
}
```

### 6.2 Synchronization Interface

```typescript
interface TierSynchronizer {
  // Synchronize all tiers
  synchronize(): Promise<SynchronizationResult>;
  
  // Link items across tiers
  linkItems(parent: ActionItem, children: ActionItem[]): Promise<void>;
  
  // Validate hierarchy
  validateHierarchy(): Promise<HierarchyValidation>;
  
  // Detect orphans
  findOrphans(): Promise<ActionItem[]>;
  
  // Generate synchronization report
  generateReport(): Promise<SynchronizationReport>;
}
```

## 7. Storage Requirements

### 7.1 Storage Locations by Tier

```typescript
interface StorageConfiguration {
  strategic: {
    format: 'markdown' | 'structured_document';
    location: 'version_controlled_file';
    example: 'ROADMAP.md';
    visibility: 'public';
  };
  
  technical: {
    format: 'markdown' | 'json' | 'yaml';
    location: 'directory_structure';
    example: 'docs/planning/action-items/';
    visibility: 'team';
  };
  
  operational: {
    format: 'issue_tracker';
    location: 'external_system';
    example: 'gitlab_issues' | 'jira_tickets';
    visibility: 'project';
  };
}
```

## 8. Metrics and Reporting

### 8.1 Tier Metrics

```typescript
interface TierMetrics {
  // Volume metrics
  volume: {
    totalItems: number;
    newItemsPerWeek: number;
    completedItemsPerWeek: number;
  };
  
  // Flow metrics
  flow: {
    averageTimeInTier: number; // hours
    escalationRate: number; // percentage
    completionRate: number; // percentage
  };
  
  // Quality metrics
  quality: {
    orphanedItems: number;
    misplacedItems: number;
    validationErrors: number;
  };
  
  // Performance metrics
  performance: {
    routingAccuracy: number; // percentage
    averageRoutingTime: number; // milliseconds
    syncLatency: number; // seconds
  };
}
```

## 9. Compliance Requirements

Systems claiming OSSA three-tier action item compliance MUST:

1. **Tier Implementation**
   - Support all three tiers (Strategic, Technical, Operational)
   - Implement routing logic
   - Enable escalation between tiers

2. **Data Model**
   - Use standard action item structure
   - Support all required fields
   - Maintain relationships between items

3. **Routing**
   - Implement automatic routing based on criteria
   - Support manual override with justification
   - Track routing decisions

4. **Synchronization**
   - Link items across tiers
   - Detect and report orphans
   - Maintain hierarchy consistency

5. **Reporting**
   - Generate tier metrics
   - Track escalations
   - Provide visibility across tiers

## 10. Example Implementations

### 10.1 Strategic Tier Item

```json
{
  "id": "strategic-2024-q4-001",
  "tier": "strategic",
  "title": "Implement AI-Powered Customer Service Platform",
  "type": "initiative",
  "impact": "organization",
  "scope": "strategic",
  "estimatedEffort": 2000,
  "estimatedCost": 250000,
  "deadline": "2024-12-31",
  "status": "in_progress",
  "childIds": ["technical-001", "technical-002", "technical-003"]
}
```

### 10.2 Technical Tier Item

```json
{
  "id": "technical-001",
  "tier": "technical",
  "title": "Design Conversational AI Architecture",
  "type": "architecture",
  "scope": "component",
  "estimatedEffort": 120,
  "parentId": "strategic-2024-q4-001",
  "dependencies": ["technical-002"],
  "status": "in_progress",
  "childIds": ["operational-101", "operational-102"]
}
```

### 10.3 Operational Tier Item

```json
{
  "id": "operational-101",
  "tier": "operational",
  "title": "Set up NLP model training pipeline",
  "type": "task",
  "severity": "medium",
  "priority": "p2",
  "estimatedEffort": 8,
  "parentId": "technical-001",
  "status": "pending"
}
```