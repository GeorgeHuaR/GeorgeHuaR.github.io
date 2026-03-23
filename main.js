// ==================== main.js ====================
// 模块化组织的应用主文件，页面渲染逻辑已分离到 Pages/ 目录
/*
    - AppState: 应用状态管理
    - Utils: 工具函数
    - Storage: 数据持久化
    - DataOperations: 数据操作
    - ModalManager: 弹窗管理
    - AppInitializer: 应用初始化
*/ 

// ==================== 1. AppState - 应用状态管理 ====================
//#region AppState 模块
const AppState = {
    currentPage: 'home',
    isEditMode: false,
    selectedIds: new Set(),
    currentFilterCategory: 'cat_1',
    currentTheme: localStorage.getItem('navTheme') || 'theme-modern',
    currentSearchQuery: '',

    // ==================== 图标相关状态 ====================
    // 是否在书签页显示图标
    showIcons: JSON.parse(localStorage.getItem('iconShowIcons') || 'false'),
    // 是否自动加载图标
    autoLoadIcons: JSON.parse(localStorage.getItem('iconAutoLoad') || 'false'),
    // 图标源: 'iconhorse'  | 'yandex' | 'direct'
    iconSource: localStorage.getItem('iconSource') || 'iconhorse',
    // 图标缓存: { bookmarkId: base64DataUrl }
    iconCache: JSON.parse(localStorage.getItem('iconCache') || '{}'),
    // 图标缓存元数据: { bookmarkId: { timestamp, source, success } }
    iconCacheMeta: JSON.parse(localStorage.getItem('iconCacheMeta') || '{}'),

    // 设置当前页面
    setCurrentPage(page) { this.currentPage = page; },
    
    // 设置编辑模式，退出时清空选中项
    setEditMode(mode) {
        this.isEditMode = mode;
        if (!mode) this.selectedIds.clear();   
    },
    
    // 切换编辑模式
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        if (!this.isEditMode) this.selectedIds.clear();
    },
    
    addSelectedId(id) { this.selectedIds.add(id); },
    removeSelectedId(id) { this.selectedIds.delete(id); },
    clearSelectedIds() { this.selectedIds.clear(); },
    setFilterCategory(category) { this.currentFilterCategory = category; },
    setTheme(theme) { this.currentTheme = theme; },

    // ==================== 图标相关方法 ====================
    /**
     * 设置是否显示图标
     * @param {boolean} value 
     */
    setShowIcons(value) {
        this.showIcons = value;
        localStorage.setItem('iconShowIcons', JSON.stringify(value));
    },

    /**
     * 设置是否自动加载图标
     * @param {boolean} value 
     */
    setAutoLoadIcons(value) {
        this.autoLoadIcons = value;
        localStorage.setItem('iconAutoLoad', JSON.stringify(value));
    },

    /**
     * 设置图标源
     * @param {string} source - 'google' | 'iconhorse' | 'direct'
     */
    setIconSource(source) {
        this.iconSource = source;
        localStorage.setItem('iconSource', source);
    },

    /**
     * 获取缓存的图标
     * @param {number} bookmarkId 
     * @returns {string|null} base64数据URL或null
     */
    getCachedIcon(bookmarkId) {
        return this.iconCache[bookmarkId] || null;
    },

    /**
     * 设置图标缓存
     * @param {number} bookmarkId 
     * @param {string} dataUrl - base64数据URL
     * @param {string} source - 图标源
     * @param {boolean} success - 是否成功
     */
    setCachedIcon(bookmarkId, dataUrl, source, success = true) {
        this.iconCache[bookmarkId] = dataUrl;
        this.iconCacheMeta[bookmarkId] = {
            timestamp: Date.now(),
            source: source,
            success: success
        };
        this.saveIconCache();
    },

    /**
     * 标记图标加载失败
     * @param {number} bookmarkId 
     * @param {string} source 
     */
    markIconFailed(bookmarkId, source) {
        this.iconCacheMeta[bookmarkId] = {
            timestamp: Date.now(),
            source: source,
            success: false
        };
        this.saveIconCache();
    },

    /**
     * 检查图标是否已缓存
     * @param {number} bookmarkId 
     * @returns {boolean}
     */
    hasCachedIcon(bookmarkId) {
        return !!this.iconCache[bookmarkId];
    },

    /**
     * 检查图标是否加载失败
     * @param {number} bookmarkId 
     * @returns {boolean}
     */
    isIconFailed(bookmarkId) {
        const meta = this.iconCacheMeta[bookmarkId];
        return meta && meta.success === false;
    },

    /**
     * 清空图标缓存
     */
    clearIconCache() {
        this.iconCache = {};
        this.iconCacheMeta = {};
        localStorage.removeItem('iconCache');
        localStorage.removeItem('iconCacheMeta');
    },

    /**
     * 保存图标缓存到localStorage
     */
    saveIconCache() {
        try {
            localStorage.setItem('iconCache', JSON.stringify(this.iconCache));
            localStorage.setItem('iconCacheMeta', JSON.stringify(this.iconCacheMeta));
        } catch (e) {
            console.warn('图标缓存保存失败，可能超出localStorage限制:', e);
        }
    },

    /**
     * 获取缓存统计信息
     * @returns {{total: number, cached: number, failed: number, pending: number, cacheSize: string}}
     */
    getIconStats() {
        const data = Storage.getAppData();
        const total = data.bookmarks.length;
        let cached = 0;
        let failed = 0;

        data.bookmarks.forEach(b => {
            if (this.hasCachedIcon(b.id)) {
                cached++;
            } else if (this.isIconFailed(b.id)) {
                failed++;
            }
        });

        // 计算缓存大小
        const cacheStr = JSON.stringify(this.iconCache);
        const bytes = new Blob([cacheStr]).size;
        const cacheSize = bytes < 1024 ? `${bytes} B` : 
                         bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` :
                         `${(bytes / 1024 / 1024).toFixed(2)} MB`;

        return {
            total,
            cached,
            failed,
            pending: total - cached - failed,
            cacheSize
        };
    }
};
//#endregion

// ==================== 2. Utils - 工具函数 ====================
//#region Utils 模块
const Utils = {
    // 根据主题类名获取中文名称
    getThemeName(themeClass) {
        if (themeClass === 'theme-modern') return '现代编辑';
        if (themeClass === 'theme-glass') return '柔和玻璃';
        if (themeClass === 'theme-tech') return '科技';
        return '未知';
    },
    
    // 比较两个数据是否相等
    isDataEqual(data1, data2) { return JSON.stringify(data1) === JSON.stringify(data2); },
    
    // 格式化数组为美观的字符串（用于导出）
    formatArray(arr) {
        if (!arr || arr.length === 0) return '[]';
        let str = '[';
        arr.forEach((item, index) => {
            str += `\n    ${JSON.stringify(item)}`;
            if (index < arr.length - 1) str += ',';
        });
        return str + '\n  ]';
    },
    
    // 从URL中提取域名
    extractDomain(url) {
        try { return new URL(url).hostname; } 
        catch (e) { return url; }
    },
    
    // 获取字符串首字母并大写
    getFirstLetter(str) { return str.charAt(0).toUpperCase(); }
};
//#endregion

// ==================== 3. Storage - 数据持久化 ====================
//#region Storage 模块
const Storage = {
    // 加载初始数据，优先从 localStorage 读取
    loadInitialData() {
        const stored = localStorage.getItem('bookmarkAppData');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // 检查版本是否一致
                if (data.version === window.bookmarkData.VERSION) return data;
            } catch (e) {}
        }
        // 无存储或版本不一致，使用静态数据
        const initialData = {
            version: window.bookmarkData.VERSION,
            searchEngines: window.bookmarkData.searchEngines,
            categories: window.bookmarkData.categories,
            bookmarks: window.bookmarkData.bookmarks
        };
        this.saveAppData(initialData);
        this.ensureUncategorizedCategory(initialData);
        return initialData;
    },
    
    // 预处理空分类的书签
    ensureUncategorizedCategory(data) {
        data.bookmarks.forEach(bookmark => {
            if (!bookmark.category || bookmark.category === '') bookmark.category = 'empty';
        });
        return data;
    },

    getAppData() { return JSON.parse(localStorage.getItem('bookmarkAppData')); },
    saveAppData(data) { localStorage.setItem('bookmarkAppData', JSON.stringify(data)); },
    
    // 导入数据文件
    importDataFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const match = content.match(/window\.bookmarkData\s*=\s*(\{[\s\S]*?\});/);
            if (!match) { alert('无法解析文件：未找到 window.bookmarkData 定义'); return; }
            try {
                const data = new Function('return ' + match[1])();
                if (!data.version || !data.searchEngines || !data.categories || !data.bookmarks) {
                    alert('数据格式不完整，导入失败'); return;
                }
                this.saveAppData(data);
                AppInitializer.refreshCurrentPage();
                alert('导入成功，当前数据已更新');
            } catch (err) { alert('解析数据失败：' + err.message); }
        };
        reader.readAsText(file);
    },
    
    // 导出数据文件
    exportDataFile() {
        const data = this.getAppData();
        let content = `// 导出自定义书签数据 (版本 ${data.version})\n`;
        content += `window.bookmarkData = {\n`;
        content += `  VERSION: '${data.version}',\n`;
        content += `  searchEngines: ${Utils.formatArray(data.searchEngines)},\n`;
        content += `  categories: ${Utils.formatArray(data.categories)},\n`;
        content += `  bookmarks: ${Utils.formatArray(data.bookmarks)}\n};`;
        const blob = new Blob([content], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarkData_${data.version}.js`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    resetToDefault() {
        localStorage.removeItem('bookmarkAppData');
        return this.loadInitialData();
    }
};
//#endregion

// ==================== 4. DataOperations - 数据操作 ====================
//#region DataOperations 模块
const DataOperations = {
    // 添加书签，自动生成ID
    addBookmark(bookmark) {
        const data = Storage.getAppData();
        const newId = data.bookmarks.length > 0 ? Math.max(...data.bookmarks.map(b => b.id)) + 1 : 1;
        const newBookmark = { id: newId, ...bookmark };
        data.bookmarks.push(newBookmark);
        Storage.saveAppData(data);
        return newBookmark;
    },
    
    // 更新书签
    updateBookmark(id, updates) {
        const data = Storage.getAppData();
        const index = data.bookmarks.findIndex(b => b.id == id);
        if (index !== -1) {
            data.bookmarks[index] = { ...data.bookmarks[index], ...updates };
            Storage.saveAppData(data);
            return data.bookmarks[index];
        }
        return null;
    },
    
    // 批量删除书签
    deleteBookmarks(ids) {
        const data = Storage.getAppData();
        const idsToDelete = new Set(ids.map(id => id.toString()));
        data.bookmarks = data.bookmarks.filter(b => !idsToDelete.has(b.id.toString()));
        Storage.saveAppData(data);
        return data.bookmarks;
    },
    
    // 批量修改分类
    batchUpdateCategory(ids, category) {
        const data = Storage.getAppData();
        ids.forEach(id => {
            const index = data.bookmarks.findIndex(b => b.id == id);
            if (index !== -1) data.bookmarks[index].category = category;
        });
        Storage.saveAppData(data);
        return data.bookmarks;
    },
    
    // 根据分类筛选书签
    filterBookmarksByCategory(bookmarks, category) {
        if (category === 'all') {
            return bookmarks;
        } else if (category === 'cat-empty') {
            return bookmarks.filter(b => !b.category || b.category === '' || b.category === 'cat-empty');
        } else {
            return bookmarks.filter(b => b.category === category);
        }
    }
};
//#endregion

// ==================== 5. ModalManager - 弹窗管理 ====================
/** ---------------------------------------------------
 * @brief:		Modal:模态框，最常用，强调阻塞式交互
 *----------------------------------------------------*/
//#region ModalManager 模块
const ModalManager = {
    // 显示添加书签弹窗
    showAddBookmarkDialog() {
        const data = Storage.getAppData();
        const availableCats = data.categories.filter(c => c.id !== 'all');
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h3>➕ 添加书签</h3>
            <div class="modal-form">
                <input type="text" id="modal-name" placeholder="名称 *">
                <input type="url" id="modal-url" placeholder="URL (以 http:// 或 https:// 开头) *">
                <input type="text" id="modal-desc" placeholder="描述 (可选)">
                <select id="modal-category">${availableCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select>
            </div>
            <div class="modal-actions">
                <button id="modal-cancel" class="modal-btn cancel">取消</button>
                <button id="modal-save" class="modal-btn save">保存</button>
            </div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 保存按钮事件
        document.getElementById('modal-save').addEventListener('click', () => {
            const name = document.getElementById('modal-name').value.trim();
            const url = document.getElementById('modal-url').value.trim();
            const desc = document.getElementById('modal-desc').value.trim();
            const category = document.getElementById('modal-category').value;
            if (!name || !url) { alert('名称和URL不能为空'); return; }
            if (!url.startsWith('http://') && !url.startsWith('https://')) { alert('URL必须以 http:// 或 https:// 开头'); return; }
            DataOperations.addBookmark({ name, url, description: desc, category });
            if (AppState.isEditMode) AppState.setEditMode(false);
            AppInitializer.loadPage('home');
            document.body.removeChild(overlay);
        });
        // 取消按钮和点击遮罩关闭
        document.getElementById('modal-cancel').addEventListener('click', () => document.body.removeChild(overlay));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
    },
    
    // 显示编辑书签弹窗
    showEditDialog(bookmark) {
        const data = Storage.getAppData();
        const availableCats = data.categories.filter(c => c.id !== 'all');
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h3>✏️ 编辑书签</h3>
            <div class="modal-form">
                <input type="text" id="modal-name" value="${bookmark.name}" placeholder="名称 *">
                <input type="url" id="modal-url" value="${bookmark.url}" placeholder="URL *">
                <input type="text" id="modal-desc" value="${bookmark.description || ''}" placeholder="描述 (可选)">
                <select id="modal-category">${availableCats.map(c => `<option value="${c.id}" ${c.id === bookmark.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}</select>
            </div>
            <div class="modal-actions">
                <button id="modal-cancel" class="modal-btn cancel">取消</button>
                <button id="modal-save" class="modal-btn save">保存</button>
            </div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('modal-save').addEventListener('click', () => {
            const name = document.getElementById('modal-name').value.trim();
            const url = document.getElementById('modal-url').value.trim();
            const desc = document.getElementById('modal-desc').value.trim();
            const category = document.getElementById('modal-category').value;
            if (!name || !url) { alert('名称和URL不能为空'); return; }
            if (!url.startsWith('http://') && !url.startsWith('https://')) { alert('URL必须以 http:// 或 https:// 开头'); return; }
            DataOperations.updateBookmark(bookmark.id, { name, url, description: desc, category });
            AppState.setEditMode(false);
            document.body.removeChild(overlay);
        });
        document.getElementById('modal-cancel').addEventListener('click', () => document.body.removeChild(overlay));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
    },
    
    // 显示批量修改分类弹窗
    showBatchCategoryDialog(selectedBookmarks) {
        const data = Storage.getAppData();
        const availableCats = data.categories.filter(c => c.id !== 'all');
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h3>📂 批量修改分类</h3>
            <p>将选中的 ${selectedBookmarks.length} 个书签移动到：</p>
            <div class="modal-form">
                <select id="modal-category">${availableCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select>
            </div>
            <div class="modal-actions">
                <button id="modal-cancel" class="modal-btn cancel">取消</button>
                <button id="modal-save" class="modal-btn save">保存</button>
            </div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('modal-save').addEventListener('click', () => {
            const newCategory = document.getElementById('modal-category').value;
            const selectedIds = selectedBookmarks.map(b => b.id);
            // 更新分类数据
            DataOperations.batchUpdateCategory(selectedIds, newCategory);
            document.body.removeChild(overlay);
            // 刷新页面，保持编辑模式
            // AppState.setEditMode(false);
            AppInitializer.loadPage('home');
            AppState.setEditMode(true);
            // AppInitializer.loadPage('home');
        });
        document.getElementById('modal-cancel').addEventListener('click', () => document.body.removeChild(overlay));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay); });
    },
    
    // 确认删除弹窗
    confirmDelete(selectedBookmarks) {
        const count = selectedBookmarks.length;
        if (confirm(`确定删除选中的 ${count} 个书签吗？`)) {
            const selectedIds = selectedBookmarks.map(b => b.id);
            DataOperations.deleteBookmarks(selectedIds);
            AppInitializer.loadPage('home');
        }
    }
};
//#endregion



