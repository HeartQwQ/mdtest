# mdtest 产品需求文档

> 版本：2026-06-07 · 状态：目标重拟，进入 Android-first 环境管理 MVP

## 1. 产品定位

mdtest 是面向《和平精英》测试团队的桌面工具，目标是长期沉淀为 **四端测试环境管理与 AI 自动化测试平台**。

当前阶段只聚焦《和平精英》，不做多游戏平台。第一阶段只打通 **Android 端测试环境管理闭环**，但设备、文件、环境模板、用例和执行接口都按 **PC / Android / iOS / Harmony** 四端预留，避免后续扩展时大改。

核心策略：

- **工具先行**：先做好稳定可控的环境搭建、文件管理、日志拉取和操作记录。
- **AI 后置增强**：AI 先辅助分析、生成和总结，后续再进入受控执行。
- **人工可验收**：涉及环境修改、文件覆盖、删除、批量同步等高风险操作时，人类始终有确认、回放和恢复入口。

当前游戏目标：

| 项 | 值 |
|----|----|
| 游戏 | 和平精英 |
| Android 包名 | `com.tencent.tmgp.pubgmhd` |
| 第一阶段平台 | Android |
| 后续预留平台 | PC / iOS / Harmony |

## 2. 目标用户与核心场景

目标用户是游戏测试工程师、专项测试负责人、自动化测试建设者，以及需要跨组了解测试知识的同学。

第一阶段核心场景：

1. 测试工程师连接 Android 设备后，工具自动识别设备和《和平精英》安装状态。
2. 测试工程师打开 Android 投屏/画面控制区，确认游戏与设备当前状态。
3. 测试工程师进入 Android 内部存储或和平精英常用目录，浏览、上传、下载、编辑、备份和恢复文件。
4. 测试工程师将一组配置、资源或缓存清理动作保存为环境模板，并复用到后续测试环境搭建中。
5. 测试工程师拉取日志、截图、崩溃文件或关键目录，作为问题定位和验收证据。
6. 工具记录所有关键文件操作和设备控制操作，便于回溯、复盘和降低误操作风险。

长期场景：

1. AI 根据需求说明和游戏知识库，生成测试点和测试用例草稿。
2. 测试工程师审核、修改、批准用例，使其沉淀为长期可维护的用例库。
3. AI 基于受控工具执行用例，使用截图、OCR、图像识别和日志判断结果。
4. 测试工程师在控制台中观察执行过程、接管设备、验收结果并输出报告。

## 3. 产品路线

### Phase A/B — 当前基础能力 ✅

已有基础：

- Electron 无边框窗口与自绘标题栏
- Svelte 5 渲染层与三页壳：主页、设备管理、设置
- PC / Android / iOS / Harmony 设备入口
- Android `adb` 设备识别
- PC 游戏目录缓存与手动添加
- 移动设备缓存与离线态
- 主进程 `devices` / `files` / `games` 业务域
- `preload + contextBridge + IPC` 安全边界
- 初步文件管理能力
- Android 截图与点击映射雏形

### Phase C — Android 环境管理 MVP

第一阶段新目标。只要求 Android 端闭环完整，其他端只保留入口、接口和能力标记。

目标链路：

```text
连接 Android 设备
-> 识别和平精英安装状态
-> 打开 Android 投屏 / 画面控制
-> 进入常用路径
-> 浏览 / 上传 / 下载 / 编辑 / 删除 / 重命名文件
-> 备份关键路径
-> 应用环境模板
-> 拉取日志与证据
-> 记录操作
-> 人工确认环境搭建完成
```

### Phase D — 游戏知识库与用例库

目标是沉淀团队资产。

- 和平精英功能模块知识
- 测试术语、路径、日志、配置说明
- 常见问题、历史缺陷和规避经验
- 需求转测试点
- AI 生成用例草稿
- 人工审核后进入正式用例库
- 用例版本、标签、平台覆盖、执行记录

### Phase E — AI 辅助分析

AI 不直接接管设备，先做辅助能力。

- 配置文件解释
- 日志分析
- 失败原因总结
- 用例补全
- 风险提示
- 基于知识库的问答

### Phase F — AI 自动执行控制台

在工具层稳定、知识库和用例库有积累后，再实现 AI 执行。

