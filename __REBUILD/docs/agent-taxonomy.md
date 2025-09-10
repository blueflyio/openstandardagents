# OSSA Agent Taxonomy v0.1.9-alpha.1

## Core Agent Categories

### 1. Orchestrator Agents
Control and coordinate other agents in workflows.
- **Subtypes**: platform, workflow, coordination
- **Responsibilities**: Planning, resource allocation, task decomposition
- **Example**: orchestrator-platform-v0.1.9

### 2. Worker Agents  
Execute specific tasks and operations.
- **Subtypes**: api, data, compute, transform
- **Responsibilities**: Task execution, data processing, computation
- **Example**: worker-api-builder, worker-data-processor

### 3. Critic Agents
Review and evaluate outputs from other agents.
- **Subtypes**: quality, security, performance, compliance
- **Responsibilities**: Quality assessment, security review, compliance checks
- **Example**: critic-security-v0.1.9

### 4. Judge Agents
Make decisions based on critic evaluations.
- **Subtypes**: arbitration, selection, ranking
- **Responsibilities**: Decision making, conflict resolution, prioritization
- **Example**: judge-quality-v0.1.9

### 5. Trainer Agents
Extract learning from execution patterns.
- **Subtypes**: pattern, curriculum, feedback
- **Responsibilities**: Learning extraction, skill updates, knowledge synthesis
- **Example**: trainer-feedback-v0.1.9

### 6. Governor Agents
Enforce policies and governance rules.
- **Subtypes**: budget, compliance, security
- **Responsibilities**: Policy enforcement, budget control, governance
- **Example**: governor-budget-v0.1.9

### 7. Monitor Agents
Observe and report on system behavior.
- **Subtypes**: health, performance, audit
- **Responsibilities**: Health monitoring, performance tracking, audit logging
- **Example**: monitor-health-v0.1.9

### 8. Integrator Agents
Connect with external systems and services.
- **Subtypes**: registry, gateway, adapter
- **Responsibilities**: Service discovery, protocol adaptation, integration
- **Example**: integrator-registry-v0.1.9

### 9. Voice Agents (Interface Category)
Enable audio-based interaction with the platform.
- **Subtypes**: assistant, transcriber, translator, narrator
- **Responsibilities**: Audio processing, speech-to-text, text-to-speech, intent routing
- **Example**: voice-assistant-v0.1.9

## Interface Agent Category

Interface agents act as bridges between humans and the OSSA agent ecosystem. They handle different modalities of interaction.

### Voice Agents
- **Purpose**: Enable hands-free, audio-based interaction
- **Capabilities**:
  - Audio input processing (microphone, files, streams)
  - Speech-to-text transcription (Whisper, Google STT, Azure Speech)
  - Intent extraction and analysis
  - Text-to-speech synthesis (ElevenLabs, Google TTS, AWS Polly)
  - Context management across conversation turns
  - Wake word activation
  - Multi-language support

### Future Interface Types (Planned)
- **Visual Agents**: Image/video processing and generation
- **Gesture Agents**: Motion and gesture recognition
- **Haptic Agents**: Touch and force feedback interfaces
- **Biometric Agents**: Emotion and physiological signal processing

## Agent Capability Domains

### Core Domains
- `nlp` - Natural language processing
- `vision` - Computer vision and image processing
- `reasoning` - Logical reasoning and inference
- `data` - Data processing and transformation
- `documentation` - Documentation generation and analysis
- `api-design` - API specification and design
- `validation` - Validation and verification
- `orchestration` - Workflow orchestration
- `monitoring` - System monitoring and observability
- `security` - Security analysis and enforcement
- `compliance` - Compliance checking
- `testing` - Test execution and analysis
- `deployment` - Deployment and rollout

### Interface Domains (New)
- `audio` - Audio processing and analysis
- `speech` - Speech recognition and synthesis
- `interaction` - Multi-modal interaction handling

## Agent Naming Convention

```
{type}-{subtype}-v{version}
```

Examples:
- `orchestrator-platform-v0.1.9`
- `worker-api-v1.0.0`
- `voice-assistant-v0.1.9-alpha.1`
- `critic-security-v2.1.0`

## Agent Registration Requirements

### Mandatory Fields
1. Agent type (from taxonomy)
2. Agent subtype (specialized role)
3. Capability domains (minimum 1)
4. Communication protocols (minimum 1)
5. Conformance level (bronze/silver/gold)

### Voice Agent Specific Requirements
1. Voice configuration:
   - Input modes (microphone, audio_file, stream, websocket)
   - Output modes (speaker, audio_file, stream, websocket)
   - Transcription provider
   - TTS provider (optional)
   - Language support
2. Audio format specifications:
   - Sample rate
   - Channels
   - Encoding
3. Context window size for conversation management

## Conformance Levels

### Bronze
- Basic OSSA compliance
- Standard protocol support
- Audit logging

### Silver
- Bronze + Feedback loop participation
- Props token resolution
- Performance metrics reporting

### Gold
- Silver + Learning signal processing
- Comprehensive telemetry
- Advanced token optimization strategies
- Full 360° feedback loop integration

## Agent Lifecycle

1. **Registration**: Agent registers with manifest
2. **Validation**: Spec-authority validates compliance
3. **Discovery**: Available for discovery via registry
4. **Allocation**: Orchestrator allocates to tasks
5. **Execution**: Agent performs operations
6. **Feedback**: Participates in feedback loop
7. **Learning**: Contributes to system learning
8. **Deregistration**: Graceful shutdown and cleanup