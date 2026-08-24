# zdsh-plugin-registry — 第一方插件注册表

zDSH 插件中心（`zsagi1368/zdsh-plugin-center`）的官方目录数据源。本仓只含**数据与准入规则**，不含可执行插件代码。

## 数据文件

| 文件 | 用途 |
|---|---|
| `catalog.json` | 可信安装目录：每个 GitHub 条目固定 40 位 commit、npm 条目固定精确 semver；插件端加载时校验 `catalog.json.sha256` 签名边车 |
| `candidates.json` | 候选隔离池：**禁止出现** pinnedCommit / integrity / evidence / compat / scriptsPolicy 字段（CI 强制），必须经完整审核后才能晋级 |
| `*.sha256` | sha256 边车；由 `node scripts/sign.mjs` 生成，任何改动后必须重新签署 |

## 准入规则（catalog 晋级标准）

1. 仓库公开存在，根目录含 `cordis.patch.yml`（或 npm 包声明 `dsh.bundle.patch`）；
2. 安装目标固定到精确 commit/版本——永不接受浮动分支；
3. `package.json` 生命周期脚本扫描通过：默认全拒，例外需显式 allowlist 并在 PR 中说明理由；
4. 双语标题/摘要齐备，分类合规；
5. 兼容性证据分三级：`exact`（在目标 DSH 版本实测）/ `range-supported`（声明范围覆盖）/ `unknown`（默认）；`recommended` 需维护者实测背书。

## 提交方式

- 开 Issue（模板：Plugin Submission）填仓库地址 → 维护者核验后手工/脚本晋级并签发新快照；
- 或直接 PR 修改 `catalog.json` / `candidates.json` —— CI 会跑 `scripts/validate.mjs` 校验 schema、固定 commit 与签名一致性。

## 刷新链路

```
编辑 catalog.json → node scripts/sign.mjs → CI validate → merge
→ 插件端下次拉取 raw/catalog.json 时按 .sha256 验签 → fresh 缓存
```

---

## English summary

First-party catalog for the zDSH Plugin Center. `catalog.json` holds pinned,
verified installable entries; `candidates.json` is a quarantine pool that is
schema-forbidden from carrying installable fields. Every document ships a
sha256 sidecar the plugin verifies before trusting a remote snapshot.
Promotion requires: public repo with a bundle patch manifest, exact
commit/version pin, lifecycle-script scan (default deny), bilingual metadata.
Submit via Issue template or PR — CI validates schema, pins and digests.
