# Perfect .agents/[agent-name] Folder Structure (5 Levels Deep)

## Overview
Each `.agents/[agent-name]` folder represents a complete, self-contained agent implementation following OSSA standards. This structure is used both in OSSA (for reference implementations) and in individual projects (for project-specific agents).

## Complete Structure

```
.agents/[agent-name]/                     # Level 1: Agent root directory
├── agent.yml                            # Level 2: Agent manifest (OSSA-compliant)
├── README.md                             # Level 2: Agent documentation
├── package.json                          # Level 2: Node.js package configuration
├── tsconfig.json                         # Level 2: TypeScript configuration
├── src/                                  # Level 2: Source code
│   ├── index.ts                          # Level 3: Main entry point
│   ├── agent/                            # Level 3: Core agent implementation
│   │   ├── core/                         # Level 4: Core agent logic
│   │   │   ├── agent.core.ts             # Level 5: Primary agent implementation
│   │   │   ├── lifecycle.manager.ts      # Level 5: Lifecycle management
│   │   │   ├── state.manager.ts          # Level 5: State management
│   │   │   ├── configuration.manager.ts  # Level 5: Configuration management
│   │   │   └── health.monitor.ts         # Level 5: Health monitoring
│   │   ├── capabilities/                 # Level 4: Agent capabilities
│   │   │   ├── capability.registry.ts    # Level 5: Capability registration
│   │   │   ├── operation.executor.ts     # Level 5: Operation execution
│   │   │   ├── input.validator.ts        # Level 5: Input validation
│   │   │   ├── output.formatter.ts       # Level 5: Output formatting
│   │   │   └── domain.specific.ts        # Level 5: Domain-specific logic
│   │   ├── communication/                # Level 4: Communication protocols
│   │   │   ├── protocol.manager.ts       # Level 5: Protocol management
│   │   │   ├── rest.handler.ts           # Level 5: REST API handler
│   │   │   ├── grpc.handler.ts           # Level 5: gRPC handler
│   │   │   ├── websocket.handler.ts      # Level 5: WebSocket handler
│   │   │   └── mcp.handler.ts            # Level 5: MCP handler
│   │   ├── security/                     # Level 4: Security implementation
│   │   │   ├── authentication.ts         # Level 5: Authentication logic
│   │   │   ├── authorization.ts          # Level 5: Authorization logic
│   │   │   ├── encryption.ts             # Level 5: Encryption utilities
│   │   │   ├── audit.logger.ts           # Level 5: Audit logging
│   │   │   └── compliance.checker.ts     # Level 5: Compliance validation
│   │   └── integration/                  # Level 4: External integrations
│   │       ├── mcp.integration.ts        # Level 5: MCP integration
│   │       ├── external.apis.ts          # Level 5: External API clients
│   │       ├── database.client.ts        # Level 5: Database integration
│   │       ├── message.queue.ts          # Level 5: Message queue integration
│   │       └── event.stream.ts           # Level 5: Event streaming
│   ├── handlers/                         # Level 3: Request handlers
│   │   ├── http/                         # Level 4: HTTP handlers
│   │   │   ├── health.handler.ts         # Level 5: Health check handlers
│   │   │   ├── capability.handler.ts     # Level 5: Capability handlers
│   │   │   ├── execution.handler.ts      # Level 5: Execution handlers
│   │   │   ├── lifecycle.handler.ts      # Level 5: Lifecycle handlers
│   │   │   └── communication.handler.ts  # Level 5: Communication handlers
│   │   ├── events/                       # Level 4: Event handlers
│   │   │   ├── system.events.ts          # Level 5: System event handlers
│   │   │   ├── agent.events.ts           # Level 5: Agent event handlers
│   │   │   ├── workflow.events.ts        # Level 5: Workflow event handlers
│   │   │   ├── error.events.ts           # Level 5: Error event handlers
│   │   │   └── monitoring.events.ts      # Level 5: Monitoring event handlers
│   │   ├── messages/                     # Level 4: Message handlers
│   │   │   ├── inter.agent.ts            # Level 5: Inter-agent messaging
│   │   │   ├── system.messages.ts        # Level 5: System messages
│   │   │   ├── user.messages.ts          # Level 5: User messages
│   │   │   ├── error.messages.ts         # Level 5: Error messages
│   │   │   └── notification.messages.ts  # Level 5: Notification messages
│   │   └── workflows/                    # Level 4: Workflow handlers
│   │       ├── orchestration.handler.ts  # Level 5: Orchestration handlers
│   │       ├── execution.handler.ts      # Level 5: Execution handlers
│   │       ├── coordination.handler.ts   # Level 5: Coordination handlers
│   │       ├── monitoring.handler.ts     # Level 5: Monitoring handlers
│   │       └── recovery.handler.ts       # Level 5: Recovery handlers
│   ├── services/                         # Level 3: Business services
│   │   ├── domain/                       # Level 4: Domain services
│   │   │   ├── nlp.service.ts            # Level 5: Natural language processing
│   │   │   ├── vision.service.ts         # Level 5: Computer vision
│   │   │   ├── reasoning.service.ts      # Level 5: Logical reasoning
│   │   │   ├── data.service.ts           # Level 5: Data processing
│   │   │   └── audio.service.ts          # Level 5: Audio processing
│   │   ├── infrastructure/               # Level 4: Infrastructure services
│   │   │   ├── logging.service.ts        # Level 5: Logging service
│   │   │   ├── metrics.service.ts        # Level 5: Metrics collection
│   │   │   ├── caching.service.ts        # Level 5: Caching service
│   │   │   ├── storage.service.ts        # Level 5: Storage service
│   │   │   └── network.service.ts        # Level 5: Network service
│   │   ├── ai/                           # Level 4: AI/ML services
│   │   │   ├── model.service.ts          # Level 5: Model management
│   │   │   ├── inference.service.ts      # Level 5: Inference service
│   │   │   ├── training.service.ts       # Level 5: Training service
│   │   │   ├── evaluation.service.ts     # Level 5: Model evaluation
│   │   │   └── optimization.service.ts   # Level 5: Model optimization
│   │   └── integration/                  # Level 4: Integration services
│   │       ├── api.client.service.ts     # Level 5: API client service
│   │       ├── webhook.service.ts        # Level 5: Webhook service
│   │       ├── queue.service.ts          # Level 5: Queue service
│   │       ├── stream.service.ts         # Level 5: Stream service
│   │       └── batch.service.ts          # Level 5: Batch processing service
│   ├── models/                           # Level 3: Data models
│   │   ├── domain/                       # Level 4: Domain models
│   │   │   ├── agent.model.ts            # Level 5: Agent data model
│   │   │   ├── capability.model.ts       # Level 5: Capability model
│   │   │   ├── operation.model.ts        # Level 5: Operation model
│   │   │   ├── execution.model.ts        # Level 5: Execution model
│   │   │   └── result.model.ts           # Level 5: Result model
│   │   ├── communication/                # Level 4: Communication models
│   │   │   ├── message.model.ts          # Level 5: Message model
│   │   │   ├── request.model.ts          # Level 5: Request model
│   │   │   ├── response.model.ts         # Level 5: Response model
│   │   │   ├── event.model.ts            # Level 5: Event model
│   │   │   └── protocol.model.ts         # Level 5: Protocol model
│   │   ├── configuration/                # Level 4: Configuration models
│   │   │   ├── agent.config.ts           # Level 5: Agent configuration
│   │   │   ├── deployment.config.ts      # Level 5: Deployment configuration
│   │   │   ├── security.config.ts        # Level 5: Security configuration
│   │   │   ├── monitoring.config.ts      # Level 5: Monitoring configuration
│   │   │   └── integration.config.ts     # Level 5: Integration configuration
│   │   └── validation/                   # Level 4: Validation models
│   │       ├── input.schema.ts           # Level 5: Input validation schemas
│   │       ├── output.schema.ts          # Level 5: Output validation schemas
│   │       ├── config.schema.ts          # Level 5: Configuration schemas
│   │       ├── state.schema.ts           # Level 5: State validation schemas
│   │       └── protocol.schema.ts        # Level 5: Protocol schemas
│   ├── utils/                            # Level 3: Utility functions
│   │   ├── common/                       # Level 4: Common utilities
│   │   │   ├── logger.util.ts            # Level 5: Logging utilities
│   │   │   ├── error.util.ts             # Level 5: Error handling utilities
│   │   │   ├── validation.util.ts        # Level 5: Validation utilities
│   │   │   ├── formatting.util.ts        # Level 5: Formatting utilities
│   │   │   └── conversion.util.ts        # Level 5: Data conversion utilities
│   │   ├── security/                     # Level 4: Security utilities
│   │   │   ├── crypto.util.ts            # Level 5: Cryptographic utilities
│   │   │   ├── token.util.ts             # Level 5: Token management utilities
│   │   │   ├── hash.util.ts              # Level 5: Hashing utilities
│   │   │   ├── cert.util.ts              # Level 5: Certificate utilities
│   │   │   └── audit.util.ts             # Level 5: Audit utilities
│   │   ├── performance/                  # Level 4: Performance utilities
│   │   │   ├── metrics.util.ts           # Level 5: Metrics utilities
│   │   │   ├── profiling.util.ts         # Level 5: Profiling utilities
│   │   │   ├── caching.util.ts           # Level 5: Caching utilities
│   │   │   ├── optimization.util.ts      # Level 5: Optimization utilities
│   │   │   └── monitoring.util.ts        # Level 5: Monitoring utilities
│   │   └── integration/                  # Level 4: Integration utilities
│   │       ├── api.util.ts               # Level 5: API utilities
│   │       ├── protocol.util.ts          # Level 5: Protocol utilities
│   │       ├── serialization.util.ts     # Level 5: Serialization utilities
│   │       ├── transport.util.ts         # Level 5: Transport utilities
│   │       └── discovery.util.ts         # Level 5: Service discovery utilities
│   └── types/                            # Level 3: Type definitions
│       ├── core/                         # Level 4: Core type definitions
│       │   ├── agent.types.ts            # Level 5: Agent type definitions
│       │   ├── capability.types.ts       # Level 5: Capability types
│       │   ├── operation.types.ts        # Level 5: Operation types
│       │   ├── execution.types.ts        # Level 5: Execution types
│       │   └── lifecycle.types.ts        # Level 5: Lifecycle types
│       ├── communication/                # Level 4: Communication types
│       │   ├── protocol.types.ts         # Level 5: Protocol types
│       │   ├── message.types.ts          # Level 5: Message types
│       │   ├── event.types.ts            # Level 5: Event types
│       │   ├── request.types.ts          # Level 5: Request types
│       │   └── response.types.ts         # Level 5: Response types
│       ├── configuration/                # Level 4: Configuration types
│       │   ├── agent.config.types.ts     # Level 5: Agent configuration types
│       │   ├── deployment.types.ts       # Level 5: Deployment types
│       │   ├── security.types.ts         # Level 5: Security types
│       │   ├── monitoring.types.ts       # Level 5: Monitoring types
│       │   └── integration.types.ts      # Level 5: Integration types
│       └── external/                     # Level 4: External API types
│           ├── mcp.types.ts              # Level 5: MCP protocol types
│           ├── openapi.types.ts          # Level 5: OpenAPI types
│           ├── grpc.types.ts             # Level 5: gRPC types
│           ├── websocket.types.ts        # Level 5: WebSocket types
│           └── graphql.types.ts          # Level 5: GraphQL types
├── behaviors/                            # Level 2: Agent behaviors
│   ├── [agent-name].behavior.yml         # Level 3: Primary behavior definition
│   ├── standard/                         # Level 3: Standard behaviors
│   │   ├── initialization.behavior.yml   # Level 4: Initialization behavior
│   │   │   ├── startup.sequence.yml      # Level 5: Startup sequence
│   │   │   ├── configuration.load.yml    # Level 5: Configuration loading
│   │   │   ├── dependency.check.yml      # Level 5: Dependency checking
│   │   │   ├── health.check.yml          # Level 5: Health check setup
│   │   │   └── registration.yml          # Level 5: Service registration
│   │   ├── execution.behavior.yml        # Level 4: Execution behavior
│   │   │   ├── request.processing.yml    # Level 5: Request processing
│   │   │   ├── operation.execution.yml   # Level 5: Operation execution
│   │   │   ├── result.formatting.yml     # Level 5: Result formatting
│   │   │   ├── error.handling.yml        # Level 5: Error handling
│   │   │   └── timeout.management.yml    # Level 5: Timeout management
│   │   ├── communication.behavior.yml    # Level 4: Communication behavior
│   │   │   ├── protocol.selection.yml    # Level 5: Protocol selection
│   │   │   ├── message.routing.yml       # Level 5: Message routing
│   │   │   ├── security.enforcement.yml  # Level 5: Security enforcement
│   │   │   ├── rate.limiting.yml         # Level 5: Rate limiting
│   │   │   └── circuit.breaking.yml      # Level 5: Circuit breaking
│   │   └── shutdown.behavior.yml         # Level 4: Shutdown behavior
│   │       ├── graceful.shutdown.yml     # Level 5: Graceful shutdown
│   │       ├── resource.cleanup.yml      # Level 5: Resource cleanup
│   │       ├── state.persistence.yml     # Level 5: State persistence
│   │       ├── connection.closing.yml    # Level 5: Connection closing
│   │       └── deregistration.yml        # Level 5: Service deregistration
│   ├── custom/                           # Level 3: Custom behaviors
│   │   ├── domain.specific.behavior.yml  # Level 4: Domain-specific behaviors
│   │   │   ├── nlp.processing.yml        # Level 5: NLP processing behavior
│   │   │   ├── vision.analysis.yml       # Level 5: Vision analysis behavior
│   │   │   ├── data.transformation.yml   # Level 5: Data transformation
│   │   │   ├── reasoning.logic.yml       # Level 5: Reasoning logic
│   │   │   └── audio.processing.yml      # Level 5: Audio processing
│   │   ├── integration.behavior.yml      # Level 4: Integration behaviors
│   │   │   ├── api.integration.yml       # Level 5: API integration behavior
│   │   │   ├── database.access.yml       # Level 5: Database access behavior
│   │   │   ├── queue.processing.yml      # Level 5: Queue processing
│   │   │   ├── file.processing.yml       # Level 5: File processing
│   │   │   └── stream.processing.yml     # Level 5: Stream processing
│   │   └── optimization.behavior.yml     # Level 4: Optimization behaviors
│   │       ├── performance.tuning.yml    # Level 5: Performance tuning
│   │       ├── resource.optimization.yml # Level 5: Resource optimization
│   │       ├── caching.strategy.yml      # Level 5: Caching strategy
│   │       ├── load.balancing.yml        # Level 5: Load balancing
│   │       └── scaling.behavior.yml      # Level 5: Scaling behavior
│   └── error-handling/                   # Level 3: Error handling behaviors
│       ├── recovery.behavior.yml         # Level 4: Recovery behaviors
│       │   ├── automatic.recovery.yml    # Level 5: Automatic recovery
│       │   ├── manual.intervention.yml   # Level 5: Manual intervention
│       │   ├── fallback.strategies.yml   # Level 5: Fallback strategies
│       │   ├── retry.logic.yml           # Level 5: Retry logic
│       │   └── escalation.procedures.yml # Level 5: Escalation procedures
│       ├── monitoring.behavior.yml       # Level 4: Error monitoring
│       │   ├── error.detection.yml       # Level 5: Error detection
│       │   ├── alert.generation.yml      # Level 5: Alert generation
│       │   ├── logging.behavior.yml      # Level 5: Error logging
│       │   ├── metrics.collection.yml    # Level 5: Error metrics
│       │   └── reporting.behavior.yml    # Level 5: Error reporting
│       └── prevention.behavior.yml       # Level 4: Error prevention
│           ├── validation.checks.yml     # Level 5: Validation checks
│           ├── circuit.breakers.yml      # Level 5: Circuit breakers
│           ├── resource.limits.yml       # Level 5: Resource limits
│           ├── timeout.controls.yml      # Level 5: Timeout controls
│           └── health.monitoring.yml     # Level 5: Health monitoring
├── schemas/                              # Level 2: JSON schemas
│   ├── [agent-name].schema.json          # Level 3: Primary agent schema
│   ├── input/                            # Level 3: Input schemas
│   │   ├── operations/                   # Level 4: Operation input schemas
│   │   │   ├── execute.input.json        # Level 5: Execute operation input
│   │   │   ├── configure.input.json      # Level 5: Configure operation input
│   │   │   ├── validate.input.json       # Level 5: Validate operation input
│   │   │   ├── monitor.input.json        # Level 5: Monitor operation input
│   │   │   └── custom.input.json         # Level 5: Custom operation inputs
│   │   ├── communication/                # Level 4: Communication input schemas
│   │   │   ├── message.input.json        # Level 5: Message input schema
│   │   │   ├── request.input.json        # Level 5: Request input schema
│   │   │   ├── event.input.json          # Level 5: Event input schema
│   │   │   ├── command.input.json        # Level 5: Command input schema
│   │   │   └── query.input.json          # Level 5: Query input schema
│   │   └── configuration/                # Level 4: Configuration input schemas
│   │       ├── agent.config.input.json   # Level 5: Agent config input
│   │       ├── deployment.input.json     # Level 5: Deployment input
│   │       ├── security.input.json       # Level 5: Security input
│   │       ├── monitoring.input.json     # Level 5: Monitoring input
│   │       └── integration.input.json    # Level 5: Integration input
│   ├── output/                           # Level 3: Output schemas
│   │   ├── operations/                   # Level 4: Operation output schemas
│   │   │   ├── execute.output.json       # Level 5: Execute operation output
│   │   │   ├── status.output.json        # Level 5: Status operation output
│   │   │   ├── health.output.json        # Level 5: Health operation output
│   │   │   ├── capabilities.output.json  # Level 5: Capabilities output
│   │   │   └── metrics.output.json       # Level 5: Metrics output
│   │   ├── communication/                # Level 4: Communication output schemas
│   │   │   ├── response.output.json      # Level 5: Response output schema
│   │   │   ├── event.output.json         # Level 5: Event output schema
│   │   │   ├── notification.output.json  # Level 5: Notification output
│   │   │   ├── result.output.json        # Level 5: Result output schema
│   │   │   └── error.output.json         # Level 5: Error output schema
│   │   └── reporting/                    # Level 4: Reporting output schemas
│   │       ├── performance.report.json   # Level 5: Performance report
│   │       ├── health.report.json        # Level 5: Health report
│   │       ├── audit.report.json         # Level 5: Audit report
│   │       ├── compliance.report.json    # Level 5: Compliance report
│   │       └── usage.report.json         # Level 5: Usage report
│   └── validation/                       # Level 3: Validation schemas
│       ├── manifest/                     # Level 4: Manifest validation
│       │   ├── ossa.compliance.json      # Level 5: OSSA compliance schema
│       │   ├── metadata.validation.json  # Level 5: Metadata validation
│       │   ├── capability.validation.json # Level 5: Capability validation
│       │   ├── protocol.validation.json  # Level 5: Protocol validation
│       │   └── security.validation.json  # Level 5: Security validation
│       ├── runtime/                      # Level 4: Runtime validation
│       │   ├── state.validation.json     # Level 5: State validation
│       │   ├── performance.validation.json # Level 5: Performance validation
│       │   ├── resource.validation.json  # Level 5: Resource validation
│       │   ├── health.validation.json    # Level 5: Health validation
│       │   └── compliance.validation.json # Level 5: Compliance validation
│       └── integration/                  # Level 4: Integration validation
│           ├── api.validation.json       # Level 5: API validation schema
│           ├── protocol.validation.json  # Level 5: Protocol validation
│           ├── security.validation.json  # Level 5: Security validation
│           ├── performance.validation.json # Level 5: Performance validation
│           └── compatibility.validation.json # Level 5: Compatibility validation
├── openapi.yml                           # Level 2: OpenAPI specification
├── tests/                                # Level 2: Test suites
│   ├── unit/                             # Level 3: Unit tests
│   │   ├── [agent-name].test.ts          # Level 4: Primary agent tests
│   │   ├── core/                         # Level 4: Core functionality tests
│   │   │   ├── agent.core.test.ts        # Level 5: Core agent tests
│   │   │   ├── lifecycle.test.ts         # Level 5: Lifecycle tests
│   │   │   ├── state.management.test.ts  # Level 5: State management tests
│   │   │   ├── configuration.test.ts     # Level 5: Configuration tests
│   │   │   └── health.monitor.test.ts    # Level 5: Health monitoring tests
│   │   ├── capabilities/                 # Level 4: Capability tests
│   │   │   ├── capability.registry.test.ts # Level 5: Registry tests
│   │   │   ├── operation.executor.test.ts # Level 5: Executor tests
│   │   │   ├── input.validator.test.ts   # Level 5: Input validation tests
│   │   │   ├── output.formatter.test.ts  # Level 5: Output formatting tests
│   │   │   └── domain.specific.test.ts   # Level 5: Domain-specific tests
│   │   ├── communication/                # Level 4: Communication tests
│   │   │   ├── protocol.manager.test.ts  # Level 5: Protocol manager tests
│   │   │   ├── rest.handler.test.ts      # Level 5: REST handler tests
│   │   │   ├── grpc.handler.test.ts      # Level 5: gRPC handler tests
│   │   │   ├── websocket.handler.test.ts # Level 5: WebSocket handler tests
│   │   │   └── mcp.handler.test.ts       # Level 5: MCP handler tests
│   │   └── security/                     # Level 4: Security tests
│   │       ├── authentication.test.ts    # Level 5: Authentication tests
│   │       ├── authorization.test.ts     # Level 5: Authorization tests
│   │       ├── encryption.test.ts        # Level 5: Encryption tests
│   │       ├── audit.logger.test.ts      # Level 5: Audit logging tests
│   │       └── compliance.test.ts        # Level 5: Compliance tests
│   ├── integration/                      # Level 3: Integration tests
│   │   ├── api/                          # Level 4: API integration tests
│   │   │   ├── rest.integration.test.ts  # Level 5: REST API tests
│   │   │   ├── grpc.integration.test.ts  # Level 5: gRPC integration tests
│   │   │   ├── websocket.integration.test.ts # Level 5: WebSocket tests
│   │   │   ├── graphql.integration.test.ts # Level 5: GraphQL tests
│   │   │   └── mcp.integration.test.ts   # Level 5: MCP integration tests
│   │   ├── external/                     # Level 4: External service tests
│   │   │   ├── database.integration.test.ts # Level 5: Database tests
│   │   │   ├── queue.integration.test.ts # Level 5: Message queue tests
│   │   │   ├── cache.integration.test.ts # Level 5: Cache integration tests
│   │   │   ├── storage.integration.test.ts # Level 5: Storage tests
│   │   │   └── monitoring.integration.test.ts # Level 5: Monitoring tests
│   │   └── workflows/                    # Level 4: Workflow integration tests
│   │       ├── orchestration.test.ts     # Level 5: Orchestration tests
│   │       ├── coordination.test.ts      # Level 5: Coordination tests
│   │       ├── execution.test.ts         # Level 5: Execution tests
│   │       ├── error.handling.test.ts    # Level 5: Error handling tests
│   │       └── recovery.test.ts          # Level 5: Recovery tests
│   ├── performance/                      # Level 3: Performance tests
│   │   ├── load/                         # Level 4: Load tests
│   │   │   ├── concurrent.requests.test.ts # Level 5: Concurrent request tests
│   │   │   ├── sustained.load.test.ts    # Level 5: Sustained load tests
│   │   │   ├── peak.load.test.ts         # Level 5: Peak load tests
│   │   │   ├── stress.test.ts            # Level 5: Stress tests
│   │   │   └── endurance.test.ts         # Level 5: Endurance tests
│   │   ├── throughput/                   # Level 4: Throughput tests
│   │   │   ├── requests.per.second.test.ts # Level 5: RPS tests
│   │   │   ├── data.processing.test.ts   # Level 5: Data processing tests
│   │   │   ├── message.handling.test.ts  # Level 5: Message handling tests
│   │   │   ├── batch.processing.test.ts  # Level 5: Batch processing tests
│   │   │   └── streaming.test.ts         # Level 5: Streaming tests
│   │   └── latency/                      # Level 4: Latency tests
│   │       ├── response.time.test.ts     # Level 5: Response time tests
│   │       ├── processing.delay.test.ts  # Level 5: Processing delay tests
│   │       ├── network.latency.test.ts   # Level 5: Network latency tests
│   │       ├── database.latency.test.ts  # Level 5: Database latency tests
│   │       └── cache.latency.test.ts     # Level 5: Cache latency tests
│   └── security/                         # Level 3: Security tests
│       ├── authentication/               # Level 4: Authentication tests
│       │   ├── oauth2.test.ts            # Level 5: OAuth 2.0 tests
│       │   ├── jwt.test.ts               # Level 5: JWT tests
│       │   ├── api.key.test.ts           # Level 5: API key tests
│       │   ├── mtls.test.ts              # Level 5: mTLS tests
│       │   └── multi.factor.test.ts      # Level 5: Multi-factor auth tests
│       ├── authorization/                # Level 4: Authorization tests
│       │   ├── rbac.test.ts              # Level 5: RBAC tests
│       │   ├── abac.test.ts              # Level 5: ABAC tests
│       │   ├── policy.enforcement.test.ts # Level 5: Policy enforcement tests
│       │   ├── access.control.test.ts    # Level 5: Access control tests
│       │   └── privilege.escalation.test.ts # Level 5: Privilege escalation tests
│       ├── encryption/                   # Level 4: Encryption tests
│       │   ├── data.at.rest.test.ts      # Level 5: Data at rest tests
│       │   ├── data.in.transit.test.ts   # Level 5: Data in transit tests
│       │   ├── key.management.test.ts    # Level 5: Key management tests
│       │   ├── certificate.test.ts       # Level 5: Certificate tests
│       │   └── algorithm.test.ts         # Level 5: Algorithm tests
│       └── vulnerability/                # Level 4: Vulnerability tests
│           ├── injection.test.ts         # Level 5: Injection attack tests
│           ├── xss.test.ts               # Level 5: XSS tests
│           ├── csrf.test.ts              # Level 5: CSRF tests
│           ├── dos.test.ts               # Level 5: DoS tests
│           └── penetration.test.ts       # Level 5: Penetration tests
├── docs/                                 # Level 2: Documentation
│   ├── api/                              # Level 3: API documentation
│   │   ├── openapi.html                  # Level 4: OpenAPI documentation
│   │   ├── endpoints/                    # Level 4: Endpoint documentation
│   │   │   ├── health.md                 # Level 5: Health endpoints
│   │   │   ├── capabilities.md           # Level 5: Capabilities endpoints
│   │   │   ├── execution.md              # Level 5: Execution endpoints
│   │   │   ├── lifecycle.md              # Level 5: Lifecycle endpoints
│   │   │   └── communication.md          # Level 5: Communication endpoints
│   │   ├── authentication/               # Level 4: Authentication docs
│   │   │   ├── oauth2.md                 # Level 5: OAuth 2.0 documentation
│   │   │   ├── jwt.md                    # Level 5: JWT documentation
│   │   │   ├── api-keys.md               # Level 5: API key documentation
│   │   │   ├── mtls.md                   # Level 5: mTLS documentation
│   │   │   └── security.md               # Level 5: Security documentation
│   │   └── examples/                     # Level 4: API examples
│   │       ├── curl.examples.md          # Level 5: cURL examples
│   │       ├── javascript.examples.md    # Level 5: JavaScript examples
│   │       ├── python.examples.md        # Level 5: Python examples
│   │       ├── typescript.examples.md    # Level 5: TypeScript examples
│   │       └── postman.collection.json   # Level 5: Postman collection
│   ├── deployment/                       # Level 3: Deployment documentation
│   │   ├── kubernetes/                   # Level 4: Kubernetes deployment
│   │   │   ├── manifests.md              # Level 5: Kubernetes manifests
│   │   │   ├── helm.charts.md            # Level 5: Helm charts
│   │   │   ├── operators.md              # Level 5: Kubernetes operators
│   │   │   ├── networking.md             # Level 5: Networking setup
│   │   │   └── security.md               # Level 5: Security configuration
│   │   ├── docker/                       # Level 4: Docker deployment
│   │   │   ├── dockerfile.md             # Level 5: Dockerfile documentation
│   │   │   ├── compose.md                # Level 5: Docker Compose
│   │   │   ├── volumes.md                # Level 5: Volume configuration
│   │   │   ├── networking.md             # Level 5: Network configuration
│   │   │   └── security.md               # Level 5: Security configuration
│   │   ├── cloud/                        # Level 4: Cloud deployment
│   │   │   ├── aws.md                    # Level 5: AWS deployment
│   │   │   ├── azure.md                  # Level 5: Azure deployment
│   │   │   ├── gcp.md                    # Level 5: GCP deployment
│   │   │   ├── serverless.md             # Level 5: Serverless deployment
│   │   │   └── edge.md                   # Level 5: Edge deployment
│   │   └── monitoring/                   # Level 4: Monitoring setup
│   │       ├── prometheus.md             # Level 5: Prometheus setup
│   │       ├── grafana.md                # Level 5: Grafana dashboards
│   │       ├── jaeger.md                 # Level 5: Jaeger tracing
│   │       ├── elasticsearch.md          # Level 5: Elasticsearch logging
│   │       └── alerting.md               # Level 5: Alerting setup
│   ├── development/                      # Level 3: Development documentation
│   │   ├── setup/                        # Level 4: Development setup
│   │   │   ├── environment.md            # Level 5: Environment setup
│   │   │   ├── dependencies.md           # Level 5: Dependencies
│   │   │   ├── configuration.md          # Level 5: Configuration
│   │   │   ├── database.md               # Level 5: Database setup
│   │   │   └── testing.md                # Level 5: Testing setup
│   │   ├── guidelines/                   # Level 4: Development guidelines
│   │   │   ├── coding.standards.md       # Level 5: Coding standards
│   │   │   ├── architecture.md           # Level 5: Architecture guidelines
│   │   │   ├── security.md               # Level 5: Security guidelines
│   │   │   ├── performance.md            # Level 5: Performance guidelines
│   │   │   └── testing.md                # Level 5: Testing guidelines
│   │   └── workflows/                    # Level 4: Development workflows
│   │       ├── git.workflow.md           # Level 5: Git workflow
│   │       ├── ci-cd.md                  # Level 5: CI/CD pipeline
│   │       ├── code.review.md            # Level 5: Code review process
│   │       ├── release.process.md        # Level 5: Release process
│   │       └── hotfix.process.md         # Level 5: Hotfix process
│   └── operations/                       # Level 3: Operations documentation
│       ├── monitoring/                   # Level 4: Monitoring documentation
│       │   ├── health.checks.md          # Level 5: Health checks
│       │   ├── metrics.md                # Level 5: Metrics collection
│       │   ├── logging.md                # Level 5: Logging setup
│       │   ├── alerting.md               # Level 5: Alerting configuration
│       │   └── dashboards.md             # Level 5: Dashboard setup
│       ├── maintenance/                  # Level 4: Maintenance procedures
│       │   ├── updates.md                # Level 5: Update procedures
│       │   ├── backup.md                 # Level 5: Backup procedures
│       │   ├── recovery.md               # Level 5: Recovery procedures
│       │   ├── scaling.md                # Level 5: Scaling procedures
│       │   └── troubleshooting.md        # Level 5: Troubleshooting guide
│       ├── security/                     # Level 4: Security operations
│       │   ├── incident.response.md      # Level 5: Incident response
│       │   ├── vulnerability.management.md # Level 5: Vulnerability mgmt
│       │   ├── access.management.md      # Level 5: Access management
│       │   ├── audit.procedures.md       # Level 5: Audit procedures
│       │   └── compliance.md             # Level 5: Compliance procedures
│       └── disaster-recovery/            # Level 4: Disaster recovery
│           ├── backup.strategies.md      # Level 5: Backup strategies
│           ├── recovery.plans.md         # Level 5: Recovery plans
│           ├── failover.procedures.md    # Level 5: Failover procedures
│           ├── data.restoration.md       # Level 5: Data restoration
│           └── business.continuity.md    # Level 5: Business continuity
├── config/                               # Level 2: Configuration files
│   ├── environments/                     # Level 3: Environment configurations
│   │   ├── development/                  # Level 4: Development environment
│   │   │   ├── agent.config.yml          # Level 5: Agent configuration
│   │   │   ├── database.config.yml       # Level 5: Database configuration
│   │   │   ├── security.config.yml       # Level 5: Security configuration
│   │   │   ├── monitoring.config.yml     # Level 5: Monitoring configuration
│   │   │   └── integration.config.yml    # Level 5: Integration configuration
│   │   ├── staging/                      # Level 4: Staging environment
│   │   │   ├── agent.config.yml          # Level 5: Agent configuration
│   │   │   ├── database.config.yml       # Level 5: Database configuration
│   │   │   ├── security.config.yml       # Level 5: Security configuration
│   │   │   ├── monitoring.config.yml     # Level 5: Monitoring configuration
│   │   │   └── integration.config.yml    # Level 5: Integration configuration
│   │   └── production/                   # Level 4: Production environment
│   │       ├── agent.config.yml          # Level 5: Agent configuration
│   │       ├── database.config.yml       # Level 5: Database configuration
│   │       ├── security.config.yml       # Level 5: Security configuration
│   │       ├── monitoring.config.yml     # Level 5: Monitoring configuration
│   │       └── integration.config.yml    # Level 5: Integration configuration
│   ├── deployment/                       # Level 3: Deployment configurations
│   │   ├── kubernetes/                   # Level 4: Kubernetes configs
│   │   │   ├── deployment.yml            # Level 5: Deployment manifest
│   │   │   ├── service.yml               # Level 5: Service manifest
│   │   │   ├── ingress.yml               # Level 5: Ingress manifest
│   │   │   ├── configmap.yml             # Level 5: ConfigMap manifest
│   │   │   └── secret.yml                # Level 5: Secret manifest
│   │   ├── docker/                       # Level 4: Docker configs
│   │   │   ├── Dockerfile                # Level 5: Docker image definition
│   │   │   ├── docker-compose.yml        # Level 5: Docker Compose file
│   │   │   ├── .dockerignore             # Level 5: Docker ignore file
│   │   │   ├── nginx.conf                # Level 5: Nginx configuration
│   │   │   └── supervisord.conf          # Level 5: Supervisor configuration
│   │   └── cloud/                        # Level 4: Cloud-specific configs
│   │       ├── aws.config.yml            # Level 5: AWS configuration
│   │       ├── azure.config.yml          # Level 5: Azure configuration
│   │       ├── gcp.config.yml            # Level 5: GCP configuration
│   │       ├── terraform.tf              # Level 5: Terraform configuration
│   │       └── cloudformation.yml        # Level 5: CloudFormation template
│   ├── monitoring/                       # Level 3: Monitoring configurations
│   │   ├── prometheus/                   # Level 4: Prometheus configs
│   │   │   ├── prometheus.yml            # Level 5: Prometheus configuration
│   │   │   ├── alert.rules.yml           # Level 5: Alert rules
│   │   │   ├── recording.rules.yml       # Level 5: Recording rules
│   │   │   ├── scrape.configs.yml        # Level 5: Scrape configurations
│   │   │   └── federation.yml            # Level 5: Federation configuration
│   │   ├── grafana/                      # Level 4: Grafana configs
│   │   │   ├── dashboards/               # Level 5: Dashboard definitions
│   │   │   ├── datasources.yml           # Level 5: Data source configuration
│   │   │   ├── plugins.yml               # Level 5: Plugin configuration
│   │   │   ├── users.yml                 # Level 5: User configuration
│   │   │   └── notifications.yml         # Level 5: Notification channels
│   │   └── logging/                      # Level 4: Logging configs
│   │       ├── logback.xml               # Level 5: Logback configuration
│   │       ├── log4j2.xml                # Level 5: Log4j2 configuration
│   │       ├── fluentd.conf              # Level 5: Fluentd configuration
│   │       ├── logstash.conf             # Level 5: Logstash configuration
│   │       └── filebeat.yml              # Level 5: Filebeat configuration
│   └── security/                         # Level 3: Security configurations
│       ├── authentication/               # Level 4: Authentication configs
│       │   ├── oauth2.config.yml         # Level 5: OAuth 2.0 configuration
│       │   ├── jwt.config.yml            # Level 5: JWT configuration
│       │   ├── saml.config.yml           # Level 5: SAML configuration
│       │   ├── ldap.config.yml           # Level 5: LDAP configuration
│       │   └── certificates/             # Level 5: Certificate files
│       ├── authorization/                # Level 4: Authorization configs
│       │   ├── rbac.config.yml           # Level 5: RBAC configuration
│       │   ├── abac.config.yml           # Level 5: ABAC configuration
│       │   ├── policies.yml              # Level 5: Policy definitions
│       │   ├── roles.yml                 # Level 5: Role definitions
│       │   └── permissions.yml           # Level 5: Permission definitions
│       └── encryption/                   # Level 4: Encryption configs
│           ├── tls.config.yml            # Level 5: TLS configuration
│           ├── key.management.yml        # Level 5: Key management
│           ├── cipher.suites.yml         # Level 5: Cipher suite config
│           ├── certificate.config.yml    # Level 5: Certificate config
│           └── hashing.config.yml        # Level 5: Hashing configuration
└── scripts/                              # Level 2: Utility scripts
    ├── build/                            # Level 3: Build scripts
    │   ├── compile.sh                    # Level 4: Compilation script
    │   ├── package.sh                    # Level 4: Packaging script
    │   ├── docker/                       # Level 4: Docker build scripts
    │   │   ├── build.image.sh            # Level 5: Docker image build
    │   │   ├── push.image.sh             # Level 5: Docker image push
    │   │   ├── tag.image.sh              # Level 5: Docker image tagging
    │   │   ├── scan.image.sh             # Level 5: Docker image scanning
    │   │   └── cleanup.images.sh         # Level 5: Docker image cleanup
    │   └── kubernetes/                   # Level 4: Kubernetes build scripts
    │       ├── generate.manifests.sh     # Level 5: Generate K8s manifests
    │       ├── validate.manifests.sh     # Level 5: Validate manifests
    │       ├── deploy.sh                 # Level 5: Deploy to cluster
    │       ├── rollback.sh               # Level 5: Rollback deployment
    │       └── cleanup.sh                # Level 5: Cleanup resources
    ├── deployment/                       # Level 3: Deployment scripts
    │   ├── deploy.sh                     # Level 4: Main deployment script
    │   ├── rollback.sh                   # Level 4: Rollback script
    │   ├── environments/                 # Level 4: Environment-specific scripts
    │   │   ├── deploy.dev.sh             # Level 5: Development deployment
    │   │   ├── deploy.staging.sh         # Level 5: Staging deployment
    │   │   ├── deploy.prod.sh            # Level 5: Production deployment
    │   │   ├── promote.staging.sh        # Level 5: Promote to staging
    │   │   └── promote.prod.sh           # Level 5: Promote to production
    │   └── verification/                 # Level 4: Deployment verification
    │       ├── health.check.sh           # Level 5: Health check script
    │       ├── smoke.test.sh             # Level 5: Smoke test script
    │       ├── integration.test.sh       # Level 5: Integration test script
    │       ├── performance.test.sh       # Level 5: Performance test script
    │       └── security.scan.sh          # Level 5: Security scan script
    ├── maintenance/                      # Level 3: Maintenance scripts
    │   ├── backup.sh                     # Level 4: Backup script
    │   ├── restore.sh                    # Level 4: Restore script
    │   ├── update/                       # Level 4: Update scripts
    │   │   ├── dependencies.sh           # Level 5: Update dependencies
    │   │   ├── configuration.sh          # Level 5: Update configuration
    │   │   ├── security.patches.sh       # Level 5: Apply security patches
    │   │   ├── database.migration.sh     # Level 5: Database migration
    │   │   └── rollback.migration.sh     # Level 5: Rollback migration
    │   └── monitoring/                   # Level 4: Monitoring scripts
    │       ├── health.monitor.sh         # Level 5: Health monitoring
    │       ├── performance.monitor.sh    # Level 5: Performance monitoring
    │       ├── resource.monitor.sh       # Level 5: Resource monitoring
    │       ├── security.monitor.sh       # Level 5: Security monitoring
    │       └── alert.processor.sh        # Level 5: Alert processing
    ├── testing/                          # Level 3: Testing scripts
    │   ├── unit.test.sh                  # Level 4: Unit test runner
    │   ├── integration.test.sh           # Level 4: Integration test runner
    │   ├── performance/                  # Level 4: Performance testing
    │   │   ├── load.test.sh              # Level 5: Load testing
    │   │   ├── stress.test.sh            # Level 5: Stress testing
    │   │   ├── endurance.test.sh         # Level 5: Endurance testing
    │   │   ├── spike.test.sh             # Level 5: Spike testing
    │   │   └── baseline.test.sh          # Level 5: Baseline testing
    │   └── security/                     # Level 4: Security testing
    │       ├── vulnerability.scan.sh     # Level 5: Vulnerability scanning
    │       ├── penetration.test.sh       # Level 5: Penetration testing
    │       ├── compliance.check.sh       # Level 5: Compliance checking
    │       ├── secret.scan.sh            # Level 5: Secret scanning
    │       └── dependency.scan.sh        # Level 5: Dependency scanning
    └── utilities/                        # Level 3: Utility scripts
        ├── setup/                        # Level 4: Setup utilities
        │   ├── environment.setup.sh      # Level 5: Environment setup
        │   ├── database.setup.sh         # Level 5: Database setup
        │   ├── monitoring.setup.sh       # Level 5: Monitoring setup
        │   ├── security.setup.sh         # Level 5: Security setup
        │   └── integration.setup.sh      # Level 5: Integration setup
        ├── cleanup/                      # Level 4: Cleanup utilities
        │   ├── logs.cleanup.sh           # Level 5: Log cleanup
        │   ├── cache.cleanup.sh          # Level 5: Cache cleanup
        │   ├── temp.cleanup.sh           # Level 5: Temporary file cleanup
        │   ├── database.cleanup.sh       # Level 5: Database cleanup
        │   └── resource.cleanup.sh       # Level 5: Resource cleanup
        └── validation/                   # Level 4: Validation utilities
            ├── config.validation.sh      # Level 5: Configuration validation
            ├── manifest.validation.sh    # Level 5: Manifest validation
            ├── dependency.check.sh       # Level 5: Dependency checking
            ├── compatibility.check.sh    # Level 5: Compatibility checking
            └── compliance.check.sh       # Level 5: Compliance checking
```

