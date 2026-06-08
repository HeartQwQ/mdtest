# AI 软件开发工具链集中管理

> 版本：2026-06-08 · 范围：mdtest 项目的 AI VibeCoding 开发治理

## 1. 目标

本项目由 AI VibeCoding 驱动开发，因此需要一套集中管理的 AI 开发工具链，用来降低以下风险：

- AI 不读需求就实现。
- AI 基于记忆或猜测编造 API。
- AI 写出空壳功能、占位命令或不可验收代码。
- AI 顺手重构无关代码。
- AI 引入不必要或不合规依赖。
- AI 修改文件系统、设备、IPC、权限和高风险逻辑时缺少确认。
- AI 声称完成但没有运行验证。

本文件统一管理 AGENTS.md、Rules、Skill（技能）、MCP（模型上下文协议）、Hooks（钩子）、文档源策略和验证策略。后续新增 AI 开发规范、仓库 Skill、MCP 配置或 hook 时，先更新本文档，再落地到对应目录。

## 2. 管理原则

### 2.1 工具分层

| 层级 | 作用 | 本项目使用方式 |
|------|------|----------------|
| AGENTS.md / Rules | 长期仓库约束 | 管沟通语言、开发边界、验证命令、禁止项 |
| Skill（技能） | 可复用工作流 | 管需求澄清、Svelte UI、Electron IPC、Android 环境管理、投屏/画面控制、验证收尾 |
| MCP（模型上下文协议） | 实时外部上下文与工具 | 查官方文档、跑浏览器验证、读取 GitHub/设计稿等外部信息 |
| Hooks（钩子） | 机械化拦截与提醒 | 拦截危险命令、缺验证收尾、密钥泄露、越权依赖安装 |
| docs | 项目事实源 | 存放需求、设计规范、工具链策略、验收规则 |

### 2.2 最小权限

不要为了“方便 AI”给它过大的工具权限。

- 文档查询类 MCP 优先。
- 浏览器验证类 MCP 按需启用。
- 能读写本地文件、执行系统命令、访问私域数据的 MCP 必须谨慎引入。
- 不引入重复能力：Codex 已能访问工作区时，不额外添加广权限 filesystem MCP。
- 不把公司私域数据默认接入 AI；需要时单独评估授权范围。

### 2.3 证据优先

AI 写代码前必须优先使用这些事实源：

1. 当前用户消息。
2. `docs/requirements.md`。
3. `docs/pomelosuki/*`。
4. 当前代码搜索结果。
5. 官方文档或 MCP 查询结果。
6. 用户确认。

AI 不能把模型记忆当成当前事实。API、配置项、依赖能力、Electron/Svelte/TanStack/OpenAI 等会变化的内容，必须查官方文档或项目已有代码。

### 2.4 开源优先，警惕造轮子

mdtest 是性能、交互和复杂度都较高的长期项目，不能按小项目方式反复手搓基础能力。

- 默认优先寻找成熟开源框架、官方工具和社区验证过的方案。
- 投屏、设备控制、自动化测试、图像识别、OCR、文件管理、虚拟列表、表格、状态管理、用例执行等复杂领域，必须先做开源方案评估。
- 自研只用于产品特有编排层、适配层、安全边界、操作记录、业务 UI 和验收流程。
- 如果选择自研核心能力，必须说明没有可接受开源替代，或现有方案在许可证、性能、交互、集成边界、维护状态上不满足要求。
- 简单实现可以作为临时验证路径，但不能冒充长期架构。

## 3. 当前已具备能力

| 能力 | 状态 | 说明 |
|------|------|------|
| Superpowers | 已引入 | 管 brainstorming、writing-plans、TDD、debug、verification 等流程 |
| pomelosuki UI 规范 | 已引入 | 管 Svelte + shadcn-svelte + Tailwind 的设计约束 |
| OpenAI Docs Skill | 当前 Codex 环境可用 | 查询 Codex、OpenAI API、Skill、MCP、hooks 等官方说明 |
| Browser / Playwright 能力 | 当前 Codex 环境可用 | 用于本地 UI 打开、截图和交互验证 |
| GitHub / Netlify 等插件 | 当前环境可用 | 当前项目早期不作为必需工具 |

当前仓库已有规则：

- `.cursor/rules/superpowers-workflow.mdc`
- `.cursor/rules/team-roles.mdc`
- `.cursor/skills/pomelosuki/SKILL.md`
- `docs/pomelosuki/project-profile.md`
- `docs/pomelosuki/ui-v2-design-notes.md`

