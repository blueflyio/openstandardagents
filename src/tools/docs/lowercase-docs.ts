#!/usr/bin/env tsx
/**
 * Convert all documentation filenames to lowercase
 */

import { readdirSync, renameSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';

const DOCS_DIR = join(process.cwd(), 'website/content/docs');

function lowercaseFiles(dir: string) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      lowercaseFiles(fullPath);
      
      // Rename directory if needed
      const lowerEntry = entry.toLowerCase();
      if (entry !== lowerEntry) {
        const newPath = join(dirname(fullPath), lowerEntry);
        console.log(`📁 Renaming: ${entry} → ${lowerEntry}`);
        renameSync(fullPath, newPath);
      }
    } else if (entry.endsWith('.md')) {
      // Rename file if needed
      const lowerEntry = entry.toLowerCase();
      if (entry !== lowerEntry) {
        const newPath = join(dirname(fullPath), lowerEntry);
        console.log(`📄 Renaming: ${entry} → ${lowerEntry}`);
        renameSync(fullPath, newPath);
      }
    }
  }
}

console.log('🔄 Converting documentation filenames to lowercase...\n');
lowercaseFiles(DOCS_DIR);
console.log('\n✅ Done!');
