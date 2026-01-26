# Project: Drupal Integration (llm-platform + AI Modules)

**Epic**: Dashboard & API Gateway  
**Phase**: 1 - Production Deployment  
**Timeline**: Week 3-4 (Feb 10 - Feb 21, 2025)  
**Owner**: Platform Team  
**Priority**: 🔴 CRITICAL - Revenue dashboard and customer-facing API

---

## Project Overview

**Repositories**:
- `gitlab.com/blueflyio/agent-platform/llm-platform` (Main Drupal site)
- `all_drupal_custom/modules/` (21 AI agent modules)

**NAS Location**: `/Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/llm-platform.git`  
**Purpose**: Production dashboard, agent marketplace, unified API gateway

---

## Current Status

- **Overall Health**: ⚠️ Cautionary (Development environment only)
- **Modules Status**: 21 modules defined, 0 production-ready
- **Dashboard**: Not deployed (blocking revenue visibility)
- **API Gateway**: Not deployed (blocking SDK integration)
- **Revenue Impact**: $2.05M/year blocked without customer-facing interfaces

---

## Phase 1 Objectives (Weeks 3-4)

### Week 3: Dashboard Deployment
**Objective**: Deploy production-ready management dashboard

#### Monday-Wednesday (Feb 10-12): STASH-24 Dashboard Foundation

**Core Dashboard Modules**:
```yaml
ai_agents:
  Purpose: Agent registry and management
  Features:
    - Agent listing with status
    - Capability discovery
    - Invocation interface
    - Real-time metrics
  Routes:
    - /admin/agents (agent list)
    - /admin/agents/{id} (agent details)
    - /admin/agents/{id}/invoke (invocation form)

ai_agents_charts:
  Purpose: Analytics and visualization
  Features:
    - Usage metrics dashboards
    - Cost tracking
    - Performance graphs
    - ROI calculations
  Routes:
    - /admin/analytics (overview)
    - /admin/analytics/costs (cost breakdown)
    - /admin/analytics/performance (performance metrics)

ai_agent_orchestra:
  Purpose: Multi-agent orchestration UI
  Features:
    - Workflow builder
    - Dependency visualization
    - Execution monitoring
  Routes:
    - /admin/orchestration (workflow list)
    - /admin/orchestration/builder (visual builder)
    - /admin/orchestration/execution/{id} (monitor)

ai_agent_marketplace:
  Purpose: Agent discovery and procurement
  Features:
    - Agent catalog
    - OSSA compliance badges
    - Installation wizard
    - Pricing calculator
  Routes:
    - /marketplace (public catalog)
    - /marketplace/{agentId} (details)
    - /marketplace/{agentId}/install (wizard)
```

**Dashboard Implementation**:
```php
<?php

namespace Drupal\ai_agents\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\ai_agents\Service\AgentRegistryService;

/**
 * Dashboard controller for AI agents.
 */
class AgentDashboardController extends ControllerBase {

  protected $agentRegistry;

  public function __construct(AgentRegistryService $agentRegistry) {
    $this->agentRegistry = $agentRegistry;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('ai_agents.registry')
    );
  }

  /**
   * Agent listing dashboard.
   */
  public function agentList() {
    $agents = $this->agentRegistry->listAgents();
    
    return [
      '#theme' => 'ai_agents_dashboard',
      '#agents' => $agents,
      '#metrics' => [
        'total_agents' => count($agents),
        'active_agents' => $this->countByStatus($agents, 'active'),
        'total_invocations_today' => $this->getInvocationsToday(),
        'total_cost_today' => $this->getCostToday(),
      ],
      '#charts' => [
        'usage_trend' => $this->getUsageTrendData(),
        'cost_breakdown' => $this->getCostBreakdownData(),
      ],
      '#attached' => [
        'library' => [
          'ai_agents/dashboard',
          'ai_agents_charts/analytics',
        ],
      ],
    ];
  }

  /**
   * Agent invocation form.
   */
  public function invokeAgent($agentId) {
    $agent = $this->agentRegistry->getAgent($agentId);
    
    if (!$agent) {
      throw new \Symfony\Component\HttpKernel\Exception\NotFoundHttpException();
    }
    
    $form = \Drupal::formBuilder()->getForm(
      'Drupal\ai_agents\Form\AgentInvocationForm',
      $agent
    );
    
    return [
      '#theme' => 'ai_agents_invoke',
      '#agent' => $agent,
      '#form' => $form,
      '#attached' => [
        'library' => ['ai_agents/invocation'],
      ],
    ];
  }
}
```

