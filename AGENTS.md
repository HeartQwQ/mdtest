# mdtest AI 开发规则

## 沟通

- 必须使用中文沟通，专业术语可翻译对照显示，例如 Skill（技能）、MCP（模型上下文协议）。

## 项目定位

- mdtest 是面向《和平精英》测试团队的长期大型项目，不按小工具、一次性 Demo 或练手项目处理。
- 当前产品路线是 Android-first，但架构必须为 PC / Android / iOS / Harmony 四端预留扩展位。
- 投屏 / 画面控制不能从核心能力中删除；第一阶段先做好 Android。

## 开源优先，警惕造轮子

- 默认优先寻找成熟开源框架、官方工具和社区验证过的方案，避免重复造轮子。
- 在投屏、设备控制、自动化测试、图像识别、OCR、文件管理、虚拟列表、表格、状态管理、用例执行等复杂领域，不允许未经评估就从零自研核心能力。
- 自研只适用于以下场景：
  - 没有满足许可证、性能、交互、可维护性或集成边界要求的开源替代。
  - 只做产品特有的编排层、适配层、安全边界、操作记录、业务 UI 和验收流程。
  - 现有框架能解决 80% 能力，但需要轻量封装以接入 Electron / Svelte / IPC。
- 引入或拒绝开源方案前，必须至少说明：
  - 候选方案是什么。
  - 许可证是否可接受。
  - 维护状态是否健康。
  - 和 Electron + Svelte + Android-first 的集成成本。
  - 为什么采用、暂缓或拒绝。
- 禁止为了“简单可控”而手搓复杂框架；简单实现只能作为临时验证路径，不能冒充长期架构。

## 开工前事实源

- 新功能或架构调整前，先读 `docs/requirements.md`。
- 涉及 UI，先读 `docs/pomelosuki/project-profile.md` 和 `docs/pomelosuki/ui-v2-design-notes.md`。
- 涉及 AI 开发治理、依赖、MCP、Skill、hooks，先读 `docs/ai/development-toolchain.md`。
- 不确定 API、框架能力或最新行为时，必须查官方文档、MCP 或当前代码，不能凭记忆猜。

## 技术边界

- 渲染层不能直接访问 Node.js、adb、hdc、idevice 或文件系统。
- 所有系统能力必须通过 Electron main + preload + IPC 暴露受控 API。
- 高风险文件操作、设备控制、删除、覆盖、批量同步必须可确认、可记录、可追溯。
- 修改代码后按影响范围运行 `pnpm run check` / `pnpm run build`；只改文档时需要明确说明未运行构建。
