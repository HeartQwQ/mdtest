# mdtest

面向《和平精英》测试团队的 Electron 桌面工具。当前路线是 Android-first，长期预留 PC / Android / iOS / Harmony 四端测试环境管理、投屏控制、用例库、知识库与 AI 自动化执行能力。

## 入口导航

| 区域 | 位置 | 内容 |
|------|------|------|
| Agent | [`Agent/`](Agent/) | AI 开发规则、Skill（技能）、MCP、智能体、记忆 |
| Docs | [`docs/`](docs/) | 产品需求、设计规范、流程图、交付文档、资源说明 |
| Source | [`src/`](src/) | Electron main / preload / Svelte renderer 源码 |
| Resources | [`resources/`](resources/) | 运行时工具链二进制，如 adb / hdc / libimobiledevice |
| Scripts | [`scripts/`](scripts/) | 项目维护脚本；临时脚本放入 `scripts/tmp/` 或根目录 `tmp/` |

## 常用文档

- 产品需求：[`docs/product/requirements.md`](docs/product/requirements.md)
- 项目设计总纲：[`docs/design/project-design.md`](docs/design/project-design.md)
- UI 设计规范：[`docs/design/pomelosuki/project-profile.md`](docs/design/pomelosuki/project-profile.md)
- AI 开发规则：[`Agent/rules/AGENTS.md`](Agent/rules/AGENTS.md)
- 柚爱 Skill：[`Agent/skills/pomelosuki/SKILL.md`](Agent/skills/pomelosuki/SKILL.md)
- MCP 清单：[`Agent/mcp/registry.md`](Agent/mcp/registry.md)
- Android-first 实施计划：[`docs/product/plans/2026-06-09-android-first-mvp.md`](docs/product/plans/2026-06-09-android-first-mvp.md)
- 设备工具链说明：[`docs/resources/device-toolchains.md`](docs/resources/device-toolchains.md)

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

