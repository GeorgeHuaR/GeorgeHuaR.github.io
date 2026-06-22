【个人主页V7.1优化方案】




## V7.1.5 样式微调

- counter计数器样式：保留原有位置（caption 行内），只改 pill 样式，白色背景+黑色文本
  counter 改 pill 后同步移除caption 分隔符
- carousel-btn导航按钮样式：改为矩形与 lightbox 统一 ❌
  ———— 测试效果并不好，回退修改
- 文本展示样式：
  - caption图片描述文本不应该太显眼，改为当前的description文本样式即可；
  - description 文本是正文内容，当前颜色偏淡，是否建议加深❌——保持当前 var(--color-text-muted)，不做加深

