# 设计原则与规范 (Design Principles)

## 🎯 核心理念

### 1. 可用性优先（Usability First）

> "Good design is as little design as possible." - Dieter Rams, 博朗工业设计之父

**关键要点**:
- ✅ 界面简洁直观，降低学习成本
- ✅ 操作反馈及时明确，避免用户困惑
- ✅ 容错机制完善，帮助用户从错误中恢复
- ❌ 避免过度装饰和复杂交互

### 2. 美观与功能平衡（Balance Form & Function）

> "Form follows function." - Louis Sullivan, 芝加哥学派建筑师

**关键要点**:
- ✅ 设计服务于内容和功能，而非形式
- ✅ 视觉美感提升产品品质和品牌形象
- ❌ 过度装饰会分散用户对核心功能的注意力

### 3. 一致性保证体验连贯（Consistency）

> "Consistency is key to user experience." - General UX Principle

**关键要点**:
- ✅ UI 元素风格统一，降低认知负担
- ✅ 交互行为符合用户预期，建立信任感
- ✅ 跨平台体验一致，减少学习成本

---

## 🎭 风格塑造指南 (Style Crafting Guide)

> *来源：frontend-design skill — 做出有灵魂的设计，拒绝 AI 流水线风格。*

### 设计思维四步法

每次动手之前，必须先回答四个问题：

| 步骤 | 问题 | 示例（以游戏测试工具为例） |
|------|------|---------------------------|
| **Purpose** | 界面解决什么问题？谁在用？ | 测试工程师，需要高效专业的工具 |
| **Tone** | 选一种明确的风格基调 | 游戏科技风、极简工具风、赛博朋克…… |
| **Constraints** | 技术栈限制是什么？ | 见项目档案：框架 / shadcn 变体 / 图标库 / 构建器 |
| **Differentiation** | 什么让人过目不忘？ | 那个唯一的"记忆点" |

> ⚠️ **核心原则：要么极度克制，要么极致张扬，但必须是有意识的选择。**
>
> 粗野极简和华丽极繁都可以——关键是**意图明确**，而非**用力过猛**。

### 风格基调参考库

以下是可供选择的设计风格方向，每次项目从中选取一种并贯彻到底：

| 风格 | 特征 | 适用场景 |
|------|------|---------|
| **Brutally Minimal** 极简主义 | 大量留白、单一焦点、字体即装饰 | 开发者工具、专业软件 |
| **Maximalist Chaos** 极繁混乱 | 密集信息、多层叠加、视觉轰炸 | 游戏社区、创意作品集 |
| **Retro-Futuristic** 复古未来 | 霓虹色、扫描线、CRT 质感 | 赛博朋克主题工具 |
| **Organic/Natural** 自然有机 | 柔和曲线、大地色、光影渐变 | 健康/冥想类应用 |
| **Luxury/Refined** 奢华精致 | 金色点缀、衬线字体、极简留白 | 高端品牌官网 |
| **Playful/Toy-like** 玩趣可爱 | 圆角大按钮、明亮配色、弹跳动画 | 儿童/游戏化应用 |
| **Editorial/Magazine** 杂志编辑 | 大胆排版、网格系统、图文对比 | 内容平台、博客 |
| **Brutalist/Raw** 粗野主义 | 原始 HTML 感、巨大文字、高对比 | 独立开发者个人站 |
| **Art Deco/Geometric** 装饰几何 | 对称图案、金属色、几何元素 | 金融/企业仪表盘 |
| **Industrial/Utilitarian** 工业实用 | 单色系、功能优先、硬朗线条 | 运维工具、CLI GUI |

### 五大设计维度

#### 1. 排版（Typography）

```
❌ 禁止：Arial、Inter、Roboto、系统默认字体
✅ 追求：有个性、有辨识度的字体配对

规则：
- 展示字体（Display）要独特、抓眼
- 正文字体（Body）要清晰、耐读
- 两者形成对比配对（contrast pairing）
```

#### 2. 色彩（Color & Theme）

