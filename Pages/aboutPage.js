/** ---------------------------------------------------
 * @brief:		个人介绍页面模块 - 项目作品集展示
 * @file:		aboutPage.js
 * @author:		GeorgeHua
 * @date:		2026/06/18
 * @version:	V6.6.1
 * @details:	文字在上+图片在下布局；每图 caption + 计数器；缩略图条（蒙版覆盖）；per-project imageFit/autoPlay
 *----------------------------------------------------*/

const AboutPage = (function () {
    /* ==================== 1. 全局配置 ==================== */
    /** ---------------------------------------------------
     * 全局默认配置，按项目可覆盖（通过 projects[].xxx 字段）
     * autoPlay:          全局默认是否自动轮播
     * autoPlayInterval:  自动播放间隔（毫秒）
     * transitionDuration: 切换动画时长（毫秒）
     *----------------------------------------------------*/
    var STYLE_CONFIG = {
        autoPlay: false,
        autoPlayInterval: 6000,
        transitionDuration: 400
    };

    /* ==================== 2. 项目数据 ==================== */
    /** ---------------------------------------------------
     * @brief 项目列表 — 后续用户直接修改此数组
     * @note  techTags:      技术栈标签数组
     *        showThumbnails: 是否显示缩略图条
     *        autoPlay:      本项目是否自动轮播（不填则继承全局）
     *        imageFit:      'contain' | 'cover' 图片适配方式
     *        images[].src:   图片路径（相对网站根目录）
     *        images[].caption: 本张图片的轻量说明文字
     *----------------------------------------------------*/
    var projects = [
        {
            id: 'demo-1',
            title: '示例项目一：个人导航站',
            description: '基于纯前端 SPA 架构的个人导航站，支持多主题切换、书签管理、分类筛选与搜索引擎集成。',
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
            description: '多图走马灯演示项目，展示三张不同场景与交互状态的截图。',
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
            description: '单张图片项目，用于演示走马灯在单图情况下的降级表现。',
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
            description: '包含多张移动端设计稿与交互原型预览，展示不同页面布局方案。',
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
            description: '通用 UI 组件库的设计与实现，涵盖按钮、表单、弹窗等常见交互组件的视觉规范。',
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
    var carouselInstances = [];
    var lightboxInstance = null;
    var contentDelegation = null;

    /* ==================== 4. 渲染函数 ==================== */
    /** ---------------------------------------------------
     * @brief 生成页面完整 HTML
     * @returns {string}
     *----------------------------------------------------*/
    function render() {
        var cardsHtml = '';

        for (var p = 0; p < projects.length; p++) {
            var proj = projects[p];
            var total = proj.images.length;
            var showMultiple = total > 1;

            /* 4a. 图片适配类名 */
            var fitClass = proj.imageFit === 'cover' ? 'image-fit-cover' : 'image-fit-contain';

            /* 4b. 幻灯片帧 HTML */
            var slidesHtml = '';
            for (var i = 0; i < total; i++) {
                var img = proj.images[i];
                slidesHtml += ''
                    + '<div class="project-carousel-slide">'
                    +   '<img src="' + img.src + '" alt="' + proj.title + ' - 图片' + (i + 1) + '" loading="lazy">'
                    + '</div>';
            }

            /* 4c. 切换控件（多图时渲染） */
            var arrowsHtml = showMultiple
                ? '<button class="carousel-arrow carousel-arrow--prev" data-action="prev" aria-label="上一张">‹</button>'
                + '<button class="carousel-arrow carousel-arrow--next" data-action="next" aria-label="下一张">›</button>'
                : '';

            var dotsHtml = '';
            if (showMultiple) {
                var dotItems = '';
                for (var d = 0; d < total; d++) {
                    dotItems += '<span class="carousel-dot' + (d === 0 ? ' active' : '') + '" data-index="' + d + '"></span>';
                }
                dotsHtml = '<div class="carousel-dots">' + dotItems + '</div>';
            }

            /* 4d. 技术标签 */
            var tagsHtml = '';
            if (proj.techTags && proj.techTags.length > 0) {
                var tagItems = '';
                for (var t = 0; t < proj.techTags.length; t++) {
                    tagItems += '<span class="tech-tag">' + proj.techTags[t] + '</span>';
                }
                tagsHtml = '<div class="tech-tags">' + tagItems + '</div>';
            }

            /* 4e. 缩略图条 */
            var thumbHtml = '';
            if (proj.showThumbnails && showMultiple) {
                for (var th = 0; th < total; th++) {
                    thumbHtml += ''
                        + '<div class="thumbnail-item' + (th === 0 ? ' active' : '') + '" data-index="' + th + '">'
                        +   '<img src="' + proj.images[th].src + '" alt="" loading="lazy">'
                        + '</div>';
                }
                thumbHtml = '<div class="thumbnail-strip">' + thumbHtml + '</div>';
            }

            /* 4f. 首张图片的 caption */
            var firstCaption = proj.images[0] ? proj.images[0].caption : '';

            cardsHtml += ''
                + '<div class="project-card ' + fitClass + '" data-project-id="' + proj.id + '">'
                /* 文字在上 */
                +   '<div class="project-header">'
                +     '<h3 class="project-title">' + proj.title + '</h3>'
                +     tagsHtml
                +     '<p class="project-desc">' + proj.description + '</p>'
                +   '</div>'
                /* 图片区域 */
                +   '<div class="project-carousel-container">'
                +     '<div class="project-carousel">'
                +       '<div class="project-carousel-track">'
                +         slidesHtml
                +       '</div>'
                +       arrowsHtml
                +       dotsHtml
                +     '</div>'
                /* 图片说明 + 计数器 */
                +     '<div class="project-carousel-caption">'
                +       '<span class="caption-text">' + firstCaption + '</span>'
                +       '<span class="caption-sep"> · </span>'
                +       '<span class="caption-counter">1 / ' + total + '</span>'
                +     '</div>'
                /* 缩略图条 */
                +     thumbHtml
                +   '</div>'
                + '</div>';
        }

        return ''
            + '<div class="content-card about-intro">'
            +   '<h2>👤 关于我</h2>'
            +   '<p>GeorgeHua 的个人导航站，这里展示了我参与和开发的一些项目。点击图片可查看原图。</p>'
            + '</div>'
            + '<h2 class="projects-section-title">🚧 个人项目展示</h2>'
            + cardsHtml;
    }

    /* ==================== 5. 走马灯管理器 ==================== */
    /** ---------------------------------------------------
     * @brief 创建单个走马灯实例
     * @param {string}   projectId
     * @param {object[]} images - { src, caption }[]
     * @returns {object|null}
     *----------------------------------------------------*/
    function createCarousel(projectId, images) {
        var cardEl = document.querySelector('.project-card[data-project-id="' + projectId + '"]');
        if (!cardEl) return null;

        var carouselContainer = cardEl.querySelector('.project-carousel');
        var track = carouselContainer.querySelector('.project-carousel-track');
        var dots = carouselContainer.querySelectorAll('.carousel-dot');

        /* 获取 caption / counter 元素 */
        var captionEl = cardEl.querySelector('.project-carousel-caption');
        var captionText = captionEl ? captionEl.querySelector('.caption-text') : null;
        var captionCounter = captionEl ? captionEl.querySelector('.caption-counter') : null;

        /* 获取缩略图元素 */
        var thumbnailItems = cardEl.querySelectorAll('.thumbnail-item');

        var total = images.length;
        var currentIndex = 0;
        var timer = null;
        var isAnimating = false;
        var isPaused = false;
        var duration = STYLE_CONFIG.transitionDuration || 400;

        /* 项目级 autoPlay：优先使用项目配置，未设置则继承全局 */
        var proj = getProjectById(projectId);
        var autoPlayEnabled = (proj && proj.autoPlay !== undefined) ? proj.autoPlay : STYLE_CONFIG.autoPlay;
        var autoPlayInterval = STYLE_CONFIG.autoPlayInterval || 6000;

        /* 切换幻灯片 */
        function goTo(index) {
            if (isAnimating) return;
            if (index < 0) index = total - 1;
            if (index >= total) index = 0;
            if (index === currentIndex) return;

            isAnimating = true;
            currentIndex = index;

            /* 滑动轨道 */
            track.style.transition = 'transform ' + duration + 'ms ease';
            track.style.transform = 'translateX(-' + (index * 100) + '%)';

            /* 更新圆点 */
            for (var d = 0; d < dots.length; d++) {
                dots[d].classList.toggle('active', d === index);
            }

            /* 更新图片说明 + 计数器 */
            var imgData = images[index] || {};
            if (captionText) captionText.textContent = imgData.caption || '';
            if (captionCounter) captionCounter.textContent = (index + 1) + ' / ' + total;

            /* 更新缩略图条 active 状态 + 蒙版 */
            for (var th = 0; th < thumbnailItems.length; th++) {
                thumbnailItems[th].classList.toggle('active', th === index);
            }

            setTimeout(function () {
                isAnimating = false;
            }, duration);
        }

        function next() { goTo(currentIndex + 1); }

        function prev() { goTo(currentIndex - 1); }

        /* 启动自动播放 */
        function startAutoPlay() {
            if (total <= 1 || !autoPlayEnabled) return;
            stopAutoPlay();
            timer = setInterval(function () {
                if (!isPaused) next();
            }, autoPlayInterval);
        }

        /* 停止自动播放 */
        function stopAutoPlay() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        /* 销毁实例 */
        function destroy() {
            stopAutoPlay();
            if (carouselContainer._onMouseEnter) {
                carouselContainer.removeEventListener('mouseenter', carouselContainer._onMouseEnter);
                carouselContainer._onMouseEnter = null;
            }
            if (carouselContainer._onMouseLeave) {
                carouselContainer.removeEventListener('mouseleave', carouselContainer._onMouseLeave);
                carouselContainer._onMouseLeave = null;
            }
        }

        /* hover 暂停/恢复 */
        carouselContainer._onMouseEnter = function () { isPaused = true; };
        carouselContainer._onMouseLeave = function () { isPaused = false; };
        carouselContainer.addEventListener('mouseenter', carouselContainer._onMouseEnter);
        carouselContainer.addEventListener('mouseleave', carouselContainer._onMouseLeave);

        /* 初始定位 */
        track.style.transform = 'translateX(0px)';
        startAutoPlay();

        return {
            destroy: destroy,
            goTo: goTo,
            next: next,
            prev: prev,
            startAutoPlay: startAutoPlay,
            stopAutoPlay: stopAutoPlay,
            getCurrentIndex: function () { return currentIndex; },
            getId: function () { return projectId; }
        };
    }

    /** 根据 projectId 查找项目数据 */
    function getProjectById(pid) {
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === pid) return projects[i];
        }
        return null;
    }

    /* ==================== 6. 全屏弹窗 ==================== */
    /** ---------------------------------------------------
     * @brief 打开全屏弹窗查看原图
     * @param {object[]} images     - { src, caption }[]
     * @param {number}   startIndex
     * @note  支持 ESC 关闭，← → 键盘导航
     *----------------------------------------------------*/
    function openLightbox(images, startIndex) {
        if (lightboxInstance) closeLightbox();

        startIndex = startIndex || 0;
        var total = images.length;
        var currentIndex = startIndex;
        var isAnimating = false;

        var overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';

        var closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.innerHTML = '✕';
        closeBtn.setAttribute('aria-label', '关闭');

        var carouselDiv = document.createElement('div');
        carouselDiv.className = 'lightbox-carousel';
        var track = document.createElement('div');
        track.className = 'lightbox-track';

        for (var i = 0; i < total; i++) {
            var slide = document.createElement('div');
            slide.className = 'lightbox-slide';
            var img = document.createElement('img');
            img.src = images[i].src;
            img.alt = '原图 ' + (i + 1);
            img.addEventListener('error', function () {
                this.alt = '加载失败';
                this.style.objectFit = 'none';
            });
            slide.appendChild(img);
            track.appendChild(slide);
        }
        carouselDiv.appendChild(track);

        /* 箭头（多图） */
        var prevBtn, nextBtn;
        if (total > 1) {
            prevBtn = document.createElement('button');
            prevBtn.className = 'lightbox-arrow lightbox-arrow--prev';
            prevBtn.innerHTML = '‹';
            prevBtn.setAttribute('aria-label', '上一张');
            carouselDiv.appendChild(prevBtn);

            nextBtn = document.createElement('button');
            nextBtn.className = 'lightbox-arrow lightbox-arrow--next';
            nextBtn.innerHTML = '›';
            nextBtn.setAttribute('aria-label', '下一张');
            carouselDiv.appendChild(nextBtn);
        }

        /* 圆点（多图） */
        var dotsContainer;
        if (total > 1) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'lightbox-dots';
            for (var j = 0; j < total; j++) {
                var dot = document.createElement('span');
                dot.className = 'lightbox-dot' + (j === startIndex ? ' active' : '');
                dot.dataset.index = j;
                dotsContainer.appendChild(dot);
            }
            carouselDiv.appendChild(dotsContainer);
        }

        /* 计数器 */
        var counter = document.createElement('div');
        counter.className = 'lightbox-counter';
        counter.textContent = (startIndex + 1) + ' / ' + total;

        /* 图片说明（弹窗下方） */
        var captionEl = document.createElement('div');
        captionEl.className = 'lightbox-caption';
        var firstImg = images[startIndex] || {};
        captionEl.textContent = firstImg.caption || '';

        overlay.appendChild(closeBtn);
        overlay.appendChild(carouselDiv);
        overlay.appendChild(counter);
        overlay.appendChild(captionEl);
        document.body.appendChild(overlay);

        document.body.style.overflow = 'hidden';

        /* 初始定位（无过渡） */
        track.style.transition = 'none';
        track.style.transform = 'translateX(-' + (startIndex * 100) + '%)';
        requestAnimationFrame(function () {
            track.style.transition = 'transform 0.4s ease';
        });

        function goTo(index) {
            if (isAnimating) return;
            if (index < 0) index = total - 1;
            if (index >= total) index = 0;
            if (index === currentIndex) return;

            isAnimating = true;
            currentIndex = index;
            track.style.transform = 'translateX(-' + (index * 100) + '%)';

            if (dotsContainer) {
                var dots = dotsContainer.querySelectorAll('.lightbox-dot');
                for (var d2 = 0; d2 < dots.length; d2++) {
                    dots[d2].classList.toggle('active', d2 === index);
                }
            }
            counter.textContent = (index + 1) + ' / ' + total;

            var imgData2 = images[index] || {};
            captionEl.textContent = imgData2.caption || '';

            setTimeout(function () { isAnimating = false; }, 400);
        }

        function nextSlide() { goTo(currentIndex + 1); }

        function prevSlide() { goTo(currentIndex - 1); }

        function onKeyDown(e) {
            if (e.key === 'Escape') { close(); }
            if (e.key === 'ArrowLeft') { prevSlide(); e.preventDefault(); }
            if (e.key === 'ArrowRight') { nextSlide(); e.preventDefault(); }
        }
        document.addEventListener('keydown', onKeyDown);

        function close() {
            document.body.removeChild(overlay);
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKeyDown);
            lightboxInstance = null;
        }

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);

        lightboxInstance = { overlay: overlay, close: close };
    }

    function closeLightbox() {
        if (lightboxInstance) {
            lightboxInstance.close();
            lightboxInstance = null;
        }
    }

    /* ==================== 7. 事件委托 ==================== */
    function onContentClick(e) {
        var target = e.target;
        var card, pid, inst;

        /* 走马灯箭头 */
        if (target.classList.contains('carousel-arrow')) {
            var action = target.dataset.action;
            card = target.closest('.project-card');
            if (!card) return;
            pid = card.dataset.projectId;
            inst = findInstance(pid);
            if (!inst) return;
            if (action === 'next') inst.next();
            else if (action === 'prev') inst.prev();
            return;
        }

        /* 圆点点击 */
        if (target.classList.contains('carousel-dot')) {
            var idx = parseInt(target.dataset.index);
            card = target.closest('.project-card');
            if (!card) return;
            pid = card.dataset.projectId;
            inst = findInstance(pid);
            if (!inst) return;
            inst.goTo(idx);
            return;
        }

        /* 缩略图点击 */
        if (target.closest('.thumbnail-item')) {
            var thumbItem = target.closest('.thumbnail-item');
            var tIdx = parseInt(thumbItem.dataset.index);
            card = target.closest('.project-card');
            if (!card) return;
            pid = card.dataset.projectId;
            inst = findInstance(pid);
            if (!inst) return;
            inst.goTo(tIdx);
            return;
        }

        /* 图片点击 -> 全屏弹窗 */
        if (target.tagName === 'IMG' && target.closest('.project-carousel-slide')) {
            card = target.closest('.project-card');
            if (!card) return;
            pid = card.dataset.projectId;
            var proj = getProjectById(pid);
            if (!proj || !proj.images) return;

            var currentSrc = target.getAttribute('src');
            var clickIndex = 0;
            for (var k = 0; k < proj.images.length; k++) {
                if (proj.images[k].src === currentSrc) { clickIndex = k; break; }
            }

            inst = findInstance(pid);
            if (inst) inst.stopAutoPlay();

            openLightbox(proj.images, clickIndex);
        }
    }

    function findInstance(projectId) {
        for (var i = 0; i < carouselInstances.length; i++) {
            if (carouselInstances[i].getId() === projectId) return carouselInstances[i];
        }
        return null;
    }

    /* ==================== 8. 生命周期 ==================== */
    function init() {
        /* 图片加载失败兜底 */
        var allImgs = document.querySelectorAll('.project-carousel-slide img');
        for (var i = 0; i < allImgs.length; i++) {
            var img = allImgs[i];
            if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                showImgError(img);
            }
            img.addEventListener('error', function () {
                showImgError(this);
            });
        }

        /* 缩略图加载失败兜底（静默处理，不显示占位文字） */
        document.querySelectorAll('.thumbnail-item img').forEach(function (thumbImg) {
            thumbImg.addEventListener('error', function () {
                this.style.display = 'none';
            });
            if (thumbImg.complete && (thumbImg.naturalWidth === 0 || thumbImg.naturalHeight === 0)) {
                thumbImg.style.display = 'none';
            }
        });

        /* 创建走马灯实例 */
        for (var p = 0; p < projects.length; p++) {
            var inst = createCarousel(projects[p].id, projects[p].images);
            if (inst) carouselInstances.push(inst);
        }

        /* 事件委托 */
        var contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.addEventListener('click', onContentClick);
            contentDelegation = { element: contentArea, handler: onContentClick };
        }
    }

    function showImgError(img) {
        if (img.parentElement.querySelector('.slide-placeholder')) return;
        img.style.display = 'none';
        var placeholder = document.createElement('div');
        placeholder.className = 'slide-placeholder';
        placeholder.textContent = '⚠️ 图片加载失败';
        img.parentElement.appendChild(placeholder);
    }

    function cleanup() {
        for (var i = 0; i < carouselInstances.length; i++) {
            carouselInstances[i].destroy();
        }
        carouselInstances = [];

        closeLightbox();

        if (contentDelegation) {
            contentDelegation.element.removeEventListener('click', contentDelegation.handler);
            contentDelegation = null;
        }
    }

    return {
        render: render,
        init: init,
        cleanup: cleanup
    };
})();

window.PageModules = window.PageModules || {};
window.PageModules.AboutPage = AboutPage;
