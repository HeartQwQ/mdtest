# 实现计划：手机三端设备自动检测（阶段一）

## 目标

取消渲染层 `setInterval` 轮询，改为**主进程统一设备监测 + IPC 事件推送**，渲染层零轮询、即插即现。安卓使用 adb `host:track-devices` 真事件长连接；鸿蒙 / iOS 在主进程内自适应监测。

## 架构

- adb server `127.0.0.1:5037` 长连接（`host:track-devices`）作为「变化触发器」
- 收到变化后由现有适配器 `listDevices` 取详情，去重后通过 `webContents.send('devices:changed')` 推送
- 失败保留上次列表（解决闪断）；首屏失败且无历史时发一次空列表以解除 loading

## 任务（阶段一）

1. `main/devices/adb-server.ts`
   - `createAdbTracker(onChange)`：连接 adb server，发送 `host:track-devices`，解析长度前缀帧，每帧触发 onChange；断线 2s 自动重连；`stop()`
   - `adb-path.ts` 增 `ensureAdbServer()`（`adb start-server`）
2. `main/devices/manager.ts`
   - 增 `listDevicesOrThrow(platform)`：不吞错（用于监测区分「无设备」与「调用失败」）
3. `main/devices/device-monitor.ts`
   - 按平台维护订阅者 `WebContents`、上次快照、机制（安卓=tracker，鸿蒙/iOS=主进程定时器）
   - `start(platform, wc)` / `stop(platform, wc)`；无订阅者时停机制
   - `refresh(platform, force)`：取列表→快照比对→变化才广播；失败保留上次
4. `ipc.ts` / `preload`
   - `devices:startWatch` / `devices:stopWatch` handler
   - preload：`startDeviceWatch` / `stopDeviceWatch` / `onDevicesChanged(cb)`（返回取消订阅）
5. `renderer/lib/devices/watch.ts`
   - 重写为订阅 `onDevicesChanged`，移除 `setInterval`；保留 `reconcileSelectedDevice`、`watchMobileDevices` 接口不变（面板无需改动）

## 验证

- `pnpm run check`（svelte-check 0 错误）
- `pnpm run build`（electron-vite 构建通过）

## 后续阶段（暂不实现）

- 阶段二：设备存储根浏览（安卓/鸿蒙 `/sdcard`；iOS 媒体根 via `afcclient`）
- 阶段三：双入口完善 + iOS App Documents（需补 `ideviceinstaller`）