```
❌ 禁止：紫色渐变 + 白色背景（AI 最爱套路）
❌ 禁止：四平八稳的均匀分配调色板
✅ 追求：主导色 + 锐利强调色

规则：
- 主色占据 60-70% 视觉面积
- 强调色只用在关键交互点
- CSS 变量统一管理
- 深色/浅色主题各有独立个性
```

#### 3. 动效（Motion）

```
❌ 禁止：满屏散落的微交互（无记忆点）
✅ 追求：少而精的高光时刻

推荐模式：
- 页面加载：交错渐显动画（animation-delay 级联）
- 滚动触发：元素进入视口时揭示
- 悬停状态：出人意料的反馈
- 优先 CSS / 框架内置过渡；复杂序列用框架动画原语（如 Svelte `transition:`、React 动画库）
```

#### 4. 空间构成（Spatial Composition）

```
❌ 禁止：对称居中、整齐网格、千篇一律的卡片布局
✅ 追求：不对称、重叠、对角线流动、打破网格

规则：
- 要么大留白（极简路数）
- 要么高密度（极繁路数）
- 不要"刚刚好"的中间态
```

#### 5. 背景与视觉细节（Backgrounds & Visual Details）

```
❌ 禁止：纯色背景（无聊）
✅ 追求：营造氛围和深度

可用技法：
- 渐变网格（gradient meshes）
- 噪点纹理（noise textures）
- 几何图案（geometric patterns）
- 半透明叠层（layered transparencies）
- 戏剧性阴影（dramatic shadows）
- 装饰性边框（decorative borders）
- 自定义光标（custom cursors）
- 颗粒覆盖层（grain overlays）
```

### AI 设计雷区清单

以下是必须主动避开的"AI slop"特征：

| 雷区 | 为什么是雷区 | 替代方案 |
|------|-------------|---------|
| Inter / Roboto / Arial 字体 | 每个 AI 都默认用这些 | 找有个性的字体配对 |
| 紫色渐变 + 白色背景 | 最泛滥的 AI 配色 | 探索独特的色彩组合 |
| 居中对称卡片布局 | 缺乏设计意图 | 不对称、重叠、打破网格 |
| 纯色背景无纹理 | 缺乏深度和氛围 | 噪点、渐变、几何图案 |
| Space Grotesk 字体 | 已成为新的"AI 默认字体" | 每次选不同的展示字体 |
| 均匀分布的调色板 | 没有主次，缺乏张力 | 主导色 + 锐利强调色 |

### 复杂度匹配原则

```
极繁设计 → 需要大量代码、丰富动画、多层次效果
极简设计 → 需要克制、精准、关注间距/排版/微妙细节

优雅来自于把选定的风格执行到位，而非"做得多"。
```

---

## 🎨 设计规范 (Design Standards)

### 色彩系统（Color System）

#### 主色（Primary Color）
| 用途 | 说明 | 示例值 |
|------|------|--------|
| Primary | 品牌主色调 | #007AFF |
| Primary Dark | 深色模式或强调态 | #005BB5 |
| Primary Light | 辅助背景 | #4DA3FF |

#### 功能色（Functional Colors）
```
Success:    #34C759  (成功/确认)
Warning:    #FF9500  (警告/注意)
Error:      #FF3B30  (错误/危险)
Info:       #5856D6  (信息/提示)
```

#### 中性色（Neutral Colors）
```
Background:  #FFFFFF  (白色背景)
Surface:     #F2F2F7  (浅灰表面)
Divider:     #E5E5EA  (分隔线)
Text Primary:  #000000  (主要文字)
Text Secondary: #8E8E93  (次要文字)
```

### 排版系统（Typography）

#### 字体家族优先级
1. **SDF Pro** - Apple 设备首选（iOS, macOS）
2. **Helvetica Neue** - 通用无衬线字体
3. **-apple-system**, `-sf-pro-text`, `-webkit-kanji`
4. **PingFang SC** - iOS/Android 中文优先
5. **Microsoft YaHei** - Windows 首选中文字体

