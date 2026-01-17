/**
 * W3C Baggage Support for OSSA Multi-Agent Correlation
 * Implements W3C Baggage specification for context propagation
 */

export interface BaggageEntry {
  key: string;
  value: string;
  metadata?: Record<string, string>;
}

export interface OSSABaggage {
  agentId?: string;
  interactionId?: string;
  traceId?: string;
  spanId?: string;
  parentAgentId?: string;
  workflowId?: string;
  tenantId?: string;
  custom?: Record<string, string>;
}

export class W3CBaggage {
  private entries: Map<string, BaggageEntry> = new Map();

  static readonly OSSA_PREFIX = 'ossa.';
  static readonly HEADER_NAME = 'baggage';
  static readonly MAX_PAIRS = 180;
  static readonly MAX_BYTES = 8192;

  constructor(initialBaggage?: OSSABaggage) {
    if (initialBaggage) {
      this.setOSSAContext(initialBaggage);
    }
  }

  set(key: string, value: string, metadata?: Record<string, string>): void {
    if (this.entries.size >= W3CBaggage.MAX_PAIRS) {
      throw new Error(
        `Baggage exceeds maximum pairs (${W3CBaggage.MAX_PAIRS})`
      );
    }
    this.entries.set(key, { key, value, metadata });
  }

  get(key: string): string | undefined {
    return this.entries.get(key)?.value;
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  setOSSAContext(context: OSSABaggage): void {
    if (context.agentId)
      this.set(`${W3CBaggage.OSSA_PREFIX}agent_id`, context.agentId);
    if (context.interactionId)
      this.set(
        `${W3CBaggage.OSSA_PREFIX}interaction_id`,
        context.interactionId
      );
    if (context.traceId)
      this.set(`${W3CBaggage.OSSA_PREFIX}trace_id`, context.traceId);
    if (context.spanId)
      this.set(`${W3CBaggage.OSSA_PREFIX}span_id`, context.spanId);
    if (context.parentAgentId)
      this.set(
        `${W3CBaggage.OSSA_PREFIX}parent_agent_id`,
        context.parentAgentId
      );
    if (context.workflowId)
      this.set(`${W3CBaggage.OSSA_PREFIX}workflow_id`, context.workflowId);
    if (context.tenantId)
      this.set(`${W3CBaggage.OSSA_PREFIX}tenant_id`, context.tenantId);
    if (context.custom) {
      for (const [k, v] of Object.entries(context.custom)) {
        this.set(`${W3CBaggage.OSSA_PREFIX}custom.${k}`, v);
      }
    }
  }

  getOSSAContext(): OSSABaggage {
    const custom: Record<string, string> = {};
    const customPrefix = `${W3CBaggage.OSSA_PREFIX}custom.`;

    for (const [key, entry] of this.entries) {
      if (key.startsWith(customPrefix)) {
        custom[key.substring(customPrefix.length)] = entry.value;
      }
    }

    return {
      agentId: this.get(`${W3CBaggage.OSSA_PREFIX}agent_id`),
      interactionId: this.get(`${W3CBaggage.OSSA_PREFIX}interaction_id`),
      traceId: this.get(`${W3CBaggage.OSSA_PREFIX}trace_id`),
      spanId: this.get(`${W3CBaggage.OSSA_PREFIX}span_id`),
      parentAgentId: this.get(`${W3CBaggage.OSSA_PREFIX}parent_agent_id`),
      workflowId: this.get(`${W3CBaggage.OSSA_PREFIX}workflow_id`),
      tenantId: this.get(`${W3CBaggage.OSSA_PREFIX}tenant_id`),
      custom: Object.keys(custom).length > 0 ? custom : undefined,
    };
  }

  toString(): string {
    const parts: string[] = [];
    for (const entry of this.entries.values()) {
      let part = `${encodeURIComponent(entry.key)}=${encodeURIComponent(entry.value)}`;
      if (entry.metadata) {
        for (const [mk, mv] of Object.entries(entry.metadata)) {
          part += `;${mk}=${mv}`;
        }
      }
      parts.push(part);
    }
    const result = parts.join(',');
    if (result.length > W3CBaggage.MAX_BYTES) {
      throw new Error(
        `Baggage exceeds maximum size (${W3CBaggage.MAX_BYTES} bytes)`
      );
    }
    return result;
  }

  static parse(header: string): W3CBaggage {
    const baggage = new W3CBaggage();
    if (!header) return baggage;

    const entries = header.split(',');
    for (const entry of entries) {
      const [kvPart, ...metaParts] = entry.trim().split(';');
      const eqIndex = kvPart.indexOf('=');
      if (eqIndex === -1) continue;

      const key = decodeURIComponent(kvPart.substring(0, eqIndex).trim());
      const value = decodeURIComponent(kvPart.substring(eqIndex + 1).trim());

      const metadata: Record<string, string> = {};
      for (const meta of metaParts) {
        const metaEq = meta.indexOf('=');
        if (metaEq !== -1) {
          metadata[meta.substring(0, metaEq).trim()] = meta
            .substring(metaEq + 1)
            .trim();
        }
      }

      baggage.set(
        key,
        value,
        Object.keys(metadata).length > 0 ? metadata : undefined
      );
    }
    return baggage;
  }

  toHeaders(): Record<string, string> {
    return { [W3CBaggage.HEADER_NAME]: this.toString() };
  }

  merge(other: W3CBaggage): W3CBaggage {
    const merged = new W3CBaggage();
    for (const entry of this.entries.values()) {
      merged.set(entry.key, entry.value, entry.metadata);
    }
    for (const entry of other.entries.values()) {
      merged.set(entry.key, entry.value, entry.metadata);
    }
    return merged;
  }
}

export function propagateOSSAContext(
  parentBaggage: W3CBaggage,
  childAgentId: string
): W3CBaggage {
  const parentContext = parentBaggage.getOSSAContext();
  const childBaggage = new W3CBaggage({
    ...parentContext,
    parentAgentId: parentContext.agentId,
    agentId: childAgentId,
  });
  return childBaggage;
}

export function createOSSABaggage(
  agentId: string,
  interactionId: string
): W3CBaggage {
  return new W3CBaggage({
    agentId,
    interactionId,
    traceId: generateTraceId(),
    spanId: generateSpanId(),
  });
}

function generateTraceId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateSpanId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
