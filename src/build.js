import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = resolve(projectRoot, 'dist');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve(projectRoot, 'index.html'), resolve(output, 'index.html'));
cpSync(resolve(projectRoot, 'src'), resolve(output, 'src'), { recursive: true });
console.log('Static production app written to dist/.');
