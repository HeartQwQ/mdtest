# mdtest — 多端测试工具

Electron 桌面端，面向**游戏 UI 测试**，统一管理 **PC / 安卓 / iOS / 鸿蒙** 四端测试设备。

> 完整产品需求见 [`docs/requirements.md`](docs/requirements.md)

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面框架 | Electron + electron-vite（无边框 + 自绘标题栏） |
| 前端 | Svelte 5（Runes）+ TypeScript + shadcn-svelte + Tailwind CSS 4 |
| 设备接入 | 主进程调用外部 CLI（adb / hdc / libimobiledevice / PowerShell），无原生模块编译 |
| UI 规范 | 柚爱 pomelosuki（见 `docs/pomelosuki/`） |

## 目录结构

```
src/
├── main/                       Electron 主进程
│   ├── index.ts                应用入口（frame: false）
│   ├── ipc.ts                  IPC（设备 / 游戏 / 文件 / 窗口控制）
│   ├── devices/                设备接入层（adb / hdc / idevice / harmony）
│   └── games/                  PC 游戏目录扫描与启动
├── preload/                    contextBridge
└── renderer/src/
    ├── App.svelte              壳：Titlebar + AppSidebar + 视图
    ├── lib/
    │   ├── components/
    │   │   ├── nav/            主导航（TeamSwitcher / AppSidebar / NavUser）
    │   │   └── Titlebar.svelte 自绘窗口栏
    │   ├── views/              主页 / 设备管理 / 设置
    │   ├── stores/             view 路由、theme
    │   └── nav/nav-data.ts     导航配置
resources/
└── device-toolchains/          内置 adb / hdc / libimobiledevice
    ├── android/
    ├── harmony/
    └── ios/
docs/
├── requirements.md             产品需求文档
└── pomelosuki/                 UI 设计约束与主题
```

## 安装与运行

> Node.js 18+，推荐 pnpm。

```bash
pnpm install
pnpm dev          # 开发模式
pnpm check        # svelte-check
pnpm build        # 编译到 out/
pnpm dist         # Windows 安装包到 dist/
```

## 界面概览

- **左侧 icon 导航**：主页 · 设备管理 · 设置（悬停显示名称）
- **设备管理页**：左设备列表 · 中投屏/文件 · 右日志/AI
- **四端顺序**：PC → 安卓 → iOS → 鸿蒙（手机三端统一手机图标，PC 为显示器图标）

## 内置工具链

| 平台 | 路径 | 说明 |
|------|------|------|
| 安卓 | `resources/device-toolchains/android/adb.exe` | Google platform-tools |
| 鸿蒙 | `resources/device-toolchains/harmony/hdc.exe` | DevEco toolchains |
| iOS | `resources/device-toolchains/ios/idevice_id.exe` | libimobiledevice-windows；另需 Apple Mobile Device Support |
| PC | — | 扫描 `ShadowTrackerExtra` 目录，无外部 CLI |

详见 [`resources/README.md`](resources/README.md)。

## 架构约定

- **设备适配器**：每端实现 `DeviceAdapter`（`isAvailable` / `listDevices`），`manager.ts` 按平台分发
- **设备监测**：主进程 `device-monitor` 经 `devices:changed` 推送；渲染层 `onMount` 订阅并在卸载时 cleanup
- **PC 列表**：`listPcGameInstances()` 读缓存/手动路径；全盘扫描走 `games:pc:scan`（用户触发）
- **工具链随仓库提交**：无 postinstall 下载脚本
- **主进程能力、渲染层 UI**：通过 `window.api` IPC，renderer 不直接访问 Node

## 路线图

- [x] UI 导航壳（无边框窗口、三页、设备管理三栏）
- [x] 四端设备列表 + 缓存/离线/删除 + PC 添加目录
- [x] 安卓 / iOS / 鸿蒙设备自动监测
- [ ] 投屏 / 文件管理 / 启动游戏 / 用例日志
- [ ] iOS 文件（AFC）、安卓 scrcpy
