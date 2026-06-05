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

### 设备管理页三栏

| 区域 | 宽度 | 内容 |
|------|------|------|
| 左 · 设备区 | `w-64` | 四端入口 + 设备列表 + PC「添加目录」 |
| 中 · 控制区 | `flex-1` | 投屏/文件标签 + 主区域 + 底部工具栏 |
| 右 · 辅助区 | `w-72` | 日志/用例进度 + AI 助手 |

## 检查清单（摘录）

- [x] 无 emoji 图标
- [x] lucide 统一尺寸
- [x] 四端顺序与图标规范
- [x] 语义 token，无硬编码色阶
- [x] 按钮 hover / disabled / focus-visible
- [ ] `pnpm dev` 目视全页交互
