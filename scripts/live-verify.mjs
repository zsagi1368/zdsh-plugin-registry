#!/usr/bin/env node
/**
 * Provenance: rescued from the archived draft copy `../zdsh-plugin-registry`
 * (local-only commit 65edb3f, never pushed; original also backed up in
 * Mirror-Backup\zdsh-registry-draft-20260915.bundle). Brought into this
 * authoritative repo under task card TC-CODER-T06
 * (campaigns/2026-09-14-zdsh-plugin-intake-verify). Only adaptation: the
 * catalog path was retargeted from the draft's `catalog/catalog.json` to
 * this repo's root-level `catalog.json`.
 *
 * Live verification for registry entries (advisory lane — NOT wired into
 * the default validate.yml CI job; run it manually or in a separate lane).
 *
 * For every github entry in catalog.json:
 *   1. the pinned commit still exists on the repo;
 *   2. cordis.patch.yml exists at that commit.
 * Failures are reported but do not fail trusted entries older than 30 days —
 * they open attention instead of breaking the pipeline.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doc = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
const token = process.env.GH_TOKEN ?? '';

async function ghJson(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: token === '' ? {} : { authorization: `Bearer ${token}` },
  });
  return { status: response.status, body: await response.json() };
}

let problems = 0;
for (const entry of doc.entries ?? []) {
  if (entry.source !== 'github') continue;
  const commit = await ghJson(`/repos/${entry.owner}/${entry.repo}/commits/${entry.pinnedCommit}`);
  if (commit.status !== 200) {
    problems += 1;
    console.error(`FAIL ${entry.id}: pinned commit unreachable (${String(commit.status)})`);
    continue;
  }
  const patch = await ghJson(
    `/repos/${entry.owner}/${entry.repo}/contents/cordis.patch.yml?ref=${entry.pinnedCommit}`,
  );
  if (patch.status !== 200) {
    problems += 1;
    console.error(`WARN ${entry.id}: no cordis.patch.yml at pinned commit`);
  } else {
    console.log(`ok   ${entry.id}`);
  }
}
console.log(problems === 0 ? 'live-verify clean' : `live-verify: ${String(problems)} attention item(s)`);
process.exit(0); // advisory lane never blocks
