# GeorgeHuaR.github.io

本项目是一个本地优先的个人导航 SPA 工程，使用原生 HTML/CSS/JavaScript 实现，不引入构建工具，直接通过 `index.html` 运行和部署到 GitHub Pages。

---

# 项目结构

```
GeorgeHuaR.github.io/
├── index.html           # 应用入口，加载所有脚本
├── style.css            # 全局结构、通用组件、主题变量兜底值
├── themes.css           # 五套主题配方的 token 覆盖
├── data.js              # 默认书签数据源
├── PageConfig.js        # 导航栏与页面路由配置
├── main.js              # 核心模块（状态、存储、页面加载、弹窗）
├── Pages/
│   ├── aboutPage.js     # About 页 + About 页CSS
│   ├── aboutPage.css
│   ├── homePage.js      # 书签主页
│   ├── editorPage.js    # 编辑器
│   └── settingsPage.js  # 设置页
├── Assets/
│   └── AboutMe/         # About 页项目展示图片
└── Html/                # iframe 嵌入页面
```

---

# 技术架构

## CSS 体系

当前 CSS 按职责分为两层文件：

```
style.css（全局）
├── Base：重置、基础布局、主题变量兜底
├── Layout：左侧导航 + 右侧内容区
├── Page - Home：书签主页
├── Theme Controls：主题切换控件
├── Components：弹窗、Toast、分类管理
├── Page - Settings：设置页
├── Embedded Pages：iframe 容器
└── Responsive：响应式适配

themes.css（主题配方）
├── 主题 token：五个风格的主题变量覆盖
├── 主题私有 token：例如插画主题的手绘描边
└── 主题专属组件覆盖
```

不引入构建工具，也不继续拆分组件级 CSS 文件。

## CSS-主题系统

主题系统基于 CSS 变量实现，`style.css` 的 `body` 上声明完整兜底值，`themes.css` 按 `.theme-xxx` 类覆盖对应变量。

表面 token 使用角色命名而非数字层级：

```
--surface-shell     应用壳层（侧栏等常驻结构）
--surface-panel     大容器（content-card、工具栏）
--surface-card      信息卡片（bookmark-card）
--surface-control   控件、输入框
--surface-overlay   浮层
```

颜色语义使用 `--color-text / --color-accent / --color-info / --surface-* / --border-color-*`，风格语义使用 `--font-* / --radius-* / --shadow-* / --border-width`。组件优先读取语义 token，不在组件层硬编码值。

## 页面框架

应用采用 SPA 路由，左侧导航栏 + 右侧内容区。所有页面模块通过 `window.PageModules` 注册，模块名与 `PageConfig.js` 中的 `moduleName` 一致：

```js
window.PageModules = window.PageModules || {};
window.PageModules.HomePage = HomePage;   // 注册名必须与 moduleName 一致
```

页面模块需暴露 `{ render, init, cleanup }` 三个方法：

- `render()` → 返回 HTML 字符串
- `init()` → 绑定事件、启动定时器
- `cleanup()` → 销毁事件、清除定时器

iframe 类型页面只需在 `PageConfig.js` 配置 `type: 'iframe'` 和 `src`，无需新增脚本。

## 书签数据加载与同步

`data.js` 是默认数据源，保存初始书签、分类和搜索引擎。浏览器运行期间的用户编辑保存在 `localStorage.bookmarkAppData`。

**加载规则**

页面刷新时只判断 `localStorage` 是否存在运行时数据：

```
页面刷新
├── localStorage.bookmarkAppData 存在 → 使用 localStorage，保留用户修改
└── 不存在 → 使用 data.js 初始化 localStorage
```

**版本规则**

`data.js` 使用 `VERSION` 字段，运行时数据使用 `version` 字段。格式为 `YYYY-MM-DD_HH-mm-ss`。版本只用于 Reset 前的导出提示判断，不参与页面加载时的数据源选择。

会更新 `localStorage.version` 的操作：

- 新增、编辑、删除书签
- 批量修改书签分类
- 新增、编辑、删除分类

不会更新版本的操作：首次初始化、Reset 加载、导入导出、主题切换等非书签操作。

**Reset 规则**

```
localStorage.version === data.js.VERSION
  → 直接重置为 data.js 默认数据，显示非阻塞 Toast

localStorage.version !== data.js.VERSION
  → 提示当前浏览器数据可能未导出，确认后重置
```

**导入导出**

导出格式为 `.js` 文件：

```js
window.bookmarkData = {
  VERSION: 'YYYY-MM-DD_HH-mm-ss',
  searchEngines: [],
  categories: [],
  bookmarks: []
};
```

导入读取上述格式。该功能面向个人本地项目，默认只导入可信任的数据文件。

---

# 开发指导

## 新增页面

三步完成：

1. **在 `PageConfig.js` 注册**
   ```js
   { id: 'my-page', name: '我的页面', icon: '📄', type: 'module', moduleName: 'MyPage' }
   ```

2. **在 `index.html` 引入脚本**
   ```html
   <script src="Pages/myPage.js"></script>
   ```

3. **实现模块**，注册到 `window.PageModules`
   ```js
   const MyPage = (function () {
     function render() { return '<div>...</div>'; }
     function init() { /* 绑定事件 */ }
     function cleanup() { /* 清理事件 */ }
     return { render, init, cleanup };
   })();
   window.PageModules = window.PageModules || {};
   window.PageModules.MyPage = MyPage;
   ```

## 自定义 About 项目卡片

About 页的项目数据定义在 `Pages/aboutPage.js` 的 `projects` 数组中，每个项目的完整字段：

```js
{
  id: 'proj-1',
  title: '项目名称',
  description: [
    '项目总体说明第一段',
    '第二段将渲染为独立的 <p>'
  ],
  techTags: ['JavaScript', 'CSS3'],
  layout: 'featured',           // 'featured' | 'standard' | 'compact'
  imageFit: 'contain',          // 'contain' | 'cover'
  showThumbnails: true,         // 是否展示底部缩略图
  autoPlay: false,              // 多图时是否自动轮播
  images: [
    { src: 'Assets/AboutMe/xxx.jpg', caption: '图片说明' },
    { src: 'Assets/AboutMe/yyy.jpg', caption: '第二张截图' }
  ]
}
```

**字段说明**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `layout` | string | `'standard'` | `featured`（图片列更宽）/ `standard`（均衡）/ `compact`（4:3 紧凑） |
| `imageFit` | string | `'contain'` | `contain` 完整显示截图 / `cover` 裁剪填充（适合封面图） |
| `showThumbnails` | boolean | `false` | 多图时底部缩略图条 |
| `autoPlay` | boolean | `false` | 多图自动轮播，单图自动忽略 |
| `images[].caption` | string | `''` | 每张图片的说明文字，显示在走马灯下方 |

## 页面改名
> 主要修改 Pages/xx.js + PageConfig + index.html + Readme 四处
- Pages：文件名 + 模块变量名 + window.PageModules 注册名，全量替换
- PageConfig：`id` + `moduleName` 全量替换
- index.html：`<script src="Pages/xxx.js">` 加载脚本路径修改
- Readme：项目结构树中文件名更新







