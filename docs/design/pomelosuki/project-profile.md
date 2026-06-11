# 项目约束档案 · mdtest（柚爱执行用）

> 柚爱（pomelosuki）落地前**必读本文件**。本体 Skill 只讲通用设计方法；本文件锁定 mdtest 的框架、路径、当前设计方向与验证命令。换项目时复制本模板并改写即可。

## 1. 框架与 UI 栈

| 项 | 值 |
|----|----|
| 应用形态 | Electron 桌面端（electron-vite） |
| 渲染框架 | **Svelte 5**（runes：`$state` / `$derived` / `$props` / `$effect`） |
| shadcn 变体 | **shadcn-svelte**（`components.json`，style 为 `new-york`，baseColor `zinc`） |
| 样式 | **Tailwind CSS 4**（`@tailwindcss/vite`，`@import 'tailwindcss'`） |
| 组件原语 | `bits-ui` + `tailwind-variants` |
| 图标 | **`@lucide/svelte`**，统一 `size-4` / `size-5`，**禁止 emoji 作图标** |
| 暗色切换 | `mode-watcher`（`<html>` 上 `.dark`） |

## 2. 关键路径

| 区域 | 路径 |
|------|------|
| 渲染入口 | `src/renderer/src/main.ts`、`App.svelte` |
| 主导航 | `src/renderer/src/lib/components/nav/`（`AppSidebar`、`TeamSwitcher`、`NavUser`） |
| 自绘标题栏 | `src/renderer/src/lib/components/Titlebar.svelte` |
| 页面视图 | `src/renderer/src/lib/views/`（`HomeView`、`DeviceManagementView`、`SettingsView`） |
| 视图路由 | `src/renderer/src/lib/stores/view.svelte.ts` |
| 导航数据 | `src/renderer/src/lib/nav/nav-data.ts` |
| 业务组件（旧） | `src/renderer/src/lib/components/*.svelte`（逐步迁移） |
| 文件工作台组件 | `src/renderer/src/lib/components/file-explorer/FileExplorer.svelte` |
| shadcn 组件 | `src/renderer/src/lib/components/ui/**` |
| 工具函数 | `src/renderer/src/lib/utils.ts`（`cn()`） |
| 样式 / token | `src/renderer/src/app.css`（含 `drag-region` / `no-drag`） |
| 主题状态 | `src/renderer/src/lib/stores/theme.svelte.ts` |
| 产品需求 | `docs/product/requirements.md` |
| 构建配置 | `electron.vite.config.ts`（alias `$lib`） |

## 3. 主题与 token 体系

- **语义 token** 定义在 `app.css`，通过 `@theme inline` 映射为 Tailwind 颜色（`bg-background`、`text-foreground`、`bg-primary`、`border-border`…）。
- **两个维度可叠加**：
  - 明暗：`.dark`（由 `mode-watcher` 控制，三档 light / dark / system）
  - 风格包：`<html data-theme="…">`
- **已落地主题**：`default`（锌灰 + 青色）、`studio`（暖中性 + 紫罗兰）、`cyber`（深底 + 荧光绿）、`forge`（冷灰石板 + 琥珀）。
- **当前设计基准**：默认浅色模式优先；深色模式保持可用；其他风格包是主题扩展示例，不作为当前主线。
- 颜色用 **OKLCH**。状态色见 `--color-online` / `--color-warn`（`status.ts` 里少量直用）。

### 新增一套主题

1. `theme.svelte.ts` 的 `themePalettes` 加一项（`id` = `data-theme` 值）。
2. `app.css` 增 `[data-theme="新id"]`（浅色）与 `.dark[data-theme="新id"]`（深色）两块变量，至少覆盖：`background`、`foreground`、`card`、`primary`、`secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring`、`sidebar*`。
3. 组件无需改动。详见 `docs/design/pomelosuki/themes.md`。

## 4. 当前设计基调

- **浅色优先的测试工作台**：克制、信息密度高、边界清晰、长时间可读；primary/cyan 作单一强调。
- **shadcn-svelte new-york**：优先使用语义 token 和 shadcn 原语，常用层级为 `border`、`bg-card`、`bg-accent`、`shadow-sm`，不要自造重阴影体系。
- **窗口**：无边框（`frame: false`）+ 自绘 `Titlebar`（`-webkit-app-region: drag`）。
- **主导航**：icon 侧栏 `w-14`，hover tooltip；顶部为项目/游戏上下文，底部为用户/设置入口。
- **环境管理页**：顶部四端切换 + 设备选择；中部 Android 投屏/画面控制与文件工作台；右侧日志/用例进度与 AI 辅助区；最小窗口 960×640。
- **四端顺序与图标**：**PC → 安卓 → iOS → 鸿蒙**；手机三端统一 `Smartphone`，PC 用 `Monitor`。
- 圆角 `rounded-lg` / `rounded-xl`；面板用 `bg-card border-border shadow-sm`。
- 优先 shadcn 组件，避免硬编码 `zinc-*` / `cyan-*`。

## 5. 落地与验证命令

```bash
pnpm dev                 # 开发，可配合本地应用目视验证
pnpm run verify          # test + svelte-check + electron-vite build
# 新增 shadcn 组件：
pnpm dlx shadcn-svelte@latest add <component...>
```

- 改 `.svelte` 后：若有 **Svelte MCP**，调用 `svelte-autofixer` 校验。
- 完成判定：`pnpm run verify` 通过；UI 大改还需要目视验证，默认浅色优先。

## 6. 流程与边界

- 处于 **Superpowers** 链路的「设计 / 实现 UI」环节，不跳过 verification。
- 柚爱**不碰**：Electron 主进程、adb/hdc、设备扫描、文件传输协议、游戏启动逻辑（归主代理）；但 UI 设计需优先服务 Android-first 的和平精英环境管理 + 投屏/画面控制闭环。
- 柚爱不能把 mdtest 当前视觉上升为自身固定风格；mdtest 项目风格只保存在 `docs/design/pomelosuki/`。

