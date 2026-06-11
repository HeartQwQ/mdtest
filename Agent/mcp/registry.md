# MCP Registry

> 版本：2026-06-09 · 范围：mdtest 项目 AI 开发辅助工具

本项目第一批只启用文档查询和 UI 验证类 MCP（模型上下文协议），不启用广权限文件系统、数据库写入或公司私域数据 MCP。

## 已登记项目配置

项目级 MCP 配置记录位于 `Agent/mcp/mcp.json`。不同 AI 客户端如需实际启用 MCP，应以该文件为来源转换到各自的配置位置。

| 名称 | 类型 | 配置 | 用途 | 风险控制 |
|------|------|------|------|----------|
| `openaiDeveloperDocs` | 远程 HTTP | `https://developers.openai.com/mcp` | 查询 OpenAI API、Codex、Agents、Vision、Responses 等官方文档 | 只读文档，不代调用 OpenAI API |
| `svelte` | 远程 HTTP | `https://mcp.svelte.dev/mcp` | 查询 Svelte 5 / SvelteKit 文档，辅助检查 Svelte 写法 | 只用于 Svelte 相关实现与审查 |
| `context7` | 本地 npx | `npx -y @upstash/context7-mcp@latest` | 查询 Electron、TanStack、Tailwind、shadcn-svelte 等库文档 | 仅用于公开文档检索 |
| `playwright` | 本地 npx | `npx @playwright/mcp@latest` | 打开本地页面、截图、交互验证 UI | 默认不接公司内网账号和敏感站点 |

## 使用规则

- OpenAI / Codex / Agents / Vision / Responses 相关问题，优先使用 `openaiDeveloperDocs`。
- Svelte 5、runes、SvelteKit 或组件写法不确定时，优先使用 `svelte`。
- 第三方库 API、安装方式和版本行为不确定时，优先使用 `context7` 或官方文档。
- UI 大改、交互验收、视觉回归时，优先使用 `playwright` 或当前 Codex Browser 能力。
- MCP 输出只能作为事实源之一，仍需结合当前代码、项目需求和本地验证。

## 暂缓列表

| MCP | 暂缓原因 |
|-----|----------|
| filesystem MCP | Codex 已能读写工作区，额外启用会扩大权限面 |
| 数据库写入 MCP | 当前还没有稳定数据层和权限模型 |
| Figma MCP | 当前没有正式 Figma 设计稿，已有本地 pomelosuki 规范 |
| Slack / 飞书 / Notion / 私域知识库 MCP | 原型期不接公司私域数据 |
| 未审查社区 MCP | MCP 是工具权限入口，安全风险高于普通 npm 依赖 |
