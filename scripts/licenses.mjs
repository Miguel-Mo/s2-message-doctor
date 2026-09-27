import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
const packages = ['ajv','ajv-formats','fast-deep-equal','fast-uri','json-schema-traverse','require-from-string','jsonc-parser'];
let text = readFileSync('THIRD_PARTY_NOTICES.md', 'utf8') + '\n\n## S2 JSON and project Apache-2.0 license\n\n' + readFileSync('vendor/s2-json/v1.0.0/LICENSE', 'utf8') + '\n\n## Bundled dependency license texts\n';
for (const name of packages) {
  const pkg = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
  let license;
  for (const filename of ['LICENSE','LICENSE.md','LICENSE.txt','license','license.md','license.txt']) { try { license = readFileSync(`node_modules/${name}/${filename}`, 'utf8'); break; } catch {} }
  if (!license) throw new Error(`Missing license for ${name}`);
  text += `\n### ${name} ${pkg.version}\n\n${license}\n`;
}
mkdirSync('dist/licenses', {recursive:true});
writeFileSync('dist/THIRD_PARTY_NOTICES.txt', text);
copyFileSync('LICENSE','dist/LICENSE');
copyFileSync('NOTICE','dist/NOTICE');
copyFileSync('vendor/s2-json/v1.0.0/LICENSE','dist/licenses/s2-json-LICENSE');
// Also preserve all notices in the single-file distribution, including offline file opening.
const html = readFileSync('dist/index.html','utf8');
const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
writeFileSync('dist/index.html', html.replace('</body>', `<details style="margin:20px 32px"><summary>Third-party licenses</summary><pre>${escaped}</pre></details></body>`));
