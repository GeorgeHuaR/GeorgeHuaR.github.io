

## About页核心方案 V6.6.1
- 图片裁剪：建议作为项目的可配置字段 imageFit, 可选 contain/cover
- 缩略图+蒙版：主走马图下方增加一条缩略图导航条，当前图高亮，其他图用半透明蒙版覆盖。
- 数据结构
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







