# AGENTS.md

## Cursor Cloud specific instructions

### 产品概览

**mdtest** 是单体 Electron 桌面应用（多端测试工具），无独立后端、数据库或 Docker。开发时只需 Node.js + pnpm；`pnpm dev` 会同时启动 electron-vite 主进程、preload 与 Svelte 渲染层 HMR。

### Linux 环境注意事项（重要）

`postinstall` 中的 `scripts/fix-electron-install.cjs` 仅检测 Windows 的 `electron.exe`，在 Linux 上 `pnpm install` 会因尝试调用 `powershell.exe` 而失败。

**推荐安装方式：**

```bash
pnpm install --ignore-scripts
node node_modules/electron/install.js
```

若 `pnpm run <script>` 因依赖状态检查再次触发失败的 postinstall，可直接调用二进制：

```bash
./node_modules/.bin/svelte-check --tsconfig ./tsconfig.json
./node_modules/.bin/electron-vite build
./node_modules/.bin/electron-vite dev
```

### 常用命令

| 命令 | 用途 |
|------|------|
| `pnpm install --ignore-scripts && node node_modules/electron/install.js` | 安装依赖（Linux） |
| `pnpm dev` / `./node_modules/.bin/electron-vite dev` | 开发模式（Electron + Vite HMR） |
| `pnpm run check` | Svelte/TS 类型检查 |
| `pnpm run build` | 编译到 `out/` |
| `pnpm dist` | 构建 + Windows NSIS 安装包 |

### 平台工具链（可选，设备 E2E）

- **Android adb**：`resources/platform-tools/`（Windows 由 postinstall 自动下载；Linux 需手动放置）
- **Harmony hdc**：`pnpm run setup:hdc`（需本机 DevEco SDK）
- **iOS libimobiledevice**：`pnpm run setup:libimobiledevice`（Windows 下载脚本）

在 Linux Cloud VM 上可正常做 UI 开发、类型检查与构建；真实设备接入（ADB/HDC/iOS）与 Windows 窗口枚举需在对应宿主环境测试。

### 验证标准

完成代码改动后运行：

```bash
pnpm run check   # 或 ./node_modules/.bin/svelte-check --tsconfig ./tsconfig.json
pnpm run build   # 或 ./node_modules/.bin/electron-vite build
```

UI 大改时额外 `pnpm dev` 并在桌面环境目视确认。

### Superpowers 流程

功能开发与 bugfix 遵循 `.cursor/rules/superpowers-workflow.mdc`；UI 任务参考 `.cursor/skills/pomelosuki/SKILL.md`。
