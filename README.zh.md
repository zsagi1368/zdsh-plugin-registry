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
  <a href="https://github.com/zsagi1368/zdsh-plugin-center">zDSH 插件中心</a>
  的第一方签名插件目录。本仓只有数据——不含任何可执行的插件代码。<br>
  English documentation: <a href="README.md">README.md</a>
</p>

---

## 这是什么

两份 JSON 文档与各自的完整性边车：

| 文件 | 用途 |
|---|---|
| `catalog.json` | 可安装条目。GitHub 目标固定精确 40 位 commit，npm 目标固定精确 semver；随附 `catalog.json.sha256` 边车，插件中心在信任任何远端快照前都会先验签。 |
| `candidates.json` | 候选隔离池：已发现但尚未过审的项目。schema **禁止**出现可安装字段（`pinnedCommit`、`integritySha256`、`evidence`、`compat`、`scriptsPolicy`、`owner`、`repo`、`version`）——CI 强制执行，池内条目不可能被误装。 |

## 验签如何工作

```
编辑 catalog.json
  → node scripts/sign.mjs        （规范化 + 写入 sha256 边车）
  → CI：签署 → git diff --exit-code → validate
  → 合并
  → 每个插件中心部署拉取 raw/catalog.json，
    与 catalog.json.sha256 比对，
    通过即视为 fresh —— 否则回退到本地已验签缓存
```

未签名或被篡改的快照永远无法把条目抬升为 `recommended`、也无法放松脚本
策略：客户端直接拒收摘要与边车不符的文档。

## 晋级规则

候选项进入 `catalog.json` 必须满足：

1. 仓库公开存在，根目录含 bundle-patch 清单（`cordis.patch.yml`，或 npm 包声明 `dsh.bundle.patch`）；
2. 安装目标固定到精确 commit / 版本——永不接受浮动分支；
3. 生命周期脚本扫描通过：脚本默认全拒，豁免必须在 PR 中显式列出并说明理由；
4. 双语（中英）标题与摘要齐备，分类合规；
5. 兼容性证据三选一：`exact`（对目标 DSH 版本实测）/ `range-supported`（声明范围覆盖）/ `unknown`（默认）；`recommended` 需维护者实测背书。

## 提交插件

- **Issue**：打开 [Plugin Submission](https://github.com/zsagi1368/zdsh-plugin-registry/issues/new?template=plugin-submission.yml)
  模板填仓库地址；维护者按上述规则核验后晋级条目并重新签署快照。
- **Pull request**：直接修改 `catalog.json` 或 `candidates.json`。CI 会运行
  `scripts/validate.mjs` —— 它是插件中心校验规则的零依赖镜像（字符集钉死的名称、
  40 位 commit 固定、双语字数边界、摘要新鲜度）。

## 消费这份目录

将插件中心指向签名快照：

```yaml
# 插件中心配置
remoteCatalogUrl: https://raw.githubusercontent.com/zsagi1368/zdsh-plugin-registry/main/catalog.json
```

加载为三级降级：验签远端 → 验签本地缓存 → 随包种子，离线时优雅退化。

## 本地开发

```bash
node scripts/sign.mjs       # 规范化文档 + 刷新 sha256 边车
node scripts/validate.mjs   # 完整 schema / 固定 / 摘要门禁（零依赖）
```

CI 拒绝任何"签署会改动文件"的合并——过期边车直接红灯。

## 许可证

[MIT](./LICENSE)