- AI 调用受控设备工具
- 截图、OCR、图像识别、日志分析
- 设备控制：启动、点击、滑动、输入、等待、断言
- 执行状态机
- 暂停、继续、重试、接管
- 证据链和人工验收

## 4. 第一阶段 MVP 范围

### 4.1 Android 设备与游戏识别

能力：

- 使用内置 `adb` 识别 Android 设备。
- 展示设备状态：在线、离线、未授权。
- 自动检测目标包名 `com.tencent.tmgp.pubgmhd` 是否安装。
- 展示安装状态、应用版本、包路径等可获取信息。
- 设备离线后保留缓存记录，但禁用文件写入和模板应用操作。

验收：

- 插入 Android 设备后，设备列表自动更新。
- 未授权设备给出明确提示。
- 未安装和平精英时，环境管理入口显示不可用原因。

### 4.2 和平精英常用路径

Android 文件工作台默认进入设备内部存储根，而不是 Linux 系统根目录。对测试同学而言，这个根目录应等价于 Windows 资源管理器 MTP 视图里的“设备 / 内部存储”；底层 ADB 路径优先使用 `/storage/emulated/0`，必要时才 fallback 到 `/sdcard` 或 `/`。

面包屑展示不照搬 Windows 的“此电脑”，应使用当前工具语义，例如：

```text
HONOR 80 GT / 内部存储 / Android / data / com.tencent.tmgp.pubgmhd
```

工具内置 Android 端常用路径入口。路径应是可维护配置，初始路径不存在时不报致命错误，而是显示“未找到 / 无权限 / 待确认”。

初始候选路径：

| 名称 | 路径 |
|------|------|
| 内部存储根 | `/storage/emulated/0` |
| 应用数据目录 | `/storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd` |
| OBB 目录 | `/storage/emulated/0/Android/obb/com.tencent.tmgp.pubgmhd` |
| UE4 保存目录 | `/storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd/files/UE4Game` |
| Saved 目录 | `/storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd/files/UE4Game/ShadowTrackerExtra/ShadowTrackerExtra/Saved` |
| 日志目录 | `/storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd/files/UE4Game/ShadowTrackerExtra/ShadowTrackerExtra/Saved/Logs` |
| 配置目录 | `/storage/emulated/0/Android/data/com.tencent.tmgp.pubgmhd/files/UE4Game/ShadowTrackerExtra/ShadowTrackerExtra/Saved/Config` |

验收：

- 用户可以从快捷入口进入目录。
- Android 文件管理默认进入内部存储根，列表内容应与 Windows MTP 的“内部存储”视图一致。
- 面包屑从设备名和“内部存储”开始展示，不额外添加“此电脑”这类外部文件管理器概念。
- 目录不存在、权限不足或 adb 返回异常时，UI 显示明确状态。
- 后续可以新增、禁用或调整内置路径，不影响文件工作台。

### 4.3 文件工作台

文件工作台是第一阶段核心能力。实现时优先评估成熟开源文件管理、虚拟列表、表格、拖拽、状态管理和命令面板能力；自研只用于和平精英路径体验、设备适配、安全边界、操作记录和无法由开源方案满足的交互细节。业务逻辑不能绑定到某个第三方组件，避免后续替换成本过高。

基础操作：

- 浏览目录
- 返回上级、回到快捷入口
- 上传本地文件到设备
- 下载设备文件到本地
- 新建文件夹
- 新建文本文件
- 重命名
- 删除
- 文本文件预览
- 文本文件编辑与保存
- 多选
- 刷新

高风险操作要求：

- 删除、覆盖、批量操作必须二次确认。
- 覆盖关键目录或文件前应提示备份。
- 执行失败必须展示原始错误摘要。
- 操作后刷新目录并记录操作日志。

验收：

- 能在 Android 设备上完成常见文件操作。
- UI 不因大目录一次性渲染而明显卡顿。
- 文件操作失败时，用户知道失败原因和下一步建议。

### 4.4 环境模板

环境模板用于保存可复用的测试环境搭建动作。

模板可以包含：

- 上传文件到指定路径
- 覆盖配置文件
- 创建目录
- 删除缓存目录
- 拉取指定日志目录
- 执行前备份指定文件或目录

