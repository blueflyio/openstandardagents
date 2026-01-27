/**
 * CloudEvents-compliant Event Emitter for OSSA agents
 * Implements CloudEvents v1.0 specification
 */

export interface CloudEvent<T = unknown> {
  specversion: '1.0';
  type: string;
  source: string;
  id: string;
  time: string;
  datacontenttype?: string;
  subject?: string;
  data?: T;
  // OSSA Extensions
  ossaagentid?: string;
  ossainteractionid?: string;
  ossatraceid?: string;
  ossaspanid?: string;
}

export interface CloudEventsEmitterConfig {
  source: string;
  defaultType?: string;
  sink?: {
    type: 'http' | 'kafka' | 'stdout';
    url?: string;
    topic?: string;
    headers?: Record<string, string>;
  };
  batchSize?: number;
  flushIntervalMs?: number;
}

export class CloudEventsEmitter {
  private config: CloudEventsEmitterConfig;
  private buffer: CloudEvent[] = [];
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(config: CloudEventsEmitterConfig) {
    this.config = config;
    if (config.flushIntervalMs && config.batchSize) {
      this.flushTimer = setInterval(() => this.flush(), config.flushIntervalMs);
    }
  }

  emit<T>(
    type: string,
    data: T,
    options?: Partial<CloudEvent<T>>
  ): CloudEvent<T> {
    const event: CloudEvent<T> = {
      specversion: '1.0',
      type,
      source: this.config.source,
      id: this.generateId(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data,
      ...options,
    };

    if (this.config.batchSize && this.config.batchSize > 1) {
      this.buffer.push(event as CloudEvent);
      if (this.buffer.length >= this.config.batchSize) {
        this.flush();
      }
    } else {
      this.send([event as CloudEvent]);
    }

    return event;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];
    await this.send(events);
  }

  private async send(events: CloudEvent[]): Promise<void> {
    const sink = this.config.sink;
    if (!sink) {
      events.forEach((e) => console.log(JSON.stringify(e)));
      return;
    }

    switch (sink.type) {
      case 'http':
        if (!sink.url) throw new Error('HTTP sink requires url');
        for (const event of events) {
          await fetch(sink.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/cloudevents+json',
              'ce-specversion': '1.0',
              'ce-type': event.type,
              'ce-source': event.source,
              'ce-id': event.id,
              ...sink.headers,
            },
            body: JSON.stringify(event),
          });
        }
        break;
      case 'stdout':
        events.forEach((e) => console.log(JSON.stringify(e)));
        break;
      case 'kafka':
        // Kafka implementation would go here
        console.log(
          `Would send ${events.length} events to Kafka topic ${sink.topic}`
        );
        break;
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export const OSSA_EVENT_TYPES = {
  AGENT_STARTED: 'dev.ossa.agent.started',
  AGENT_COMPLETED: 'dev.ossa.agent.completed',
  AGENT_FAILED: 'dev.ossa.agent.failed',
  TOOL_CALLED: 'dev.ossa.tool.called',
  TOOL_COMPLETED: 'dev.ossa.tool.completed',
  TOOL_FAILED: 'dev.ossa.tool.failed',
  TURN_STARTED: 'dev.ossa.turn.started',
  TURN_COMPLETED: 'dev.ossa.turn.completed',
  STATE_UPDATED: 'dev.ossa.state.updated',
  WORKFLOW_STARTED: 'dev.ossa.workflow.started',
  WORKFLOW_COMPLETED: 'dev.ossa.workflow.completed',
} as const;

export type OSSAEventType =
  (typeof OSSA_EVENT_TYPES)[keyof typeof OSSA_EVENT_TYPES];
