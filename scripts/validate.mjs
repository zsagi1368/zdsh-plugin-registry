#!/usr/bin/env node
/**
 * Registry validator — mirrors the plugin's catalog rules (charset-pinned
 * owner/repo/package/version, 40-hex pinned commits, evidence levels,
 * bilingual text). Dependency-free so CI needs nothing but node.
 *
 * Usage: node scripts/validate.mjs [catalog.json] [candidates.json]
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
let failed = false;

function err(file, message) {
  console.error(`${file}: ${message}`);
  failed = true;
}

const COMMIT = /^[0-9a-f]{40}$/;
const NAME_PART = /^[A-Za-z0-9][A-Za-z0-9._-]{0,98}$/;
const NPM_PACKAGE = /^(@[A-Za-z0-9][A-Za-z0-9._-]*\/)?[A-Za-z0-9][A-Za-z0-9._-]{0,213}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const CATEGORY = /^[A-Za-z0-9 _-]{1,40}$/;
const ID_PART = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function bilingualOk(value) {
  return (
    typeof value === 'object' && value !== null &&
    typeof value.zh === 'string' && value.zh.length >= 1 && value.zh.length <= 200 &&
    typeof value.en === 'string' && value.en.length >= 1 && value.en.length <= 200
  );
}

function validateEntry(file, entry, index, { requirePin }) {
  const label = `${file}#${String(index)} (${entry?.id ?? '?'})`;
  if (typeof entry !== 'object' || entry === null) return err(label, 'not an object');
  const parts = String(entry.id ?? '').split('/');
  if (parts.length !== 2 || parts.some((p) => !ID_PART.test(p))) return err(label, 'bad id');
  if (entry.source === 'github') {
    if (typeof entry.owner !== 'string' || !NAME_PART.test(entry.owner)) err(label, 'bad owner');
    if (typeof entry.repo !== 'string' || !NAME_PART.test(entry.repo)) err(label, 'bad repo');
    if (requirePin && (typeof entry.pinnedCommit !== 'string' || !COMMIT.test(entry.pinnedCommit))) {
      err(label, 'catalog github entries must pin a 40-hex commit');
    }
    if (entry.pinnedCommit !== undefined && (typeof entry.pinnedCommit !== 'string' || !COMMIT.test(entry.pinnedCommit))) {
      err(label, 'pinnedCommit must be 40-hex when present');
    }
  } else if (entry.source === 'npm') {
    if (typeof entry.packageName !== 'string' || !NPM_PACKAGE.test(entry.packageName)) err(label, 'bad packageName');
    if (requirePin && (typeof entry.version !== 'string' || !SEMVER.test(entry.version))) {
      err(label, 'catalog npm entries must pin an exact semver version');
    }
  } else {
    err(label, `unknown source: ${String(entry.source)}`);
  }
  if (!bilingualOk(entry.title) || !bilingualOk(entry.summary)) err(label, 'title/summary must be bilingual ≤200 chars');
  if (!CATEGORY.test(String(entry.category ?? ''))) err(label, 'bad category');
  if (!['discovered', 'installable', 'verified', 'recommended'].includes(entry.evidence)) err(label, 'bad evidence');
  if (!['exact', 'range-supported', 'unknown'].includes(entry.compat)) err(label, 'bad compat');
  if (!['none', 'allowlisted'].includes(entry.scriptsPolicy)) err(label, 'bad scriptsPolicy');
  if (typeof entry.updatedAt !== 'string' || Number.isNaN(Date.parse(entry.updatedAt))) err(label, 'bad updatedAt');
}

// ---- catalog.json: installable entries, every target pinned
try {
  const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
  if (!Array.isArray(catalog.entries)) err('catalog.json', 'entries must be an array');
  else catalog.entries.forEach((e, i) => validateEntry('catalog.json', e, i, { requirePin: true }));
  const seen = new Set((catalog.entries ?? []).map((e) => e?.id));
  if (seen.size !== (catalog.entries ?? []).length) err('catalog.json', 'duplicate ids');
  // sidecar must match the canonical document exactly
  const { createHash } = await import('node:crypto');
  const body = `${JSON.stringify(catalog, null, 2)}\n`;
  const expected = createHash('sha256').update(body, 'utf8').digest('hex');
  let actual = '';
  try {
    actual = readFileSync(join(root, 'catalog.json.sha256'), 'utf8').trim();
  } catch {
    err('catalog.json.sha256', 'missing sidecar');
  }
  if (actual && actual !== expected) err('catalog.json.sha256', `stale digest (expected ${expected.slice(0, 12)}…, got ${actual.slice(0, 12)}…)`);

  // ---- candidates.json: quarantine pool; install fields are FORBIDDEN here
  try {
    const candidates = JSON.parse(readFileSync(join(root, 'candidates.json'), 'utf8'));
    if (!Array.isArray(candidates.entries)) err('candidates.json', 'entries must be an array');
    for (const [i, c] of (candidates.entries ?? []).entries()) {
      const label = `candidates.json#${String(i)}`;
      if (typeof c !== 'object' || c === null) {
        err(label, 'not an object');
        continue;
      }
      const id = String(c.id ?? '');
      if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(id)) err(label, 'bad id');
      if (typeof c.originUrl !== 'string' || !/^https:\/\//.test(c.originUrl)) err(label, 'originUrl must be https');
      if (typeof c.noteZh !== 'string' || c.noteZh === '') err(label, 'noteZh required');
      if (typeof c.noteEn !== 'string' || c.noteEn === '') err(label, 'noteEn required');
      if (typeof c.discoveredAt !== 'string' || Number.isNaN(Date.parse(c.discoveredAt))) err(label, 'bad discoveredAt');
      // The whole point of the pool: nothing installable may leak in.
      for (const banned of ['pinnedCommit', 'integritySha256', 'evidence', 'compat', 'scriptsPolicy', 'owner', 'repo', 'version']) {
        if (c[banned] !== undefined) err(label, `forbidden field ${banned} in candidate pool`);
      }
    }
    const seen = new Set((candidates.entries ?? []).map((e) => e?.id));
    if (seen.size !== (candidates.entries ?? []).length) err('candidates.json', 'duplicate ids');
  } catch (error) {
    err('candidates.json', error instanceof Error ? error.message : 'unreadable');
  }
} catch (error) {
  err('catalog.json', error instanceof Error ? error.message : 'unreadable');
}

console.log(failed ? 'validation FAILED' : 'validation OK');
process.exit(failed ? 1 : 0);
