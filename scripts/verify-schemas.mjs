import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(readFileSync(new URL('../vendor/s2-json/manifest.json', import.meta.url)));
for (const [path, hash] of Object.entries(manifest.files)) {
  const bytes = readFileSync(new URL('../vendor/s2-json/v1.0.0/' + path, import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error(`Schema checksum mismatch: ${path}`);
}
console.log(`Verified ${Object.keys(manifest.files).length} upstream files at ${manifest.commit}`);