模板字段：

| 字段 | 说明 |
|------|------|
| 名称 | 例如“Android 登录测试环境” |
| 描述 | 说明适用场景 |
| 平台 | 第一阶段固定 Android，结构预留四端 |
| 目标游戏 | 第一阶段固定和平精英 |
| 步骤 | 文件操作步骤列表 |
| 风险等级 | 普通 / 高风险 |
| 最近执行结果 | 成功 / 失败 / 部分成功 |

验收：

- 用户可以创建、编辑、删除模板。
- 用户可以预览模板会执行哪些文件操作。
- 应用模板前必须展示影响范围并等待确认。
- 应用结果进入操作记录。

### 4.5 备份与恢复

备份恢复用于降低文件覆盖和删除风险。

能力：

- 手动备份文件或目录。
- 模板应用前可自动备份。
- 查看备份记录。
- 从备份恢复到原路径。
- 备份记录包含设备、路径、时间、来源操作。

验收：

- 覆盖关键文件前能生成备份。
- 恢复失败时保留错误信息。
- 备份记录可追溯到具体设备和路径。

### 4.6 日志与证据拉取

能力：

- 一键拉取和平精英日志目录。
- 支持拉取用户选择的文件或目录。
- 保存到本地工作区。
- 记录拉取时间、设备、路径和保存位置。
- 后续可作为 AI 日志分析输入。

验收：

- 用户能从快捷入口拉取日志。
- 拉取失败时展示 adb 错误摘要。
- 拉取成功后可在本地打开目录。

### 4.7 操作记录

所有关键动作进入操作记录。

记录字段：

| 字段 | 说明 |
|------|------|
| 时间 | 操作发生时间 |
| 平台 | Android / PC / iOS / Harmony |
| 设备 | 设备 ID 和名称 |
| 操作 | 上传 / 下载 / 删除 / 重命名 / 备份 / 恢复 / 应用模板 |
| 路径 | 源路径和目标路径 |
| 结果 | 成功 / 失败 / 部分成功 |
| 错误摘要 | 失败时记录 |
| 关联模板 | 如果由模板触发 |

验收：

- 操作完成后能在记录中查看。
- 失败操作也会记录。
- 用户可以按设备、操作类型和时间筛选。

### 4.8 Android 投屏与基础操控

投屏不能从产品核心能力中删除。第一阶段先做 Android 端画面查看与基础控制闭环，后续再按同一控制台抽象扩展到 PC / iOS / Harmony。

MVP 实现口径：

- 允许先用 `adb screencap` 截图刷新 + 坐标映射打通可验收流程。
- 后续可升级为 `scrcpy` 实时低延迟投屏，但上层 UI 和控制接口不能依赖某个具体投屏实现。
- 投屏区必须和文件工作台并列成为环境管理页核心区域，不能退化成隐藏能力。

基础能力：

- 查看当前 Android 画面。
- 刷新画面。
- 点击画面并映射为设备坐标。
- 执行返回、Home 等基础按键。
- 保存当前画面为证据截图。
- 设备断开、未授权、截图失败时展示明确状态。

后续增强：

- 滑动、长按、文本输入。
- 实时投屏。
- 录屏。
- OCR / 图像识别辅助定位。

验收：

- 在线 Android 设备能打开画面区域并看到当前截图。
- 用户点击画面后，设备侧能收到对应点击。
- 用户能保存证据截图到本地工作区。
- 设备断开后，投屏区显示离线状态并禁用控制操作。

## 5. 四端预留原则

第一阶段只实现 Android，但不能写成 Android-only 架构。

### 5.1 平台抽象

统一平台枚举：

```ts
type Platform = 'pc' | 'android' | 'ios' | 'harmony'
```

统一能力声明：

```ts
interface PlatformCapabilities {
  deviceList: boolean
  gameDetect: boolean
  fileBrowse: boolean
  fileWrite: boolean
  backupRestore: boolean
  logPull: boolean
  appLaunch: boolean
  screenMirror: boolean
  screenCapture: boolean
  screenControl: boolean
  inputControl: boolean
}
```

统一环境适配器：

