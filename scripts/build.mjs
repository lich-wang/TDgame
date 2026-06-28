import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

cpSync('index.html', 'dist/index.html');
cpSync('css', 'dist/css', { recursive: true });
cpSync('js', 'dist/js', { recursive: true });

console.log('Built static assets into dist/.');
