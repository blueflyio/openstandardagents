#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const VERSION_FILE = path.join(process.cwd(), '.version.json');
const versionConfig = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
const { current } = versionConfig;

// Update package.json
const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.version = current;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// Update website package.json
const websitePkgPath = path.join(process.cwd(), 'website/package.json');
const websitePkg = JSON.parse(fs.readFileSync(websitePkgPath, 'utf-8'));
websitePkg.version = current;
fs.writeFileSync(websitePkgPath, JSON.stringify(websitePkg, null, 2) + '\n');

// Update README badge
const readmePath = path.join(process.cwd(), 'README.md');
let readme = fs.readFileSync(readmePath, 'utf-8');
readme = readme.replace(
  /\[!\[Specification\]\(https:\/\/img\.shields\.io\/badge\/Spec-v[^-\)]+(-[^-\)]+)?-blue\)\]/g,
  `[![Specification](https://img.shields.io/badge/Spec-v${current}-blue)]`
);
fs.writeFileSync(readmePath, readme);

// Update website home
const homePath = path.join(process.cwd(), 'website/content/docs/00-HOME.md');
let home = fs.readFileSync(homePath, 'utf-8');
home = home.replace(
  /\[!\[Specification\]\(https:\/\/img\.shields\.io\/badge\/Spec-v[^-)]+(-[^-)]+)?-blue\)\]/g,
  `[![Specification](https://img.shields.io/badge/Spec-v${current}-blue)]`
);
fs.writeFileSync(homePath, home);

console.log(`✅ Synced version to ${current}`);