#### 字号层级（Typography Scale）
| 层级 | 尺寸 | 用途 | 字重 |
|------|------|------|------|
| Display | 48px | 超大标题 | Bold (700) |
| H1 | 32px | 页面主标题 | Semibold (600) |
| H2 | 24px | 二级标题 | Semibold (600) |
| H3 | 20px | 三级标题 | Medium (500) |
| Body Large | 17px | 正文大段 | Regular (400) |
| Body Normal | 16px | 标准正文 | Regular (400) |
| Body Small | 14px | 小字说明 | Regular (400) |
| Caption | 12px | 辅助文本 | Regular (400) |

#### 行高规范（Line Heights）
- Display: 1.1×字号
- H1-H3: 1.25×字号
- Body: 1.5-1.75×字号（推荐 1.6）
- Caption: 1.4×字号

### 间距系统（Spacing Scale）

**基础单位**: 4px（移动端），8px（桌面端）

| 层级 | 倍数 | 像素值 | 用途 |
|------|------|--------|------|
| xs | 0.25x | 1-2px | 紧密元素内边距 |
| sm | 0.5x | 4px | 紧凑间距 |
| md | 1x | 8px | 标准间距（移动端） |
| lg | 2x | 16px | 中等间距（桌面） |
| xl | 4x | 32px | 大间距（区块分隔） |

### 圆角规范（Border Radius）

| 层级 | 值 (px) | 用途示例 |
|------|---------|----------|
| xs | 2-4 | 按钮小圆点、图标 |
| sm | 6-8 | 输入框、卡片默认 |
| md | 12 | 弹窗、抽屉容器 |
| lg | 16-20 | App 全屏页、大卡片 |
| full | 999 | 头像、徽章等圆形元素 |

### 阴影规范（Shadows）

#### 移动端阴影层级
```css
/* 悬浮层 */
box-shadow: 0 4px 16px rgba(0,0,0,0.12);

/* 弹窗/抽屉 */
box-shadow: 0 8px 32px rgba(0,0,0,0.16);

/* 模态遮罩 */
background: rgba(0,0,0,0.4);
```

#### 桌面端阴影层级
```css
/* 轻浮层 */
box-shadow: 0 2px 8px rgba(0,0,0,0.1);

/* 中浮层 */
box-shadow: 0 4px 16px rgba(0,0,0,0.15);

/* 重浮层（模态）*/
box-shadow: 0 8px 32px rgba(0,0,0,0.25);
```

---

## 🖱️ 交互规范 (Interaction Guidelines)

### 按钮（Buttons）

#### 尺寸规格
| 类型 | 高度 (px) | 最小宽度 (px) | 用途 |
|------|-----------|---------------|------|
| Small | 28 | 60+ | 次要操作、密集布局 |
| Medium | 40-44 | 80+ | 主要操作（移动端标准） |
| Large | 52-60 | 120+ | CTA 按钮、重要操作 |

#### 状态规范
```markdown
- Default: 正常态，显示主色背景或边框
- Hover: 鼠标悬停，颜色加深或提升阴影
- Active/Pressed: 按下态，轻微下沉效果（-1px）
- Disabled: 禁用态，灰度处理（opacity: 0.5）
- Loading: 加载态，显示 spinner
```

#### 点击反馈时间
| 操作 | 反馈时长 (ms) | 说明 |
|------|---------------|------|
| Button Click | 100-200ms | 快速响应，轻微下沉动画 |
| Form Submit | 300-500ms | 等待服务端处理 |
| Tab Switch | 150-300ms | 页面切换时的过渡 |

### 表单（Forms）

#### 输入框状态
```markdown
- Default: 边框色为中性灰 (#8E8E93)
- Focused: 边框色为主色，带 glow 效果
- Error: 边框色为红色 (#FF3B30)，显示错误信息
- Success: 边框色为绿色 (#34C759)，显示成功提示
- Disabled: 背景灰度处理，文字变淡
```

#### 表单验证反馈
- **实时验证**: 用户输入时即时反馈（如邮箱格式）
- **提交验证**: 所有字段完成后统一展示错误列表
- **错误提示位置**: 贴近触发元素显示，避免遮挡

