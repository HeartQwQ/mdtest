# mdtest — 多端测试工具

Electron 桌面端，统一管理 **Windows / 安卓 / iOS / 鸿蒙** 四端测试设备。第一版聚焦**设备接入**：安卓（ADB）与 Windows（目标窗口）已打通，iOS / 鸿蒙在后端预留适配器。

## 技术栈

| 层 | 选型 |
|----|------|
| 桌面框架 | Electron + electron-vite |
| 前端 | Svelte 5（Runes）+ TypeScript |
| 设备接入 | 主进程调用外部 CLI（adb / PowerShell …），不依赖原生模块，免 MSVC 编译 |

## 目录结构

```
src/
├── main/                  Electron 主进程
│   ├── index.ts           应用入口 / 窗口
│   ├── ipc.ts             IPC 注册中心
│   └── devices/           设备接入层
│       ├── types.ts       统一设备类型与适配器接口
│       ├── manager.ts     设备管理器（按平台分发）
│       ├── android.ts     安卓适配器（adb）— 已实现
│       ├── windows.ts     Windows 适配器（PowerShell）— 已实现
│       ├── ios.ts         iOS 适配器 — 预留
│       └── harmony.ts     鸿蒙适配器 — 预留
├── preload/               contextBridge 安全桥接
└── renderer/              Svelte 5 渲染层
    └── src/
        ├── App.svelte
        └── lib/
            ├── ipc.ts                   类型化 IPC 封装
            └── components/
                ├── Sidebar.svelte       四端导航 + 工具链就绪指示
                └── DeviceView.svelte    设备列表 + 详情
```

## 安装与运行

> 需要 Node.js 18+。推荐 pnpm（亦可用 npm）。

```bash
pnpm install
pnpm dev          # 开发模式，热更新
```

打包：

```bash
pnpm build        # 编译到 out/
pnpm dist         # 生成 Windows 安装包到 dist/
```

类型检查：

```bash
pnpm check
```

## 前置依赖（设备接入）

| 平台 | 依赖 | 说明 |
|------|------|------|
| 安卓 | **内置 adb** | `resources/platform-tools/adb.exe` |
| Windows | 无 | 使用系统自带 PowerShell |
| iOS | libimobiledevice | 后续接入 |
| 鸿蒙 | **内置 hdc** | `resources/hdc-toolchains/toolchains/hdc.exe` |

## 架构约定

- **设备接入层适配器化**：每端实现统一的 `DeviceAdapter` 接口（`isAvailable` / `listDevices`），`manager.ts` 按平台分发。
- **内置工具固定路径**：`resources/platform-tools/adb.exe`、`resources/hdc-toolchains/toolchains/hdc.exe`。
- **主进程做系统能力，渲染层只做 UI**：renderer 通过 `window.api` 调用，不直接接触 Node API。

## 路线图

- [x] 框架搭建（Electron + Svelte 5 + TS）
- [x] 安卓设备列表（adb devices）
- [x] Windows 目标窗口列表（PowerShell）
- [ ] 安卓包信息 / 安装 APK / 日志
- [ ] Windows 窗口截图（Win32 / windows-capture）
- [ ] scrcpy 投屏与操控
- [ ] iOS（libimobiledevice）
- [ ] 鸿蒙（HDC）
