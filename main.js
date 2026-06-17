// ==================== main.js ====================
// 模块化组织的应用主文件，页面渲染逻辑已分离到 Pages/ 目录
/*
    - AppState: 应用状态管理
    - Utils: 工具函数
    - Storage: 数据持久化
    - DataOperations: 数据操作
    - ModalManager: 弹窗管理
    - ToastManager: 非阻塞提示管理
    - AppInitializer: 应用初始化
*/ 

// 【V6.3.3】主题选项只保留 className 与 label，避免为当前不需要的兼容和图标元数据增加复杂度。
const THEME_OPTIONS = [
    { className: 'theme-glass', label: '玻璃风格' },
    { className: 'theme-illustration', label: '插画风格' },
    { className: 'theme-light-modern', label: '浅色现代' },
    { className: 'theme-dark-modern', label: '深色现代' },
    { className: 'theme-tech', label: '科技风格' }
];
// 【V6.3.3】风格主题白名单由主题选项清单生成，主题切换只替换这些 class。
const THEME_CLASSES = THEME_OPTIONS.map(theme => theme.className);
const DEFAULT_THEME = 'theme-illustration';

function getStoredTheme() {
    const storedTheme = localStorage.getItem('navTheme');
    return THEME_CLASSES.includes(storedTheme) ? storedTheme : DEFAULT_THEME;
}