### 导航（Navigation）

#### 移动端侧边栏
```markdown
- 打开动画：从左向右滑入
- 遮罩层：背景半透明黑色，点击关闭
- 图标尺寸：24×24px
- 点击热区：最小 44×44px（考虑手指操作）
```

#### 桌面端顶部导航
```markdown
- 高度：56-60px（含 logo、导航项、操作按钮）
- Logo: 最左侧，品牌标识
- 主菜单：居中位置，主要功能入口
- 用户区：右侧，头像 + 下拉菜单
- Hover 效果：背景色轻微变化
```

---

## 📱 响应式布局（Responsive Layout）

### 断点设置（Breakpoints）

| 名称 | 最小宽度 (px) | 设备类型 | 说明 |
|------|--------------|----------|------|
| xs | 0 | Phone SE | 超小屏幕 |
| sm | 576 | iPhone 12/Mini | 竖屏手机 |
| md | 768 | iPad mini / Android 平板 | 小横屏 |
| lg | 992 | iPad Pro 10.9" | 中平板 |
| xl | 1200 | Laptop | 笔记本/大桌面 |
| xxl | 1400+ | Desktop Large | 大屏幕 |

### 移动端优先（Mobile First）开发策略

```css
/* CSS Media Query 顺序 */
@media (min-width: 576px) { /* Mobile - Phone Portrait */ }
@media (min-width: 768px) { /* Tablet Small */ }
@media (min-width: 992px) { /* Laptop */ }
@media (min-width: 1200px) { /* Desktop Large */ }

/* 关键：Mobile 样式写在最前面，后续逐步增强 */
```

### 布局容器规范（Container）

| 断点 | Container Max Width | Gutter | Padding |
|------|---------------------|--------|---------|
| xs | 100% (Full viewport) | - | - |
| sm | 540px | 8px | 24px |
| md | 720px | 16px | 32px |
| lg | 960px | 24px | 48px |
| xl | 1140px | 24px | 64px |
| xxl | 1320px | 32px | 80px |

---

## 🎬 动效规范 (Motion Guidelines)

### 动画时长（Duration）

| 场景 | 时长 (ms) | 缓动函数 | 说明 |
|------|-----------|---------|------|
| Micro-interaction | 100-200 | ease-out | 按钮点击、切换选中 |
| Page transition | 300-500 | ease-in-out | 页面加载/切换 |
| Modal open/close | 300-400 | cubic-bezier(0.4, 0, 0.2, 1) | 弹窗动画 |
| Complex animation | 600-800 | - | 复杂转场（需谨慎使用） |

### 缓动函数（Easing Functions）

```css
/* iOS / Apple */
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)

/* Android / Material Design */
ease-in-out: cubic-bezier(.2,.0,0,.3)

/* Default Web Standard */
ease-out-quint: cubic-bezier(0.755, 0.05, 0.855, 0.06)
```

### 常用动效模式

#### 淡入淡出（Fade）
- **进入**: opacity: 0 → 1 (配合 transform: translateY)
- **退出**: opacity: 1 → 0
- **时长**: 300ms

#### 缩放（Scale）
- **进入**: scale(0.8) → scale(1) + fade-in
- **弹出**: scale(0) → scale(1)
- **时长**: 250-400ms

#### 滑入（Slide）
- **侧边栏**: translateX(-100%) → translateX(0)
- **抽屉**: translateY(100vh) → translateY(0)
- **时长**: 300ms

---

## ♿ 无障碍设计 (Accessibility Guidelines)

### 色彩对比度（Color Contrast）

| AA (标准符合 WCAG 2.1 Level AA) | AAA (推荐更高可读性) |
|--------------------------------|---------------------|
| Normal text: ≥4.5:1 | Normal text: ≥7:1 |
| Large text: ≥3:1 | Large text: ≥4.5:1 |
| UI components: ≥3:1 | - |

**验证工具**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools 无障碍检查器

### 焦点可见性（Focus Visibility）

