> 一级标题倒序记录

# V7.3 编辑器开发

[changelogPage改名EditorPage]【V7.3.1】✅

【V7.3.2】 基本功能实现
- 实现待办编辑器 MVP：多清单管理、待办 CRUD、优先级、排序过滤
- 新增 editorPage.css 独立样式，动态加载，.editor- 命名空间隔离
- 修复 UI 反馈：输入框 focus 阴影、默认筛选改为"全部"、复选框/优先级/编辑框尺寸调整、删除按钮右对齐
- 输入框默认启用 accent 边框+阴影、优先级占位空心圆、删除按钮仅已完成显示

【V7.3.3】 样式优化+功能更新
- 修复 sidebar 分隔线（border-color-light → border-color-subtle）
- 删除按钮 margin-left:auto 移除，恢复自然排列
- 待办项新增 MM-DD 日期戳 pill
- 宽屏布局优化：.editor-wrapper 增加 max-width: 960px;

【V7.3.4】 移动端适配
- 移动端 < 768px 时，侧栏与待办区切换显示（通过按钮切换"清单"↔"待办"）
- 新增 panelClass() 控制移动端面板显隐
- 选中清单或新建清单后自动切回待办视图

【V7.3.5】 右侧时间日期面板
- 新增 .editor-right-panel，≥ 1024px 时显示，< 768px 不干扰移动端
- 数字时钟：HH:MM 大字 + 年月日星期，setInterval 每秒更新
- 当月月历：周一始，今天高亮，只读无交互

【V7.3.6】 滚动条修复
- .editor-wrapper 改用 position:absolute 精确填充 .main-content 内容区，消除外层溢出滚动条
- 移除 height:100% 导致的 padding 冲突
- About 页：.main-content 增加 max-height:100vh，溢出不撑高 body，触发主题滚动条而非文档默认滚动条
- ❌ ———— 可能影响加载性能！

---

# 个人主页开发

## V6.6.1 DS-AboutPage初版发布

实现了基本功能，但很多细节需要优化；
与CODEX的方案对比后，执行V7.1优化

【核心方案 V6.6.1】

- 图片裁剪：建议作为项目的可配置字段 imageFit, 可选 contain/cover
- 缩略图+蒙版：主走马图下方增加一条缩略图导航条，当前图高亮，其他图用半透明蒙版覆盖。
- 数据结构

```
var projects = [
    {
        id: 'proj-1',
        title: '项目名称',
        description: '项目总体说明文字',
        techTags: ['Vue', 'TypeScript', 'Vite'],
        /* 样式覆盖字段（可选，不填则使用 STYLE_CONFIG 全局默认） */
        showThumbnails: true,         // 是否启用缩略图条
        autoPlay: false,              // 本项目是否自动轮播
        imageFit: 'contain',          // 'contain' | 'cover'
        images: [
            { src: '...', caption: '主页设计稿及交互流程' },
            { src: '...', caption: '移动端适配方案' },
            { src: '...', caption: '暗色主题效果' }
        ]
    }
];
```

## V7.1.1 About页 CSS+JS架构优化

- 独立CSS + `about-*` 命名空间
- 安全HTML转义+防御性编程
- 拆分render
- 单委托事件模型+- Map 存储状态，cleanup更方便
- Lightbox 静态HTML+hidden属性切换
- 动态效果

## V7.1.2 description多段 + Lightbox交互优化

- description 从 String 改为 Array`<string>`，遍历输出多段 `<p>`
- Lightbox 重构为 flex 双层布局（body→prev/figure/next，caption 独立一行）
- 背景滚动锁定（open/close Lightbox 切换 body.overflow）
- 滚轮切换图片 + 300ms 防抖
- 手机端 overflow:auto 原生双指缩放
- 移除计数器，dots 保留在 figure 底部

## V7.1.3 Lightbox 单图 src-swap + 固定卡片布局

