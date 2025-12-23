export class DependencyUpdaterBot {
  async checkUpdates(): Promise<{ updates: unknown[] }> {
    return { updates: [] };
  }

  async applySecurityPatches(): Promise<{ applied: number }> {
    return { applied: 0 };
  }
}