// ==================== 7. AppInitializer - 应用初始化 ====================
//#region AppInitializer 模块
const AppInitializer = {
    currentPageModule: null,
    isMobile: false,  // 是否为移动设备

    // 初始化应用
    init() {
        document.body.className = AppState.currentTheme;
        Storage.loadInitialData();
        
        // 检测是否为移动设备并初始化响应式布局
        this.initResponsive();
        
        // 动态加载导航按钮[V3.6更新]
        this.renderNavigation();

        // 绑定汉堡菜单事件
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('collapsed');
            });
        }
        
        // 导航按钮事件已在 renderNavigation() 中绑定，此处无需重复绑定
        
        // 默认加载主页
        this.loadDefaultPage();
        // const defaultActiveBtn = document.querySelector('.nav-btn[data-page="home"]');
        // if (defaultActiveBtn) {
        //     this.setActiveNav(defaultActiveBtn);
        //     this.loadPage('home');
        // }
    },
    
    // ==================== 移动端响应式初始化 ====================
    /**
     * 初始化响应式布局
     * 检测是否为移动设备，自动折叠侧边栏
     */
    initResponsive() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        // 检测是否为移动设备
        this.checkMobile();
        
        // 初始状态：移动端默认折叠侧边栏
        if (this.isMobile) {
            sidebar.classList.add('collapsed');
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.checkMobile();
            
            // 从桌面端切换到移动端：自动折叠
            if (!wasMobile && this.isMobile) {
                sidebar.classList.add('collapsed');
            }
            // 从移动端切换到桌面端：可选展开（根据用户偏好）
            // 这里保持当前状态，不强制展开
        });
    },
    
    /**
     * 检测是否为移动设备
     * 使用屏幕宽度和 UserAgent 双重检测
     */
    checkMobile() {
        const mobileWidth = 768;  // 与 CSS 媒体查询保持一致
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= mobileWidth;
        const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.isMobile = isSmallScreen || (mobileUserAgent && isTouch);
        return this.isMobile;
    },
    
    /** ---------------------------------------------------
     * @brief:		根据 PageConfig 动态渲染导航栏并绑定事件
     * @function:		renderNavigation
     *----------------------------------------------------*/
    renderNavigation() {
        const navContainer = document.getElementById('dynamic-nav-container');
        if (!navContainer || !window.PageConfig) return;
        
        // 清空容器，防止重复渲染
        navContainer.innerHTML = '';
        
        window.PageConfig.forEach(config => {
            const button = document.createElement('button');
            button.className = 'nav-btn';
            button.dataset.page = config.id; // 设置路由标识
            button.innerHTML = `<span>${config.icon}</span> <span>${config.name}</span>`;
            
            // 绑定点击事件：设置激活状态并加载页面
            button.addEventListener('click', () => {
                this.setActiveNav(button);
                this.loadPage(config.id);
            });
            
            navContainer.appendChild(button);
        });
    },

    /**
     * 加载默认页面（配置文件中标明 isDefault 的页面，或第一个页面）
     */
    loadDefaultPage() {
        if (!window.PageConfig || window.PageConfig.length === 0) {
            console.error('PageConfig 未定义或为空');
            return;
        }
        
        // 查找默认页面配置
        let defaultConfig = window.PageConfig.find(config => config.isDefault);
        // 如果未设置 isDefault，则使用第一个页面作为默认页
        if (!defaultConfig) {
            defaultConfig = window.PageConfig[0];
            console.warn('未在 PageConfig 中找到标记为 isDefault 的页面，将使用第一项作为默认页。');
        }
        
        // 找到对应的导航按钮并激活
        const defaultNavButton = document.querySelector(`.nav-btn[data-page="${defaultConfig.id}"]`);
        if (defaultNavButton) {
            this.setActiveNav(defaultNavButton);
        }
        // 加载默认页面
        this.loadPage(defaultConfig.id);
    },

    // 设置导航按钮激活状态
    setActiveNav(activeBtn) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    },
    
    /**
     * 根据页面ID加载对应页面
     * @param {string} pageId - 页面标识符，对应 PageConfig 中的 id
     */
    loadPage(pageId) {
        // 1. 清理当前页面资源（预留清理接口，根据页面需要实现）
        if (this.currentPageModule && typeof this.currentPageModule.cleanup === 'function') {
            this.currentPageModule.cleanup();
        }
        this.currentPageModule = null;
        
        // 2. 切换到不同页面时，强制退出编辑模式
        if (AppState.currentPage !== pageId && AppState.isEditMode) {
            AppState.setEditMode(false);
        }
        AppState.setCurrentPage(pageId);
        
        // 3. 根据 pageId 获取页面配置
        const config = window.PageConfig?.getConfig(pageId);
        if (!config) {
            console.error(`页面配置未找到: ${pageId}`);
            this.showErrorPage(`页面“${pageId}”配置不存在`);
            return;
        }
        
        // 4. 根据配置类型，调用不同的渲染方法
        const contentArea = document.getElementById('content-area');
        if (!contentArea) {
            console.error('内容区域 (#content-area) 未找到');
            return;
        }
        
        if (config.type === 'module') {
            this.loadModulePage(config, contentArea);
        } else if (config.type === 'iframe') {
            this.loadIframePage(config, contentArea); // 未来扩展
        } else {
            console.error(`未知的页面类型: ${config.type} (页面: ${pageId})`);
            this.showErrorPage(`页面“${config.name}”类型配置错误`);
        }
    },

    /**
     * 加载 JS 模块页面
     * @param {PageConfigItem} config - 页面配置
     * @param {HTMLElement} container - 内容容器
     */
    loadModulePage(config, container) {
        const module = window.PageModules?.[config.moduleName];
        if (!module) {
            console.error(`页面模块未找到: ${config.moduleName} (页面: ${config.id})`);
            this.showErrorPage(`页面“${config.name}”加载失败`);
            return;
        }
        
        // 渲染页面
        container.innerHTML = module.render();
        // 初始化页面逻辑
        if (typeof module.init === 'function') {
            module.init();
        }
        // 记录当前模块，以便后续清理
        this.currentPageModule = module;
    },

    /**
     * 加载 iframe 页面
     * @param {PageConfigItem} config - 页面配置
     * @param {HTMLElement} container - 内容容器
     */
    loadIframePage(config, container) {
        // 清空容器
        container.innerHTML = '';
        
        // 1. 创建 iframe 容器，用于控制布局和可能添加加载状态
        const iframeContainer = document.createElement('div');
        iframeContainer.className = 'iframe-page-container';
        // 移除内联样式，使用 CSS 中定义的绝对定位
        // iframeContainer.style.width = '100%';
        // iframeContainer.style.height = '100%';
        // iframeContainer.style.position = 'relative'; // 为加载指示器定位做准备
        
        // 2. 创建 iframe 元素
        const iframe = document.createElement('iframe');
        iframe.id = `iframe-${config.id}`;
        iframe.src = config.src;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = 'inherit'; // 继承主容器的圆角
        iframe.referrerPolicy = 'no-referrer-when-downgrade'; // 可选的引用策略
        iframe.allow = 'fullscreen'; // 根据需要添加功能策略
        
        // 3. 可选：添加加载中和加载错误的处理
        iframe.onload = () => {
            console.log(`iframe页面加载成功: ${config.src}`);
            // 可以在此处移除加载中的指示器
        };
        iframe.onerror = () => {
            console.error(`iframe页面加载失败: ${config.src}`);
            // 可以在此处显示错误信息，例如：
            // iframeContainer.innerHTML = `<p class="error">无法加载页面 ${config.name}。</p>`;
        };
        
        // 4. 将 iframe 添加到容器，再将容器插入内容区
        iframeContainer.appendChild(iframe);
        container.appendChild(iframeContainer);
        
        // 5. 对于 iframe 页面，没有对应的 JS 模块，所以清理 currentPageModule
        this.currentPageModule = null;
    },

    /**
     * 显示错误页面（降级处理）
     * @param {string} message - 错误信息
     */
    showErrorPage(message) {
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="content-card">
                    <h2>⚠️ 页面加载异常</h2>
                    <p>${message}</p>
                    <p>请检查控制台获取详细信息，或<a href="javascript:location.reload()">刷新页面</a>重试。</p>
                </div>
            `;
        }
    },

    
    // 设置主题
    setTheme(themeClass) {
        document.body.className = themeClass;
        localStorage.setItem('navTheme', themeClass);
        AppState.setTheme(themeClass);
    },
    
    // 刷新当前页面
    refreshCurrentPage() { this.loadPage(AppState.currentPage); }
};
//#endregion

// ==================== 8. 全局导出与初始化 ====================
//#region 全局导出与初始化
// 导出核心模块到 CoreModules 命名空间
window.CoreModules = { AppState, Utils, Storage, DataOperations, ModalManager, AppInitializer };
// 同时导出到全局变量，保持向后兼容
window.AppState = AppState;
window.Utils = Utils;
window.Storage = Storage;
window.DataOperations = DataOperations;
window.ModalManager = ModalManager;
window.AppInitializer = AppInitializer;

// 延迟初始化，等待所有脚本（包括 Pages 文件夹里的页面模块）加载完成
window.addEventListener('load', () => AppInitializer.init());
//#endregion
