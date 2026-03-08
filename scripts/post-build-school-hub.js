#!/usr/bin/env node
// Moves the contents of dist/browser/ up into dist/ after school-hub is built.
// Angular's application builder places browser artifacts in a browser/ subdirectory
// by default; Firebase Hosting expects files directly in dist/.

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const browserDir = path.join(distDir, 'browser');

if (!fs.existsSync(browserDir)) {
  console.error('dist/browser/ not found — nothing to move.');
  process.exit(1);
}

const entries = fs.readdirSync(browserDir);
for (const entry of entries) {
  fs.renameSync(path.join(browserDir, entry), path.join(distDir, entry));
}

fs.rmdirSync(browserDir);
console.log(`Moved ${entries.length} item(s) from dist/browser/ to dist/`);
