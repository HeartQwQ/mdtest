# Agent

这里集中放置 AI VibeCoding 相关资料：规则、Skill（技能）、MCP（模型上下文协议）、智能体和项目记忆。产品资料、阶段计划、资源说明放在 `docs/`，不要混进 Agent。

## 目录

| 路径 | 内容 |
|------|------|
| [`rules/`](rules/) | 仓库级 AI 开发规则与长期约束 |
| [`skills/`](skills/) | 仓库级 Skill（技能），当前包含柚爱 |
| [`agents/`](agents/) | 专用智能体职责说明 |
| [`mcp/`](mcp/) | MCP 配置、来源策略、安装记录 |
| [`memory/`](memory/) | 预留：项目内可共享记忆、决策记录和经验卡片 |

## 使用规则

- AI 开工前先读 [`rules/AGENTS.md`](rules/AGENTS.md)。
- 涉及 UI/设计，读 [`skills/pomelosuki/SKILL.md`](skills/pomelosuki/SKILL.md) 和 `docs/design/`。
- 涉及 MCP 或外部事实源，读 [`mcp/registry.md`](mcp/registry.md)。
- 产品实施计划放到 [`../docs/product/plans/`](../docs/product/plans/)，不放在 Agent。
- 临时提示词、调研片段、草稿必须进入 `Agent/*/tmp/` 或根目录 `tmp/`，不要散落在根目录。
