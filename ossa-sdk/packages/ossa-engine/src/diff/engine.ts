import type { DiffResult, DiffEntry, DiffOp } from '../types.js';

/** Computes structural diffs between two OSSA manifests. Useful for PRs, audits, migration reviews. */
export class DiffEngine {
  diff(
    oldManifest: Record<string, unknown>,
    newManifest: Record<string, unknown>,
  ): DiffResult {
    const entries: DiffEntry[] = [];
    this.diffObjects(oldManifest, newManifest, '', entries);

    const hasChanges = entries.some((e) => e.op !== 'unchanged');
    const added = entries.filter((e) => e.op === 'added').length;
    const removed = entries.filter((e) => e.op === 'removed').length;
    const changed = entries.filter((e) => e.op === 'changed').length;

    const parts: string[] = [];
    if (added) parts.push(`${added} added`);
    if (removed) parts.push(`${removed} removed`);
    if (changed) parts.push(`${changed} changed`);
    const summary = parts.length ? parts.join(', ') : 'No changes';

    return { entries, hasChanges, summary };
  }

  private diffObjects(
    old: Record<string, unknown>,
    cur: Record<string, unknown>,
    prefix: string,
    entries: DiffEntry[],
  ): void {
    const allKeys = new Set([...Object.keys(old), ...Object.keys(cur)]);

    for (const key of allKeys) {
      const path = prefix ? `${prefix}.${key}` : key;
      const oldVal = old[key];
      const newVal = cur[key];

      if (!(key in old)) {
        entries.push({ path, op: 'added', newValue: newVal });
      } else if (!(key in cur)) {
        entries.push({ path, op: 'removed', oldValue: oldVal });
      } else if (this.isObject(oldVal) && this.isObject(newVal)) {
        this.diffObjects(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          path,
          entries,
        );
      } else if (!this.deepEqual(oldVal, newVal)) {
        entries.push({ path, op: 'changed', oldValue: oldVal, newValue: newVal });
      }
    }
  }

  private isObject(val: unknown): val is Record<string, unknown> {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
