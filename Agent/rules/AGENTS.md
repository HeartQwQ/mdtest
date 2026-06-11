# mdtest AI 开发规则

## 沟通

- 必须使用中文沟通，专业术语可翻译对照显示，例如 Skill（技能）、MCP（模型上下文协议）。

## 项目定位

- mdtest 是面向《和平精英》测试团队的长期大型 Electron 桌面项目，不按小工具、一次性 Demo 或练手项目处理。
- 当前路线是 Android-first；接口、UI 和数据结构必须为 PC / Android / iOS / Harmony 四端预留扩展位。
- 投屏 / 画面控制、环境管理、文件工作台是核心能力，不能因为阶段收缩而从产品里删除。

## 事实源顺序

开工前按任务读取：

1. 产品目标和阶段范围：`docs/product/requirements.md`。
2. UI / 设计任务：`Agent/skills/pomelosuki/SKILL.md`、`docs/design/project-design.md`、`docs/design/pomelosuki/project-profile.md`、`docs/design/pomelosuki/ui-v2-design-notes.md`。
3. MCP 配置和来源策略：`Agent/mcp/registry.md`、`Agent/mcp/mcp.json`。
4. 设备工具链来源、许可和路径：`docs/resources/device-toolchains.md`。
5. 当前代码搜索结果和本轮用户消息。

不确定 API、框架能力、依赖行为或最新文档时，必须查官方文档、MCP 或当前代码，不能凭记忆猜。

## 开源优先，警惕造轮子

- 投屏、设备控制、自动化测试、图像识别、OCR、文件管理、虚拟列表、表格、状态管理、用例执行等复杂领域，默认优先评估成熟开源框架、官方工具和社区验证过的方案。
- 自研只用于产品特有编排层、适配层、安全边界、操作记录、业务 UI 和验收流程。
- 引入或拒绝开源方案前，至少说明候选方案、许可证、维护状态、Electron + Svelte + Android-first 集成成本，以及采用或拒绝原因。
- 简单实现只能作为临时验证路径，不能冒充长期架构。

## Agent 分工

| 角色 | 负责 | 不负责 |
|------|------|--------|
| 主代理 | 需求澄清、IPC / 主进程、设备与游戏逻辑、计划与验证、协调子代理 | 独自大改 UI 而不读设计事实源 |
| Superpowers | brainstorming、writing-plans、TDD、debug、verification 等流程 | UI 审美细则 |
| 柚爱 pomelosuki | shadcn-svelte + Tailwind UI/UX、设计 token、主题色、组件状态、界面评审 | adb / hdc、扫描、文件协议、主进程逻辑 |

涉及 UI 时，先读 `Agent/skills/pomelosuki/SKILL.md`；复杂改版可参考 `Agent/agents/pomelosuki.md` 的职责边界。

## Superpowers 流程

- 新功能、改行为、架构或 UX 决策前，使用 brainstorming 澄清意图、约束和方案。
- 多步骤或跨文件任务，使用 writing-plans；项目计划写入 `docs/product/plans/`。
- 功能和 bugfix 默认遵循 test-driven-development；无法先写自动化测试时，必须说明原因并给出可执行验证命令。
- 任何 bug、测试失败或异常行为，先用 systematic-debugging 找根因，再修复。
- 声称完成前必须使用 verification-before-completion，基于新鲜命令输出说明结果。
- 较大功能完成后做自检或 code review，再进入收尾。

用户明确要求“直接改”时，可缩小计划形式，但不能跳过事实源和完成前验证。

## MCP 与文档查询

- OpenAI / Codex / Agents / Vision / Responses 相关问题，优先使用 OpenAI developer docs MCP。
- Svelte 5、SvelteKit、runes 或组件写法不确定时，优先使用 Svelte MCP。
- 第三方库 API、安装方式和版本行为不确定时，优先使用 Context7 或官方文档。
- UI 大改、交互验收、视觉回归时，优先使用 Playwright / Browser 能力做目视验证。
- 不启用广权限 filesystem MCP、数据库写入 MCP、公司私域数据 MCP，除非单独评估并得到确认。

## 技术边界

- 渲染层不能直接访问 Node.js、adb、hdc、idevice 或文件系统。
- 所有系统能力必须通过 Electron main + preload + IPC 暴露受控 API。
- 高风险文件操作、设备控制、删除、覆盖、批量同步必须可确认、可记录、可追溯。
- IPC handler 不能写只返回成功的空壳逻辑；未实现能力不要伪装成已完成。

## UI 规则

- 使用 Svelte 5 + shadcn-svelte + Tailwind 4 + lucide-svelte。
- 颜色走语义 token，避免硬编码色阶；禁止 emoji 作图标。
- 默认浅色优先，深色保持可用。
- 文件管理、设备管理这类工作台界面优先信息层级、密度和可扫读性，不做营销式布局。

## 文件创建与目录治理

- AI 规则、Skill、MCP、智能体、记忆进入 `Agent/`。
- 产品需求、阶段计划、流程图、PPT、PDF、Excel、调研资料进入 `docs/`。
- 运行时工具链和二进制资源进入 `resources/`，说明文档进入 `docs/resources/`。
- 源码进入 `src/`，维护脚本进入 `scripts/`。
- 临时文件必须放入根目录 `tmp/`、`scripts/tmp/` 或对应模块的 `tmp/` 子目录，不能散落在根目录或功能目录下。
- 新增文档后要从根 `README.md`、`Agent/README.md` 或 `docs/README.md` 中至少一个入口可导航到。

## 验证策略

- 只改文档：不强制运行构建，但完成报告必须说明仅改文档。
- 修改 renderer / `.svelte` / UI：运行 `pnpm run verify`，UI 大改还应目视验证。
- 修改 Electron main / preload / IPC / 文件系统 / 设备逻辑：运行 `pnpm run verify`，涉及真实设备时补充人工设备验收。
- 修改依赖：运行 `pnpm install` 与 `pnpm run verify`，并说明依赖用途和许可证。