**Twig Templates**:
```twig
{# templates/ai-agents-dashboard.html.twig #}
<div class="ai-agents-dashboard">
  <div class="dashboard-header">
    <h1>{{ 'Agent Platform Dashboard'|t }}</h1>
    <div class="metrics-summary">
      <div class="metric">
        <span class="metric-value">{{ metrics.total_agents }}</span>
        <span class="metric-label">{{ 'Total Agents'|t }}</span>
      </div>
      <div class="metric">
        <span class="metric-value">{{ metrics.active_agents }}</span>
        <span class="metric-label">{{ 'Active'|t }}</span>
      </div>
      <div class="metric">
        <span class="metric-value">{{ metrics.total_invocations_today|number_format }}</span>
        <span class="metric-label">{{ 'Invocations Today'|t }}</span>
      </div>
      <div class="metric">
        <span class="metric-value">${{ metrics.total_cost_today|number_format(2) }}</span>
        <span class="metric-label">{{ 'Cost Today'|t }}</span>
      </div>
    </div>
  </div>

  <div class="dashboard-charts">
    <div class="chart-container">
      <h2>{{ 'Usage Trend'|t }}</h2>
      <div id="usage-trend-chart" data-chart="{{ charts.usage_trend|json_encode }}"></div>
    </div>
    <div class="chart-container">
      <h2>{{ 'Cost Breakdown'|t }}</h2>
      <div id="cost-breakdown-chart" data-chart="{{ charts.cost_breakdown|json_encode }}"></div>
    </div>
  </div>

  <div class="agents-list">
    <h2>{{ 'Agents'|t }}</h2>
    <table class="agents-table">
      <thead>
        <tr>
          <th>{{ 'Name'|t }}</th>
          <th>{{ 'Role'|t }}</th>
          <th>{{ 'Status'|t }}</th>
          <th>{{ 'Invocations'|t }}</th>
          <th>{{ 'Actions'|t }}</th>
        </tr>
      </thead>
      <tbody>
        {% for agent in agents %}
        <tr class="agent-row" data-status="{{ agent.status }}">
          <td>
            <a href="{{ path('ai_agents.agent_detail', {'agentId': agent.id}) }}">
              {{ agent.name }}
            </a>
          </td>
          <td>{{ agent.role }}</td>
          <td>
            <span class="status-badge status-{{ agent.status }}">
              {{ agent.status|upper }}
            </span>
          </td>
          <td>{{ agent.invocations_total|number_format }}</td>
          <td>
            <a href="{{ path('ai_agents.invoke', {'agentId': agent.id}) }}" class="button">
              {{ 'Invoke'|t }}
            </a>
          </td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
  </div>
</div>
```

#### Thursday-Friday (Feb 13-14): STASH-25 API Gateway

