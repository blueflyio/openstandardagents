#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function hasCommand(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function write(pathName, content) {
  writeFileSync(pathName, content);
}

function read(pathName) {
  return readFileSync(pathName, 'utf8');
}

function parseJsonWithComments(content) {
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/,(\s*[}\]])/g, '$1');

  return JSON.parse(withoutComments);
}

const nodeMajorVersion = Number.parseInt(process.versions.node.split('.')[0], 10);
const viteVersion = nodeMajorVersion >= 20 ? 'latest' : '5.4.11';
const projectName = process.argv[2];
const componentsTarball = path.join(__dirname, 'shadcn-components.tar.gz');

if (nodeMajorVersion < 18) {
  console.error(`Error: Node.js 18 or higher is required. Current version: ${process.version}`);
  process.exit(1);
}

if (!projectName) {
  console.error('Usage: node scripts/init-artifact.mjs <project-name>');
  process.exit(1);
}

if (!existsSync(componentsTarball)) {
  console.error(`Error: Missing components tarball at ${componentsTarball}`);
  process.exit(1);
}

if (!hasCommand('pnpm')) {
  console.log('pnpm not found. Installing pnpm...');
  run('npm', ['install', '-g', 'pnpm']);
}

console.log(`Creating React + Vite project: ${projectName}`);
run('pnpm', ['create', 'vite', projectName, '--template', 'react-ts']);
process.chdir(projectName);

const indexHtml = read('index.html')
  .replace(/\s*<link rel="icon"[^>]*vite\.svg[^>]*>\s*/g, '\n')
  .replace(/<title>.*?<\/title>/, `<title>${projectName}</title>`);
write('index.html', indexHtml);

console.log('Installing base dependencies...');
run('pnpm', ['install']);

if (nodeMajorVersion < 20) {
  console.log(`Pinning Vite to ${viteVersion} for Node 18 compatibility...`);
  run('pnpm', ['add', '-D', `vite@${viteVersion}`]);
}

console.log('Installing Tailwind CSS dependencies...');
run('pnpm', [
  'install',
  '-D',
  'tailwindcss@3.4.1',
  'postcss',
  'autoprefixer',
  '@types/node',
  'tailwindcss-animate',
]);
run('pnpm', [
  'install',
  'class-variance-authority',
  'clsx',
  'tailwind-merge',
  'lucide-react',
  'next-themes',
]);

write(
  'postcss.config.js',
  `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
);

write(
  'tailwind.config.js',
  `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
`
);

write(
  'src/index.css',
  `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}
`
);

const tsconfig = JSON.parse(read('tsconfig.json'));
tsconfig.compilerOptions = tsconfig.compilerOptions || {};
tsconfig.compilerOptions.baseUrl = '.';
tsconfig.compilerOptions.paths = { '@/*': ['./src/*'] };
write('tsconfig.json', `${JSON.stringify(tsconfig, null, 2)}\n`);

if (existsSync('tsconfig.app.json')) {
  const tsconfigApp = parseJsonWithComments(read('tsconfig.app.json'));
  tsconfigApp.compilerOptions = tsconfigApp.compilerOptions || {};
  tsconfigApp.compilerOptions.baseUrl = '.';
  tsconfigApp.compilerOptions.paths = { '@/*': ['./src/*'] };
  write('tsconfig.app.json', `${JSON.stringify(tsconfigApp, null, 2)}\n`);
}

write(
  'vite.config.ts',
  `import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
`
);

console.log('Installing shadcn/ui dependencies...');
run('pnpm', [
  'install',
  '@radix-ui/react-accordion',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-label',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toast',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  '@radix-ui/react-tooltip',
]);
run('pnpm', [
  'install',
  'sonner',
  'cmdk',
  'vaul',
  'embla-carousel-react',
  'react-day-picker',
  'react-resizable-panels',
  'date-fns',
  'react-hook-form',
  '@hookform/resolvers',
  'zod',
]);

console.log('Extracting shadcn/ui components...');
run('tar', ['-xzf', componentsTarball, '-C', 'src']);

write(
  'components.json',
  `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
`
);

console.log('Setup complete.');
console.log(`Next steps:\n  cd ${projectName}\n  pnpm dev`);
