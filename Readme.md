# GeorgeHuaR.github.io

本项目是一个本地优先的个人导航 SPA 工程，使用原生 HTML/CSS/JavaScript 实现。当前不引入构建工具，直接通过 `index.html` 运行和部署到 GitHub Pages。

## 当前入口

- `index.html`：应用入口，包含左侧导航栏和右侧页面渲染区。
- `style.css`：全局结构、通用组件、页面样式、响应式规则和主题 token 兜底值。
- `themes.css`：主题配方、主题 token 覆盖和主题专属组件覆盖。
- `data.js`：默认书签数据源。
- `PageConfig.js`：导航和页面路由配置。
- `main.js`：核心模块，包含状态、存储、数据操作、弹窗、Toast、页面加载等逻辑。
- `Pages/*.js`：SPA 页面模块，每个模块通过 `window.PageModules` 注册。
- `Html/GH_本地主页.html`：当前作为 iframe 页面嵌入的旧本地主页。

## CSS 结构约定

V6.4.2 已将主题配方从 `style.css` 拆分到 `themes.css`。当前仍不引入构建工具，也不继续拆分组件级 CSS 文件。

当前 CSS 分层：

```text
style.css
├── Base：全局重置、基础布局、主题变量兜底值
├── Layout：左侧导航栏、右侧主内容区
├── Page - Home：书签主页
├── Theme Controls：设置页中的主题切换控件
├── Components：弹窗、Toast、分类管理弹窗
├── Page - Settings：设置页与图标控制面板
├── Embedded Pages：iframe 页面容器
└── Responsive：移动端响应式适配

themes.css
├── 主题 token：五个风格主题的公共主题契约覆盖
├── 主题私有 token：例如插画主题的手绘描边和贴纸阴影
└── 主题专属组件覆盖：只保留确实无法由通用组件 token 表达的风格差异
```

### 主题系统约定

【V6.3.3】主题系统按“风格主题 + 语义 token”组织。当前暂不拆分自定义强调色，因此“主题”同时包含风格与配色，保留五种风格主题：

- `theme-glass`：玻璃风格，也是当前默认主题。
- `theme-illustration`：插画风格，使用更强描边、块状阴影和轻快配色。
- `theme-light-modern`：浅色现代风格，强调干净面板、低对比边框和柔和阴影。
- `theme-dark-modern`：深色现代风格，延续原深色编辑方向。
- `theme-tech`：科技网格风格。

公共主题契约只定义语义 token，不再按具体控件定义变量。主题专属覆盖可以保留少量私有 token，但必须只服务该主题内部的真实差异。组件应优先读取：

```text
颜色语义：--color-text / --color-accent / --color-info / --color-success / --color-warning / --color-danger / --surface-* / --border-color-*
风格语义：--font-* / --radius-* / --shadow-* / --blur-* / --effect-* / --border-width
```

【V6.4.6】插画风格是当前公共 token 基准。`style.css` 的 `body` 兜底值直接提供完整插画配方，`.theme-illustration` 只维护手绘描边、贴纸阴影等主题私有细节和组件覆盖，避免基准主题重复声明同一套公共变量。

【V6.4.6】表面 token 只使用角色命名：

```text
--surface-shell：应用壳层和常驻结构区域，例如侧栏。
--surface-panel：大容器区域，例如 content-card 和底部 toolbar-container。
--surface-card：信息卡片区域，例如 bookmark-card。
--surface-control / --surface-input / --surface-overlay：控件、输入框和浮层。
```

`--surface-1/2/3` 已从主题契约中移除，主题必须直接声明角色 surface，避免数字层级继续制造二次映射和兼容负担。

【V6.4.5】全局 border 语义拆分为 `--border-width` 与 `--border-color-*`，不再使用 `--panel-emphasis-border-left` / `--item-emphasis-border-left` 这类包含方向和完整 CSS 声明的 token。组件需要完整边框时直接组合宽度、样式和颜色；主题专属强调边由对应主题的组件覆盖承担。

新增主题时应先确认它是否提供了独立风格，例如字体、背景质感、圆角、阴影、边框和特效差异；如果只是更换强调色，后续应通过强调色自定义实现，而不是新增主题。

主题入口在 `main.js` 的 `THEME_OPTIONS` 中维护，只保留 `className` 与 `label`。设置页根据该清单渲染主题按钮，不再为主题按钮维护单独图标或额外元数据。

【V6.3.4】通用组件尺度也属于主题系统维护范围。`content-card`、底部工具栏、设置页按钮、二级搜索框和状态提示应读取语义 token，不保留旧主题遗留的硬编码阴影、固定圆角或孤立状态色。

### 主页搜索栏约定

【V6.3.2】主页顶部网页搜索栏按 Ant/Input Group 风格处理：搜索引擎选择、输入框和搜索按钮紧贴组合，边框使用主题强调色，搜索按钮左侧直角贴合输入框、右侧圆角作为组合收尾。

搜索栏不为每个小控件单独建立主题变量，也不叠加阴影、发光、位移等复杂动态效果。风格差异优先通过 V6.3.1 的语义 token 继承。

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
- 暂不继续拆分组件级 CSS 文件；当前只保留 `style.css + themes.css` 两文件结构。
- 暂不引入构建工具。
- 暂不做复杂数据 schema 校验。