**Unified API Gateway Configuration**:
```php
<?php

namespace Drupal\ai_agents_client\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use GuzzleHttp\ClientInterface;

/**
 * API Gateway service.
 */
class ApiGatewayService {

  protected $httpClient;
  protected $config;

  /**
   * Service endpoints configuration.
   */
  private $endpoints = [
    'agents' => 'http://blueflynas.tailcf98b3.ts.net:3005/api/agents',
    'compliance' => 'http://blueflynas.tailcf98b3.ts.net:3010/api/compliance',
    'router' => 'http://blueflynas.tailcf98b3.ts.net:4000/api/route',
    'brain' => 'http://blueflynas.tailcf98b3.ts.net:6333/api/search',
    'workflows' => 'http://blueflynas.tailcf98b3.ts.net:3015/api/workflows',
  ];

  public function __construct(
    ClientInterface $http_client,
    ConfigFactoryInterface $config_factory
  ) {
    $this->httpClient = $http_client;
    $this->config = $config_factory->get('ai_agents_client.settings');
  }

  /**
   * Proxy request to agent service.
   */
  public function proxyRequest(string $service, string $method, string $path, array $options = []): array {
    $endpoint = $this->endpoints[$service] ?? null;
    
    if (!$endpoint) {
      throw new \InvalidArgumentException("Unknown service: {$service}");
    }
    
    $url = rtrim($endpoint, '/') . '/' . ltrim($path, '/');
    
    // Add authentication
    $options['headers'] = array_merge(
      $options['headers'] ?? [],
      ['Authorization' => 'Bearer ' . $this->config->get('api_token')]
    );
    
    try {
      $response = $this->httpClient->request($method, $url, $options);
      return json_decode($response->getBody()->getContents(), TRUE);
    }
    catch (\Exception $e) {
      \Drupal::logger('ai_agents_client')->error(
        'API Gateway error: @message',
        ['@message' => $e->getMessage()]
      );
      throw $e;
    }
  }

  /**
   * List all agents.
   */
  public function listAgents(array $filters = []): array {
    return $this->proxyRequest('agents', 'GET', '', [
      'query' => $filters,
    ]);
  }

  /**
   * Invoke agent capability.
   */
  public function invokeAgent(string $agentId, string $capability, array $input): array {
    return $this->proxyRequest('agents', 'POST', "{$agentId}/invoke", [
      'json' => [
        'capability' => $capability,
        'input' => $input,
      ],
    ]);
  }

  /**
   * Run compliance check.
   */
  public function runComplianceCheck(array $config): array {
    return $this->proxyRequest('compliance', 'POST', 'checks', [
      'json' => $config,
    ]);
  }

  /**
   * Search with vector database.
   */
  public function semanticSearch(string $query, array $filters = []): array {
    return $this->proxyRequest('brain', 'POST', 'search', [
      'json' => array_merge(['query' => $query], $filters),
    ]);
  }
}
```

**REST API Endpoints** (Drupal JSON:API):
```php
<?php

namespace Drupal\ai_agents_client\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\ai_agents_client\Service\ApiGatewayService;

/**
 * Unified API Gateway controller.
 */
class ApiGatewayController extends ControllerBase {

  protected $gateway;

  public function __construct(ApiGatewayService $gateway) {
    $this->gateway = $gateway;
  }

  public static function create(ContainerInterface $container) {
    return new static($container->get('ai_agents_client.gateway'));
  }

  /**
   * Unified agents endpoint.
   * 
   * @route /api/v1/agents
   */
  public function agents(Request $request): JsonResponse {
    $filters = [
      'role' => $request->query->get('role'),
      'status' => $request->query->get('status'),
      'access_tier' => $request->query->get('access_tier'),
    ];
    
    $agents = $this->gateway->listAgents(array_filter($filters));
    
    return new JsonResponse($agents);
  }

  /**
   * Invoke agent capability.
   * 
   * @route /api/v1/agents/{agentId}/invoke
   */
  public function invokeAgent(Request $request, string $agentId): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);
    
    $result = $this->gateway->invokeAgent(
      $agentId,
      $data['capability'] ?? '',
      $data['input'] ?? []
    );
    
    return new JsonResponse($result);
  }

  /**
   * Compliance check endpoint.
   * 
   * @route /api/v1/compliance/check
   */
  public function complianceCheck(Request $request): JsonResponse {
    $config = json_decode($request->getContent(), TRUE);
    
    $result = $this->gateway->runComplianceCheck($config);
    
    return new JsonResponse($result);
  }

  /**
   * Semantic search endpoint.
   * 
   * @route /api/v1/search
   */
  public function search(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);
    
    $results = $this->gateway->semanticSearch(
      $data['query'] ?? '',
      $data['filters'] ?? []
    );
    
    return new JsonResponse($results);
  }
}
```

### Week 4: Production Hardening
**Objective**: Security, performance, and monitoring

#### Monday-Tuesday (Feb 17-18): Security Hardening

