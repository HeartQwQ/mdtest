# mdtest AI 开发规则

## 沟通

- 必须使用中文沟通，专业术语需要对照翻译。

## 项目定位

- mdtest 是面向《和平精英》测试团队的长期大型 Electron 桌面项目，不按小工具、一次性 Demo 或练手项目处理。
- 当前路线是 Android-first；接口、UI 和数据结构必须为 PC / Android / iOS / Harmony 四端预留扩展位。
- 投屏 / 画面控制、环境管理、文件工作台是核心能力，不能因为阶段收缩而从产品里删除。

## 事实源顺序

开工前按任务读取：

1. 产品目标和阶段范围：`docs/需求文档.md`。
2. UI / 设计任务：`Agent/skills/pomelosuki/SKILL.md`、`docs/设计规范.md`。
3. MCP 配置：`Agent/mcp/mcp.json`。
4. 设备工具链来源、许可和路径：`resources/device-toolchains/device-toolchains.md`。
5. 当前代码搜索结果和本轮用户消息。

不确定 API、框架能力、依赖行为或最新文档时，必须查官方文档、MCP 或当前代码，不能凭记忆猜。

## 开源优先，警惕造轮子

- 投屏、设备控制、自动化测试、图像识别、OCR、文件管理、虚拟列表、表格、状态管理、用例执行等复杂领域，默认优先评估成熟开源框架、官方工具和社区验证过的方案。
- 自研只用于产品特有编排层、适配层、安全边界、操作记录、业务 UI 和验收流程。
- 引入或拒绝开源方案前，至少说明候选方案、许可证、维护状态、Electron + Svelte + Android-first 集成成本，以及采用或拒绝原因。
- 简单实现只能作为临时验证路径，不能冒充长期架构。

## 项目内 Agent

当前项目内只维护一个角色化 Agent：`Agent/agents/pomelosuki.md`。

| 角色 | 负责 | 不负责 |
|------|------|--------|
| 柚爱 pomelosuki | shadcn-svelte + Tailwind UI/UX、设计 token、主题色、组件状态、界面评审 | adb / hdc、扫描、文件协议、主进程逻辑 |

涉及 UI 时，先读 `Agent/skills/pomelosuki/SKILL.md`；复杂改版可参考 `Agent/agents/pomelosuki.md` 的职责边界。

## MCP 与文档查询

MCP 配置见 `Agent/mcp/mcp.json`，使用策略以本节为准。

- Svelte 5、SvelteKit、runes 或组件写法不确定时，优先使用 Svelte MCP。
- 第三方库 API、安装方式和版本行为不确定时，优先使用 Context7 或官方文档。

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

- AI 规则、Skill、MCP 配置、智能体进入 `Agent/`。
- 产品事实源、设计规范、流程图、PPT、PDF、Excel、调研资料进入 `docs/`。
- 临时执行计划默认不写入 `docs/`，除非用户明确要求保留为长期文档。
- 运行时工具链、二进制资源和随资源维护的说明文档进入 `resources/`。
- 源码进入 `src/`，维护脚本进入 `scripts/`。
- 临时文件必须放入根目录 `tmp/`、`scripts/tmp/` 或对应模块的 `tmp/` 子目录，不能散落在根目录或功能目录下。
- 新增长期文档后要从根 `README.md` 中可导航到；避免在子目录重复维护入口说明。

## 验证策略

- 只改文档：不强制运行构建，但完成报告必须说明仅改文档。
- 修改 renderer / `.svelte` / UI：运行 `pnpm run verify`，UI 大改还应目视验证。
- 修改 Electron main / preload / IPC / 文件系统 / 设备逻辑：运行 `pnpm run verify`，涉及真实设备时补充人工设备验收。
- 修改依赖：运行 `pnpm install` 与 `pnpm run verify`，并说明依赖用途和许可证。
