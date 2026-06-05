# mdtest 产品需求文档



> 版本：2026-06-06 · 状态：Phase A/B 已落地，Phase C 待接入



## 1. 产品定位



Electron 桌面端，面向**游戏 UI 测试**，统一管理 **PC / 安卓 / iOS / 鸿蒙** 四端测试设备。开发策略：**先设计 UI、验收交互，再完善功能**，避免边做边改。



目标包名（移动三端）：`com.tencent.tmgp.pubgmhd`（和平精英）



---



## 2. 设计规范



UI 遵循 **柚爱（pomelosuki）** 设计语言，详见：



- `docs/pomelosuki/project-profile.md` — 项目约束（Svelte 5 + shadcn-svelte + Tailwind 4）

- `docs/pomelosuki/ui-v2-design-notes.md` — 布局与 token 说明

- `.cursor/skills/pomelosuki/references/design-principles.md` — 通用设计原则



要点摘要：



- **基调**：Dark & Premium 开发者工具风，cyan/primary 单一强调

- **颜色**：全走语义 token（`bg-background`、`bg-card`、`border-border`、`text-online` 等），禁止硬编码色阶

- **图标**：`@lucide/svelte`，统一 `size-4` / `size-5`，**禁止 emoji 作图标**

- **四端顺序与图标**：**PC → 安卓 → iOS → 鸿蒙**；手机三端统一 **Smartphone**，仅 PC 使用 **Monitor**



---



## 3. 窗口与导航层



参考 `D:\code\tauri-app` 导航结构，Electron 侧实现方式：



| 能力 | 实现 |

|------|------|

| 隐藏系统标题栏 | 主进程 `BrowserWindow({ frame: false })` |

| 自绘标题栏 | `Titlebar.svelte` + `-webkit-app-region: drag` |

| 窗口控制 | IPC：`windowMinimize` / `windowToggleMaximize` / `windowClose` |



### 3.1 左侧主导航（icon-only）



- 宽度约 `w-14`，**仅显示图标**，鼠标悬停 tooltip 显示名称

- 顶部额外功能区：**TeamSwitcher**（复刻 tauri，暂不接业务）

- 底部额外功能区：**NavUser**（复刻 tauri，暂不接业务）

- 三个导航项：



| 页面 | 说明 |

|------|------|

| **主页** | 简洁展示各功能入口，点击跳转 |

| **设备管理** | 四端设备接入、投屏、文件、用例 |

| **设置** | 应用内配置（主题、工具链、扫描路径等） |



视图路由：`lib/stores/view.svelte.ts`（状态切换，非 SvelteKit）。离开设备管理页时卸载视图并 **cleanup 设备订阅**，避免 IPC 泄漏。



---



## 4. 设备管理页布局



三栏结构（左 · 中 · 右）：



```

┌─────────────┬────────────────────────────┬──────────────┐

│ 四端入口      │ [投屏] [文件管理]             │  日志/用例进度  │

│ PC/安卓/iOS/鸿蒙│                            │              │

├─────────────┤      投屏大区域（占位）          ├──────────────┤

│ 设备列表       │                            │  AI 助手      │

│ ●在线 ○离线   ├────────────────────────────┤              │

│ [刷新][+目录]PC│ 截屏/录屏/用例 · [启动游戏▾]  │              │

└─────────────┴────────────────────────────┴──────────────┘

```



### 4.1 左侧 · 设备区



- 顶部：**四端入口**（顺序 PC → 安卓 → iOS → 鸿蒙）

- 下方：**当前选中端的设备列表**

- **设备缓存**：移动三端连接后自动展示并持久化；离线设备保留在列表中置灰

- **状态标识**：小圆点 — 已连接绿色、未连接置灰离线

- **PC 专属**（底部两按钮）：

  - **刷新扫描**：触发全盘 PowerShell 搜索 `ShadowTrackerExtra`（用户主动，可能耗时数分钟）

  - **添加目录**：手动选择游戏目录



设备行：整行可选中；hover 显示「打开文件夹」（PC）与「从列表移除」。**禁止 button 嵌套**，操作按钮独立。



### 4.2 中间 · 投屏控制区



- 顶部标签：**投屏**（默认）、**文件管理**

- 中间：投屏大区域（Phase A 占位，后续 scrcpy / WDA 等）