**API Authentication**:
```php
<?php

namespace Drupal\ai_agents_client\EventSubscriber;

use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * API authentication subscriber.
 */
class ApiAuthSubscriber implements EventSubscriberInterface {

  public static function getSubscribedEvents() {
    return [
      'kernel.request' => ['onRequest', 100],
    ];
  }

  public function onRequest(RequestEvent $event) {
    $request = $event->getRequest();
    
    // Only authenticate API requests
    if (!str_starts_with($request->getPathInfo(), '/api/v1/')) {
      return;
    }
    
    // Extract Bearer token
    $authorization = $request->headers->get('Authorization');
    
    if (!$authorization || !preg_match('/Bearer\s+(.+)/', $authorization, $matches)) {
      throw new AccessDeniedHttpException('Missing or invalid authorization header');
    }
    
    $token = $matches[1];
    
    // Validate token
    if (!$this->validateToken($token)) {
      throw new AccessDeniedHttpException('Invalid API token');
    }
    
    // Add user context to request
    $request->attributes->set('api_user', $this->getUserFromToken($token));
  }

  private function validateToken(string $token): bool {
    // Validate against stored API tokens
    $query = \Drupal::database()->select('api_tokens', 't')
      ->fields('t', ['id', 'user_id'])
      ->condition('token', hash('sha256', $token))
      ->condition('expires_at', time(), '>')
      ->execute();
    
    return (bool) $query->fetchObject();
  }
}
```

#### Wednesday-Thursday (Feb 19-20): Performance Optimization

**Caching Strategy**:
```php
<?php

namespace Drupal\ai_agents\Service;

use Drupal\Core\Cache\CacheBackendInterface;

/**
 * Agent registry with caching.
 */
class CachedAgentRegistryService extends AgentRegistryService {

  protected $cache;

  public function __construct(CacheBackendInterface $cache) {
    $this->cache = $cache;
  }

  public function listAgents(array $filters = []): array {
    $cid = 'agents:list:' . md5(serialize($filters));
    
    // Check cache
    if ($cached = $this->cache->get($cid)) {
      return $cached->data;
    }
    
    // Fetch from API
    $agents = parent::listAgents($filters);
    
    // Cache for 5 minutes
    $this->cache->set($cid, $agents, time() + 300, ['agents']);
    
    return $agents;
  }

  public function getAgent(string $agentId): ?array {
    $cid = 'agents:detail:' . $agentId;
    
    if ($cached = $this->cache->get($cid)) {
      return $cached->data;
    }
    
    $agent = parent::getAgent($agentId);
    
    if ($agent) {
      $this->cache->set($cid, $agent, time() + 300, ['agents', 'agent:' . $agentId]);
    }
    
    return $agent;
  }
}
```

#### Friday (Feb 21): STASH-26 Monitoring Integration

**Drupal Monitoring Module**:
```php
<?php

namespace Drupal\ai_agents\Plugin\QueueWorker;

use Drupal\Core\Queue\QueueWorkerBase;

/**
 * Processes agent invocations from queue.
 *
 * @QueueWorker(
 *   id = "agent_invocation_queue",
 *   title = @Translation("Agent Invocation Queue"),
 *   cron = {"time" = 60}
 * )
 */
class AgentInvocationQueueWorker extends QueueWorkerBase {

  public function processItem($data) {
    $start = microtime(true);
    
    try {
      // Invoke agent
      $result = \Drupal::service('ai_agents_client.gateway')->invokeAgent(
        $data['agent_id'],
        $data['capability'],
        $data['input']
      );
      
      $duration = microtime(true) - $start;
      
      // Log metrics
      \Drupal::service('ai_agents.metrics')->recordInvocation([
        'agent_id' => $data['agent_id'],
        'capability' => $data['capability'],
        'duration' => $duration,
        'status' => 'success',
      ]);
      
      return $result;
    }
    catch (\Exception $e) {
      $duration = microtime(true) - $start;
      
      // Log error
      \Drupal::service('ai_agents.metrics')->recordInvocation([
        'agent_id' => $data['agent_id'],
        'capability' => $data['capability'],
        'duration' => $duration,
        'status' => 'error',
        'error' => $e->getMessage(),
      ]);
      
      throw $e;
    }
  }
}
```

---

## Technical Implementation

### Drupal Module Structure

