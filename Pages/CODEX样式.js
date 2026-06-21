/** ---------------------------------------------------
 * @brief:      个人介绍页面模块
 * @file:       aboutPage.js
 * @author:     GeorgeHua
 * @date:       2026/03/21
 *----------------------------------------------------*/

const AboutPage = (function() {
    /**
     * V6.6：About 页面采用“项目数据 + 通用展示器”的结构。
     * 维护项目内容时，优先修改 projects 数组；轮播、缩略图和原图预览逻辑保持复用。
     */
    const AUTO_PLAY_INTERVAL_MS = 5200;
    const IMAGE_BASE_PATH = 'Assets/AboutMe/';

    /**
     * V6.6：项目示范数据区。
     * 后续替换为真实项目时，推荐只修改 title、description、tags、images 等内容字段。
     *
     * 可选字段说明：
     * - layout: featured | standard | compact，用于快速试不同卡片版式。
     * - imageFit: contain | cover，项目截图建议 contain，照片或氛围图可用 cover。
     * - autoPlay: 多图项目是否自动轮播；单图项目会自动忽略。
     * - showThumbnails: 是否展示底部缩略图；图片较多时建议开启。
     */
    const projects = [
        {
            id: 'navigation-site-demo',
            title: '项目示范 A：个人导航站界面迭代',
            summary: '以导航、主题切换和书签管理为中心的个人主页项目示范。',
            layout: 'featured',
            imageFit: 'contain',
            autoPlay: true,
            showThumbnails: true,
            tags: ['前端页面', '主题系统', '交互优化'],
            description: [
                '这里可以写项目目标、你负责的模块，以及最终解决的问题。当前文字只是占位示范。',
                '图片区域固定比例展示，点击主图可以查看原图；多张图片会自动轮播，也可以手动切换。'
            ],
            images: [
                {
                    src: `${IMAGE_BASE_PATH}p壁纸13.png`,
                    alt: '项目示范 A 截图 1',
                    caption: '示范图 1：适合放主页、仪表盘或项目总览截图。'
                },
                {
                    src: `${IMAGE_BASE_PATH}p壁纸14.png`,
                    alt: '项目示范 A 截图 2',
                    caption: '示范图 2：适合放主题切换、设置页或核心功能状态。'
                },
                {
                    src: `${IMAGE_BASE_PATH}p壁纸17.png`,
                    alt: '项目示范 A 截图 3',
                    caption: '示范图 3：适合放移动端、暗色主题或对比视图。'
                },
                {
                    src: `${IMAGE_BASE_PATH}p壁纸7.png`,
                    alt: '项目示范 A 截图 4',
                    caption: '示范图 4：适合放补充界面或最终效果。'
                }
            ]
        },
        {
            id: 'tool-prototype-demo',
            title: '项目示范 B：工具类应用原型',
            summary: '偏工具型项目可以突出流程、界面状态和关键功能截图。',
            layout: 'standard',
            imageFit: 'contain',
            autoPlay: true,
            showThumbnails: false,
            tags: ['工具应用', '功能原型', '流程展示'],
            description: [
                '如果项目图片是不同功能页截图，建议按“入口、操作、结果”的顺序排列。',
                '文字说明保持简短即可，重点让图片承担主要展示信息。'
            ],
            images: [
                {
                    src: `${IMAGE_BASE_PATH}微信图片_20251024163842_22_32.jpg`,
                    alt: '项目示范 B 截图 1',
                    caption: '入口或主界面示范。'
                },
                {
                    src: `${IMAGE_BASE_PATH}微信图片_20251024163843_23_32.jpg`,
                    alt: '项目示范 B 截图 2',
                    caption: '核心功能流程示范。'
                },
                {
                    src: `${IMAGE_BASE_PATH}微信图片_20251024163843_24_32.jpg`,
                    alt: '项目示范 B 截图 3',
                    caption: '结果页或状态反馈示范。'
                }
            ]
        },
        {
            id: 'visual-material-demo',
            title: '项目示范 C：视觉素材与展示页',
            summary: '图片比例差异较大时，可以用 cover 形成更强的画面感。',
            layout: 'compact',
            imageFit: 'cover',
            autoPlay: false,
            showThumbnails: true,
            tags: ['视觉展示', '素材整理', '轻量说明'],
            description: [
                'compact 版式适合信息较少的项目，也适合后续做成两列项目列表。',
                'cover 会裁切边缘，适合照片或封面图；如果是软件截图，建议改回 contain。'
            ],
            images: [
                {
                    src: `${IMAGE_BASE_PATH}微信图片_20251024163844_25_32.jpg`,
                    alt: '项目示范 C 图片 1',
                    caption: '封面图或氛围图示范。'
                },
                {
                    src: `${IMAGE_BASE_PATH}微信图片_20251024163845_26_32.jpg`,
                    alt: '项目示范 C 图片 2',
                    caption: '补充图或细节图示范。'
                }
            ]
        }
    ];

    // V6.6：页面级状态集中保存，cleanup 时统一释放，避免页面切换后轮播定时器继续运行。
    let pageRoot = null;
    let clickHandler = null;
    let keydownHandler = null;
    let mouseenterHandler = null;
    let mouseleaveHandler = null;
    let carouselTimers = new Map();
    let currentSlideByProject = new Map();
    let lightboxState = null;

    /**
     * 渲染 About 页面外壳。
     * @returns {string} 页面 HTML 字符串。
     */
    function render() {
        return `
            <section class="about-page" data-about-page>
                <div class="content-card about-intro">
                    <div class="about-intro-text">
                        <p class="about-eyebrow">Project Gallery</p>
                        <h2>个人项目介绍</h2>
                        <p>这里用于展示我做过的项目。当前为 V6.6 示例内容，后续可以直接替换项目标题、说明和图片路径。</p>
                    </div>
                </div>

                <div class="about-project-list">
                    ${projects.map(renderProjectCard).join('')}
                </div>

                ${renderLightbox()}
            </section>
        `;
    }

    /**
     * 渲染单个项目卡片。
     * @param {Object} project - projects 中的项目配置。
     * @returns {string} 项目卡片 HTML。
     */
    function renderProjectCard(project) {
        const images = getProjectImages(project);
        const firstImage = images[0] || {
            src: '',
            alt: project.title,
            caption: '暂无项目图片，后续可在 images 数组中补充 src。'
        };
        const layoutClass = `about-project-card--${project.layout || 'standard'}`;
        const fitClass = `about-media-frame--${project.imageFit || 'contain'}`;
        const hasMultipleImages = images.length > 1;

        return `
            <article class="content-card about-project-card ${layoutClass}" data-about-project="${escapeAttribute(project.id)}">
                <div class="about-project-copy">
                    <div class="about-project-header">
                        <p class="about-project-kicker">${escapeHtml(project.summary || 'Project showcase')}</p>
                        <h3>${escapeHtml(project.title)}</h3>
                    </div>
                    ${renderTags(project.tags)}
                    <div class="about-project-description">
                        ${renderDescription(project.description)}
                    </div>
                </div>

                <div class="about-project-media">
                    <div class="about-media-frame ${fitClass}">
                        ${firstImage.src ? `
                            <button type="button"
                                    class="about-media-open"
                                    data-about-open="${escapeAttribute(project.id)}"
                                    aria-label="查看原图：${escapeAttribute(project.title)}">
                                <img class="about-project-image"
                                     data-about-image
                                     src="${escapeAttribute(firstImage.src)}"
                                     alt="${escapeAttribute(firstImage.alt || project.title)}"
                                     loading="lazy">
                            </button>
                        ` : `
                            <div class="about-image-placeholder" data-about-image-placeholder>
                                暂无项目图片
                            </div>
                        `}

                        ${hasMultipleImages ? renderCarouselButtons(project.id) : ''}

                        <div class="about-media-counter" data-about-counter>
                            ${images.length ? `1 / ${images.length}` : '0 / 0'}
                        </div>
                    </div>

                    <div class="about-media-caption" data-about-caption>
                        ${escapeHtml(firstImage.caption || '')}
                    </div>

                    ${hasMultipleImages ? renderCarouselDots(project) : ''}
                    ${hasMultipleImages && project.showThumbnails ? renderThumbnails(project) : ''}
                </div>
            </article>
        `;
    }

    /**
     * 渲染项目标签。
     * @param {string[]} tags - 标签文本。
     * @returns {string} 标签 HTML。
     */
    function renderTags(tags = []) {
        if (!tags.length) return '';

        return `
            <div class="about-tag-list">
                ${tags.map(tag => `<span class="about-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
    }

    /**
     * 渲染项目说明段落。
     * @param {string|string[]} description - 单段或多段说明。
     * @returns {string} 说明 HTML。
     */
    function renderDescription(description) {
        const paragraphs = Array.isArray(description) ? description : [description].filter(Boolean);

        return paragraphs
            .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
            .join('');
    }

    /**
     * 渲染轮播左右按钮。
     * @param {string} projectId - 项目标识。
     * @returns {string} 按钮 HTML。
     */
    function renderCarouselButtons(projectId) {
        return `
            <button type="button" class="about-carousel-btn about-carousel-btn--prev" data-about-prev="${escapeAttribute(projectId)}" aria-label="上一张">‹</button>
            <button type="button" class="about-carousel-btn about-carousel-btn--next" data-about-next="${escapeAttribute(projectId)}" aria-label="下一张">›</button>
        `;
    }

    /**
     * 渲染轮播圆点。
     * @param {Object} project - 项目配置。
     * @returns {string} 圆点 HTML。
     */
    function renderCarouselDots(project) {
        return `
            <div class="about-carousel-dots" aria-label="项目图片切换">
                ${getProjectImages(project).map((image, index) => `
                    <button type="button"
                            class="about-carousel-dot ${index === 0 ? 'active' : ''}"
                            data-about-slide="${escapeAttribute(project.id)}"
                            data-about-slide-index="${index}"
                            aria-label="查看图片 ${index + 1}：${escapeAttribute(image.alt || project.title)}"></button>
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染缩略图条。
     * @param {Object} project - 项目配置。
     * @returns {string} 缩略图 HTML。
     */
    function renderThumbnails(project) {
        return `
            <div class="about-thumbnail-strip" aria-label="项目图片缩略图">
                ${getProjectImages(project).map((image, index) => `
                    <button type="button"
                            class="about-thumbnail ${index === 0 ? 'active' : ''}"
                            data-about-thumb="${escapeAttribute(project.id)}"
                            data-about-slide-index="${index}"
                            aria-label="查看缩略图 ${index + 1}">
                        <img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.alt || project.title)}" loading="lazy">
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * 渲染原图预览弹窗。
     * @returns {string} lightbox HTML。
     */
    function renderLightbox() {
        return `
            <div class="about-lightbox" data-about-lightbox hidden>
                <div class="about-lightbox-backdrop" data-about-close></div>
                <div class="about-lightbox-panel" role="dialog" aria-modal="true" aria-label="项目图片预览">
                    <button type="button" class="about-lightbox-close" data-about-close aria-label="关闭预览">×</button>
                    <button type="button" class="about-lightbox-nav about-lightbox-nav--prev" data-about-lightbox-prev aria-label="上一张">‹</button>
                    <figure class="about-lightbox-figure">
                        <img class="about-lightbox-image" data-about-lightbox-image alt="">
                        <figcaption class="about-lightbox-caption">
                            <span data-about-lightbox-caption></span>
                            <span class="about-lightbox-counter" data-about-lightbox-counter></span>
                        </figcaption>
                    </figure>
                    <button type="button" class="about-lightbox-nav about-lightbox-nav--next" data-about-lightbox-next aria-label="下一张">›</button>
                </div>
            </div>
        `;
    }

    /**
     * 初始化页面事件和轮播状态。
     * AppInitializer 每次进入 About 页面后调用本方法。
     */
    function init() {
        pageRoot = document.querySelector('[data-about-page]');
        if (!pageRoot) return;

        // V6.6：进入页面时初始化每个项目的当前页，确保重进页面后状态可预测。
        projects.forEach(project => currentSlideByProject.set(project.id, 0));

        clickHandler = handlePageClick;
        keydownHandler = handleDocumentKeydown;
        mouseenterHandler = handleProjectMouseEnter;
        mouseleaveHandler = handleProjectMouseLeave;

        // V6.6：使用事件委托，新增项目卡片或按钮时不需要逐个绑定事件。
        pageRoot.addEventListener('click', clickHandler);
        pageRoot.addEventListener('mouseenter', mouseenterHandler, true);
        pageRoot.addEventListener('mouseleave', mouseleaveHandler, true);
        document.addEventListener('keydown', keydownHandler);

        startAutoPlay();
    }

    /**
     * 页面点击事件统一入口。
     * @param {MouseEvent} event - 点击事件。
     */
    function handlePageClick(event) {
        const target = event.target instanceof Element ? event.target : event.target.parentElement;
        if (!target) return;

        const prevButton = target.closest('[data-about-prev]');
        const nextButton = target.closest('[data-about-next]');
        const dotButton = target.closest('[data-about-slide]');
        const thumbButton = target.closest('[data-about-thumb]');
        const openButton = target.closest('[data-about-open]');
        const closeButton = target.closest('[data-about-close]');
        const lightboxPrevButton = target.closest('[data-about-lightbox-prev]');
        const lightboxNextButton = target.closest('[data-about-lightbox-next]');

        // V6.6：轮播控制只改变当前项目，不影响其他项目的展示状态。
        if (prevButton) {
            stepProjectSlide(prevButton.dataset.aboutPrev, -1, true);
            return;
        }

        if (nextButton) {
            stepProjectSlide(nextButton.dataset.aboutNext, 1, true);
            return;
        }

        if (dotButton) {
            setProjectSlide(dotButton.dataset.aboutSlide, Number(dotButton.dataset.aboutSlideIndex), true);
            return;
        }

        if (thumbButton) {
            setProjectSlide(thumbButton.dataset.aboutThumb, Number(thumbButton.dataset.aboutSlideIndex), true);
            return;
        }

        // V6.6：点击主图打开 lightbox，而不是跳转新页面，保证浏览体验不被打断。
        if (openButton) {
            const projectId = openButton.dataset.aboutOpen;
            const currentIndex = currentSlideByProject.get(projectId) || 0;
            openLightbox(projectId, currentIndex);
            return;
        }

        if (closeButton) {
            closeLightbox();
            return;
        }

        if (lightboxPrevButton) {
            stepLightboxSlide(-1);
            return;
        }

        if (lightboxNextButton) {
            stepLightboxSlide(1);
        }
    }

    /**
     * 键盘事件：lightbox 打开后支持 ESC 和左右方向键。
     * @param {KeyboardEvent} event - 键盘事件。
     */
    function handleDocumentKeydown(event) {
        if (!lightboxState) return;

        if (event.key === 'Escape') {
            closeLightbox();
            return;
        }

        if (event.key === 'ArrowLeft') {
            stepLightboxSlide(-1);
            return;
        }

        if (event.key === 'ArrowRight') {
            stepLightboxSlide(1);
        }
    }

    /**
     * 鼠标进入项目卡片时暂停该项目自动轮播，给用户留出阅读图片的时间。
     * @param {MouseEvent} event - 鼠标事件。
     */
    function handleProjectMouseEnter(event) {
        const card = event.target.closest?.('[data-about-project]');
        if (!card || !pageRoot.contains(card)) return;

        stopProjectTimer(card.dataset.aboutProject);
    }

    /**
     * 鼠标离开项目卡片后恢复该项目自动轮播。
     * @param {MouseEvent} event - 鼠标事件。
     */
    function handleProjectMouseLeave(event) {
        const card = event.target.closest?.('[data-about-project]');
        if (!card || !pageRoot.contains(card)) return;

        const project = findProject(card.dataset.aboutProject);
        startProjectTimer(project);
    }

    /**
     * 启动所有符合条件的自动轮播。
     */
    function startAutoPlay() {
        projects.forEach(project => startProjectTimer(project));
    }

    /**
     * 启动指定项目的自动轮播。
     * @param {Object|undefined} project - 项目配置。
     */
    function startProjectTimer(project) {
        if (!project || project.autoPlay === false || getProjectImages(project).length <= 1) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

        stopProjectTimer(project.id);

        const interval = Number(project.intervalMs) || AUTO_PLAY_INTERVAL_MS;
        const timerId = window.setInterval(() => {
            stepProjectSlide(project.id, 1, false);
        }, interval);

        carouselTimers.set(project.id, timerId);
    }

    /**
     * 停止指定项目的自动轮播。
     * @param {string} projectId - 项目标识。
     */
    function stopProjectTimer(projectId) {
        const timerId = carouselTimers.get(projectId);
        if (!timerId) return;

        window.clearInterval(timerId);
        carouselTimers.delete(projectId);
    }

    /**
     * 切换到上一张或下一张。
     * @param {string} projectId - 项目标识。
     * @param {number} direction - -1 表示上一张，1 表示下一张。
     * @param {boolean} userInitiated - 是否由用户手动触发。
     */
    function stepProjectSlide(projectId, direction, userInitiated) {
        const project = findProject(projectId);
        if (!project) return;

        const currentIndex = currentSlideByProject.get(projectId) || 0;
        setProjectSlide(projectId, currentIndex + direction, userInitiated);
    }

    /**
     * 设置项目当前展示图片。
     * @param {string} projectId - 项目标识。
     * @param {number} nextIndex - 目标图片索引，允许越界，会自动循环。
     * @param {boolean} userInitiated - 是否由用户手动触发。
     */
    function setProjectSlide(projectId, nextIndex, userInitiated) {
        const project = findProject(projectId);
        if (!project) return;

        const images = getProjectImages(project);
        const normalizedIndex = normalizeIndex(nextIndex, images.length);
        const image = images[normalizedIndex];
        const card = pageRoot?.querySelector(`[data-about-project="${cssEscape(projectId)}"]`);
        if (!card || !image) return;

        currentSlideByProject.set(projectId, normalizedIndex);

        // V6.6：只更新当前项目卡片内的展示节点，避免整页重渲染导致轮播状态丢失。
        const imageElement = card.querySelector('[data-about-image]');
        const captionElement = card.querySelector('[data-about-caption]');
        const counterElement = card.querySelector('[data-about-counter]');

        if (imageElement) {
            imageElement.src = image.src;
            imageElement.alt = image.alt || project.title;
        }

        if (captionElement) {
            captionElement.textContent = image.caption || '';
        }

        if (counterElement) {
            counterElement.textContent = `${normalizedIndex + 1} / ${images.length}`;
        }

        updateActiveState(card, '[data-about-slide]', normalizedIndex);
        updateActiveState(card, '[data-about-thumb]', normalizedIndex);

        // V6.6：手动切换后重置计时器，避免用户刚选完图片就被自动轮播切走。
        if (userInitiated) {
            startProjectTimer(project);
        }
    }

    /**
     * 打开原图预览弹窗。
     * @param {string} projectId - 项目标识。
     * @param {number} imageIndex - 当前图片索引。
     */
    function openLightbox(projectId, imageIndex) {
        const project = findProject(projectId);
        if (!project) return;

        lightboxState = {
            projectId,
            imageIndex: normalizeIndex(imageIndex, getProjectImages(project).length)
        };

        updateLightbox();

        const lightbox = pageRoot?.querySelector('[data-about-lightbox]');
        if (lightbox) {
            lightbox.hidden = false;
            lightbox.classList.add('open');
        }
    }

    /**
     * 关闭原图预览弹窗。
     */
    function closeLightbox() {
        const lightbox = pageRoot?.querySelector('[data-about-lightbox]');
        if (lightbox) {
            lightbox.classList.remove('open');
            lightbox.hidden = true;
        }

        lightboxState = null;
    }

    /**
     * lightbox 内切换图片。
     * @param {number} direction - -1 表示上一张，1 表示下一张。
     */
    function stepLightboxSlide(direction) {
        if (!lightboxState) return;

        const project = findProject(lightboxState.projectId);
        if (!project) return;

        lightboxState.imageIndex = normalizeIndex(
            lightboxState.imageIndex + direction,
            getProjectImages(project).length
        );

        updateLightbox();
    }

    /**
     * 根据 lightboxState 刷新弹窗内容。
     */
    function updateLightbox() {
        if (!lightboxState || !pageRoot) return;

        const project = findProject(lightboxState.projectId);
        if (!project) return;

        const images = getProjectImages(project);
        const image = images[lightboxState.imageIndex];
        const lightbox = pageRoot.querySelector('[data-about-lightbox]');
        if (!lightbox || !image) return;

        const imageElement = lightbox.querySelector('[data-about-lightbox-image]');
        const captionElement = lightbox.querySelector('[data-about-lightbox-caption]');
        const counterElement = lightbox.querySelector('[data-about-lightbox-counter]');
        const prevButton = lightbox.querySelector('[data-about-lightbox-prev]');
        const nextButton = lightbox.querySelector('[data-about-lightbox-next]');
        const hasMultipleImages = images.length > 1;

        if (imageElement) {
            imageElement.src = image.src;
            imageElement.alt = image.alt || project.title;
        }

        if (captionElement) {
            captionElement.textContent = image.caption || project.title;
        }

        if (counterElement) {
            counterElement.textContent = `${lightboxState.imageIndex + 1} / ${images.length}`;
        }

        // V6.6：单图项目不展示左右按钮，避免无效控件干扰预览。
        if (prevButton) prevButton.hidden = !hasMultipleImages;
        if (nextButton) nextButton.hidden = !hasMultipleImages;
    }

    /**
     * 更新圆点或缩略图的激活状态。
     * @param {HTMLElement} container - 项目卡片节点。
     * @param {string} selector - 需要更新的控件选择器。
     * @param {number} activeIndex - 当前图片索引。
     */
    function updateActiveState(container, selector, activeIndex) {
        container.querySelectorAll(selector).forEach(button => {
            const buttonIndex = Number(button.dataset.aboutSlideIndex);
            button.classList.toggle('active', buttonIndex === activeIndex);
        });
    }

    /**
     * 获取项目图片数组，并保证至少返回空数组。
     * @param {Object} project - 项目配置。
     * @returns {Object[]} 图片配置数组。
     */
    function getProjectImages(project) {
        return Array.isArray(project?.images) ? project.images : [];
    }

    /**
     * 根据 id 查找项目。
     * @param {string} projectId - 项目标识。
     * @returns {Object|undefined} 项目配置。
     */
    function findProject(projectId) {
        return projects.find(project => project.id === projectId);
    }

    /**
     * 将任意索引归一到图片数组范围内。
     * @param {number} index - 目标索引。
     * @param {number} length - 数组长度。
     * @returns {number} 合法索引。
     */
    function normalizeIndex(index, length) {
        if (!length) return 0;
        return ((index % length) + length) % length;
    }

    /**
     * 转义普通文本，避免项目数据中的特殊字符破坏 HTML。
     * @param {string} value - 原始文本。
     * @returns {string} 转义后的文本。
     */
    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    /**
     * 属性值转义与普通文本一致，单独保留函数名便于后续区分 URL 或 aria 字段处理。
     * @param {string} value - 原始属性值。
     * @returns {string} 转义后的属性值。
     */
    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    /**
     * CSS.escape 兼容封装，用于 data 属性选择器。
     * @param {string} value - 原始选择器片段。
     * @returns {string} 可用于 CSS 选择器的片段。
     */
    function cssEscape(value) {
        if (window.CSS?.escape) return window.CSS.escape(value);
        return String(value).replaceAll('"', '\\"');
    }

    /**
     * 清理页面事件和轮播资源。
     * AppInitializer 离开页面前调用，防止后台定时器和全局键盘事件残留。
     */
    function cleanup() {
        carouselTimers.forEach(timerId => window.clearInterval(timerId));
        carouselTimers.clear();
        currentSlideByProject.clear();
        lightboxState = null;

        if (pageRoot && clickHandler) {
            pageRoot.removeEventListener('click', clickHandler);
        }

        if (pageRoot && mouseenterHandler) {
            pageRoot.removeEventListener('mouseenter', mouseenterHandler, true);
        }

        if (pageRoot && mouseleaveHandler) {
            pageRoot.removeEventListener('mouseleave', mouseleaveHandler, true);
        }

        if (keydownHandler) {
            document.removeEventListener('keydown', keydownHandler);
        }

        pageRoot = null;
        clickHandler = null;
        keydownHandler = null;
        mouseenterHandler = null;
        mouseleaveHandler = null;
    }

    return {
        render,
        init,
        cleanup
    };
})();

window.PageModules = window.PageModules || {};
window.PageModules.AboutPage = AboutPage;