```ts
interface GameEnvironmentAdapter {
  platform: Platform
  capabilities: PlatformCapabilities
  listDevices(): Promise<DeviceInfo[]>
  detectGame(deviceId: string): Promise<GameInstallState>
  listKnownPaths(deviceId: string): Promise<KnownPath[]>
  listFiles(target: FileTarget): Promise<FileEntry[]>
  readFile(target: FileTarget): Promise<FileContent>
  writeFile(target: FileTarget, content: FileContent): Promise<void>
  deleteFile(target: FileTarget): Promise<void>
  backupPath(target: FileTarget): Promise<BackupRecord>
  restoreBackup(recordId: string): Promise<void>
  pullLogs(deviceId: string): Promise<LogBundle>
}
```

### 5.2 UI 预留

四端入口继续保留，但第一阶段状态为：

| 平台 | 状态 |
|------|------|
| PC | 待接入环境管理 |
| Android | 可用 |
| iOS | 待接入环境管理 |
| Harmony | 待接入环境管理 |

非 Android 平台不展示半成品功能，只展示后续接入说明和已有设备状态。

## 6. 游戏知识库规划

知识库不是第一阶段 MVP，但需求结构需要预留。

目标：

- 帮助 AI 理解和平精英。
- 帮助不同测试小组跨组了解彼此负责内容。
- 统一术语、路径、配置、流程和常见问题，减少低级错误。

内容类型：

- 功能模块说明
- 测试术语
- 常见测试流程
- 常用目录与配置说明
- 日志字段说明
- 典型页面截图
- 历史缺陷与经验
- 小组负责范围

后续能力：

- 标签和模块分类
- 全文搜索
- 与用例关联
- 与失败记录关联
- 供 AI 检索生成回答和用例

## 7. 需求转用例与用例库规划

目标是形成可长期维护的和平精英测试用例库。

流程：

```text
输入需求 / 变更说明
-> AI 分析需求
-> AI 生成测试点和用例草稿
-> 人工审核
-> 修改、批准、入库
-> 后续执行与结果回写
```

用例字段规划：

| 字段 | 说明 |
|------|------|
| 用例标题 | 简洁描述 |
| 需求来源 | 关联需求或变更 |
| 模块 | 游戏功能模块 |
| 平台覆盖 | PC / Android / iOS / Harmony |
| 前置环境 | 依赖配置、账号、网络、包版本 |
| 步骤 | 人工或自动化执行步骤 |
| 断言 | 通过标准 |
| 风险点 | 可能误判或易失败点 |
| 自动化能力 | 可自动化 / 半自动 / 人工 |
| 审核状态 | 草稿 / 待审核 / 已批准 / 废弃 |
| 历史结果 | 执行记录与证据 |

## 8. AI 执行控制台规划

AI 执行控制台是后期目标，不进入第一阶段 MVP。

原则：

- AI 不能直接拥有系统能力，只能调用受控工具。
- 高风险操作必须可配置人工确认。
- 所有工具调用必须记录。
- 每次失败必须保存证据链。

受控工具示例：

- `listDevices`
- `selectDevice`
- `detectGame`
- `startScreenMirror`
- `stopScreenMirror`
- `captureScreen`
- `saveEvidenceFrame`
- `tap`
- `swipe`
- `inputText`
- `launchApp`
- `listFiles`
- `readFile`
- `writeFile`
- `pullLogs`
- `ocr`
- `findImage`
- `assertVisible`
- `waitForScreen`

执行链路：

```text
用例
-> 执行计划
-> 工具调用
-> 截图 / OCR / 图像识别 / 日志
-> 判断结果
-> 保存证据
-> 人工验收
```

## 9. 设计规范

UI 继续遵循 **柚爱（pomelosuki）** 设计语言，详见：

- `docs/design/pomelosuki/project-profile.md`
- `docs/design/pomelosuki/ui-v2-design-notes.md`
- `docs/design/pomelosuki/themes.md`

要点：

- Dark & Premium 开发者工具风。
- 使用语义 token：`bg-background`、`bg-card`、`border-border`、`text-muted-foreground` 等。
- 图标使用 `@lucide/svelte`，禁止 emoji 作图标。
- 四端顺序保持 **PC -> Android -> iOS -> Harmony**。
- 高密度工具界面优先，不做营销式布局。

