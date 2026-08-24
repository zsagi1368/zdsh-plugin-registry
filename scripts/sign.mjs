#!/usr/bin/env node
/**
 * Recompute the sha256 sidecar for every registry document that ships one:
 *   catalog.json  -> catalog.json.sha256
 * The plugin refuses remote snapshots whose digest does not match, so this
 * script must run after every catalog edit (CI enforces it).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const targets = ['catalog.json'];

let failed = false;
for (const name of targets) {
  const path = join(root, name);
  let body;
  try {
    body = readFileSync(path, 'utf8');
  } catch {
    console.error(`missing ${name}`);
    failed = true;
    continue;
  }
  // Canonicalize through JSON so formatting churn cannot flip digests.
  const canonical = `${JSON.stringify(JSON.parse(body), null, 2)}\n`;
  writeFileSync(path, canonical, 'utf8');
  const digest = createHash('sha256').update(canonical, 'utf8').digest('hex');
  writeFileSync(join(root, `${name}.sha256`), `${digest}\n`, 'utf8');
  console.log(`${name} -> ${digest}`);
}
process.exit(failed ? 1 : 0);
