# design-principles.md 审阅报告

审阅对象：从 WorkBuddy `pomelosuki` 迁入的 `Agent/skills/pomelosuki/references/design-principles.md`。

## 总体评价

**质量：良好，可作为柚爱设计知识内核的一部分，但不应替代项目约束档案。**

优点：

- 结构完整：理念、风格、规范、交互、响应式、动效、a11y、交付、流程、反模式都有覆盖。
- 反 AI 审美部分实用，能避免紫渐变、空洞 Hero、emoji 图标、过度营销式 UI 等常见问题。
- 交付前检查清单可直接用于 UI review / verification 前自检。
- 游戏测试工具示例贴合 mdtest 领域，但仍需要结合当前项目阶段判断。

## 当前对齐情况

| 项 | 当前状态 |
|----|----------|
| 技术栈 | mdtest 使用 Electron + Svelte 5 + shadcn-svelte + Tailwind 4 |
| shadcn 风格 | `components.json` 为 `new-york`，baseColor 为 `zinc` |
| 默认视觉 | 默认浅色优先，深色可用；其他主题为扩展示例 |
| 文件工作台图标 | 已使用 lucide-svelte，不再用 emoji 图标 |
| UI 验证 | 使用 `pnpm run verify`，UI 大改还需目视验证 |

## 仍存在的局限

1. **篇幅与重复**  
   「AI 雷区」在风格章与反模式章有重叠。柚爱本体应按任务选择性读取，不要每次全量塞入上下文。

2. **项目约束优先级**  
   通用规范可能鼓励大改 token 或视觉方向；mdtest 当前应优先保持 shadcn-svelte `new-york` 语义 token，不因单个问题新增重阴影或硬编码色阶。

3. **主题实验边界**  
   `forge`、`studio`、`cyber` 可作为主题能力示例，但不应被误读为当前主视觉。

4. **Agent 行为约束**  
   柚爱必须先读 `Agent/skills/pomelosuki/SKILL.md`，再读 `docs/design/pomelosuki/project-profile.md`。只读通用审美、不读项目档案，会导致设计漂移。

## 可反哺柚爱本体的结论

若只改一处：建议在柚爱 Skill 的「项目落地协议」里增加一个更硬的执行检查清单：

```text
已读项目约束档案？
当前项目的 shadcn style / baseColor 是什么？
默认验收模式是浅色还是深色？
当前 UI 问题应通过 token 调整、组件变体还是页面局部 class 解决？
哪些风格实验只是历史记录，不能当当前方向？
```

这能降低 Agent 因为通用审美过强而覆盖项目事实的风险。
