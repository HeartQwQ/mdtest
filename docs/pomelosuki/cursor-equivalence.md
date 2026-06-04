# WorkBuddy 插件 vs Cursor 已有能力

避免在 Cursor 重复安装 WorkBuddy 市场里已有等价物的能力。

## 已内化到 PomeloSuki（不必再装）

| WorkBuddy | 处理 |
|-----------|------|
| general-skills → ui-ux-pro-max | 并入 `design-principles.md`（优先级表、无障碍、风格库） |
| general-skills → frontend-design | 并入「风格塑造」「反 AI 审美」章节 |
| pomelosuki 专家长文 | 收敛为 `.cursor/agents/pomelosuki.md` + SKILL |

## Cursor 已具备（推荐用现有的）

| 需求 | Cursor 等价 | 说明 |
|------|-------------|------|
| Svelte 5 实现与校验 | 插件 **plugin-svelte-svelte** MCP | `get-documentation`、`svelte-autofixer` |
| 库文档查询 | **Context7** MCP | Electron、Vite、Svelte 官方文档 |
| Figma 设计稿 | **plugin-figma-figma** | `get_design_context`、设计转代码 |
| 浏览器看 UI | **cursor-ide-browser** MCP | `pnpm dev` 后 snapshot/截图 |
| 开发流程 | **Superpowers** + `superpowers-workflow.mdc` | 不装 requirements-driven / feature-dev 等 |
| Git / PR | 内置 + 用户 rule | 不必装 commit-commands 除非要用斜杠命令 |
| 代码评审 | Superpowers `requesting-code-review` / `code-reviewer` 子代理 | 不必装 pr-review-toolkit 除非要专项 PR 工具 |

## 可选 npm，无需插件

| 需求 | 做法 |
|------|------|
| 图标 | `pnpm add lucide-svelte`，不必装 lucide-icons 插件 |
| 截图测试 | 浏览器 MCP 即可，不必 playwright-cli 插件 |

## WorkBuddy 独有、Cursor 未迁移

| 项 | 说明 |
|----|------|
| `SkillManage.py` / tasks.json | WorkBuddy 任务库；Cursor 用 Superpowers 计划 + TodoWrite |
| ardot-design-generator | 依赖 Ardot 产品，与 mdtest 无关 |
| design-to-code MCP | Cursor 侧用官方 Figma 插件即可 |

## 推荐组合（mdtest）

```
Superpowers（流程）
+ pomelosuki skill/agent（UI 知识）
+ Svelte MCP（实现校验）
+ Context7（文档）
+ Figma MCP（有稿时）
+ cursor-ide-browser（目视验证）
```