```markdown
✅ 必须实现：
- Tab 键切换时显示明显焦点指示（outline/highlight）
- 自定义组件需适配键盘导航
- Focus 状态颜色对比度 ≥3:1

❌ 禁止：
- 移除默认焦点样式而不提供替代方案
- 仅通过 color 变化表示 focus（色盲用户无法识别）
```

### ARIA 标签使用原则

```markdown
✅ 何时使用：
- 内容动态更新且不可见
- 自定义组件需要暴露状态到辅助技术
- 语义 HTML 无法满足的复杂交互场景

❌ 避免过度使用：
- 能使用原生 HTML 语义元素时不使用 ARIA
- 为装饰性图片添加 role="img"
```

---

## 📦 交付规范 (Deliverable Standards)

### Figma 文件组织（File Organization）

```
📁 PomeloSuki Design System.fig
├── 📂 00_Setting (设置层/分组)
│   ├── Fonts & Styles
│   ├── Color Styles
│   └── Auto Layout Presets
├── 📂 01_Components (基础组件库)
│   ├── Buttons
│   │   ├── Primary Button
│   │   ├── Secondary Button
│   │   └── Text Button
│   ├── Inputs
│   └── Cards
├── 📂 02_Pages (页面设计稿)
│   ├── Login Page
│   ├── Dashboard
│   └── Settings
└── 📂 99_Exports (切图/导出)
    ├── @1x
    └── @2x
```

### 设计规范文档（Design System Doc）

**必须包含**:
- ✅ 设计原则和理念
- ✅ 色彩系统完整定义
- ✅ 排版系统和字号层级
- ✅ 图标规范和图例
- ✅ 组件库使用说明
- ✅ 动效指导原则
- ✅ 响应式布局说明

### 交付清单（Checklist）

```markdown
- [ ] UI 元素符合设计规范
- [ ] 交互逻辑完整无遗漏
- [ ] 适配不同屏幕尺寸/设备
- [ ] 支持深色模式（如需要）
- [ ] 包含无障碍访问支持
- [ ] 所有图片资源已优化压缩
- [ ] 设计稿与切图一一对应
- [ ] 设计规范文档齐全
```

---

## 🔄 设计流程（Design Process）

### 阶段划分及产出物

| 阶段 | 占比 | 核心任务 | 交付物 |
|------|------|----------|--------|
| **需求分析** | 10-20% | 业务理解、用户调研、竞品分析 | 需求文档、用户故事地图 |
| **用户研究** | 15-25% | 访谈测试、数据分析 | 研究报告、问题清单 |
| **信息架构** | 10-15% | 站点结构、流程梳理 | 线框图、流程图、用户旅程图 |
| **视觉设计** | 30-40% | 风格定义、组件库、页面设计 | 视觉稿、设计规范文档 |
| **交互原型** | 10-15% | 低保真→高保真、动效 | 可交互原型、微交互动画 |
| **评审优化** | 5-10% | 内部/用户测试、迭代改进 | 评审报告、修改清单 |

### 设计评审流程（Design Review）

```markdown
1. 设计师准备：
   - 整理设计方案和 rationale
   - 准备原型或可交互演示
   
2. 评审会议：
   - 产品经理：评估业务目标匹配度
   - 设计师：确认体验完整性和一致性
   - 前端工程师：评估技术可行性
   - UI/UX 专家（如有）：专业评审

3. 反馈收集与处理：
   - 分类整理所有意见
   - 判断是否采纳及原因
   - 更新设计稿并记录修改理由
   
4. 最终确认：
   - 签字确认可进入开发阶段
   - 输出完整的设计资源包
```

---

## 🚀 最佳实践（Best Practices）

### Web Design

1. **性能优先**: 
   - Lighthouse 评分目标 ≥90
   - First Contentful Paint < 1.8s
   - Total Blocking Time < 200ms

2. **SEO 友好**:
   - Semantic HTML5 结构
   - Meta tags 完整配置
   - 图片使用 WebP/AVIF 格式
   - Lazy loading 实现

