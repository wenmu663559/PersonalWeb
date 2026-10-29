import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { content } from '../content.js';
await mkdir('dist', { recursive: true });
for (const name of ['index.html', 'app.js', 'style.css', 'favicon.svg', 'giscus-config.js']) await copyFile(`public/${name}`, `dist/${name}`);
await writeFile('dist/content.js', `export const content = ${JSON.stringify(content)};\n`);
await writeFile('dist/.nojekyll', '');
console.log('Static website built in dist/; no server or private data included.');
