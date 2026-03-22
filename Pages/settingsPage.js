/** ---------------------------------------------------
 * @brief:		设置页面模块 - 主题切换 + 图标获取控制
 * @file:		settingsPage.js
 * @author:		GeorgeHua
 * @date:		2026/03/22
 *----------------------------------------------------*/

const SettingsPage = (function() {
    // ==================== 图标源配置 ====================
    //#region 图标源配置
    
    /**
     * 图标源URL生成器
     * @param {string} source - 图标源标识
     * @param {string} domain - 域名
     * @returns {string} 图标URL
     */
    function getIconUrl(source, domain) {
        const sources = {
            // IconHorse 服务（推荐，支持多种尺寸，国内可访问）✅
            // 32px图标，配合bookmark-icon.css中32*32px显示
            iconhorse: `https://icon.horse/icon/${domain}?size=32`,
            // Yandex 图标服务（俄罗斯搜索引擎）
            yandex: `https://favicon.yandex.net/favicon/${domain}`,
            // 直接获取网站根目录的 favicon.ico（跨域限制，成功率低）
            direct: `https://${domain}/favicon.ico`
        };
        return sources[source] || sources.iconhorse;
    }
    
    /**
     * 从URL提取域名
     * @param {string} url 
     * @returns {string}
     */
    function extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return url;
        }
    }
    //#endregion
    
    // ==================== 图标获取控制面板 ====================
    //#region 图标获取控制面板
    
    /**
     * 渲染图标控制面板HTML
     * @returns {string} HTML字符串
     */
    function renderIconControlPanel() {
        const showIcons = window.CoreModules.AppState.showIcons ?? false;
        const autoLoad = window.CoreModules.AppState.autoLoadIcons ?? false;
        const iconSource = window.CoreModules.AppState.iconSource ?? 'iconhorse';
        
        return `
            <div class="content-card">
                <h2>🖼️ 书签图标设置</h2>
                
                <!-- 显示图标开关 -->
                <div class="icon-setting-row">
                    <label class="icon-toggle-label">
                        <span class="toggle-slider ${showIcons ? 'active' : ''}" id="showIconsToggle"></span>
                        <span class="toggle-text">在书签页显示图标</span>
                    </label>
                </div>
                
                <!-- 自动加载开关 -->
                <div class="icon-setting-row">
                    <label class="icon-toggle-label">
                        <span class="toggle-slider ${autoLoad ? 'active' : ''}" id="autoLoadToggle"></span>
                        <span class="toggle-text">自动加载图标</span>
                    </label>
                </div>
                
                <!-- 图标源选择 -->
                <div class="icon-setting-row">
                    <label class="icon-select-label">
                        <span>图标源：</span>
                        <select class="icon-source-select" id="iconSourceSelect">
                        <option value="iconhorse" ${iconSource === 'iconhorse' ? 'selected' : ''}>IconHorse（推荐）</option>
                            <option value="yandex" ${iconSource === 'yandex' ? 'selected' : ''}>Yandex</option>
                            <option value="direct" ${iconSource === 'direct' ? 'selected' : ''}>直接获取（跨域限制）</option>
                        </select>
                    </label>
                </div>
                
                <!-- 控制按钮组 -->
                <div class="icon-control-buttons">
                    <button class="icon-btn primary" id="loadIconsBtn">
                        <span class="btn-icon">🔄</span>
                        <span>加载图标</span>
                    </button>
                    <button class="icon-btn secondary" id="stopLoadBtn" disabled>
                        <span class="btn-icon">⏹️</span>
                        <span>停止</span>
                    </button>
                    <button class="icon-btn danger" id="clearCacheBtn">
                        <span class="btn-icon">🗑️</span>
                        <span>清空缓存</span>
                    </button>
                </div>
                
                <!-- 更新模式选择（互斥复选框） -->
                <div class="icon-update-mode">
                    <span class="mode-label">更新模式：</span>
                    <label class="radio-label">
                        <input type="radio" name="updateMode" value="incremental" checked id="modeIncremental">
                        <span>增量更新（仅加载缺失）</span>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="updateMode" value="overwrite" id="modeOverwrite">
                        <span>覆盖更新（重新加载所有）</span>
                    </label>
                </div>
                
                <!-- 统计面板 -->
                <div class="icon-stats-panel">
                    <div class="stat-item">
                        <span class="stat-value" id="statTotal">0</span>
                        <span class="stat-label">总书签</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="statLoaded">0</span>
                        <span class="stat-label">已缓存</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="statFailed">0</span>
                        <span class="stat-label">失败</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="statPending">0</span>
                        <span class="stat-label">等待中</span>
                    </div>
                    <div class="stat-item cache-size">
                        <span class="stat-value" id="statCacheSize">0 KB</span>
                        <span class="stat-label">缓存大小</span>
                    </div>
                </div>
                
                <!-- 日志窗口 -->
                <div class="icon-log-panel">
                    <div class="log-header">
                        <span>📋 Icon Log </span>
                        <button class="clear-log-btn" id="clearLogBtn">清空</button>
                    </div>
                    <div class="log-content" id="iconLogContent">
                        <div class="log-entry info">系统就绪，等待操作...</div>
                    </div>
                </div>
            </div>
        `;
    }
    //#endregion
    
    // ==================== 主题设置面板 ====================
    //#region 主题设置面板
    
    /**
     * 渲染主题设置面板HTML
     * @returns {string} HTML字符串
     */
    function renderThemePanel() {
        const currentTheme = window.CoreModules.AppState.currentTheme;
        return `
            <div class="content-card settings-container">
                <h2>🎨 主题设置</h2>
                <div class="theme-options">
                    <button class="theme-btn modern" data-theme="theme-modern">📰 现代编辑</button>
                    <button class="theme-btn glass" data-theme="theme-glass">🥛 柔和玻璃</button>
                    <button class="theme-btn tech" data-theme="theme-tech">💻 科技</button>
                </div>
                <p class="current-theme-text">当前主题：<span id="current-theme-label">${window.CoreModules.Utils.getThemeName(currentTheme)}</span></p>
            </div>
        `;
    }
    //#endregion
    
    // ==================== 页面渲染 ====================
    //#region 页面渲染
    
    function render() {
        return `
            ${renderThemePanel()}
            ${renderIconControlPanel()}
        `;
    }
    //#endregion
    
    // ==================== 事件绑定 ====================
    //#region 事件绑定
    
    function init() {
        initThemeEvents();
        initIconControlEvents();
        updateThemeButtonsActive(window.CoreModules.AppState.currentTheme);
        updateIconStats();
        console.log('SettingsPage 初始化完成');
    }
    
    function initThemeEvents() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.CoreModules.AppInitializer) {
                    window.CoreModules.AppInitializer.setTheme(btn.dataset.theme);
                    updateThemeButtonsActive(btn.dataset.theme);
                }
            });
        });
    }
    
    function initIconControlEvents() {
        // 显示图标开关
        const showIconsToggle = document.getElementById('showIconsToggle');
        if (showIconsToggle) {
            showIconsToggle.addEventListener('click', () => {
                const newState = !showIconsToggle.classList.contains('active');
                showIconsToggle.classList.toggle('active', newState);
                window.CoreModules.AppState.setShowIcons(newState);
                addLog(`图标显示已${newState ? '开启' : '关闭'}`, 'info');
                // 通知主页刷新（如果当前在主页）
                if (window.CoreModules.AppState.currentPage === 'home' && window.CoreModules.AppInitializer) {
                    window.CoreModules.AppInitializer.loadPage('home');
                }
            });
        }
        
        // 自动加载开关
        const autoLoadToggle = document.getElementById('autoLoadToggle');
        if (autoLoadToggle) {
            autoLoadToggle.addEventListener('click', () => {
                const newState = !autoLoadToggle.classList.contains('active');
                autoLoadToggle.classList.toggle('active', newState);
                window.CoreModules.AppState.setAutoLoadIcons(newState);
                addLog(`自动加载已${newState ? '开启' : '关闭'}`, 'info');
            });
        }
        
        // 图标源选择
        const iconSourceSelect = document.getElementById('iconSourceSelect');
        if (iconSourceSelect) {
            iconSourceSelect.addEventListener('change', (e) => {
                window.CoreModules.AppState.setIconSource(e.target.value);
                addLog(`图标源已切换为: ${e.target.options[e.target.selectedIndex].text}`, 'info');
            });
        }
        
        // 加载图标按钮
        const loadIconsBtn = document.getElementById('loadIconsBtn');
        if (loadIconsBtn) {
            loadIconsBtn.addEventListener('click', () => {
                const isOverwrite = document.getElementById('modeOverwrite').checked;
                startIconLoading(isOverwrite);
            });
        }
        
        // 停止按钮
        const stopLoadBtn = document.getElementById('stopLoadBtn');
        if (stopLoadBtn) {
            stopLoadBtn.addEventListener('click', stopIconLoading);
        }
        
        // 清空缓存按钮
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', clearIconCache);
        }
        
        // 清空日志按钮
        const clearLogBtn = document.getElementById('clearLogBtn');
        if (clearLogBtn) {
            clearLogBtn.addEventListener('click', clearLogs);
        }
    }
    //#endregion
    
    // ==================== 主题相关函数 ====================
    //#region 主题相关函数
    
    function updateThemeButtonsActive(currentTheme) {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
        });
    }
    //#endregion
    
    // ==================== 图标加载核心功能 ====================
    //#region 图标加载核心功能
    
    // 加载状态
    let isLoading = false;
    let shouldStop = false;
    let loadQueue = [];
    let currentIndex = 0;
    let loadedCount = 0;
    let failedCount = 0;
    
    // 配置
    const CONFIG = {
        TIMEOUT: 20000,         // 单个图标超时时间（毫秒）- 20秒
        BATCH_DELAY: 500,       // 批次间隔（毫秒）- 500ms，避免服务器限流
        CONCURRENT: 5           // 并发加载数量 - 5个
    };
    
    /**
     * 加载单个图标
     * @param {Object} bookmark - 书签对象
     * @param {string} source - 图标源
     * @returns {Promise<{success: boolean, dataUrl?: string, error?: string}>}
     */
    function loadSingleIcon(bookmark, source) {
        return new Promise((resolve) => {
            const domain = extractDomain(bookmark.url);
            const iconUrl = getIconUrl(source, domain);
            
            const img = new Image();
            let isResolved = false;
            
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    img.src = '';
                    resolve({ success: false, error: '超时' });
                }
            }, CONFIG.TIMEOUT);
            
            img.onload = () => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timeoutId);
                
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || 32;
                    canvas.height = img.naturalHeight || 32;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve({ success: true, dataUrl });
                } catch (e) {
                    resolve({ success: false, error: '转换失败' });
                }
            };
            
            img.onerror = () => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeoutId);
                    resolve({ success: false, error: '加载失败' });
                }
            };
            
            img.crossOrigin = 'anonymous';
            img.src = iconUrl;
        });
    }
    
    /**
     * 开始加载图标
     * @param {boolean} isOverwrite - 是否覆盖更新
     */
    async function startIconLoading(isOverwrite) {
        if (isLoading) {
            addLog('加载已在进行中...', 'warning');
            return;
        }
        
        isLoading = true;
        shouldStop = false;
        loadedCount = 0;
        failedCount = 0;
        
        // 更新UI状态
        document.getElementById('loadIconsBtn').disabled = true;
        document.getElementById('stopLoadBtn').disabled = false;
        
        // 获取书签列表
        const data = window.CoreModules.Storage.getAppData();
        const source = window.CoreModules.AppState.iconSource;
        
        // 根据更新模式筛选需要加载的书签
        if (isOverwrite) {
            loadQueue = [...data.bookmarks];
            addLog(`开始覆盖加载 ${loadQueue.length} 个图标...`, 'info');
        } else {
            loadQueue = data.bookmarks.filter(b => 
                !window.CoreModules.AppState.hasCachedIcon(b.id)
            );
            addLog(`开始增量加载 ${loadQueue.length} 个图标...`, 'info');
        }
        
        currentIndex = 0;
        
        // 批量加载
        await processLoadQueue(source);
        
        // 完成
        finishLoading();
    }
    
    /**
     * 处理加载队列
     * @param {string} source - 图标源
     */
    async function processLoadQueue(source) {
        while (currentIndex < loadQueue.length && !shouldStop) {
            // 取出一批书签并发加载
            const batch = loadQueue.slice(currentIndex, currentIndex + CONFIG.CONCURRENT);
            
            await Promise.all(batch.map(async (bookmark) => {
                if (shouldStop) return;
                
                const result = await loadSingleIcon(bookmark, source);
                
                if (shouldStop) return;
                
                if (result.success) {
                    window.CoreModules.AppState.setCachedIcon(
                        bookmark.id, 
                        result.dataUrl, 
                        source, 
                        true
                    );
                    loadedCount++;
                    addLog(`✅ ${bookmark.name}`, 'success');
                } else {
                    window.CoreModules.AppState.markIconFailed(bookmark.id, source);
                    failedCount++;
                    addLog(`❌ ${bookmark.name}: ${result.error}`, 'error');
                }
                
                // 更新统计
                updateIconStats();
            }));
            
            currentIndex += CONFIG.CONCURRENT;
            
            // 批次间隔
            if (!shouldStop && currentIndex < loadQueue.length) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY));
            }
        }
    }
    
    /**
     * 停止图标加载
     */
    function stopIconLoading() {
        if (!isLoading) return;
        
        shouldStop = true;
        addLog('正在停止加载...', 'warning');
    }
    
    /**
     * 完成加载
     */
    function finishLoading() {
        isLoading = false;
        
        // 更新UI状态
        document.getElementById('loadIconsBtn').disabled = false;
        document.getElementById('stopLoadBtn').disabled = true;
        
        // 最终统计
        updateIconStats();
        
        if (shouldStop) {
            addLog(`加载已停止，已加载 ${loadedCount} 个，失败 ${failedCount} 个`, 'warning');
        } else {
            addLog(`加载完成！成功 ${loadedCount} 个，失败 ${failedCount} 个`, 'success');
        }
    }
    
    /**
     * 清空图标缓存
     */
    function clearIconCache() {
        if (!confirm('确定要清空所有图标缓存吗？')) return;
        
        window.CoreModules.AppState.clearIconCache();
        addLog('缓存已清空', 'success');
        updateIconStats();
    }
    
    /**
     * 更新统计面板
     */
    function updateIconStats() {
        const stats = window.CoreModules.AppState.getIconStats();
        
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statLoaded').textContent = stats.cached;
        document.getElementById('statFailed').textContent = stats.failed;
        document.getElementById('statPending').textContent = stats.pending;
        document.getElementById('statCacheSize').textContent = stats.cacheSize;
    }
    //#endregion
    
    // ==================== 日志功能 ====================
    //#region 日志功能
    
    function addLog(message, type = 'info') {
        const logContent = document.getElementById('iconLogContent');
        if (!logContent) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logContent.insertBefore(entry, logContent.firstChild);
        
        // 限制日志条目数量
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.lastChild);
        }
    }
    
    function clearLogs() {
        const logContent = document.getElementById('iconLogContent');
        if (logContent) {
            logContent.innerHTML = '<div class="log-entry info">日志已清空</div>';
        }
    }
    //#endregion
    
    // ==================== 清理资源 ====================
    //#region 清理资源
    
    function cleanup() {
        if (isLoading) {
            stopIconLoading();
        }
        console.log('SettingsPage 资源已清理');
    }
    //#endregion
    
    return {
        render,
        init,
        cleanup
    };
})();

window.PageModules = window.PageModules || {};
window.PageModules.SettingsPage = SettingsPage;