3. **兼容性**:
   - 支持主流浏览器（Chrome, Firefox, Safari, Edge）
   - CSS 前缀自动处理（Autoprefixer）
   - Polyfill 方案兜底

### Mobile Design

1. **手势操作规范**:
   ```markdown
   - Swipe Left/Right: 页面切换（50px 滑动阈值）
   - Pull Down: 刷新页面
   - Long Press: 快捷菜单或编辑模式
   - Tap and Hold: 拖拽选择
   ```

2. **触控热区**:
   - 最小点击区域：44×44 px（iOS），48×48 dp（Android）
   - 避免元素过于密集
   - 保留安全区域（刘海、底部栏）

3. **Loading 状态处理**:
   ```markdown
   - 骨架屏（Skeleton Screen）: 页面加载时的占位动画
   - Spinner: 等待中的反馈
   - Toast: 轻提示消息
   ```

### Desktop Design

**桌面应用通则**（具体数值见项目约束档案 `docs/design/pomelosuki/project-profile.md`）：
- 固定侧栏 + 弹性主区（`min-w-0 flex-1`）；设定合理最小窗口尺寸
- 颜色走语义 token（`bg-background` / `bg-card` / `text-foreground`…），勿硬编码色阶
- 图标用矢量图标库，**禁止 emoji 作图标**
- 优先用 shadcn 组件 + Tailwind 工具类，少写裸 CSS

1. **布局策略**:
   - CSS Grid for main structure
   - Flexbox for component-level alignment
   - Container queries for responsive containers

2. **快捷键支持**:
   ```markdown
   - Cmd/Ctrl + K: Search
   - Cmd/Ctrl + N: New item
   - Cmd/Ctrl + S: Save
   - Escape: Close/Cancel
   ```

---

## 🚀 专业 UI 速查手册 (Professional UI Quick Reference)

> *来源：ui-ux-pro-max skill — 57 种风格、95+ 配色、56 字体配对、99 UX 指南。*

### 八大优先级规则体系

| 优先级 | 类别 | 影响 | 核心规则 |
|--------|------|------|---------|
| 1 | **无障碍** | CRITICAL | 色彩对比度 ≥4.5:1、可见焦点环、alt 文本、aria-label、键盘导航 |
| 2 | **触控与交互** | CRITICAL | 最小触控区 44×44px、禁用异步按钮、错误反馈就近显示 |
| 3 | **性能** | HIGH | WebP 图片、srcset 响应式、懒加载、检查 prefers-reduced-motion |
| 4 | **布局与响应式** | HIGH | viewport meta、移动端最小 16px 字号、z-index 定义层级体系 |
| 5 | **排版与色彩** | MEDIUM | 行高 1.5-1.75、行长 65-75 字符、字体个性配对 |
| 6 | **动画** | MEDIUM | 150-300ms 微交互、用 transform/opacity 不用 width/height、骨架屏 |
| 7 | **风格选择** | MEDIUM | 风格匹配产品类型、全局一致性、禁止 emoji 做图标 |
| 8 | **图表与数据** | LOW | 图表类型匹配数据类型、无障碍配色、提供数据表格替代 |

### 常见业余 UI 速查

#### 图标与视觉
| ✅ 做 | ❌ 不做 |
|------|--------|
| SVG 图标（Heroicons / Lucide） | 用 emoji 当图标 |
| hover 用颜色/透明度变化 | hover 用 scale 导致布局抖动 |
| 统一 viewBox 24×24 + w-6 h-6 | 图标尺寸混用 |

#### 交互与光标
| ✅ 做 | ❌ 不做 |
|------|--------|
| `cursor-pointer` 在所有可点击元素 | 默认光标在交互元素上 |
| hover 有反馈（颜色/阴影/边框） | 交互元素无任何视觉提示 |
| `transition-colors duration-200` | 瞬间变化或 >500ms 的慢动画 |

