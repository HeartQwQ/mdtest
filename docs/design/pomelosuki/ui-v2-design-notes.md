# UI 布局说明（柚爱 / shadcn-svelte）

> 产品需求全文见 [`docs/product/requirements.md`](../../product/requirements.md)

## 方向

- **Tone**：浅色优先的专业测试工作台（非营销页、非紫渐变 SaaS、非暗色炫技面板）
- **记忆点**：shadcn-svelte new-york + primary/cyan 强调 + 高密度设备/文件操作 + lucide 线性图标
- **四端规范**：顺序 **PC → 安卓 → iOS → 鸿蒙**；手机三端统一 `Smartphone`，PC 用 `Monitor`
- **当前阶段**：Android-first，先打通和平精英安卓测试环境管理、投屏/画面控制与文件工作台。

## Token（`app.css` @theme）

| Token | 用途 |
|-------|------|
| `background` / `foreground` | 页面底与正文 |
| `card` / `border` | 面板与分隔；默认浅色需保持清楚边界 |
| `primary` | 主按钮、选中强调 |
| `sidebar*` | 主导航侧栏 |
| `online` / `warn` | 设备在线 / 警告态 |

### shadcn 使用约定

- 组件优先使用 `Button`、`Card`、`Input`、`DropdownMenu`、`Select` 等 shadcn-svelte 源码组件。
- 状态优先使用 `bg-accent text-accent-foreground`、`focus-visible:ring-ring`、`border-border`。
- 面板层级使用 `bg-card border-border shadow-sm`，避免新增 `shadow-panel`、`shadow-control` 这类项目外视觉体系。
- 默认浅色模式是第一验收面；深色模式保持可读但不是当前主要设计基准。

## 布局（当前壳）

```text
┌─ Titlebar（自绘，drag-region）────────────────────────┐
│ icon │                                                 │
│ nav  │  HomeView / DeviceManagementView / SettingsView  │
│ w-14 │                                                 │
└──────┴─────────────────────────────────────────────────┘
```

### 环境管理页

| 区域 | 宽度 | 内容 |
|------|------|------|
| 左侧主导航 | `w-14` | Home / 设备管理 / 设置，icon-only + tooltip |
| 顶部环境栏 | `h-16` 左右 | 左侧四端切换 + 单端设备下拉；右侧投屏 / 文件管理功能切换 |
| 中央工作台 | `flex-1` | 投屏或文件工作台直接占满，不再套第二层卡片 |
| 右侧辅助区 | `w-80` | 当前环境、快捷操作、日志 / 用例进度、AI 辅助入口 |

文件工作台当前位于：

```text
src/renderer/src/lib/components/file-explorer/FileExplorer.svelte
```

### 文件工作台交互约束

- 四端切换必须保持一级可见，不做二级菜单；单端设备选择可以下拉。
- 投屏 / 文件管理属于功能模式，放在环境栏右侧，与四端设备选择分区。
- 文件管理器本身不再额外套 `Card`，避免页面卡片里再套文件卡片。
- 文件管理工具栏只保留高频导航与入口：目录模式、上级、刷新、上传、新建。
- 新建文件 / 文件夹不常驻输入框，使用“新建”下拉 + 小浮层确认。
- 复制、剪切、粘贴、重命名、删除默认收纳到右键菜单。
- 面包屑是文件管理器的一级导航，需要比普通辅助文本更显眼。
- 完全无用的主页按钮不要出现在文件管理工具栏；根路径通过面包屑首项返回。

## 检查清单（摘录）

- [x] 无 emoji 图标
- [x] lucide 统一尺寸
- [x] 四端顺序与图标规范
- [x] 语义 token，无硬编码色阶
- [x] 按钮 hover / disabled / focus-visible
- [x] 默认浅色边界清晰，不靠重阴影堆层级
- [ ] `pnpm dev` 目视全页交互
