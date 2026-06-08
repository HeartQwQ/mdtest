# UI 布局说明（柚爱 / Tailwind）

> 产品需求全文见 [`docs/requirements.md`](../requirements.md)

## 方向

- **Tone**：Dark & Premium 开发者工具（非紫渐变 SaaS）
- **记忆点**：primary/cyan 强调 + 三栏信息密度 + lucide 线性图标
- **四端规范**：顺序 **PC → 安卓 → iOS → 鸿蒙**；手机三端统一 `Smartphone`，PC 用 `Monitor`

## Token（`app.css` @theme）

| Token | 用途 |
|-------|------|
| `background` / `foreground` | 页面底与正文 |
| `card` / `border` | 面板与分隔 |
| `primary` | 主按钮、选中强调 |
| `sidebar*` | 主导航侧栏 |
| `online` / `warn` | 设备在线 / 警告态 |

## 布局（当前壳）

```
┌─ Titlebar（自绘，drag-region）────────────────────────┐
│ icon │                                                 │
│ nav  │  HomeView / DeviceManagementView / SettingsView  │
│ w-14 │                                                 │
└──────┴─────────────────────────────────────────────────┘
```

### 环境管理页三栏

| 区域 | 宽度 | 内容 |
|------|------|------|
| 左 · 端与设备区 | `w-64` | PC / Android / iOS / Harmony 入口 + 设备列表；第一阶段 Android 可用，其余待接入 |
| 中 · 环境工作台 | `flex-1` | Android 投屏/画面控制 + 和平精英常用路径 + 文件工作台 + 环境模板 + 备份/恢复 |
| 右 · 证据与辅助区 | `w-72` | 操作记录、日志拉取结果、知识/AI 辅助入口 |

## 检查清单（摘录）

- [x] 无 emoji 图标
- [x] lucide 统一尺寸
- [x] 四端顺序与图标规范
- [x] 语义 token，无硬编码色阶
- [x] 按钮 hover / disabled / focus-visible
- [ ] `pnpm dev` 目视全页交互