#### 明暗模式对比
| 场景 | ✅ 正确 | ❌ 错误 |
|------|--------|--------|
| 浅色模式玻璃卡片 | `bg-white/80` | `bg-white/10`（太透） |
| 浅色正文文字 | `#0F172A`（slate-900） | `#94A3B8`（slate-400） |
| 浅色次要文字 | 最低 `#475569`（slate-600） | gray-400 |
| 浅色边框 | `border-gray-200` | `border-white/10`（不可见） |

#### 布局间距
| ✅ 做 | ❌ 不做 |
|------|--------|
| 侧栏/顶栏与边缘留白（如 `padding: 16px`） | 贴边 `0` 显得拥挤 |
| 主内容区为固定导航预留间距 | 内容被固定栏遮挡 |
| 统一 `max-width`（如 1280px） | 各页容器宽度不一致 |

### 交付前检查清单

**视觉质量：**
- [ ] 无 emoji 做图标
- [ ] 所有图标来自统一图标集
- [ ] 品牌 Logo 正确
- [ ] hover 不引起布局偏移

**交互：**
- [ ] 所有可点击元素有 `cursor-pointer`
- [ ] hover 有清晰视觉反馈
- [ ] 过渡动画 150-300ms
- [ ] 焦点状态键盘可见

**布局：**
- [ ] 浮动元素与边缘有间距
- [ ] 无内容被固定导航栏遮挡
- [ ] 响应式验证：375px / 768px / 1024px / 1440px
- [ ] 移动端无横向滚动

**无障碍：**
- [ ] 所有图片有 alt 文本
- [ ] 表单输入有标签
- [ ] 不仅靠颜色传达信息
- [ ] 尊重 `prefers-reduced-motion`

---

## 🎨 完整美学风格目录 (Complete Aesthetics Catalog)

> *来源：design-wizard skill aesthetics-catalog — 14 种美学风格分类，含特征和代码模板。*

### 现代风格 (Modern)

| 风格 | 特征 | 最适合 |
|------|------|--------|
| **Dark & Premium** | 黑色背景 #0a0a0a、高对比白字、少量强调色、大字重排版 | SaaS / 金融科技 / 开发者工具 |
| **Glassmorphism** | 毛玻璃效果 backdrop-blur、半透明背景、分层深度感 | 仪表盘 / 金融应用 |
| **Neobrutalism** | 黑色粗边框、黄色/红色强调、硬阴影、原始字体 | 创意作品集 / 独立开发者 |
| **Bento Grid** | 模块化网格、不同大小卡片、信息密度高 | 仪表盘 / 产品展示 |

### 复古风格 (Retro)

| 风格 | 特征 | 最适合 |
|------|------|--------|
| **Brutalist/Editorial** | 巨大字体、高对比、不对称、杂志感 | 创意机构 / 个人网站 |
| **Y2K/Cyber** | 霓虹色、金属质感、未来感科技字体 | 游戏 / 加密 / 科技产品 |

### 文化风格 (Cultural)

| 风格 | 特征 | 最适合 |
|------|------|--------|
| **Swiss Typography** | 网格系统、无衬线字体、数学般精确的间距 | 企业 / 专业服务 |
| **Scandinavian Minimal** | 温暖中性色、有机曲线、柔软质感、大量留白 | 生活方式 / 健康品牌 |
| **Japanese Zen** | 极简克制、不对称平衡、自然材质感、手写体点缀 | 冥想 / 茶道 / 高端品牌 |

### 极简风格 (Stripped-Down)

| 风格 | 特征 | 最适合 |
|------|------|--------|
| **Statement Hero** | 超大标题占满屏幕、无其他干扰、字体即设计 | 创业公司 / 即将上线页面 |
| **Type-Only** | 纯粹排版、无图片无图标、靠字体层级区分 | 文档 / 博客 / 极简工具 |

### 风格选择指南

```
游戏/科技  → Y2K/Cyber 或 Dark & Premium
开发者工具 → Dark & Premium 或 Neobrutalism
企业/SaaS  → Swiss Typography 或 Glassmorphism
生活方式   → Scandinavian Minimal 或 Japanese Zen
创意作品集 → Brutalist/Editorial 或 Neobrutalism
仪表盘     → Bento Grid 或 Glassmorphism
```