旧 Tauri 项目的 `.codebuddy/rules` 中，最值得迁移的是“AI 协作总则”和“一键验证”思想，而不是 Tauri/Rust 专属实现。

## 4. 推荐新增的仓库级入口

### 4.1 AGENTS.md

建议在仓库根目录新增 `AGENTS.md`，作为所有 AI 客户端的长期入口。

建议内容：

- 必须中文沟通，专业术语可中英对照。
- 警惕造轮子，复杂能力优先评估成熟开源框架。
- 开工前先读 `docs/requirements.md`。
- 涉及 UI 先读 `docs/pomelosuki/project-profile.md`。
- 涉及流程先遵守 Superpowers。
- 渲染层不能直接访问 Node.js。
- 所有系统能力必须走 Electron main + preload + IPC。
- 修改代码后按范围运行 `pnpm run check` / `pnpm run build`。
- 不确定 API 时必须查文档或问用户。
- 不写空壳功能和无法验收的 TODO。

### 4.2 docs/ai

`docs/ai/` 用于集中管理 AI 开发工具链、来源策略、验证策略和未来 Skill 设计。

当前建议只保留本文档。后续文档拆分时遵循：

| 文件 | 触发条件 |
|------|----------|
| `docs/ai/source-policy.md` | MCP 和官方文档策略变复杂时拆分 |
| `docs/ai/verification-policy.md` | 验证矩阵、hook、CI 策略变复杂时拆分 |
| `docs/ai/skill-roadmap.md` | 开始实际创建多个 repo Skill 时拆分 |
| `docs/ai/mcp-registry.md` | MCP 安装和启停策略变复杂时拆分 |

### 4.3 .agents/skills

后续建议创建 repo-scoped Skill（仓库级技能），位置：

```text
.agents/skills/
  mdtest-requirement-gate/
  mdtest-svelte-ui/
  mdtest-electron-ipc/
  mdtest-android-env/
  mdtest-verification/
```

第一阶段先不创建实体 Skill，避免工具入口过多。等开发流程稳定后，再把本文档中的流程固化为 Skill。

### 4.4 .codex/hooks.json

后续可以新增项目级 hooks，但必须先让用户确认，因为 hook 会参与工具调用生命周期。

优先级：

1. `Stop`：如果代码有变但未运行验证，提醒不能声称完成。
2. `PreToolUse`：拦截危险命令、未确认依赖安装、递归删除、git 历史改写。
3. `PermissionRequest`：审查高风险审批理由是否具体。
4. `PostToolUse`：检查命令失败后是否按规则处理。

## 5. 推荐 Skill（技能）规划

### 5.1 mdtest-requirement-gate

触发场景：

- 新功能。
- 改行为。
- 调整架构。
- 修改文件管理、环境模板、AI 执行、知识库、用例库。

必须做：

- 读取 `docs/requirements.md`。
- 确认当前阶段是否属于 Android-first MVP。
- 明确目标、非目标、验收标准。
- 发现需求含糊时先问用户。

禁止：

- 不读需求直接实现。
- 把后续 Phase 的 AI 自动执行/OCR/多端闭环提前塞入第一阶段。

### 5.2 mdtest-svelte-ui

触发场景：

- 修改 `.svelte`。
- 修改 UI 布局、主题、组件、交互。

必须做：

- 读取 `docs/pomelosuki/project-profile.md`。
- 复用 shadcn-svelte / bits-ui / lucide-svelte。
- 使用 Svelte 5 runes。
- 使用 Tailwind 语义 token。
- 保持高密度工具界面，不做营销式布局。

禁止：

- emoji 作图标。
- 大量硬编码色值。
- 随意引入新 UI 库。
- 为了某个第三方组件牺牲业务结构。

### 5.3 mdtest-electron-ipc

触发场景：

- 修改 Electron main。
- 修改 preload。
- 新增 IPC。
- 接入 Node.js、adb、hdc、idevice、文件系统、外部进程。

必须做：

- renderer 不直接访问 Node.js。
- 所有系统能力通过 main 进程实现。
- preload 只暴露受控 API。
- IPC channel 命名集中、稳定、可追踪。
- 错误必须转换为 UI 可理解的信息。

禁止：

- 在 renderer 中打开 Node 权限。
- 让前端拼 shell 命令。
- 在 IPC 中写无法验收的占位 handler。
- 将用户路径未经校验传给破坏性操作。

### 5.4 mdtest-android-env

触发场景：

