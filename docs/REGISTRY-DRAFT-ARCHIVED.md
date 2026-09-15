# 草稿份归档记录 / Draft copy archival record

> 本文件是权威侧（本仓 `PluginRegistry`）对旧草稿目录
> `G:\000Github\zDSH\zDSH-plugins\zdsh-plugin-registry` 退役状态的回溯记录。
> 原文收编自草稿仓 `README-ARCHIVED.md`（commit `65edb3f`，2026-09-06），
> 由任务卡 TC-CODER-T06（campaigns/2026-09-14-zdsh-plugin-intake-verify）迁入。

## 原始归档声明（收编原文）

> **EN**: This working copy is an outdated early draft of the zDSH plugin registry
> (single commit `d51232f`, never pushed to any remote). It has been superseded by
> the authoritative copy and must not be used or developed further.
>
> **中文**：本目录是 zDSH 插件注册表的过时初始草稿（仅 1 个 commit `d51232f`，从未 push 到任何远端），内容已被权威副本整体取代，请勿继续使用或在此开发。
>
> **权威副本 / Authoritative copy**: `G:\000Github\zDSH\zDSH-plugins\PluginRegistry`
> （remote: `https://github.com/zsagi1368/zdsh-plugin-registry`，main 分支，与 origin/main 同步）

### 与权威副本的主要差异（归档时点，2026-09-03）

| 项 | 本草稿（已过时） | 权威副本（PluginRegistry） |
|---|---|---|
| 数据布局 | `catalog/` 子目录 | 根级 `catalog.json` / `candidates.json` |
| 完整性 sidecar | `catalog/snapshot.sha256` | `catalog.json.sha256` |
| 签名工具 | `scripts/live-verify.mjs` | `scripts/sign.mjs` |
| catalog.json | 4615 字节 | 4745 字节 |
| candidates.json | 3 条 | 4 条 |

### 归档信息（原文）

- 归档时间：2026-09-03
- 归档执行：R7 任务卡（campaigns/2026-09-03-plugins-alpha4-adaptation），保守方案——未删除目录，仅标记
- 采取行动原文记录：本目录保留原地不动，仅新增 `README-ARCHIVED.md` 并在 `README.md` 头部插入归档声明；改动前的 README.md 原件备份于 `G:\000Github\zDSH\zDSH-plugins\PluginRegistry\del\20260903-164329-alpha4-adapt\`
- 处置建议：目录后续去留（删除/移入归档区）由用户决定

## 权威侧补充记录（TC-CODER-T06，2026-09-15）

- 草稿仓在标记归档时除 `d51232f` 外，另有仅存本地的归档声明提交 `65edb3f`
  （完整 hash `65edb3f60b8d17d5a4aa5fe77c98cb506f936b83`，2026-09-06），从未 push 到任何远端。
- `65edb3f` 中独有的 `scripts/live-verify.mjs`（草稿版，advisory 网络核验脚本）已抢救进本仓
  `scripts/live-verify.mjs`，仅适配数据布局（`catalog/catalog.json` → 根级 `catalog.json`），
  未接入默认 CI（`.github/workflows/validate.yml` 仍只跑 `sign.mjs` + `validate.mjs`）。
- 草稿仓全量兜存：`G:\000Github\zDSH\zDSH-backup\Mirror-Backup\zdsh-registry-draft-20260915.bundle`
  （git bundle，含 `65edb3f` 及其祖先历史）。
- 草稿目录退役条件：本记录 + bundle 兜存 + live-verify.mjs 已迁入权威仓三者齐备即视为
  内容无损失；目录物理删除权归用户，任何 agent 不得清理（per AGENTS.md 第 5 条）。