---

## 🚫 设计反模式大全 (Design Anti-Patterns Complete)

> *来源：design-wizard skill anti-patterns — 10 大 AI 设计雷区，含代码对比和替代方案。*

### 反模式速查表

| # | 反模式 | 问题 | 替代 |
|---|--------|------|------|
| 1 | **Hero 徽章** | 标题上方放「AI-Powered」「New」标签 | 直接用标题开场，用副标题补充 |
| 2 | **通用字体** | Inter / Roboto / Arial / system-ui | Instrument Serif / Outfit / Cabinet Grotesk / Satoshi |
| 3 | **紫蓝渐变+白底** | 每个 SaaS 都用的套路配色 | 单色强调 / 暗色主题 / 温暖中性色+跳色 |
| 4 | **通用几何装饰** | 模糊圆圈/色块/抽象线条 | 不装饰 / 有意图的边框 / 品牌图形 |
| 5 | **过度圆角** | 全局大圆角 / 全 pill | 混合尖锐和圆角 / 尖锐为主，圆角留给按钮与卡片 |
| 6 | **模板化布局** | Hero→Features→Testimonials→CTA→Footer | 不对称 / 单列叙事 / 案例研究 |
| 7 | **通用文案** | 「All-in-One」「Boost Productivity」 | 具体痛点 / 观点鲜明 / 具体数字 |
| 8 | **过度使用图库照片** | 指着屏幕笑的人 / 握手 / 3D 抽象形 | 无图片纯排版 / 实际产品截图 / 定制插画 |
| 9 | **低质量暗色模式** | #000 纯黑 / 灰上堆灰 / 低对比度 | #0a0a0a 或 #121212 / 白色高对比文字 / 渐变透明度 |
| 10 | **动画滥用** | 弹跳 CTA / 旋转 Logo / 脉冲元素 / 视差泛滥 | 细腻 hover / 焦点指示 / 页面转场 / 微交互 |

### 替代字体推荐

| 用途 | ❌ 过度使用的 | ✅ 推荐替代 |
|------|-------------|-----------|
| 展示标题 | Inter, Poppins | Instrument Serif, Fraunces, Clash Display, Cabinet Grotesk |
| 正文阅读 | Roboto, Open Sans | Outfit, Satoshi, General Sans, Plus Jakarta Sans |
| 等宽代码 | Consolas, Courier | JetBrains Mono, Fira Code, IBM Plex Mono |

### AI 文案禁语表

以下词组在专业设计中出现即暴露"AI 生成"：

```
❌ All-in-one platform
❌ Boost productivity
❌ Streamline your workflow
❌ Cutting-edge solution
❌ Transform your business
❌ Next-generation
❌ Seamless integration
❌ Start your free trial
```

✅ 替代：陈述具体问题 → 展示转变 → 用具体语言

### 动画规范（反滥用）

```
❌ animate-bounce / animate-pulse 在 CTA 上
❌ animate-spin 在 Logo 上
❌ 所有元素 fade-in-up on scroll
❌ 视差滚动泛滥

✅ `transition` 150–300ms；hover 优先改颜色/边框，慎用 scale
✅ `:focus-visible { outline: 2px solid var(--accent) }`
✅ 骨架屏加载态
✅ @media (prefers-reduced-motion: reduce) { animation-duration: 0.01ms !important; }
```

---

## 📚 参考资源（References）

### 设计规范文档
- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Windows UX Guidelines](https://learn.microsoft.com/windows/apps/design/)

### 设计工具
- [Figma Community](https://www.figma.com/community)
- [Sketch Repository](https://sketchrepo.com)
- [Dribbble Inspiration](https://dribbble.com/popular)

### 学习资源
- [Google Web Design Certification](https://grow.google/design/)
- [Nielsen Norman Group](https://www.nngroup.com/articles/)
- [UX Collective (Medium)](https://uxdesign.cc/)

---

**保持更新，持续改进！** ✨🎨
