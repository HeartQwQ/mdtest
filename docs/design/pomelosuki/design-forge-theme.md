# 历史实验 · 熔炉主题（柚爱实测）

> 本文是一次主题扩展实验记录，用于说明 `data-theme` 风格包如何落地。它不代表 mdtest 当前默认视觉方向；当前主线是默认浅色优先，深色可用，其他主题作为参考。

## 设计方向

**冷灰石板上的琥珀信号灯**：工业监控 / 熔炉控制台感，与默认（青）、工作室（紫）、赛博（绿）形成第四条色相记忆点。

| 四步法 | 结论 |
|--------|------|
| Purpose | 测试工程师长时间盯屏，需低刺激底 + 高辨识度强调 |
| Tone | 克制、偏冷中性底，单一暖色强调 |
| Constraints | Svelte 5 + shadcn-svelte + OKLCH 变量 + `data-theme` |
| Differentiation | 琥珀 `primary`（hue 约 55）+ 蓝灰石板底（hue 约 250） |

## Token 表（`forge`）

| Token | Light | Dark |
|-------|-------|------|
| background | `oklch(0.97 0.008 250)` | `oklch(0.14 0.02 250)` |
| foreground | `oklch(0.22 0.02 250)` | `oklch(0.96 0.01 250)` |
| primary | `oklch(0.58 0.16 55)` | `oklch(0.78 0.14 55)` |
| card | `oklch(0.99 0.006 250)` | `oklch(0.18 0.022 250)` |
| sidebar | `oklch(0.95 0.01 250)` | `oklch(0.12 0.022 250)` |
| ring | = primary | = primary |

完整变量见 `src/renderer/src/app.css` 中 `[data-theme='forge']` / `.dark[data-theme='forge']`。

## 当前状态

- `forge` 可保留为主题系统示例。
- 不再作为项目主视觉、默认设计方向或 UI 改造优先级。
- 新增主题前必须先回到 `themes.md` 的当前约束确认使用场景。