```
llm-platform/web/modules/custom/ai_agents/
â"œâ"€â"€ src/
â"‚   â"œâ"€â"€ Controller/
â"‚   â"‚   â"œâ"€â"€ AgentDashboardController.php
â"‚   â"‚   â""â"€â"€ ApiGatewayController.php
â"‚   â"œâ"€â"€ Service/
â"‚   â"‚   â"œâ"€â"€ AgentRegistryService.php
â"‚   â"‚   â"œâ"€â"€ CachedAgentRegistryService.php
â"‚   â"‚   â""â"€â"€ ApiGatewayService.php
â"‚   â"œâ"€â"€ Form/
â"‚   â"‚   â""â"€â"€ AgentInvocationForm.php
â"‚   â"œâ"€â"€ Plugin/
â"‚   â"‚   â""â"€â"€ QueueWorker/
â"‚   â"‚       â""â"€â"€ AgentInvocationQueueWorker.php
â"‚   â""â"€â"€ EventSubscriber/
â"‚       â""â"€â"€ ApiAuthSubscriber.php
â"œâ"€â"€ templates/
â"‚   â"œâ"€â"€ ai-agents-dashboard.html.twig
â"‚   â""â"€â"€ ai-agents-invoke.html.twig
â"œâ"€â"€ config/
â"‚   â""â"€â"€ install/
â"‚       â""â"€â"€ ai_agents.settings.yml
â"œâ"€â"€ ai_agents.info.yml
â"œâ"€â"€ ai_agents.module
â"œâ"€â"€ ai_agents.routing.yml
â""â"€â"€ ai_agents.services.yml
```

### Full CRUD Implementation

**Agents Dashboard**:
- CREATE: N/A (agents created via registry)
- READ: Query and display all agents
- UPDATE: N/A (update via API Gateway)
- DELETE: N/A (delete via registry)

**API Gateway**:
- CREATE: Proxy POST requests to services
- READ: Proxy GET requests to services
- UPDATE: Proxy PATCH/PUT requests to services
- DELETE: Proxy DELETE requests to services

**Metrics**:
- CREATE: Record new invocation metrics
- READ: Query metrics for dashboards
- UPDATE: N/A (immutable)
- DELETE: Archive old metrics

---

## Dependencies

### Upstream Dependencies
- **agent-docker**: NAS services operational
- **platform-agents**: Agent registry deployed
- **compliance-engine**: API operational

### Downstream Dependencies
- **SDK customers**: API Gateway required
- **Revenue**: $2.05M/year blocked without dashboard

---

## Success Metrics

### Week 3 Targets
```yaml
Dashboard:
  Status: Deployed
  Modules_Operational: 4
  Routes: 8+
  Real_Time_Updates: Enabled

API_Gateway:
  Status: Operational
  Endpoints: 6+
  Authentication: Configured
  Rate_Limiting: Enforced
```

### Week 4 Targets
```yaml
Production_Hardening:
  Security: Hardened
  Caching: Operational
  Monitoring: Complete
  Performance: Optimized

Quality:
  Test_Coverage: ">80%"
  Load_Testing: Passed
  Security_Scan: Passed
```

---

## Next Immediate Actions (Monday, Feb 10)

```bash
# 1. Create worktree
cd /Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/llm-platform.git
git worktree add /Volumes/AgentPlatform/worktrees/shared/2025-02-10/llm-platform/dashboard-deployment main

# 2. Enable modules
cd /Volumes/AgentPlatform/worktrees/shared/2025-02-10/llm-platform/dashboard-deployment
ddev drush en ai_agents ai_agents_charts ai_agent_orchestra ai_agent_marketplace -y

# 3. Run database updates
ddev drush updb -y

# 4. Clear cache
ddev drush cr
```

---

## Quality Gates

- ✅ Dashboard deployed and accessible
- ✅ API Gateway operational (6+ endpoints)
- ✅ Authentication configured
- ✅ Caching strategy implemented
- ✅ Monitoring integrated
- ✅ All tests passing (>80% coverage)
- ✅ Security scan passed
- ✅ Load testing passed

---

## Revenue Enablement

**Blocked Revenue**: $2.05M/year
**Unblocking Date**: Week 4 completion (Feb 21, 2025)

---

## Reference

- **NAS Repo**: `/Volumes/AgentPlatform/repos/bare/blueflyio/agent-platform/llm-platform.git`
- **Drupal Modules**: `llm-platform/web/modules/custom/`
- **Master Coordination**: `00-MASTER-PROJECT-COORDINATION.md`

---

**Status**: ⏳ AWAITING APPROVAL  
**Next Update**: Daily during Week 3-4  
**Owner**: Platform Team
