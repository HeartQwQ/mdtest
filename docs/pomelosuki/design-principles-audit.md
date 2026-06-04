# design-principles.md 审阅报告（809 行）

审阅对象：从 WorkBuddy `pomelosuki` 迁入的 `references/design-principles.md`（Cursor 版已做栈适配补丁）。

## 总体评价

**质量：良好，可作为项目内 UI 单一事实来源（SSOT）。**

优点：

- 结构完整：理念 → 风格 → 规范 → 交互 → 响应式 → 动效 → a11y → 交付 → 流程 → 反模式，层次清晰。
- **反 AI 审美**部分实用（字体、紫渐变、Hero 徽章、文案禁语、动画滥用），与 frontend-design 精华一致且可执行。
- **交付前检查清单**可直接用于 PR / verification 前自检。
- 游戏测试工具示例（四步法表格）贴合 mdtest 领域。
- 专业 UI 速查（浮动导航、容器宽度、hover 布局偏移）偏实战，非空泛理论。

## 已修复的 Cursor / mdtest 问题

| 问题 | 处理 |
|------|------|
| 技术栈写 Tauri + SvelteKit | 改为 Electron + Svelte 5 + `app.css` |
| 动效只提 React Motion | 补充 Svelte `transition` |
| 检查清单大量 Tailwind 类名 | 改为通用 CSS / 变量表述 |

## 仍存在的局限（建议后续迭代）

1. **篇幅与重复**  
   - 「AI 雷区」在风格章与反模式章有重叠；可合并为一张总表减少 token 消耗。  
   - 约 809 行对每次对话全读过重；SKILL 已要求按章浏览，合理。

2. **与当前代码的对齐**  
   - 文档假设可大改 token；现网 UI 已用 `--bg` / `--accent` 暗色工具风，大改前应在 brainstorming 确认是否「演进」而非「推倒重来」。  
   - 未单独写 **Electron 窗口**（标题栏、最小尺寸 960×640、系统字体）约束，可在「Desktop Design」加一小节。

3. **图标规范 vs 现状**  
   - 清单要求「不用 emoji 做图标」，现 `FileExplorer` 用 📁📄；若严格执行需换 SVG（如 lucide-svelte）。

4. **来源标注**  
   - 部分章节标注来自 design-wizard / frontend-design，利于维护；长期可把 mdtest 专有决策（三栏设备页、文件树）写入独立章节，减少泛化内容比例。

5. **WorkBuddy 残留**  
   - Figma 交付目录仍名 `PomeloSuki Design System.fig`，仅影响交付物命名，不影响 Cursor 使用。

6. **无障碍**  
   - WCAG 对比度、focus、`prefers-reduced-motion` 写得够；实现时需在 Svelte 组件上逐项落地（当前部分按钮缺 `type="button"` 等可顺带修）。

## 不建议从 WorkBuddy 原样搬入的部分

| 内容 | 原因 |
|------|------|
| `SkillManage.py` + SKILL 内 Python API | Cursor 无 WorkBuddy 运行时；已用 Superpowers 计划替代 |
| `agents/pomelosuki.md` 320 行营销向长文 | 信息密度低，已由 subagent 短 prompt + design-principles 替代 |

## 结论

**800 行规范本身值得保留**；作为柚爱的知识内核合格。Cursor 版通过 **SKILL 按需读章 + subagent + 栈补丁** 比原 WorkBuddy「专家 + Python 任务库 + 重复插件」更易维护。

若只改一处：建议下一步增加 **「mdtest 现有 UI 约定」** 半页（侧栏 200px、三栏网格、panel 圆角 8px），减少设计与实现漂移。