// ==================== 1. AppState - 应用状态管理 ====================
//#region AppState 模块
const AppState = {
    currentPage: 'home',
    isEditMode: false,
    selectedIds: new Set(),
    currentFilterCategory: 'cat_1',
    currentTheme: getStoredTheme(),
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
    // 【V6.3.3】根据主题选项清单获取中文名称，避免设置页和工具函数维护两套主题文案。
    getThemeName(themeClass) {
        const theme = THEME_OPTIONS.find(item => item.className === themeClass);
        return theme ? theme.label : '未知';
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
    /**
     * V6.1.1：从 data.js 创建运行时默认数据副本。
     * data.js 使用 VERSION 字段，localStorage 运行时统一使用 version 字段。
     */
    createDefaultData() {
        return this.toRuntimeData(window.bookmarkData || {});
    },

    /**
     * V6.1.1：生成用户在浏览器内修改书签/分类后的数据版本。
     * 版本用于 Reset 前提示是否需要导出，不参与页面刷新时的数据源选择。
     */
    createDataVersion(date = new Date()) {
        const pad = value => String(value).padStart(2, '0');
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('-') + '_' + [
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds())
        ].join('-');
    },

    /**
     * V6.1.1：将 data.js/导入数据转换成 localStorage 使用的运行时结构。
     * 这里只处理当前项目的固定字段，不引入复杂兼容层。
     */
    toRuntimeData(rawData = {}) {
        const data = {
            version: rawData.version || rawData.VERSION || window.bookmarkData.VERSION,
            searchEngines: Array.isArray(rawData.searchEngines) ? rawData.searchEngines.map(item => ({ ...item })) : [],
            categories: Array.isArray(rawData.categories) ? rawData.categories.map(item => ({ ...item })) : [],
            bookmarks: Array.isArray(rawData.bookmarks) ? rawData.bookmarks.map(item => ({ ...item })) : []
        };

        this.ensureUncategorizedCategory(data);
        return data;
    },

    /**
     * V6.1.1：最小数据检查，避免导入明显不是书签数据的文件。
     * 个人本地项目不做复杂 schema 校验，字段细节仍由当前 UI 操作保证。
     */
    isUsableAppData(data) {
        return !!(
            data &&
            Array.isArray(data.searchEngines) &&
            Array.isArray(data.categories) &&
            Array.isArray(data.bookmarks)
        );
    },

    /**
     * V6.1.1：解析项目约定的 data.js 导入格式。
     * 这里保留简单解析方式，前提是只导入自己导出的或可信任的 data.js 文件。
     */
    parseBookmarkDataContent(content) {
        const match = content.match(/window\.bookmarkData\s*=\s*(\{[\s\S]*?\});/);
        if (!match) {
            throw new Error('未找到 window.bookmarkData 定义');
        }

        return new Function('return ' + match[1])();
    },

    // V6.1.1：加载时只判断 localStorage 是否存在；存在则保留用户运行时数据。
    loadInitialData() {
        const stored = localStorage.getItem('bookmarkAppData');
        if (stored) {
            try {
                const data = this.toRuntimeData(JSON.parse(stored));
                if (this.isUsableAppData(data)) {
                    return data;
                }
            } catch (e) {
                console.warn('本地书签数据解析失败，已回退到默认数据:', e);
            }
        }
        // 无本地运行时数据时，使用 data.js 默认数据初始化。
        const initialData = this.createDefaultData();
        this.saveAppData(initialData);
        return initialData;
    },
    
    // V6.1.1：预处理空分类，统一归入当前 data.js 中的 cat-empty。
    ensureUncategorizedCategory(data) {
        data.bookmarks.forEach(bookmark => {
            if (!bookmark.category || bookmark.category === '') {
                bookmark.category = 'cat-empty';
            }
        });
        return data;
    },

    getAppData() {
        const stored = localStorage.getItem('bookmarkAppData');
        if (!stored) return this.loadInitialData();

        try {
            const data = this.toRuntimeData(JSON.parse(stored));
            if (!this.isUsableAppData(data)) {
                throw new Error('本地数据结构不完整');
            }
            return data;
        } catch (e) {
            console.warn('读取本地书签数据失败，已重置为默认数据:', e);
            return this.resetToDefault();
        }
    },

    /**
     * V6.1.1：保存运行时数据。
     * 只有用户通过界面修改书签/分类时传入 markModified，才更新时间版本用于 Reset 提示。
     */
    saveAppData(data, options = {}) {
        const runtimeData = this.toRuntimeData(data);
        if (options.markModified) {
            runtimeData.version = this.createDataVersion();
        }

        localStorage.setItem('bookmarkAppData', JSON.stringify(runtimeData));
        return runtimeData;
    },
    
    // 导入数据文件
    importDataFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            try {
                const importedData = this.toRuntimeData(this.parseBookmarkDataContent(content));
                if (!this.isUsableAppData(importedData)) {
                    alert('数据格式不完整，导入失败'); return;
                }
                this.saveAppData(importedData);
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

    /**
     * V6.1.1：Reset 前只用版本判断是否提示导出。
     * 版本不同表示浏览器运行时数据可能未同步回 data.js。
     */
    shouldWarnBeforeReset(data = this.getAppData()) {
        return data.version !== window.bookmarkData.VERSION;
    },
    
    resetToDefault() {
        const defaultData = this.createDefaultData();
        this.saveAppData(defaultData);
        return defaultData;
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
        // V6.1.1：用户通过界面新增书签后更新时间版本，用于 Reset 前提示导出。
        Storage.saveAppData(data, { markModified: true });
        return newBookmark;
    },
    
    // 更新书签
    updateBookmark(id, updates) {
        const data = Storage.getAppData();
        const index = data.bookmarks.findIndex(b => b.id == id);
        if (index !== -1) {
            data.bookmarks[index] = { ...data.bookmarks[index], ...updates };
            // V6.1.1：用户通过界面编辑书签后更新时间版本，用于 Reset 前提示导出。
            Storage.saveAppData(data, { markModified: true });
            return data.bookmarks[index];
        }
        return null;
    },
    
    // 批量删除书签
    deleteBookmarks(ids) {
        const data = Storage.getAppData();
        const idsToDelete = new Set(ids.map(id => id.toString()));
        data.bookmarks = data.bookmarks.filter(b => !idsToDelete.has(b.id.toString()));
        // V6.1.1：用户通过界面删除书签后更新时间版本，用于 Reset 前提示导出。
        Storage.saveAppData(data, { markModified: true });
        return data.bookmarks;
    },
    
    // 批量修改分类
    batchUpdateCategory(ids, category) {
        const data = Storage.getAppData();
        ids.forEach(id => {
            const index = data.bookmarks.findIndex(b => b.id == id);
            if (index !== -1) data.bookmarks[index].category = category;
        });
        // V6.1.1：用户通过界面批量修改分类后更新时间版本，用于 Reset 前提示导出。
        Storage.saveAppData(data, { markModified: true });
        return data.bookmarks;
    },
    
    // 根据分类筛选书签
    filterBookmarksByCategory(bookmarks, category) {
        if (category === 'all') {
            return bookmarks;
        } else if (category === 'cat-empty') {
            // V6.1.1：当前分类约定统一使用 cat-empty，不再保留历史 empty 分支。
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

// ==================== 6. ToastManager - 非阻塞提示管理 ====================
//#region ToastManager 模块
const ToastManager = {
    /**
     * V6.1.1：显示非阻塞提示，用于 Reset 成功等无需用户确认的反馈。
     * @param {string} message - 提示文本
     * @param {'info'|'success'|'warning'} type - 提示类型
     * @param {number} duration - 自动消失时间，单位毫秒
     */
    show(message, type = 'info', duration = 1000) {
        const container = this.getContainer();
        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // 先插入 DOM 再触发可见状态，保证 CSS 过渡动画生效。
        requestAnimationFrame(() => toast.classList.add('visible'));

        setTimeout(() => {
            toast.classList.remove('visible');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, duration);
    },

    /**
     * V6.1.1：复用全局 Toast 容器，避免每次提示都创建固定定位节点。
     * @returns {HTMLElement}
     */
    getContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
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
        this.applyThemeClass(AppState.currentTheme);
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
            // V6.1.2：模块页当前采用预加载脚本方案，缺失时优先检查 index.html 是否引入对应 Pages/*.js。
            console.error(`页面模块未找到: ${config.moduleName} (页面: ${config.id})`);
            this.showErrorPage(`页面“${config.name}”加载失败，请检查 PageConfig.js 的 moduleName 与 index.html 的页面脚本引入是否一致。`);
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

    
    // 【V6.3.1】只替换主题 class，保留 body 上未来可能存在的其他状态类。
    applyThemeClass(themeClass) {
        document.body.classList.remove(...THEME_CLASSES);
        document.body.classList.add(themeClass);
    },

    // 设置主题
    setTheme(themeClass) {
        const nextTheme = THEME_CLASSES.includes(themeClass) ? themeClass : DEFAULT_THEME;
        this.applyThemeClass(nextTheme);
        localStorage.setItem('navTheme', nextTheme);
        AppState.setTheme(nextTheme);
    },
    
    // 刷新当前页面
    refreshCurrentPage() { this.loadPage(AppState.currentPage); }
};
//#endregion

// ==================== 8. 全局导出与初始化 ====================
//#region 全局导出与初始化
// 导出核心模块到 CoreModules 命名空间
// 【V6.3.3】导出主题选项清单，设置页直接复用 className/label 生成主题按钮。
window.CoreModules = { AppState, Utils, Storage, DataOperations, ModalManager, ToastManager, AppInitializer, THEME_OPTIONS };
// 同时导出到全局变量，保持向后兼容
window.AppState = AppState;
window.Utils = Utils;
window.Storage = Storage;
window.DataOperations = DataOperations;
window.ModalManager = ModalManager;
window.ToastManager = ToastManager;
window.AppInitializer = AppInitializer;

// 延迟初始化，等待所有脚本（包括 Pages 文件夹里的页面模块）加载完成
window.addEventListener('load', () => AppInitializer.init());
//#endregion
