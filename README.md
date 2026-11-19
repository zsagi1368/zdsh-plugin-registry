> [!WARNING]
> **⛔ 本仓库已存档（2026-11-18）— 不再继续开发与更新。** 官方 DeepSeek Harness 近期升级已修复大量问题，本仓库的维护使命随之完成；仓库已设为只读存档，如需继续使用或改造请自行 fork。仍在活跃开发的相关项目：[dsh-zcontext](https://github.com/zsagi1368/dsh-zcontext) 与 [zDSH-Go](https://github.com/zsagi1368/zDSH-Go)。
>
> **⛔ ARCHIVED (2026-11-18) — No longer under active development.** Recent official DeepSeek Harness upgrades have fixed many of the issues this project addressed, so its maintenance mission is complete; the repo is now a read-only archive — fork it if you want to continue. Related projects still under active development: [dsh-zcontext](https://github.com/zsagi1368/dsh-zcontext) & [zDSH-Go](https://github.com/zsagi1368/zDSH-Go).


<h1 align="center">zdsh-plugin-registry</h1>

<p align="center">
  <a href="https://github.com/zsagi1368/zdsh-plugin-registry/actions/workflows/validate.yml"><img src="https://github.com/zsagi1368/zdsh-plugin-registry/actions/workflows/validate.yml/badge.svg" alt="validate"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-2563eb?style=flat-square" alt="License: MIT"></a>
</p>

<p align="center">
  The first-party, signed plugin catalog powering the
  <a href="https://github.com/zsagi1368/zdsh-plugin-center">zDSH Plugin Center</a>.<br>
  Data only — no executable plugin code lives here.<br>
  中文文档见 <a href="README.zh.md">README.zh.md</a>
</p>

---

## What this is

Two JSON documents and their integrity sidecars:

| File | Purpose |
|---|---|
| `catalog.json` | Installable entries. Every GitHub target is pinned to an exact 40-hex commit; npm targets to an exact semver. Shipped with a `catalog.json.sha256` sidecar that the Plugin Center verifies before trusting a remote snapshot. |
| `candidates.json` | Quarantine pool for discovered-but-not-yet-reviewed projects. The schema **forbids** install-capable fields (`pinnedCommit`, `integritySha256`, `evidence`, `compat`, `scriptsPolicy`, `owner`, `repo`, `version`) — CI enforces it, so nothing here can be installed by accident. |

## How verification works

```
edit catalog.json
  → node scripts/sign.mjs        (canonicalize + write sha256 sidecar)
  → CI: sign → git diff --exit-code → validate
  → merge
  → every Plugin Center deployment pulls raw/catalog.json,
    checks it against catalog.json.sha256,
    accepts it as "fresh" — or falls back to its digest-checked local cache
```

An unsigned or tampered snapshot can never promote an entry to `recommended`
or relax a scripts policy: the client refuses documents whose digest does not
match the sidecar.

## Promotion rules

A candidate enters `catalog.json` only after:

1. The repository is public and carries a bundle-patch manifest
   (`cordis.patch.yml` at the repo root, or an npm package declaring
   `dsh.bundle.patch`);
2. The install target is pinned to an exact commit / version — floating
   branches are never accepted;
3. A lifecycle-script scan passes: scripts are denied by default, exceptions
   require an explicit allow-list justified in the PR;
4. Bilingual (zh/en) title and summary are present, category is valid;
5. Compatibility evidence is recorded as one of `exact` (tested against a
   target DSH release) / `range-supported` (declared range covers it) /
   `unknown` (default). `recommended` requires maintainer-tested endorsement.

## Submitting a plugin

- **Issue**: open a [Plugin Submission](https://github.com/zsagi1368/zdsh-plugin-registry/issues/new?template=plugin-submission.yml)
  issue with the repository URL. A maintainer verifies the rules above and
  promotes the entry with a freshly signed snapshot.
- **Pull request**: edit `catalog.json` or `candidates.json` directly. CI runs
  `scripts/validate.mjs` — a dependency-free mirror of the Plugin Center's
  validation (charset-pinned names, 40-hex pins, bilingual text bounds, digest
  freshness).

## Consuming the catalog

Point the Plugin Center at the signed snapshot:

```yaml
# Plugin Center configuration
remoteCatalogUrl: https://raw.githubusercontent.com/zsagi1368/zdsh-plugin-registry/main/catalog.json
```

Loading is three-tier: verified remote → digest-checked local cache → bundled
seed, degrading gracefully when offline.

## Development

```bash
node scripts/sign.mjs       # canonicalize documents + refresh sha256 sidecars
node scripts/validate.mjs   # full schema / pin / digest gate (no dependencies)
```

CI refuses any merge where signing would change files — a stale sidecar fails
the build.

## License

[MIT](./LICENSE)