- Android 设备识别。
- 和平精英包检测。
- Android 文件管理。
- Android 投屏 / 画面控制。
- 环境模板。
- 备份恢复。
- 日志拉取。

必须做：

- 固定当前游戏为和平精英。
- 固定包名 `com.tencent.tmgp.pubgmhd`。
- Android 优先打通闭环。
- 投屏不能从产品核心能力中删除；第一阶段先做 Android 画面查看与基础控制闭环。
- 接口层保留 PC / iOS / Harmony 扩展位。
- 删除、覆盖、批量同步必须有确认和记录。

禁止：

- 第一阶段做多游戏配置中心。
- 把 Android-only 写死到上层 UI 和用例结构。
- 高风险文件操作无备份或无操作记录。

### 5.5 mdtest-verification

触发场景：

- 声称完成前。
- 修改代码后。
- 修改 IPC、文件系统、设备逻辑后。
- UI 大改后。

验证基线：

```powershell
pnpm run check
pnpm run build
```

后续如果加入格式化脚本，建议扩展为：

```powershell
pnpm run format:check
pnpm run check
pnpm run build
```

完成报告必须包含：

- 改了哪些文件。
- 没有改哪些高风险区域。
- 运行了哪些验证。
- 验证是否通过。
- 未运行验证的原因。

## 6. MCP 引入策略

### 6.1 第一批建议

| MCP | 优先级 | 用途 | 引入理由 |
|-----|--------|------|----------|
| Svelte MCP | P0 | Svelte 5 / runes 官方文档 | 防止写旧语法和编造 API |
| Context7 | P0 | Electron、electron-vite、TanStack、Tailwind、shadcn-svelte 等通用文档 | 查最新库文档 |
| OpenAI Docs MCP | P0 | OpenAI API、Codex、Agents、Vision、Responses 等官方文档 | 后续 AI 能力必须用官方来源 |
| Playwright MCP 或 Browser 插件 | P1 | UI 交互、截图、回归验证 | 防止只靠描述判断 UI 正常 |
| GitHub MCP | P2 | issue、PR、review、CI | 等项目进入多人协作后再启用 |

### 6.2 暂不建议

| MCP | 暂缓原因 |
|-----|----------|
| 广权限 filesystem MCP | Codex 已能读写工作区，重复且扩大风险 |
| 数据库写入 MCP | 当前还没有稳定数据层 |
| Slack / 飞书 / Notion / 私域知识库 MCP | 原型期避免引入公司私域数据权限 |
| Figma MCP | 当前已有本地 pomelosuki 规范，除非后续有正式设计稿 |
| 未审查社区 MCP | MCP 是工具权限入口，安全风险高于普通文档依赖 |

### 6.3 文档查询调度

| 主题 | 第一来源 | 第二来源 | 禁止 |
|------|----------|----------|------|
| 项目目标 | `docs/requirements.md` | 用户确认 | 凭旧对话猜 |
| UI 规范 | `docs/pomelosuki/*` | 当前组件代码 | 自创风格 |
| Svelte | Svelte MCP | `svelte.dev` | 凭记忆写 runes API |
| Electron | Context7 | `electronjs.org` / `electron-vite.org` | 编造 WebContents / IPC API |
| TanStack | Context7 | TanStack 官方文档 | 按 React 文档硬套 Svelte |
| OpenAI / Agent | OpenAI Docs MCP | OpenAI 官方文档 | 使用非官方博客当事实源 |
| Android / adb | 本项目代码 + Android 官方/adb 文档 | 用户设备反馈 | 随意拼危险 shell |

## 7. 防幻觉机制

### 7.1 开工前协议

AI 在复杂任务前必须内部确认：

```text
目标：我要完成什么？
约束：哪些不能做？
事实源：我已经读了哪些文件？
影响范围：会改哪些文件？
验收：怎样算完成？
风险：是否涉及依赖、权限、删除、覆盖、IPC、设备操作？
```

### 7.2 不确定 API 的标准动作

```text
不确定 API
-> 查项目现有代码
-> 查 MCP / 官方文档
-> 仍不确定就问用户或明确说不确定
-> 禁止编造 API
```

### 7.3 空壳功能禁令

不允许为了“看起来完成”而写：

- 只返回成功但不做业务的 IPC handler。
- 只改 UI 状态但不调用真实 API 的按钮。
- 未接线的菜单项。
- 无法触达的 TODO。
- 与需求无关的“预留大架构”。

如果当前阶段不实现，文档中标记为后续 Phase；代码里不要伪装成已实现。

