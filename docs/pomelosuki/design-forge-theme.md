# 设计交付 · 熔炉主题（柚爱实测）

> 按「SKILL 方法论 → `project-profile.md` 约束 → 落地」流程完成，用于验证柚爱新分工。

## 设计方向

**冷灰石板上的琥珀信号灯** — 工业监控 / 熔炉控制台感，与默认（青）、工作室（紫）、赛博（绿）形成第四条色相记忆点。

| 四步法 | 结论 |
|--------|------|
| Purpose | 测试工程师长时间盯屏，需低刺激底 + 高辨识度强调 |
| Tone | 克制、偏冷中性底，单一暖色强调 |
| Constraints | Svelte 5 + shadcn-svelte + OKLCH 变量 + `data-theme` |
| Differentiation | 琥珀 `primary`（hue ≈ 55）+ 蓝灰石板底（hue ≈ 250） |

## Token 表（`forge`）

| Token | Light | Dark |
|-------|-------|------|
| background | oklch(0.97 0.008 250) | oklch(0.14 0.02 250) |
| foreground | oklch(0.22 0.02 250) | oklch(0.96 0.01 250) |
| primary | oklch(0.58 0.16 55) | oklch(0.78 0.14 55) |
| card | oklch(0.99 0.006 250) | oklch(0.18 0.022 250) |
| sidebar | oklch(0.95 0.01 250) | oklch(0.12 0.022 250) |
| ring | = primary | = primary |

完整变量见 `src/renderer/src/app.css` 中 `[data-theme='forge']` / `.dark[data-theme='forge']`。

## 实现（仅 2 处，组件未改）

1. `src/renderer/src/lib/stores/theme.svelte.ts` — `ThemePalette` + `themePalettes` 增加 `forge`
2. `src/renderer/src/app.css` — 熔炉 light/dark 变量块

侧栏 `ThemeSwitcher` 自动从 `themePalettes` 渲染，无需改 Svelte。

## 检查清单

- [x] 语义 token 覆盖 profile 要求字段
- [x] light / dark 两套齐全
- [x] 无硬编码 `zinc-*` / `cyan-*` 于新代码
- [x] 未改主进程 / IPC
- [x] `pnpm run check` + `pnpm run build`（见下方验证节）

## 目视验证

`pnpm dev` → 侧栏「外观 → 熔炉」→ 切换明暗三档，主按钮与选中态应呈琥珀色。
