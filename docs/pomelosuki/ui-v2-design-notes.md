# UI v2（柚爱 / Tailwind）

## 方向

- **Tone**：Dark & Premium 开发者工具（非紫渐变 SaaS）
- **记忆点**：cyan 强调 + 清晰三栏信息密度 + lucide 线性图标
- **Differentiation**：左侧平台导航带就绪绿点；面板半透明分层 `bg-panel/80`

## Token（`app.css` @theme）

| Token | 用途 |
|-------|------|
| `surface` | 页面底 `#09090b` |
| `panel` / `elevated` | 卡片与侧栏 |
| `border` | 分隔线 |
| `accent` / cyan-600 | 主按钮与选中态 |
| `online` / `warn` | 设备状态 |

## 布局

- 侧栏 224px（`w-56`）
- PC：游戏列表 260–300px + 详情
- 移动：设备 | 包 | 文件 三栏（xl 断点）

## 检查清单（摘录）

- [x] 无 emoji 图标
- [x] lucide 统一尺寸
- [x] 选中态 border + bg cyan/10
- [x] 按钮 hover / disabled
- [ ] 浏览器下 `pnpm dev` 目视（用户本地）