## 8. 依赖与许可证策略

由于当前阶段需要规避商业化和公司规范风险，引入依赖时必须记录：

| 检查项 | 要求 |
|--------|------|
| 许可证 | 优先 MIT / Apache-2.0 / BSD；不明确则不引 |
| 商业限制 | 有商业授权、License Key、运行时水印的库不作为核心依赖 |
| 必要性 | 先说明为什么现有依赖或成熟开源方案不能直接满足 |
| 替代方案 | 至少比较“现有依赖 / 成熟开源新依赖 / 轻量自研适配” |
| 维护状态 | 检查近期更新、issue、下载量或官方来源 |
| 实际使用 | 加依赖后必须在代码中实际使用，禁止残留依赖 |

文件管理器方向：

- 优先评估成熟开源文件管理、虚拟列表、表格、拖拽、状态管理和命令面板能力。
- SVAR 可作为原型参考，但如果 UI 改造成本过高，不强行绑定。
- 长期核心文件工作台不应从零造轮子；优先采用成熟开源基础设施，业务适配层、安全边界、操作记录和和平精英路径体验由项目自研。
- TanStack 可作为 Query / Virtual / Table 等局部能力引入，不为了框架迁移而迁移。

## 9. 验证策略

### 9.1 文档修改

文档修改不强制运行构建，但完成报告必须说明“仅改文档，未运行 build/check”。

### 9.2 前端修改

修改 `.svelte` / renderer 逻辑后：

```powershell
pnpm run check
pnpm run build
```

UI 大改还应打开应用目视验证。

### 9.3 Electron 主进程 / preload / IPC 修改

修改以下区域后必须跑：

```powershell
pnpm run check
pnpm run build
```

涉及真实设备、文件、adb 的能力，还需要人工设备验收。

### 9.4 依赖修改

修改 `package.json` / `pnpm-lock.yaml` 后：

```powershell
pnpm install
pnpm run check
pnpm run build
```

并报告新增/移除依赖、许可证和用途。

## 10. Hook 规划

### 10.1 Stop hook

目标：

- 如果 git 工作区有代码改动，但本轮未记录验证命令，提醒 AI 不得声称完成。

风险：

- hook 只能提醒，不能替代真实测试。
- 需要处理文档-only 改动例外。

### 10.2 PreToolUse hook

目标：

- 拦截递归删除。
- 拦截 `git reset --hard`、`git checkout --` 等历史破坏命令。
- 拦截未确认的依赖安装。
- 拦截跨工作区写入。

### 10.3 PermissionRequest hook

目标：

- 检查审批理由是否具体。
- 对网络、安装依赖、打开 GUI、写工作区外路径进行提醒。

### 10.4 暂不落地原因

hook 会参与 Codex 工具调用生命周期，属于高影响配置。当前阶段先写文档策略，等项目需求和开发流稳定后再落地。

## 11. 当前行动计划

### 立即执行

1. 保留本文档作为 AI 开发工具链集中入口。
2. 使用仓库根目录 `AGENTS.md` 固化长期规则，让 Codex 可自动读取。
3. 先使用已有 Superpowers 与 pomelosuki 规则，不重复建设。
4. 需要查新框架/库时，优先通过 MCP 或官方文档。

### 第二步

1. 将旧 Tauri 项目的 AI 协作规则改写为 Electron 版本。
2. 持续补充 `AGENTS.md` 与本文档的一致性。
3. 新增 `pnpm verify` 脚本，统一 `check + build`。
4. 评估是否加入 `format:check`。

### 第三步

1. 创建 `.agents/skills/mdtest-*` 仓库级 Skill。
2. 配置 Svelte MCP、Context7、OpenAI Docs MCP。
3. 评估 Playwright MCP / Browser 测试流程。
4. 最后再考虑 hooks。

## 12. 非目标

当前不做：

- 立刻安装所有 MCP。
- 立刻创建 hooks。
- 接入公司私域数据源。
- 引入商业化 UI 或文件管理组件。
- 建立复杂 CI/CD。
- 把 AI 自动执行测试提前到第一阶段。

## 13. 与项目需求的关系

本文件服务于 `docs/requirements.md`，不改变产品阶段目标。

当前产品第一阶段仍然是：

```text
和平精英
-> Android-first
-> 四端预留
-> Android 投屏/画面控制
-> 环境管理与文件工作台
-> AI 后置增强
```

AI 开发工具链的目标是让 AI 更稳地实现这些需求，而不是替代需求判断。
