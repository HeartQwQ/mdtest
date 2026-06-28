# mdtest

面向《和平精英》测试团队的 Electron 桌面工具。当前路线是 Android-first，长期预留 PC / Android / iOS / Harmony 四端测试环境管理、投屏控制、用例库、知识库与 AI 自动化执行能力。

## 入口导航

| 区域 | 位置 | 内容 |
|------|------|------|
| Agent | [`Agent/`](Agent/) | AI 开发规则、Skill（技能）、MCP 配置、智能体 |
| Docs | [`docs/`](docs/) | 产品事实源和交付资料；`需求文档.md` 放产品目标、范围、验收标准，`设计规范.md` 放 UI/主题/交互，`flows/`、`deliverables/`、`research/` 按需新增 |
| Source | [`src/`](src/) | Electron main / preload / Svelte renderer 源码 |
| Resources | [`resources/`](resources/) | 运行时工具链二进制，如 adb / hdc / libimobiledevice |
| Scripts | [`scripts/`](scripts/) | 项目维护脚本；临时脚本放入 `scripts/tmp/` 或根目录 `tmp/` |

## 常用文档

- 产品需求：[`docs/需求文档.md`](docs/需求文档.md)
- 项目设计规范：[`docs/设计规范.md`](docs/设计规范.md)
- AI 开发规则：[`Agent/rules/AGENTS.md`](Agent/rules/AGENTS.md)
- 柚爱 Skill：[`Agent/skills/pomelosuki/SKILL.md`](Agent/skills/pomelosuki/SKILL.md)
- MCP 配置：[`Agent/mcp/mcp.json`](Agent/mcp/mcp.json)
- 设备工具链说明：[`resources/device-toolchains/device-toolchains.md`](resources/device-toolchains/device-toolchains.md)

## 开发命令

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
pnpm verify
pnpm dist
```

## 根目录原则

根目录只保留工程入口和必要配置。新增文件前先判断归属：AI/开发治理进 `Agent/`，产品和交付资料进 `docs/`，运行时资源进 `resources/`，源码进 `src/`，临时材料进 `tmp/` 或对应模块的 `tmp/` 子目录。

目录职责以本 README 为准，避免在子目录重复维护入口说明；新增长期文档后应更新这里的入口或目录说明。