## Purpose of Each Level

### Level 1: Agent Root Directory
The top-level directory for a specific agent implementation, containing all necessary files and subdirectories for that agent.

### Level 2: Major Functional Areas
Eight core areas covering agent definition, source code, behaviors, schemas, API specification, tests, documentation, configuration, and utility scripts.

### Level 3: Specific Categories
Detailed categorization within each functional area, such as separating unit tests from integration tests, or core source code from handlers.

### Level 4: Implementation Details
Specific implementations within categories, such as different types of handlers (HTTP, events, messages) or different test types (load, stress, security).

### Level 5: Individual Files
Actual implementation files, configuration files, test files, and documentation files that contain the specific code and configurations needed for the agent to function.

## Key Characteristics

1. **OSSA Compliance**: Every agent folder follows the OSSA specification with required `agent.yml` manifest
2. **Self-Contained**: Each agent has everything needed for independent operation
3. **Comprehensive Testing**: Full test coverage including unit, integration, performance, and security tests
4. **Multiple Protocols**: Support for REST, gRPC, WebSocket, MCP, and GraphQL communication
5. **Security-First**: Built-in security, authentication, authorization, and compliance features
6. **Observability**: Comprehensive monitoring, logging, and health check capabilities
7. **Documentation**: Complete documentation for API, deployment, development, and operations
8. **Multi-Environment**: Support for development, staging, and production environments
9. **Automation-Ready**: Scripts for build, deployment, testing, and maintenance
10. **TypeScript/Node.js**: Modern TypeScript implementation with proper type definitions
11. **Behavior-Driven**: Declarative behavior definitions in YAML format
12. **Schema-Validated**: JSON schemas for all inputs, outputs, and configurations
13. **Cloud-Native**: Support for Kubernetes, Docker, and major cloud providers
14. **Extensible**: Clear structure for adding new capabilities and integrations

## Agent Types and Specializations

This structure supports all OSSA agent types:
- **Orchestrator**: Workflow coordination and multi-agent management
- **Worker**: Task execution and data processing
- **Critic**: Quality assurance and validation
- **Judge**: Decision making and evaluation
- **Trainer**: Learning and model improvement
- **Governor**: Policy enforcement and compliance
- **Monitor**: System observability and alerting
- **Integrator**: System integration and protocol bridging
- **Voice**: Audio and speech processing

Each agent type can have specialized implementations while maintaining the same consistent structure.