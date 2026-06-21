/** ---------------------------------------------------
 * @brief:      个人介绍页面模块 - 项目作品集展示（V7.1.3）
 * @file:       aboutPage.js
 * @author:     GeorgeHua
 * @date:       2026/06/21
 * @version:    V7.1.3
 * @details:    Lightbox 单图 src 交换 + 固定深色卡片；按钮 absolute 叠入
 *              figure（prev/next/close）；滚轮切换+300ms防抖；背景锁定
 *----------------------------------------------------*/

const AboutPage = (function () {
    /* ==================== 1. 全局配置 ==================== */
    var STYLE_CONFIG = {
        autoPlay: false,
        autoPlayInterval: 6000,
        transitionDuration: 400
    };

    /* ==================== 2. 项目数据 ==================== */
    var projects = [
        {
            id: 'demo-1',
            title: '示例项目一：个人导航站',
            description: [
                '基于纯前端 SPA 架构的个人导航站，支持多主题切换、书签管理。',
                '书签支持分类筛选、排序和搜索引擎集成。',
                '数据持久化使用 localStorage，支持导入导出。'
            ],
            techTags: ['JavaScript', 'CSS3', 'LocalStorage'],
            showThumbnails: true,
            autoPlay: false,
            imageFit: 'contain',
            images: [
                { src: 'Assets/AboutMe/微信图片_20251024163842_22_32.jpg', caption: '首页——书签网格与分类工具栏' },
                { src: 'Assets/AboutMe/微信图片_20251024163843_23_32.jpg', caption: '深色主题下的页面效果展示' }
            ]
        },
        {
            id: 'demo-2',
            title: '示例项目二：数据可视化面板',
            description: [
                '多图走马灯演示项目，展示三张不同场景与交互状态的截图。',
                '用于测试走马灯组件在 multi-image 场景下的切换、缩略图、自动轮播等功能表现。'
            ],
            techTags: ['ECharts', 'Vue', 'SCSS'],
            showThumbnails: true,
            autoPlay: true,
            imageFit: 'contain',
            images: [
                { src: 'Assets/AboutMe/微信图片_20251024163843_24_32.jpg', caption: '仪表盘——关键指标概览' },
                { src: 'Assets/AboutMe/微信图片_20251024163844_25_32.jpg', caption: '数据趋势——时间序列分析' },
                { src: 'Assets/AboutMe/微信图片_20251024163845_26_32.jpg', caption: '用户画像——多维数据聚合' }
            ]
        },
        {
            id: 'demo-3',
            title: '示例项目三：工具集应用',
            description: [
                '单张图片项目，用于演示走马灯在单图情况下的降级表现。'
            ],
            techTags: ['Python', 'Flask', 'SQLite'],
            showThumbnails: false,
            imageFit: 'contain',
            images: [
                { src: 'Assets/AboutMe/p壁纸13.png', caption: '命令行工具运行界面' }
            ]
        },
        {
            id: 'demo-4',
            title: '示例项目四：移动端解决方案',
            description: [
                '包含多张移动端设计稿与交互原型预览，展示不同页面布局方案。',
                '涵盖首页、个人中心、设置页等核心页面的交互流程。'
            ],
            techTags: ['React Native', 'TypeScript', 'Styled Components'],
            showThumbnails: true,
            autoPlay: false,
            imageFit: 'contain',
            images: [
                { src: 'Assets/AboutMe/p壁纸14.png', caption: '移动端首页布局方案' },
                { src: 'Assets/AboutMe/p壁纸17.png', caption: '个人中心页面交互流程' }
            ]
        },
        {
            id: 'demo-5',
            title: '示例项目五：组件库设计',
            description: [
                '通用 UI 组件库的设计与实现，涵盖按钮、表单、弹窗等常见交互组件的视觉规范。',
                '使用 Storybook 进行组件展示与文档管理，支持主题变量实时切换预览。'
            ],
            techTags: ['Storybook', 'React', 'CSS Variables'],
            showThumbnails: true,
            autoPlay: true,
            imageFit: 'contain',
            images: [
                { src: 'Assets/AboutMe/p壁纸7.png', caption: 'Button & Input 组件概览' },
                { src: 'Assets/AboutMe/微信图片_20251024163842_22_32.jpg', caption: '弹窗与 Toast 交互演示' }
            ]
        }
    ];

    /* ==================== 3. 内部状态 ==================== */
    var pageRoot = null;
    var carouselTimers = new Map();       // projectId → timerId
    var currentSlideByProject = new Map(); // projectId → slideIndex
    var lightboxState = null;             // { projectId, imageIndex } 或 null
    var lastWheelTime = 0;               // 滚轮防抖时间戳
    var WHEEL_DEBOUNCE = 300;            // 滚轮防抖间隔（ms）
    var wheelHandler = null;             // 滚轮事件监听器引用
    var clickHandler = null;
    var mouseenterHandler = null;
    var mouseleaveHandler = null;
    var keydownHandler = null;

    /* ==================== 4. 工具函数 ==================== */
    /** 转义 HTML 特殊字符，避免项目数据中的 < > & " ' 破坏 DOM */
    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    /** 属性值转义（行为和 escapeHtml 一致，单独保留函数名便于后续区分 URL 等字段） */
    function escapeAttribute(value) { return escapeHtml(value); }

    /** CSS.escape 兼容封装，用于 data 属性选择器中的特殊字符 */
    function cssEscape(value) {
        if (window.CSS?.escape) return window.CSS.escape(value);
        return String(value).replaceAll('"', '\\"');
    }

    /** 获取项目图片数组，防御性取值保证返回数组而非 undefined/null */
    function getProjectImages(project) {
        return Array.isArray(project?.images) ? project.images : [];
    }

    /** 将任意索引归一到 [0, length) 范围内（取模循环）
     *  负数也能正确翻转：(-1 % 3 + 3) % 3 = 2 */
    function normalizeIndex(index, length) {
        if (!length) return 0;
        return ((index % length) + length) % length;
    }

    /** 根据 projectId 查找项目配置 */
    function findProject(projectId) {
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === projectId) return projects[i];
        }
        return null;
    }

    /** 获取图片适配类名 */
    function getFitClass(project) {
        return (project.imageFit === 'cover')
            ? 'about-media-frame--cover'
            : 'about-media-frame--contain';
    }

    /** 渲染多段 description 为多个 <p> 标签
     *  支持数组（多段）和字符串（向后兼容兜底） */
    function renderDescription(desc) {
        var arr = Array.isArray(desc) ? desc : (desc ? [desc] : []);
        return arr.map(function (p) {
            var text = (p && typeof p === 'string') ? escapeHtml(p) : '';
            return text ? '<p class="about-project-description">' + text + '</p>' : '';
        }).join('');
    }

    /* ==================== 5. 渲染函数 ==================== */
    function render() {
        return ''
            + '<div class="content-card about-intro">'
            +   '<h2>👤 关于我</h2>'
            +   '<p>GeorgeHua 的个人导航站，这里展示了我参与和开发的一些项目。点击图片可查看原图。</p>'
            + '</div>'
            + '<h2 class="about-section-title">🚧 个人项目展示</h2>'
            + '<div data-about-page>'
            +   projects.map(renderProjectCard).join('')
            +   renderLightbox()
            + '</div>';
    }

    function renderProjectCard(project) {
        var images = getProjectImages(project);
        var total = images.length;
        var showMultiple = total > 1;
        var fitClass = getFitClass(project);
        var firstImage = images[0] || { src: '', caption: '' };
        var pid = escapeAttribute(project.id);

        /* 预生成幻灯片 HTML */
        var slidesHtml = '';
        for (var si = 0; si < images.length; si++) {
            var img = images[si];
            var altText = img.alt || project.title + ' - 图片' + (si + 1);
            slidesHtml += '<div class="about-carousel-slide">'
                + '<img src="' + escapeAttribute(img.src) + '" alt="' + escapeAttribute(altText) + '" loading="lazy">'
                + '</div>';
        }

        /* 预生成箭头 HTML */
        var arrowsHtml = showMultiple
            ? '<button class="about-carousel-btn about-carousel-btn--prev" data-about-prev="' + pid + '" aria-label="上一张">‹</button>'
            + '<button class="about-carousel-btn about-carousel-btn--next" data-about-next="' + pid + '" aria-label="下一张">›</button>'
            : '';

        /* 预生成圆点 HTML */
        var dotsHtml = '';
        if (showMultiple) {
            var dotItems = '';
            for (var di = 0; di < total; di++) {
                dotItems += '<span class="about-carousel-dot' + (di === 0 ? ' active' : '') + '" data-about-slide="' + pid + '" data-about-slide-index="' + di + '"></span>';
            }
            dotsHtml = '<div class="about-carousel-dots">' + dotItems + '</div>';
        }

        /* 缩略图条 */
        var thumbsHtml = (showMultiple && project.showThumbnails) ? renderThumbnails(project) : '';

        return ''
            + '<div class="about-project-card ' + fitClass + '" data-about-project="' + pid + '">'
            +   '<div class="about-project-copy">'
            +     '<h3 class="about-project-title">' + escapeHtml(project.title) + '</h3>'
            +     renderTags(project.techTags)
            +     renderDescription(project.description)
            +   '</div>'
            +   '<div class="about-media-area">'
            +     '<div class="about-media-frame">'
            +       '<div class="about-carousel-track" data-about-track="' + pid + '">'
            +         slidesHtml
            +       '</div>'
            +       arrowsHtml
            +       dotsHtml
            +     '</div>'
            +     '<div class="about-media-caption">'
            +       '<span class="about-caption-text" data-about-caption="' + pid + '">' + escapeHtml(firstImage.caption || '') + '</span>'
            +       '<span class="about-caption-sep">·</span>'
            +       '<span class="about-media-counter" data-about-counter="' + pid + '">1 / ' + total + '</span>'
            +     '</div>'
            +     thumbsHtml
            +   '</div>'
            + '</div>';
    }

    function renderTags(tags) {
        if (!tags || !tags.length) return '';
        return '<div class="about-tag-list">'
            + tags.map(function (tag) {
                return '<span class="about-tag">' + escapeHtml(tag) + '</span>';
            }).join('')
            + '</div>';
    }

    function renderThumbnails(project) {
        var images = getProjectImages(project);
        var pid = escapeAttribute(project.id);
        return '<div class="about-thumbnail-strip">'
            + images.map(function (img, i) {
                return '<div class="about-thumbnail' + (i === 0 ? ' active' : '') + '" data-about-thumb="' + pid + '" data-about-slide-index="' + i + '">'
                    + '<img src="' + escapeAttribute(img.src) + '" alt="" loading="lazy">'
                    + '</div>';
            }).join('')
            + '</div>';
    }

    function renderLightbox() {
        return ''
            + '<div class="about-lightbox" data-about-lightbox hidden>'
            +   '<div class="about-lightbox-backdrop" data-about-close></div>'
            +   '<div class="about-lightbox-panel">'
            +     '<figure class="about-lightbox-figure">'
            +       '<button class="about-lightbox-close" data-about-close aria-label="关闭">✕</button>'
            +       '<button class="about-lightbox-nav about-lightbox-nav--prev" data-about-lightbox-prev aria-label="上一张">‹</button>'
            +       '<img class="about-lightbox-image" data-about-lightbox-image alt="">'
            +       '<button class="about-lightbox-nav about-lightbox-nav--next" data-about-lightbox-next aria-label="下一张">›</button>'
            +       '<figcaption class="about-lightbox-caption">'
            +         '<span data-about-lightbox-caption></span>'
            +         '<span class="about-lightbox-counter" data-about-lightbox-counter></span>'
            +       '</figcaption>'
            +     '</figure>'
            +   '</div>'
            + '</div>';
    }

    /* ==================== 6. 走马灯控制 ==================== */
    function stepProjectSlide(projectId, direction, userInitiated) {
        var project = findProject(projectId);
        if (!project) return;
        var currentIndex = currentSlideByProject.get(projectId) || 0;
        setProjectSlide(projectId, currentIndex + direction, userInitiated);
    }

    function setProjectSlide(projectId, nextIndex, userInitiated) {
        var project = findProject(projectId);
        if (!project) return;
        var images = getProjectImages(project);
        if (!images.length) return;

        var normalizedIndex = normalizeIndex(nextIndex, images.length);
        var card = pageRoot.querySelector('[data-about-project="' + cssEscape(projectId) + '"]');
        if (!card) return;

        currentSlideByProject.set(projectId, normalizedIndex);

        /* 通过 translateX 滑动轨道 */
        var track = card.querySelector('[data-about-track="' + cssEscape(projectId) + '"]');
        if (track) {
            var duration = STYLE_CONFIG.transitionDuration || 400;
            var offset = -(normalizedIndex * 100);
            track.style.transition = 'transform ' + duration + 'ms ease';
            track.style.transform = 'translateX(' + offset + '%)';
        }

        /* 更新圆点 active 状态 */
        card.querySelectorAll('[data-about-slide="' + cssEscape(projectId) + '"]').forEach(function (dot) {
            var idx = Number(dot.dataset.aboutSlideIndex);
            dot.classList.toggle('active', idx === normalizedIndex);
        });

        /* 更新 caption + 计数器 */
        var imgData = images[normalizedIndex] || {};
        var captionEl = card.querySelector('[data-about-caption="' + cssEscape(projectId) + '"]');
        var counterEl = card.querySelector('[data-about-counter="' + cssEscape(projectId) + '"]');
        if (captionEl) captionEl.textContent = imgData.caption || '';
        if (counterEl) counterEl.textContent = (normalizedIndex + 1) + ' / ' + images.length;

        /* 更新缩略图 active */
        card.querySelectorAll('[data-about-thumb="' + cssEscape(projectId) + '"]').forEach(function (thumb) {
            var idx = Number(thumb.dataset.aboutSlideIndex);
            thumb.classList.toggle('active', idx === normalizedIndex);
        });

        /* 用户手动切换后重置自动轮播定时器 */
        if (userInitiated) {
            startProjectTimer(project);
        }
    }

    /* ==================== 7. 自动轮播 ==================== */
    function startAutoPlay() {
        projects.forEach(function (project) { startProjectTimer(project); });
    }

    function startProjectTimer(project) {
        if (!project || project.autoPlay === false) return;
        var images = getProjectImages(project);
        if (images.length <= 1) return;

        stopProjectTimer(project.id);
        var interval = STYLE_CONFIG.autoPlayInterval || 6000;
        var timerId = window.setInterval(function () {
            stepProjectSlide(project.id, 1, false);
        }, interval);
        carouselTimers.set(project.id, timerId);
    }

    function stopProjectTimer(projectId) {
        var timerId = carouselTimers.get(projectId);
        if (!timerId) return;
        window.clearInterval(timerId);
        carouselTimers["delete"](projectId);
    }

    /* ==================== 8. Lightbox ==================== */
    function openLightbox(projectId, imageIndex) {
        var project = findProject(projectId);
        if (!project) return;
        var images = getProjectImages(project);
        if (!images.length) return;

        var lightbox = pageRoot.querySelector('[data-about-lightbox]');
        if (!lightbox) return;

        var index = normalizeIndex(imageIndex, images.length);
        lightboxState = { projectId: projectId, imageIndex: index };

        /* 直接更新图片源 + caption + 计数器 */
        updateLightbox(images, index);

        /* 显示/隐藏箭头（单图时隐藏） */
        var prevBtn = lightbox.querySelector('[data-about-lightbox-prev]');
        var nextBtn = lightbox.querySelector('[data-about-lightbox-next]');
        if (prevBtn) prevBtn.hidden = images.length <= 1;
        if (nextBtn) nextBtn.hidden = images.length <= 1;

        lightbox.hidden = false;

        /* 锁定背景滚动 + 绑定滚轮切换 */
        document.body.style.overflow = 'hidden';
        if (!wheelHandler) {
            wheelHandler = handleLightboxWheel;
            lightbox.addEventListener('wheel', wheelHandler, { passive: false });
        }
    }

    function closeLightbox() {
        /* 恢复背景滚动 */
        document.body.style.overflow = '';
        /* 移除滚轮监听 */
        if (wheelHandler) {
            var lb = pageRoot?.querySelector('[data-about-lightbox]');
            if (lb) lb.removeEventListener('wheel', wheelHandler, { passive: false });
            wheelHandler = null;
        }
        var lightbox = pageRoot?.querySelector('[data-about-lightbox]');
        if (lightbox) lightbox.hidden = true;
        lightboxState = null;
        lastWheelTime = 0;
    }

    /** 滚轮切换图片，300ms 防抖 */
    function handleLightboxWheel(event) {
        if (!lightboxState) return;
        var project = findProject(lightboxState.projectId);
        if (!project) return;
        var images = getProjectImages(project);
        if (images.length <= 1) return;

        var now = Date.now();
        if (now - lastWheelTime < WHEEL_DEBOUNCE) return;
        lastWheelTime = now;

        if (event.deltaY > 0) {
            stepLightboxSlide(1);
        } else if (event.deltaY < 0) {
            stepLightboxSlide(-1);
        }
        event.preventDefault();
    }

    function stepLightboxSlide(direction) {
        if (!lightboxState) return;
        var project = findProject(lightboxState.projectId);
        if (!project) return;
        var images = getProjectImages(project);
        if (!images.length) return;

        lightboxState.imageIndex = normalizeIndex(
            lightboxState.imageIndex + direction,
            images.length
        );

        updateLightbox(images, lightboxState.imageIndex);
    }

    function updateLightbox(images, index) {
        var lightbox = pageRoot?.querySelector('[data-about-lightbox]');
        if (!lightbox) return;

        var imgData = images[index] || {};

        /* 切换单图 src */
        var imgEl = lightbox.querySelector('[data-about-lightbox-image]');
        if (imgEl) imgEl.src = imgData.src || '';

        /* 更新 caption */
        var captionEl = lightbox.querySelector('[data-about-lightbox-caption]');
        if (captionEl) captionEl.textContent = imgData.caption || '';

        /* 更新计数器 "1/N" */
        var counterEl = lightbox.querySelector('[data-about-lightbox-counter]');
        if (counterEl) counterEl.textContent = (index + 1) + ' / ' + images.length;
    }

    /* ==================== 9. 事件委托 ==================== */
    function handlePageClick(event) {
        var target = event.target;
        if (!(target instanceof Element)) return;

        var pid, action;

        /* 走马灯箭头 */
        var prevBtn = target.closest('[data-about-prev]');
        var nextBtn = target.closest('[data-about-next]');
        if (prevBtn) { stepProjectSlide(prevBtn.dataset.aboutPrev, -1, true); return; }
        if (nextBtn) { stepProjectSlide(nextBtn.dataset.aboutNext, 1, true); return; }

        /* 圆点跳转 */
        var dot = target.closest('[data-about-slide]');
        if (dot) {
            setProjectSlide(dot.dataset.aboutSlide, Number(dot.dataset.aboutSlideIndex), true);
            return;
        }

        /* 缩略图点击 */
        var thumb = target.closest('[data-about-thumb]');
        if (thumb) {
            setProjectSlide(thumb.dataset.aboutThumb, Number(thumb.dataset.aboutSlideIndex), true);
            return;
        }

        /* 主图点击 → 打开 Lightbox */
        var openTrigger = target.closest('.about-carousel-slide img');
        if (openTrigger) {
            var card = openTrigger.closest('[data-about-project]');
            if (!card) return;
            pid = card.dataset.aboutProject;
            var currentIndex = currentSlideByProject.get(pid) || 0;
            stopProjectTimer(pid);
            openLightbox(pid, currentIndex);
            return;
        }

        /* Lightbox 关闭（按钮 + 遮罩 backdrop） */
        if (target.closest('[data-about-close]')) { closeLightbox(); return; }

        /* Lightbox 导航 */
        if (target.closest('[data-about-lightbox-prev]')) { stepLightboxSlide(-1); return; }
        if (target.closest('[data-about-lightbox-next]')) { stepLightboxSlide(1); return; }
    }

    function handleMouseEnter(event) {
        var card = event.target.closest?.('[data-about-project]');
        if (card && pageRoot?.contains(card)) {
            stopProjectTimer(card.dataset.aboutProject);
        }
    }

    function handleMouseLeave(event) {
        var card = event.target.closest?.('[data-about-project]');
        if (card && pageRoot?.contains(card)) {
            var project = findProject(card.dataset.aboutProject);
            startProjectTimer(project);
        }
    }

    function handleKeydown(event) {
        if (!lightboxState) return;
        if (event.key === 'Escape') { closeLightbox(); return; }
        if (event.key === 'ArrowLeft') { stepLightboxSlide(-1); event.preventDefault(); return; }
        if (event.key === 'ArrowRight') { stepLightboxSlide(1); event.preventDefault(); }
    }

    /* ==================== 10. 生命周期 ==================== */
    function init() {
        pageRoot = document.querySelector('[data-about-page]');
        if (!pageRoot) return;

        /* 初始化每个项目的当前索引 */
        projects.forEach(function (proj) {
            currentSlideByProject.set(proj.id, 0);
        });

        /* 图片加载失败兜底 */
        pageRoot.querySelectorAll('.about-carousel-slide img').forEach(function (img) {
            if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                showImgError(img);
            }
            img.addEventListener('error', function () { showImgError(this); });
        });

        /* 缩略图加载失败静默处理 */
        pageRoot.querySelectorAll('.about-thumbnail img').forEach(function (img) {
            img.addEventListener('error', function () { this.style.display = 'none'; });
            if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                img.style.display = 'none';
            }
        });

        /* 将每个轨道初始定位到第 0 帧 */
        pageRoot.querySelectorAll('[data-about-track]').forEach(function (track) {
            track.style.transform = 'translateX(0%)';
        });

        /* 绑定事件委托 */
        clickHandler = handlePageClick;
        mouseenterHandler = handleMouseEnter;
        mouseleaveHandler = handleMouseLeave;
        keydownHandler = handleKeydown;

        pageRoot.addEventListener('click', clickHandler);
        pageRoot.addEventListener('mouseenter', mouseenterHandler, true);
        pageRoot.addEventListener('mouseleave', mouseleaveHandler, true);
        document.addEventListener('keydown', keydownHandler);

        startAutoPlay();
    }

    function showImgError(img) {
        if (img.parentElement.querySelector('.about-image-placeholder')) return;
        img.style.display = 'none';
        var placeholder = document.createElement('div');
        placeholder.className = 'about-image-placeholder';
        placeholder.textContent = '⚠️ 图片加载失败';
        img.parentElement.appendChild(placeholder);
    }

    function cleanup() {
        carouselTimers.forEach(function (id) { window.clearInterval(id); });
        carouselTimers.clear();
        currentSlideByProject.clear();
        lightboxState = null;

        /* 移除滚轮监听 */
        if (wheelHandler && pageRoot) {
            var lb = pageRoot.querySelector('[data-about-lightbox]');
            if (lb) lb.removeEventListener('wheel', wheelHandler, { passive: false });
            wheelHandler = null;
        }

        if (pageRoot && clickHandler) {
            pageRoot.removeEventListener('click', clickHandler);
            pageRoot.removeEventListener('mouseenter', mouseenterHandler, true);
            pageRoot.removeEventListener('mouseleave', mouseleaveHandler, true);
        }
        if (keydownHandler) {
            document.removeEventListener('keydown', keydownHandler);
        }

        pageRoot = null;
        clickHandler = null;
        mouseenterHandler = null;
        mouseleaveHandler = null;
        keydownHandler = null;
        lastWheelTime = 0;
    }

    return {
        render: render,
        init: init,
        cleanup: cleanup
    };
})();

window.PageModules = window.PageModules || {};
window.PageModules.AboutPage = AboutPage;
