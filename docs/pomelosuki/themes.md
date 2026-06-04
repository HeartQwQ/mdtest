# UI 主题扩展指南（柚爱 / shadcn-svelte）

## 能否做「多套主题」而不只是深浅色？

**可以。** shadcn-svelte 的样式由 **CSS 变量** 驱动（`--background`、`--primary` 等），深浅色只是其中一层：

| 维度 | 实现方式 | 说明 |
|------|----------|------|
| 浅色 / 深色 / 系统 | `mode-watcher` 在 `<html>` 上切换 `.dark` | 与 shadcn 官方一致 |
| 品牌 / 风格包 | `<html data-theme="studio">` 等 | 同一套组件，换一组变量 |

二者可组合：`class="dark"` + `data-theme="cyber"` = 赛博主题的深色模式。

## 文件位置

- 变量定义：`src/renderer/src/app.css`
- 运行时切换：`src/renderer/src/lib/stores/theme.svelte.ts`
- 侧栏控件：`src/renderer/src/lib/components/ThemeSwitcher.svelte`

## 新增一套主题（给设计师）

1. 在 `theme.svelte.ts` 的 `themePalettes` 增加一项（`id` 即 `data-theme` 值）。
2. 在 `app.css` 增加两段选择器：
   - `[data-theme="新id"]` — 浅色变量（`:root` 同级）
   - `.dark[data-theme="新id"]` — 深色变量
3. 至少覆盖 shadcn 核心 token：`background`、`foreground`、`card`、`primary`、`secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring`。
4. 可选：调整 `--radius`、字体、状态色（在线/警告等见 `@theme` 里的 `--color-online`）。

设计交付建议：每套主题一张 **变量表**（HEX 或 OKLCH），分别列出 light / dark 两列；开发照表填入 CSS 即可，无需改 Svelte 组件。

## 组件约定

- 布局与控件优先用 shadcn：`Button`、`Card`、`Badge`、`Input`、`ScrollArea` 等。
- 颜色用语义类：`bg-background`、`text-foreground`、`border-border`、`bg-primary`，避免硬编码 `zinc-*` / `cyan-*`（状态点等少量例外见 `status.ts`）。
