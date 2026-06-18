
> V6.X 版本是用CODEX优化后的版本，主要是主题系统优化（新增CSS变量，新增主题等）
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

