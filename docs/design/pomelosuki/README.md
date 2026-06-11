# mdtest · 柚爱项目设计档案

本目录保存 mdtest 项目给柚爱读取的项目级设计资料。

注意：这里不是柚爱本体。柚爱本体在：

```text
Agent/skills/pomelosuki/SKILL.md
```

## 读取顺序

1. 先读 `Agent/skills/pomelosuki/SKILL.md`，确认柚爱的通用方法和边界。
2. 再读本目录的 `project-profile.md`，确认 mdtest 的框架、路径、主题和验证命令。
3. 再读 `ui-v2-design-notes.md`，确认当前阶段的设计方向。
4. 最后按任务选择性读取主题、历史实验或审阅文档。

## 文档状态

| 文档 | 状态 | 说明 |
|------|------|------|
| `project-profile.md` | 当前有效 | mdtest 项目约束档案；任何 UI 落地前必读 |
| `ui-v2-design-notes.md` | 当前有效 | 当前 UI 方向、布局和设计检查清单 |
| `themes.md` | 参考 | 主题扩展指南；当前主线是默认浅色优先，非多主题优先 |
| `design-forge-theme.md` | 历史实验 | forge 主题验证记录，保留作主题扩展示例 |
| `design-principles-audit.md` | 历史审阅 | WorkBuddy 设计规范迁入时的审阅记录 |
| `pomelosuki-skill-improvement-notes.md` | 建议 | 从 mdtest 实践中提炼的柚爱本体优化建议 |

## 已清理的过时方向

- 不再把 mdtest 固定描述为暗色优先；当前以默认浅色为主，深色为辅。
- 不再把 forge / studio / cyber 等主题实验当成当前设计主线。
- 不再把旧 Tauri 视觉复刻作为当前目标。
- 不再把 SVAR 文件管理实验作为当前文件工作台方向。
- 不再把项目风格写进柚爱本体；项目风格只保存在本目录。
- 不再保留迁移期工具对照文档；AI 能力配置统一看 `Agent/`。
