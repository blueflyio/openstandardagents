import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { GeneratedFile } from '@bluefly/ossa-engine';

interface FileTreeBrowserProps {
  files: GeneratedFile[];
  children: (ctx: FileTreeBrowserContext) => ReactNode;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: TreeNode[];
  file?: GeneratedFile;
}

interface FileTreeBrowserContext {
  tree: TreeNode[];
  selectedFile: GeneratedFile | null;
  selectFile: (path: string) => void;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
  totalFiles: number;
}

/** Headless file tree viewer for generated export files */
export function FileTreeBrowser({ files, children }: FileTreeBrowserProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const tree = buildTree(files);
  const selectedFile = files.find((f) => f.path === selectedPath) ?? null;

  const selectFile = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  return children({
    tree,
    selectedFile,
    selectFile,
    expandedPaths,
    toggleExpand,
    totalFiles: files.length,
  });
}

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const path = parts.slice(0, i + 1).join('/');
      const isFile = i === parts.length - 1;

      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = {
          name,
          path,
          type: isFile ? 'file' : 'directory',
          children: [],
          file: isFile ? file : undefined,
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  return root;
}
