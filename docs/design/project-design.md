# mdtest 项目设计总纲

> 范围：mdtest UI/UX 设计治理。具体项目约束和历史记录放在 `docs/design/pomelosuki/`。

## 设计事实源

UI/UX 设计、视觉方向、主题 token、组件改造和设计评审，先读：

1. `Agent/skills/pomelosuki/SKILL.md`：柚爱的通用设计方法。
2. `docs/design/pomelosuki/project-profile.md`：mdtest 的框架、路径、主题、验证命令和边界。
3. `docs/design/pomelosuki/ui-v2-design-notes.md`：当前界面布局和交互约束。
4. `docs/product/requirements.md`：产品阶段、目标和非目标。

柚爱是 UI/UX Agent（智能体）与 Skill（技能），不是 mdtest 的固定风格。项目风格只记录在 `docs/design/pomelosuki/`，不能上升为柚爱的永久默认审美。

## 当前设计方向

mdtest 是面向《和平精英》测试团队的 Electron 桌面工具。当前阶段是 Android-first 的测试环境管理工作台，不是营销页、通用 SaaS 控制台或多游戏平台。

- 默认浅色优先，深色可用。
- 使用 shadcn-svelte `new-york`、Tailwind 语义 token 和 lucide 图标。
- 保持高密度、可扫读、边界清楚的工作台气质。
- 四端切换保持一级可见；Android 先打通，但结构预留 PC / iOS / Harmony。
- 投屏 / 画面控制与文件工作台都是核心体验。

## 文件工作台设计口径

文件工作台的路径导航是核心控件，不能只按工程实现方便展示 ADB 路径。Android 设备文件管理默认对应“设备内部存储”，底层路径优先为 `/storage/emulated/0`，UI 展示应从“设备名 / 内部存储”开始，例如：

```text
HONOR 80 GT / 内部存储 / Android / data / com.tencent.tmgp.pubgmhd
```

不要在 mdtest 自己的面包屑里硬套 Windows 资源管理器的“此电脑”。“此电脑”只属于 Windows MTP 外部视图，不是项目内路径模型。

当前文件工作台面包屑仍是 `FileExplorer.svelte` 内部手写组合，并非 shadcn-svelte 的 Breadcrumb 组件。后续应补 `src/renderer/src/lib/components/ui/breadcrumb/` 组件，统一无障碍语义、分隔符、溢出、当前项、收藏按钮位置和暗色模式状态；在组件化前，不要把更多路径逻辑继续堆进视图模板。

## 设计边界

柚爱可设计和改造：

- 页面布局、视觉层级、信息密度。
- shadcn-svelte 组件组合和状态样式。
- Tailwind 语义 class 与 `app.css` token。
- 明暗模式、主题变量、hover、focus-visible、disabled、empty、loading、error 状态。

柚爱不直接决定：

- Electron main / preload / IPC 权限模型。
- adb / hdc / libimobiledevice 调用策略。
- 文件删除、写入、备份、恢复等高风险业务规则。
- AI 自动化执行、OCR、图像识别模型和测试用例生成逻辑。

这些能力可以由柚爱提供 UI 方案，但实现边界和安全策略归主工程规划。

## 文档地图

| 文档 | 状态 | 用途 |
|------|------|------|
| `pomelosuki/README.md` | 当前入口 | 说明设计档案目录内各文档状态 |
| `pomelosuki/project-profile.md` | 当前有效 | mdtest 项目约束档案，UI 落地前必读 |
| `pomelosuki/ui-v2-design-notes.md` | 当前有效 | 当前 UI 方向、布局与检查清单 |
| `pomelosuki/themes.md` | 参考 | 主题扩展方法；多主题不是当前主线 |
| `pomelosuki/design-forge-theme.md` | 历史实验 | forge 主题验证记录，不代表当前默认方向 |
| `pomelosuki/design-principles-audit.md` | 历史审阅 | 外部规范迁入时的审查记录 |
| `pomelosuki/pomelosuki-skill-improvement-notes.md` | 建议 | 可反哺柚爱本体的通用想法 |

## 验收

修改 UI 后运行：

```bash
pnpm run verify
```

只改文档时可以不运行构建，但完成报告必须说明。涉及视觉质量时，默认浅色优先目视检查，其次检查深色模式是否可用。
