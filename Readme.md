# GeorgeHuaR.github.io

本项目是一个本地优先的个人导航 SPA 工程，使用原生 HTML/CSS/JavaScript 实现。当前不引入构建工具，直接通过 `index.html` 运行和部署到 GitHub Pages。

## 当前入口

- `index.html`：应用入口，包含左侧导航栏和右侧页面渲染区。
- `style.css`：全局样式、主题样式、页面样式和响应式规则。
- `data.js`：默认书签数据源。
- `PageConfig.js`：导航和页面路由配置。
- `main.js`：核心模块，包含状态、存储、数据操作、弹窗、Toast、页面加载等逻辑。
- `Pages/*.js`：SPA 页面模块，每个模块通过 `window.PageModules` 注册。
- `Html/GH_本地主页.html`：当前作为 iframe 页面嵌入的旧本地主页。

## CSS 结构约定

V6.2 已在 `style.css` 内完成结构整理和主题变量化，当前仍保持单 CSS 文件，不拆分为多个物理文件。

当前 CSS 分层：

```text
style.css
├── Base：全局重置、基础布局、主题变量默认值
├── Layout：左侧导航栏、右侧主内容区
├── Page - Home：书签主页
├── Theme Controls：主题切换按钮
├── Themes：主题变量与少量主题特效覆盖
├── Components：弹窗、Toast、分类管理弹窗
├── Page - Settings：设置页与图标控制面板
├── Embedded Pages：iframe 页面容器
└── Responsive：移动端响应式适配
```

新增主题时优先在 `Themes` 区域定义 CSS 变量，避免为每个组件重复写 `.theme-xxx .component` 覆盖。

## 书签数据机制

`data.js` 是默认数据源，保存初始书签、分类和搜索引擎。浏览器运行期间的用户修改保存在 `localStorage.bookmarkAppData`。

### 加载规则

页面加载时只判断 `localStorage` 是否存在运行时书签数据：

```text
页面刷新
├── localStorage.bookmarkAppData 存在
│   └── 使用 localStorage 数据，保留用户运行时修改
└── localStorage.bookmarkAppData 不存在
    └── 使用 data.js 初始化 localStorage
```

`data.js` 使用 `VERSION` 字段，运行时数据使用 `version` 字段。版本格式采用日期时间：

```text
YYYY-MM-DD_HH-mm-ss
```

版本字段只用于 Reset 前判断是否提示导出，不参与页面刷新时的数据源选择。

### 版本规则

用户通过页面修改书签或分类时，`localStorage.version` 会更新为当前日期时间，用于标记浏览器运行时数据已经偏离 `data.js`。

会更新版本的操作：

- 新增、编辑、删除书签
- 批量修改书签分类
- 新增、编辑、删除分类

不会更新版本的操作：

- 首次从 `data.js` 初始化
- Reset 重新加载 `data.js`
- Import 导入数据文件
- Export 导出数据文件
- 主题、图标缓存等非书签数据操作

### Reset 规则

点击 Reset 时，只比较运行时版本和 `data.js.VERSION`：

```text
localStorage.version === data.js.VERSION
└── 直接重置为 data.js 默认数据，并显示非阻塞 Toast

localStorage.version !== data.js.VERSION
└── 提示当前浏览器数据可能未导出；确认后重置为 data.js 默认数据
```

如果用户已导出数据但没有替换本地 `data.js`，版本仍不一致，Reset 仍会提示。若用户导出后替换了本地 `data.js`，且 `VERSION` 一致，则 Reset 不再提示导出风险。

### 导入导出

导出仍保持当前项目约定的 `.js` 格式：

```js
window.bookmarkData = {
  VERSION: 'YYYY-MM-DD_HH-mm-ss',
  searchEngines: [],
  categories: [],
  bookmarks: []
};
```

导入也读取上述 `.js` 格式。该功能面向个人本地项目使用，默认只导入自己导出的或可信任的 `data.js` 文件。

## 页面模块约定

当前暂不启用页面脚本懒加载，原因是项目页面数量较少，预加载脚本足够简单稳定。新增 `module` 页面时需要同步修改两处：

```text
新增 module 页面
├── PageConfig.js
│   └── 添加 id/name/icon/type/moduleName
└── index.html
    └── 在 main.js 后引入对应 Pages/*.js
```

页面模块必须注册到 `window.PageModules`，且注册名必须与 `PageConfig.js` 中的 `moduleName` 一致：

```js
window.PageModules = window.PageModules || {};
window.PageModules.HomePage = HomePage;
```

iframe 页面只需要在 `PageConfig.js` 中配置 `type: 'iframe'` 和 `src`，不需要在 `index.html` 中新增页面脚本。

## 已确认暂缓项

- 暂不做页面脚本懒加载。
- 暂不物理拆分 CSS 文件；当前只在 `style.css` 内做分层和变量化。
- 暂不引入构建工具。
- 暂不做复杂数据 schema 校验。
