# 手机三端设备自动检测 + 文件管理 · 待办与实现细节

> 目标：取消渲染层轮询，三端（安卓 / 鸿蒙 / iOS）**主进程统一事件检测**，即插即现、无需手动刷新；连接后可浏览**设备存储根**与**应用包数据目录**进行文件管理。
>
> 关联设计：本目录 `2026-06-05-mobile-device-monitor.md`（阶段一计划）。

## 总体架构

```
主进程 device-monitor（统一调度 + 去重 + 失败保留上次）
  ├─ 安卓：adb host:track-devices 长连接（真事件触发器）
  ├─ 鸿蒙：主进程内自适应轮询（2.5s）
  └─ iOS ：主进程内自适应轮询（3s）
        │ 变化时 webContents.send('devices:changed', { platform, devices })
        ▼
渲染层（零 setInterval）：onDevicesChanged 订阅 → 列表即插即现 → 文件管理双入口
```

约定：
- 安卓命令统一经 `runAdb`，需 **adb 命令串行**（后续阶段加锁，减少并发超时）。
- 失败**保留上次列表**，仅首屏无历史时发一次空列表解除 loading。
- iOS 文件能力受 libimobiledevice 限制：仅 AFC（媒体目录 + 开启文件共享的 App Documents），无法浏览系统根。

---

## 阶段一：主进程统一监测 + 事件推送（移除轮询）

**状态：已实现，待 `pnpm check` / `build` 验证。**

- [x] `main/devices/adb-path.ts` 增 `ensureAdbServer()`（`adb start-server`）
- [x] `main/devices/adb-server.ts`：`createAdbTracker(onChange)`
  - 连接 `127.0.0.1:5037`，发送 `host:track-devices`
  - 状态机解析「4 位十六进制长度前缀 + 帧体」，每帧触发 `onChange`
  - `error` / `close` 后 2s 自动重连；`stop()` 释放
- [x] `main/devices/manager.ts` 增 `listDevicesOrThrow(platform)`（不吞错，区分「无设备」与「调用失败」）
- [x] `main/devices/device-monitor.ts`：`DeviceMonitor` 单例
  - 按平台维护：订阅者 `Set<WebContents>`、上次快照、机制（安卓=tracker / 鸿蒙·iOS=定时器）
  - `start(platform, wc)` / `stop(platform, wc)`；无订阅者即停机制；`wc.destroyed` 自动解绑
  - `refresh(platform, force)`：取列表→快照比对→变化才广播；失败保留上次
  - 频道常量 `DEVICES_CHANGED_CHANNEL = 'devices:changed'`
- [x] `main/ipc.ts`：`devices:startWatch` / `devices:stopWatch` handler（用 `event.sender`）
- [x] `preload/index.ts`：`startDeviceWatch` / `stopDeviceWatch` / `onDevicesChanged(cb)`（返回取消订阅）
- [x] `renderer/lib/ipc.ts`：上述三个类型化封装 + `DevicesChangedPayload`
- [x] `renderer/lib/devices/watch.ts`：重写为事件订阅，**删除 setInterval**；保留 `watchMobileDevices` / `reconcileSelectedDevice` 接口（面板零改动）
- [ ] `pnpm run check` 通过
- [ ] `pnpm run build` 通过
- [ ] 目视：插拔安卓即时上线、授权状态变化即时反映

---

## 阶段二：设备存储根浏览

**状态：未开始。**

目标：设备详情区新增「设备存储」入口，连接后直接看根目录树并管理文件。

- [ ] `main/files/device-fs.ts`：统一「设备存储根」抽象
  - 安卓：默认根 `/sdcard`（`/storage/emulated/0`）；`ls -la` 复用 `remote-fs`
  - 鸿蒙：默认根 `/storage/media/100/local/files`（按可访问性回退）
  - iOS：`afcclient` 列媒体根（DCIM 等）
- [ ] `main/files/ios-fs.ts`：基于 `afcclient.exe` 的 list/read/write/delete/mkdir
  - 解析 `afcclient ls/stat` 输出为 `FileEntry`
- [ ] `ipc.ts` / `preload` / `renderer ipc`：`files:device:*`（list/read/write/delete/mkdir）按 platform 分发
- [ ] `FileExplorer.svelte`：支持 `mode='device'`（给定根路径，从根起浏览）
- [ ] `MobileGamePanel` / `IosDevicePanel`：详情区加「设备存储 / 应用包」切换（Tabs）
- [ ] 权限受限时明确提示（如安卓 `/Android/data` 受限、iOS 仅媒体可见）
- [ ] `pnpm check` + `build` + 目视

---

## 阶段三：双入口完善 + iOS 应用 Documents

**状态：未开始（依赖补工具）。**

- [ ] `scripts/setup-libimobiledevice.mjs`：确保包含并复制 `ideviceinstaller.exe`
- [ ] iOS 应用枚举：`ideviceinstaller -l`（含可文件共享的 App）
- [ ] iOS App Documents：`afcclient --documents <bundleId>` 浏览/读写
- [ ] 安卓 `runAdb` 全局串行队列（互斥锁），降低并发超时
- [ ] 安卓可选 `run-as <pkg>`（debuggable 应用）访问私有数据
- [ ] 应用启动时 `ensureAdbServer()` 预热
- [ ] `pnpm check` + `build` + 目视

---

## 验证命令

```bash
pnpm run check     # svelte-check，0 错误
pnpm run build     # electron-vite 构建
pnpm dev           # 目视：插拔/授权即时反映、文件浏览
```

## 风险与备注

- adb 与本机其它 adb（Android Studio / scrcpy）共用 server，注意版本一致。
- 鸿蒙 `hdc track-targets` 各 DevEco 版本行为不一，故阶段一鸿蒙先用主进程轮询；后续可探测升级为事件。
- iOS 在 Windows 需 Apple Mobile Device Support（usbmuxd）。