- Lightbox 从 track 多 slide 架构改为单 `<img>` src 直接切换，消除 track 布局冲突
- 外层 container 从 flex column 改为 grid place-items:center，撑满视口
- 新增 `.about-lightbox-backdrop` 独立遮罩层（点击关闭），与面板分离
- 面板改为固定深灰 `rgba(25,25,30,0.93)` 卡片 → 后续改为暖灰白 `rgba(245,245,248,0.97)`
- 导航/关闭按钮从 panel 级 flex item 移入 figure 内 absolute 叠放在图片上
- 按钮样式脱离主题变量，使用固定半透明色（黑底 `rgba(0,0,0,0.30)` / hover 0.50）
- caption + counter 文字从主题变量改为固定色值，适配浅色面板
- 移除 Lightbox 内 dots（dots 无 slide 可索引），恢复计数器 "1/N" 与 caption 同行
- 弃用缩放功能（overflow:auto + wheel 切换冲突，功能搁置）
- 修复：走马灯图片 `border-radius` 缺失导致 object-fit:contain 时图片内容直角不贴合容器圆角

## V7.1.4 图文布局优化

- [数据] 新增 `layout: 'featured' | 'standard' | 'compact'` 字段
- [渲染] 卡片改为 CSS Grid 左右分栏（左 copy + 右 media）
- [样式] 替换固定 height 为 `aspect-ratio`，layout 联动比例
- [响应式] ≥1024px Grid 分栏 → <768px 降级单列
- [Grid 列宽] featured: `0.65fr / 1.35fr` 图片~68%，standard: `0.85fr / 1.15fr` 图片~57.5%，compact: `0.95fr / 1.05fr` 图片~52.5%

## V7.1.5 样式微调

- [样式] counter 改为行内白底黑字 pill，移除 caption 分隔符
- [样式] carousel-btn 从圆形改为矩形 40×56 / radius 6px，与 lightbox 导航统一（测试后回退，恢复圆型）
- [样式] caption 文本降级为 description 次要色（var(--color-text-muted)）

## V7.2 Readme 文档重写

- [文档] 移除所有残留版本号标签（【Vx.x.x】共 7 处）
- [文档] 新增项目结构树形图
- [文档] CSS 体系保留架构图，精简主题系统描述（聚焦 token 机制，去掉主题列表和过时说明）
- [文档] 书签数据独立成章，保留加载/同步/reset/导入导出逻辑，去除过时描述
- [文档] 新增开发指导：新页面三步流程 + About 自定义卡片字段说明
- [文档] 移除顶部文档冗余声明（"当前入口"等重复信息）

---

---

# CODEX 结构优化

## V6.1.1 数据加载与同步逻辑优化

【书签源】
    data.js为默认数据源，存放初始书签，用户可手动编辑；localStorage 是运行时存储，用户可以通过界面编辑书签，操作后数据保存在localStorage
【加载逻辑】
    页面加载或刷新优先检查localStorage 中是否有数据，只要用户运行时数据存在，就优先保留用户数据。data.js 更新后不会自动覆盖 localStorage，用户想重新加载默认源时，用“重置”按钮。
【版本信息】与数据优先级
    VERSION格式 ：VERSION: '2026-06-15_19-30-45'
    用户在浏览器修改书签/分类，localStorage.version更新
    点击 Reset 时比较两个版本，若一致则直接加载（改为非阻塞msgbox提示）data.js覆盖缓存；若不一致则弹窗提示，确认后可加载

## V6.3 + .4 主题变量+插画主题

- 主题系统引入CSS变量，重构复用
- 新增主题
- 插画主题单独优化效果
- V6.4.1 主题闪烁问题优化
  【增加极早期主题启动脚本】
  在页面主体渲染前，先同步读取 localStorage.navTheme，把正确主题 class 放到 body 上。后续 main.js 仍保留正式状态初始化。
  `<body class="theme-xxx"> `后紧接着读取缓存替换class
- V6.4.4 插画主题定稿优化（作为基准）
- V6.4.5 变量语义明确

## V6.5 书签排序功能

> OpenCode的 Deepseek V4 Flash经过两轮讨论直接敲定方案，用很少的代码修改实现了主页书签排序功能！

【方案概述】
    1. 不改渲染策略：每次 move 完后直接调 renderBookmarkGrid() 全量重建即可，按钮触发的操作没有「拖拽过程中间状态」需要维护
    2. 数据操作原子化：每次只 swap 两条记录的 sortOrder，无需复杂的序列重算
    3. 与现有编辑模式完美融合：复用 updateActionButtons() 的 disable 逻辑，新增按钮直接放入已有 btn 组
    4. CSS Grid 兼容：按钮操作不依赖卡片在网格中的视觉位置

---
