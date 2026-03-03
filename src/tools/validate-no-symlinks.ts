/**
 * Validate that the repository contains no symlinks (platform policy).
 * Excludes node_modules and .git. Exit code 1 if any symlink found.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git']);

function check(dir: string): string[] {
  const found: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    try {
      const stat = fs.lstatSync(p);
      if (stat.isSymbolicLink()) {
        found.push(path.relative(ROOT, p));
      } else if (stat.isDirectory()) {
        found.push(...check(p));
      }
    } catch {
      // ignore permission errors
    }
  }
  return found;
}

const symlinks = check(ROOT);
if (symlinks.length > 0) {
  console.error(
    'Symlinks found (policy violation). Remove them and use direct paths or config paths.'
  );
  symlinks.forEach((s) => console.error('  ', s));
  process.exit(1);
}