- 底部功能区：

  - 左侧：截屏、录屏、执行用例等快捷操作（占位）

  - 右侧：**启动游戏** + 上拉菜单选择具体应用（配置后续接入）



### 4.3 右侧 · 辅助区



- **右上**：日志 / 用例执行进度（统一日志形式展示用例结果）

- **右下**：AI 对话（待接入）



---



## 5. 四端设备接入



渲染层 **不轮询**；主进程 `device-monitor` 统一监测，经 IPC 事件 `devices:changed` 推送到 UI。



| 端 | 监测方式 | 列表数据来源 | 说明 |

|----|----------|--------------|------|

| **PC** | 无定时轮询 | 缓存 + 手动路径（秒开） | 全盘扫描仅用户点「刷新扫描」；`listDevices` 不阻塞主进程 |

| **安卓** | `adb host:track-devices` 长连接 | 实时 CLI + 失败保留上次列表 | 工具链 `resources/device-toolchains/android/` |

| **iOS** | 3s 轮询 | 实时 CLI + 缓存合并 | `resources/device-toolchains/ios/`；需 Apple Mobile Device Support |

| **鸿蒙** | 2.5s 轮询 | 实时 CLI + 缓存合并 | `resources/device-toolchains/harmony/`；过滤 UART/COM 串口 |



移动三端设备缓存文件：`userData/device-registry.json`。



PC 扫描缓存：`userData/pc-game-scan-cache.json`。



工具链目录规范见 `resources/README.md`。



### 5.1 主进程日志（开发阶段）



结构化前缀，便于终端过滤：



- `[devices]` — 订阅 start/stop、refresh 结果

- `[game_scanner]` — PC 全盘扫描进度



---



## 6. 后续能力（未实现 / 规划中）



| 能力 | 优先级 | 备注 |

|------|--------|------|

| 投屏（scrcpy / WDA） | P1 | Phase C |

| iOS 文件管理（afcclient） | P1 | 见 superpowers 计划 |

| 启动游戏 + 应用选择 | P1 | 底部启动区 |

| 用例执行 + 日志面板联动 | P2 | 右上日志区 |

| AI 助手 | P3 | 右下占位 |

| PC 扫描后台静默刷新 | P3 | 参考 tauri `loadCacheThenScan`，当前仅手动 |



---



## 7. 交付阶段



### Phase A — 导航与 UI 骨架 ✅



- [x] 无边框窗口 + 自绘标题栏

- [x] icon 侧栏 + 主页 / 设备管理 / 设置

- [x] 设备管理三栏占位 + 四端顺序与图标规范

- [x] 设置页主题切换



### Phase B — 设备列表真实数据 ✅



- [x] 四端 `device-monitor` 事件推送（渲染层 `onMount` 订阅 + cleanup）

- [x] 移动三端设备缓存（`device-registry.json`）+ 离线态

- [x] PC 缓存快路径 + 手动「刷新扫描」+ 手动添加目录

- [x] 设备状态圆点 + 从列表删除 + PC 打开文件夹

- [x] 修复 WebContents `MaxListenersExceededWarning`（单 wc 单次 destroyed 监听）

- [x] 修复 `$effect` 重复订阅死循环（改用 `onMount`）



### Phase C — 投屏 / 文件 / 用例



- [ ] 投屏、文件管理、启动游戏、日志、AI



---



## 8. 验收命令



```bash

pnpm dev      # 目视交互

pnpm check    # 类型检查

pnpm build    # 构建

```



### 8.1 Phase B 验收要点



1. 启动后终端无 `MaxListenersExceededWarning`，无反复 `start/stop watch` 日志

2. 设备管理页：四端 Tab 可切换、设备行可点击选中

3. PC Tab：秒开缓存列表；「刷新扫描」才启动全盘搜索

4. 主页 ↔ 设备管理切换多次，IPC 订阅不累积（日志中 watch 次数稳定）

5. 安卓插拔设备后列表自动更新（需 adb 与真机）



---



## 9. 已知限制



- PC 全盘扫描按盘符串行 PowerShell，单次最长约 120s/盘符，扫描期间主进程负载较高

- iOS 工具链未内置时，轮询会失败并保留空列表（需手动放入 `resources/device-toolchains/ios/`）

- 旧版 `Sidebar.svelte` / `DeviceView.svelte` 仍存在，已被新壳替代，后续可清理


