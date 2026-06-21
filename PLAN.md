【个人主页V7.1优化方案】

> 7.1.1 CSS + JS架构优化已经完成

---

## V7.1.2 已实施（2026-06-21）

### [数据结构] description 多段支持

- 类型：`String` → `Array<String>`
- 渲染：数组元素逐个 `<p>` 输出，段落间 6px 间距

> 明确：「数组元素逐个 `<p>` 输出」指遍历数组，每个元素渲染为一个独立的 `<p>` 标签，
> 非 `<br>` 拼接或 `<ul><li>` 列表。

示例：

```js
description: [
  '基于纯前端 SPA 架构的个人导航站，支持多主题切换、书签管理。',
  '书签支持分类筛选、排序和搜索引擎集成。',
  '数据持久化使用 localStorage，支持导入导出。'
]
```

## V7.1.3 [Lightbox 原图预览样式]

【核心方案】（参考CODEX）
**单图 src 直接切换**
openLightbox() 时 imgElement.src = images[index].src，切换时直接改 img.src

**鼠标滚轮功能**

- 打开 Lightbox 时锁定背景滚动（`document.body.style.overflow = 'hidden'`）
- 滚动滚轮切换图片（`deltaY > 0` 下一张，`deltaY < 0` 上一张）
- 防抖间隔 300ms
- 关闭 Lightbox 后恢复背景滚动

**手机端缩放功能**【❌为了避免冲突，暂时搁置该功能】
手机端缩放功能

- 方案：.about-lightbox-figure { overflow: auto }
  img { max-width: 100%; max-height: 100vh; object-fit: scale-down; display: block; }
- 浏览器原生支持双指缩放和平移，无需自定义手势
- 与单图 src swap 架构无冲突（原冲突只发生在 track 模式下）
- 提示：overflow:auto 不干扰 wheel 切换（wheel 事件在 panel 层捕获，不传到 figure）【缩放搁置期间无冲突】

**交互控件定位**

```
about-lightbox-panel（flex row, align-items:center）
  ├── prev
  ├── about-lightbox-figure（flex column, flex:1）
  │   ├── img（单图 overflow:hidden + object-fit:contain）
  │   └── figcaption（caption, 自然左对齐）
  └── next
```

- 移除dots: dots表达的是"多张 slide 中当前在哪一帧"，单图模式下没有 slide，只有 src 替换，dots 没有意义
- 新增计数器1/N: 与 caption 同一行，作为 figcaption 的 flex 行右侧

**图片的文本说明**
随 figcaption 进入 figure 内部，自然与图片左边缘对齐。文字颜色用 var(--color-on-overlay)（主题化，不再固定 rgba(255,255,255,0.85)）


[样式修正]
给 `<img>` 自身加 border-radius【⚠️只有cover样式才生效！】

---

## V7.1.4 图文布局优化

- 图片容器与图文布局：借鉴 CODEX 样式 的二维控制体系和图文响应式布局

**二维控制体系** = Layout + imageFit 的组合控制
- 新增布局参数：layout: 'featured' | 'standard' | 'compact'，使用 CSS Grid 实现左右分栏，调节图片与文字列的比例
  - featured：图片列更宽（适合重点项目）
  - standard：均衡分配
  - compact：图片 4:3 + 文字列稍宽（适合轻量项目）
- 图片容器：从固定高度改为固定比例 aspect-ratio （layout 联动）


**图文响应式布局** = 不同屏幕尺寸的响应式适配策略
≥1024px (桌面) → Grid 左右分栏正常显示
768–1024px → Grid 列宽微调
<768px → 降级为单列（文字在上、图片在下，与当前 V7.1.3 视觉效果一致）
<480px → 进一步紧凑（图片容器减小）

纯白容器背景❌ —— 我的想法：当前使用主题变量效果可以，没必要改

【样式细节】
- 图片的caption：放在Grid右列
  .about-project-media  ← Grid 右列
    ├── .about-media-frame  ← aspect-ratio 容器
    ├── .about-carousel-caption  ← 图片说明（frame 外部）
    └── .about-thumbnail-strip






---