## 10. 技术架构原则

当前技术栈保持不变：

| 层 | 选型 |
|----|------|
| 桌面端 | Electron + electron-vite |
| 前端 | Svelte 5 + TypeScript |
| 样式 | Tailwind CSS 4 |
| UI 原语 | shadcn-svelte + bits-ui |
| 图标 | `@lucide/svelte` |
| 包管理 | pnpm |

架构原则：

- 渲染层不直接访问 Node.js、adb、hdc、idevice。
- 系统能力放在 Electron 主进程。
- 通过 `preload + contextBridge + IPC` 暴露受控 API。
- 复杂能力优先采用成熟开源框架；只有在许可证、性能、交互、集成边界或维护状态不满足时才自研核心能力。
- 文件工作台优先复用成熟开源基础设施，项目自研业务适配层、安全边界、操作记录和和平精英专属体验。
- 后续可引入 `@tanstack/svelte-query` 管理目录加载、缓存、刷新和错误状态。
- 后续可引入 `@tanstack/svelte-virtual` 处理大目录虚拟滚动。
- AI 能力独立为 `ai` / `vision` / `automation` 模块，不能污染文件管理核心链路。
- AI VibeCoding 开发治理、Skill（技能）、MCP、文档源和验证策略统一见 `Agent/rules/AGENTS.md` 与 `Agent/mcp/registry.md`。

## 11. 非目标

第一阶段明确不做：

- 多游戏支持
- 完整四端环境管理闭环
- 完整四端投屏闭环
- AI 自动执行测试
- OCR / 图像识别
- 复杂多人权限系统
- 云设备农场
- CI 平台集成
- 复杂用例审批流

投屏能力调整：

- 投屏保留为核心能力之一，不能从产品主链路中删除。
- 第一阶段只做 Android 投屏 / 画面查看与基础控制闭环。
- PC / iOS / Harmony 投屏暂不进入第一阶段，但接口和控制台布局需要预留。
- 实时低延迟 `scrcpy` 投屏可作为 Android 投屏的后续增强；MVP 可先用截图刷新 + 坐标映射打通流程。

## 12. 第一阶段验收标准

### 12.1 功能验收

1. 工具能识别 Android 设备在线、离线、未授权状态。
2. 工具能检测 Android 设备是否安装 `com.tencent.tmgp.pubgmhd`。
3. 用户能打开 Android 投屏/画面控制区，刷新画面并保存证据截图。
4. 用户点击画面后，工具能映射到 Android 设备坐标并触发点击。
5. 用户能通过快捷入口进入和平精英常用目录。
6. 用户能完成文件浏览、上传、下载、删除、重命名、文本预览和文本编辑。
7. 删除和覆盖操作有二次确认。
8. 用户能创建环境模板，并预览模板步骤。
9. 用户能应用环境模板到 Android 设备。
10. 用户能备份关键文件或目录，并从备份恢复。
11. 用户能拉取日志目录到本地。
12. 关键操作进入操作记录。

### 12.2 质量验收

1. `pnpm run check` 无错误。
2. `pnpm run build` 无错误。
3. Android 设备断开后，UI 不崩溃，写操作禁用。
4. adb 操作失败时，UI 展示可理解的错误摘要。
5. 多次切换页面后，设备监听和 IPC 订阅不累积。
6. 大目录浏览不出现明显 UI 阻塞。

### 12.3 体验验收

1. Android 是当前唯一可用闭环，其他平台状态清楚，不误导用户。
2. 测试工程师能在不依赖 AI 的情况下完成一次环境搭建。
3. 高风险操作可预览、可确认、可追溯。
4. 操作结果清楚：成功、失败、部分成功都有反馈。

## 13. 开放问题

后续需要在实现前继续确认：

1. Android 端和平精英实际常用配置、日志、缓存路径的最终清单。
2. 环境模板是否只保存“文件操作步骤”，还是也保存 adb shell 命令。
3. 备份文件保存位置：应用 `userData`、用户选择目录，或项目工作区。
4. 操作记录是否只本地保存，还是未来需要导出报告。
5. 知识库第一版使用本地 Markdown / JSON，还是引入轻量数据库。
6. 用例库第一版是否需要和需求管理系统集成。

