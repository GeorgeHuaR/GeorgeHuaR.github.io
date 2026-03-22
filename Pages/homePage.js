/** ---------------------------------------------------
 * @brief:		书签主页模块 - 核心页面，包含书签展示、搜索、编辑、分类管理等功能
 * @file:		homePage.js
 * @author:		GeorgeHua
 * @date:		2026/03/21 15:00:00
 *----------------------------------------------------*/

const HomePage = (function() {
    let currentGrid = null;     // 当前书签网格容器
    let currentData = null;     // 当前应用数据

    // ==================== 分类管理相关函数 ====================
    //#region 分类管理
    // 添加分类
    function addCategory(category) {
        const data = window.CoreModules.Storage.getAppData();
        const newId = 'cat_' + Date.now();
        const newCategory = {
            id: newId,
            name: category.name,
            icon: category.icon || '📁'
        };
        data.categories.push(newCategory);
        window.CoreModules.Storage.saveAppData(data);
        return newCategory;
    }

    // 更新分类
    function updateCategory(id, updates) {
        const data = window.CoreModules.Storage.getAppData();
        const index = data.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            data.categories[index] = { ...data.categories[index], ...updates };
            window.CoreModules.Storage.saveAppData(data);
            return data.categories[index];
        }
        return null;
    }

    // 删除分类
    function deleteCategory(id) {
        const data = window.CoreModules.Storage.getAppData();
        // 不允许删除"未分类"和"全部"
        if (id === 'cat-empty' || id === 'all') {
            alert('不能删除此分类');
            return false;
        }
        // 将该分类下的书签移至"未分类"
        data.bookmarks.forEach(bookmark => {
            if (bookmark.category === id) {
                bookmark.category = 'cat-empty';
            }
        });
        // 删除分类
        data.categories = data.categories.filter(c => c.id !== id);
        window.CoreModules.Storage.saveAppData(data);
        return true;
    }

    // 显示分类管理弹窗
    function showCategoryManageDialog() {
        const data = window.CoreModules.Storage.getAppData();
        const categories = data.categories.filter(c => c.id !== 'all');

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.width = '500px';
        modal.style.maxHeight = '80vh';
        modal.style.overflow = 'auto';

        // HTML 转义函数
        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>]/g, function(m) {
                if (m === '&') return '&amp;';
                if (m === '<') return '&lt;';
                if (m === '>') return '&gt;';
                return m;
            });
        }

        // 渲染分类列表
        const renderList = () => {
            const updatedData = window.CoreModules.Storage.getAppData();
            const updatedCategories = updatedData.categories.filter(c => c.id !== 'all');
            const listHtml = updatedCategories.map(cat => {
                const canDelete = cat.id !== 'cat-empty';
                return `
                    <div class="category-item" data-id="${cat.id}">
                        <span class="cat-icon">${escapeHtml(cat.icon)}</span>
                        <span class="cat-name">${escapeHtml(cat.name)}</span>
                        <div class="cat-actions">
                            <button class="cat-edit" data-id="${cat.id}">✏️</button>
                            ${canDelete ? `<button class="cat-delete" data-id="${cat.id}">🗑️</button>` : '<button class="cat-delete" disabled style="opacity:0.5">🗑️</button>'}
                        </div>
                    </div>
                `;
            }).join('');
            return `<div class="category-list">${listHtml || '<p>暂无分类，点击下方按钮新增</p>'}</div>`;
        };

        // 刷新列表
        const refreshList = () => {
            const container = document.getElementById('categoryListContainer');
            if (container) {
                container.innerHTML = renderList();
                bindListEvents();
            }
        };

        // 绑定列表事件
        const bindListEvents = () => {
            // 编辑按钮
            document.querySelectorAll('.cat-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const catId = btn.dataset.id;
                    const category = window.CoreModules.Storage.getAppData().categories.find(c => c.id === catId);
                    if (category) startInlineEdit(catId);
                });
            });
            // 删除按钮（排除禁用的）
            document.querySelectorAll('.cat-delete:not([disabled])').forEach(btn => {
                btn.addEventListener('click', () => {
                    const catId = btn.dataset.id;
                    const category = window.CoreModules.Storage.getAppData().categories.find(c => c.id === catId);
                    if (category && category.id !== 'cat-empty') {
                        if (confirm(`确定删除分类"${category.name}"吗？该分类下的所有书签将移至"未分类"。`)) {
                            deleteCategory(catId);
                            refreshList();
                        }
                    }
                });
            });
        };

        // 开始行内编辑
        const startInlineEdit = (catId) => {
            const category = window.CoreModules.Storage.getAppData().categories.find(c => c.id === catId);
            if (!category) return;

            const itemDiv = document.querySelector(`.category-item[data-id="${catId}"]`);
            if (!itemDiv) return;

            const originalName = category.name;
            const originalIcon = category.icon;

            itemDiv.innerHTML = `
                <input type="text" id="edit-cat-name-${catId}" value="${escapeHtml(originalName)}" placeholder="分类名称" style="flex:2; margin-right:8px;">
                <input type="text" id="edit-cat-icon-${catId}" value="${escapeHtml(originalIcon)}" placeholder="图标" style="width:60px;">
                <div class="cat-actions">
                    <button class="save-edit" data-id="${catId}">✅</button>
                    <button class="cancel-edit" data-id="${catId}">❌</button>
                </div>
            `;

            const saveBtn = itemDiv.querySelector('.save-edit');
            saveBtn.addEventListener('click', () => {
                const newName = document.getElementById(`edit-cat-name-${catId}`).value.trim();
                const newIcon = document.getElementById(`edit-cat-icon-${catId}`).value.trim();
                if (!newName) {
                    alert('分类名称不能为空');
                    return;
                }
                updateCategory(catId, { name: newName, icon: newIcon || '📁' });
                refreshList();
            });

            const cancelBtn = itemDiv.querySelector('.cancel-edit');
            cancelBtn.addEventListener('click', () => refreshList());
        };

        // 添加分类 UI
        const addCategoryUI = () => {
            const container = document.getElementById('categoryListContainer');
            if (!container) return;

            let listDiv = container.querySelector('.category-list');
            if (!listDiv) {
                listDiv = document.createElement('div');
                listDiv.className = 'category-list';
                container.appendChild(listDiv);
            }

            const addRow = document.createElement('div');
            addRow.className = 'category-item';
            addRow.innerHTML = `
                <input type="text" id="new-cat-name" placeholder="分类名称" style="flex:2; margin-right:8px;">
                <input type="text" id="new-cat-icon" placeholder="图标" value="📁" style="width:60px;">
                <div class="cat-actions">
                    <button id="confirm-add">✅</button>
                    <button id="cancel-add">❌</button>
                </div>
            `;
            listDiv.appendChild(addRow);

            const confirmBtn = document.getElementById('confirm-add');
            const cancelBtn = document.getElementById('cancel-add');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    const newName = document.getElementById('new-cat-name').value.trim();
                    const newIcon = document.getElementById('new-cat-icon').value.trim();
                    if (!newName) {
                        alert('请输入分类名称');
                        return;
                    }
                    addCategory({ name: newName, icon: newIcon || '📁' });
                    refreshList();
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => refreshList());
            }
        };

        modal.innerHTML = `
            <h3>📂 分类管理</h3>
            <div id="categoryListContainer">${renderList()}</div>
            <div class="modal-actions" style="margin-top: 20px;">
                <button id="addCategoryBtn" class="modal-btn save">➕ 新增分类</button>
                <button id="closeCategoryBtn" class="modal-btn cancel">关闭</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 关闭弹窗后刷新内容（分类筛选 + 书签网格）
        const closeAndRefresh = () => {
            document.body.removeChild(overlay);
            currentData = window.CoreModules.Storage.getAppData();
            renderContent();
        };

        document.getElementById('addCategoryBtn').addEventListener('click', addCategoryUI);
        document.getElementById('closeCategoryBtn').addEventListener('click', closeAndRefresh);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAndRefresh();
        });

        bindListEvents();
    }
    //#endregion

    // ==================== 页面渲染相关函数 ====================
    // 渲染页面 HTML 结构（静态骨架）
    function render() {
        // 根据编辑模式生成不同的工具栏
        const isEditMode = window.CoreModules.AppState.isEditMode;
        let toolbarHtml = '';
        if (isEditMode) {
            toolbarHtml = `
                <div class="toolbar">
                    <div class="toolbar-group">
                        <span id="selectedCount">已选择 0 项</span>
                        <button class="toolbar-btn" id="editAttrBtn" disabled>✏️ 编辑属性</button>
                        <button class="toolbar-btn" id="batchCategoryBtn" disabled>📂 修改分类</button>
                        <button class="toolbar-btn" id="deleteBtn" disabled>🗑️ 删除</button>
                        <button class="toolbar-btn" id="exitEditBtn">✅ 完成</button>
                    </div>
                </div>
            `;
        } else {
            toolbarHtml = `
                <div class="toolbar">
                    <div class="toolbar-group">
                        <button class="toolbar-btn" id="manageCategoryBtn"> 📁分类</button>
                        <button class="toolbar-btn" id="addBookmarkBtn">➕ 添加</button>
                        <button class="toolbar-btn" id="editBookmarkBtn">✏️ 编辑</button>
                    </div>
                    <div class="toolbar-group">
                        <input type="text" class="bookmark-search-input" placeholder="🔍 搜索书签..." value="${window.CoreModules.AppState.currentSearchQuery}">
                    </div>
                    <div class="toolbar-group">
                        <button class="toolbar-btn" id="importDataBtn">📂 导入</button>
                        <button class="toolbar-btn" id="exportDataBtn">⏬ 导出</button>
                        <button class="toolbar-btn" id="resetBtn">🔄 重置</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="homepage-container">
                <div class="search-engine-container">
                    <div class="search-engine-row">
                        <select class="search-engine-select" id="searchEngineSelect"></select>
                        <input type="text" class="search-input" id="searchInput" placeholder="输入关键词...">
                        <button class="search-btn" id="searchBtn">🔍</button>
                    </div>
                </div>
                <div class="bookmarks-content">
                    <div class="category-filter" id="categoryFilter"></div>
                    <div class="bookmark-grid" id="bookmarkGrid"></div>
                </div>
                <div class="toolbar-container">
                    ${toolbarHtml}
                </div>
            </div>
        `;
    }

    // 获取过滤后的书签列表
    function getFilteredBookmarks(data) {
        const searchQuery = window.CoreModules.AppState.currentSearchQuery.toLowerCase().trim();
        
        // 如果有搜索关键词，直接在所有书签中搜索
        if (searchQuery) {
            return data.bookmarks.filter(b => 
                b.name.toLowerCase().includes(searchQuery) ||
                b.url.toLowerCase().includes(searchQuery)
            );
        }
        
        // 如果没有搜索关键词，根据分类筛选
        return window.CoreModules.DataOperations.filterBookmarksByCategory(
            data.bookmarks, 
            window.CoreModules.AppState.currentFilterCategory
        );
    }

    // 渲染分类筛选按钮
    function renderCategoryFilter() {
        const container = document.getElementById('categoryFilter');
        if (!container) return;
        
        const isEditMode = window.CoreModules.AppState.isEditMode;
        
        // 直接使用数据中的分类（已包含 "全部" 和 "未分类"）
        container.innerHTML = currentData.categories.map(cat => 
            `<button data-category="${cat.id}" class="${cat.id === window.CoreModules.AppState.currentFilterCategory ? 'active' : ''}" ${isEditMode ? 'disabled' : ''}>${cat.icon} ${cat.name}</button>`
        ).join('');
    }

    // 渲染书签网格
    function renderBookmarkGrid() {
        const container = document.getElementById('bookmarkGrid');
        if (!container) return;
        
        currentGrid = container;
        const isEditMode = window.CoreModules.AppState.isEditMode;
        const displayedBookmarks = getFilteredBookmarks(currentData);
        const showIcons = window.CoreModules.AppState.showIcons;

        if (displayedBookmarks.length === 0) {
            container.innerHTML = '<p class="empty-message">暂无书签</p>';
            return;
        }

        let gridHtml = '';
        displayedBookmarks.forEach(b => {
            const firstLetter = window.CoreModules.Utils.getFirstLetter(b.name);
            const domain = window.CoreModules.Utils.extractDomain(b.url);
            const checkedAttr = window.CoreModules.AppState.selectedIds.has(b.id) ? 'checked' : '';
            const checkboxHtml = isEditMode ? `<input type="checkbox" class="bookmark-checkbox" data-id="${b.id}" ${checkedAttr}>` : '';

            // 图标渲染逻辑
            let iconHtml = '';
            if (showIcons) {
                const cachedIcon = window.CoreModules.AppState.getCachedIcon(b.id);
                if (cachedIcon) {
                    // 显示缓存的图标图片
                    iconHtml = `<img class="bookmark-favicon" src="${cachedIcon}" alt="${b.name}" loading="lazy" />`;
                } else {
                    // 无缓存，显示首字母占位
                    iconHtml = `<span class="bookmark-letter">${firstLetter}</span>`;
                }
            } else {
                // 图标显示关闭，显示首字母
                iconHtml = `<span class="bookmark-letter">${firstLetter}</span>`;
            }

            gridHtml += `
                <div class="bookmark-card ${isEditMode ? 'edit-mode' : ''}" data-id="${b.id}" title="${b.description || ''}\n${b.url}">
                    ${checkboxHtml}
                    <a href="${b.url}" class="bookmark-link" target="_blank" rel="noopener noreferrer">
                        <div class="bookmark-icon">${iconHtml}</div>
                        <div class="bookmark-info">
                            <div class="bookmark-title">${b.name}</div>
                            <div class="bookmark-url">${domain}</div>
                        </div>
                    </a>
                </div>
            `;
        });
        container.innerHTML = gridHtml;

        // 编辑模式下绑定复选框事件
        if (isEditMode) {
            document.querySelectorAll('.bookmark-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    if (e.target.checked) {
                        window.CoreModules.AppState.addSelectedId(id);
                    } else {
                        window.CoreModules.AppState.removeSelectedId(id);
                    }
                    updateActionButtons();
                    updateSelectionCount();
                });
            });
        }
    }

    // 渲染搜索引擎选择器
    function renderSearchEngines() {
        const container = document.getElementById('searchEngineSelect');
        if (!container) return;
        
        container.innerHTML = currentData.searchEngines.map((se, idx) => 
            `<option value="${idx}">${se.name}</option>`
        ).join('');
    }

    // 渲染内容区域（分类筛选 + 书签网格）
    function renderContent() {
        renderCategoryFilter();
        renderBookmarkGrid();
        bindCategoryFilterEvents();
    }

    // 更新工具栏按钮状态
    function updateActionButtons() {
        const count = window.CoreModules.AppState.selectedIds.size;
        const editAttrBtn = document.getElementById('editAttrBtn');
        const batchCategoryBtn = document.getElementById('batchCategoryBtn');
        const deleteBtn = document.getElementById('deleteBtn');

        if (!editAttrBtn || !batchCategoryBtn || !deleteBtn) return;

        editAttrBtn.disabled = count !== 1;
        batchCategoryBtn.disabled = count === 0;
        deleteBtn.disabled = count === 0;
    }

    // 更新选中数量显示
    function updateSelectionCount() {
        const countSpan = document.getElementById('selectedCount');
        if (countSpan) {
            countSpan.textContent = `已选择 ${window.CoreModules.AppState.selectedIds.size} 项`;
        }
    }

    // 绑定分类筛选事件
    function bindCategoryFilterEvents() {
        if (window.CoreModules.AppState.isEditMode) return;
        
        const filterButtons = document.querySelectorAll('.category-filter button');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.CoreModules.AppState.setFilterCategory(btn.dataset.category);
                renderBookmarkGrid();
            });
        });
    }

    // 绑定搜索引擎事件
    function bindSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const engineSelect = document.getElementById('searchEngineSelect');

        function performSearch() {
            const query = searchInput.value.trim();
            if (!query) return;
            const engineIdx = engineSelect.value;
            const engine = currentData.searchEngines[engineIdx];
            window.open(engine.url + encodeURIComponent(query), '_blank');
        }

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // 绑定书签搜索事件
    function bindBookmarkSearchEvents() {
        const searchInput = document.querySelector('.bookmark-search-input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            window.CoreModules.AppState.currentSearchQuery = e.target.value;
            renderBookmarkGrid();
        });
    }

    // 绑定工具栏事件
    function bindToolbarEvents() {
        const isEditMode = window.CoreModules.AppState.isEditMode;

        if (isEditMode) {
            // 编辑模式事件
            // 编辑属性按钮点击事件
            document.getElementById('editAttrBtn').addEventListener('click', () => {
                if (window.CoreModules.AppState.selectedIds.size === 1) {
                    const id = Array.from(window.CoreModules.AppState.selectedIds)[0];
                    const bookmark = currentData.bookmarks.find(b => b.id === id);
                    if (bookmark) window.CoreModules.ModalManager.showEditDialog(bookmark);
                }
            });

            // 批量修改分类按钮点击事件
            document.getElementById('batchCategoryBtn').addEventListener('click', () => {
                if (window.CoreModules.AppState.selectedIds.size > 0) {
                    const selectedBookmarks = currentData.bookmarks.filter(b => window.CoreModules.AppState.selectedIds.has(b.id));
                    window.CoreModules.ModalManager.showBatchCategoryDialog(selectedBookmarks);
                }
            });

            // 删除按钮点击事件
            document.getElementById('deleteBtn').addEventListener('click', () => {
                if (window.CoreModules.AppState.selectedIds.size > 0) {
                    const selectedBookmarks = currentData.bookmarks.filter(b => window.CoreModules.AppState.selectedIds.has(b.id));
                    window.CoreModules.ModalManager.confirmDelete(selectedBookmarks);
                }
            });

            // 完成编辑按钮点击事件
            document.getElementById('exitEditBtn').addEventListener('click', () => {
                window.CoreModules.AppState.setEditMode(false);
                if (window.CoreModules.AppInitializer) {
                    window.CoreModules.AppInitializer.loadPage('home');
                }
            });

            updateSelectionCount();
        } else {
            // 非编辑模式事件
            // 分类管理按钮点击事件
            document.getElementById('manageCategoryBtn').addEventListener('click', showCategoryManageDialog);
            // 添加书签按钮点击事件
            document.getElementById('addBookmarkBtn').addEventListener('click', window.CoreModules.ModalManager.showAddBookmarkDialog);

            // 编辑模式按钮点击事件
            document.getElementById('editBookmarkBtn').addEventListener('click', () => {
                window.CoreModules.AppState.toggleEditMode();
                if (window.CoreModules.AppInitializer) {
                    window.CoreModules.AppInitializer.loadPage('home');
                }
            });

            // 导入数据按钮点击事件
            document.getElementById('importDataBtn').addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.js';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) window.CoreModules.Storage.importDataFile(file);
                };
                input.click();
            });

            // 导出数据按钮点击事件
            document.getElementById('exportDataBtn').addEventListener('click', () => window.CoreModules.Storage.exportDataFile());

            // 重置数据按钮点击事件
            document.getElementById('resetBtn').addEventListener('click', () => {
                const currentData = window.CoreModules.Storage.getAppData();
                const defaultData = {
                    version: window.bookmarkData.VERSION,
                    searchEngines: window.bookmarkData.searchEngines,
                    categories: window.bookmarkData.categories,
                    bookmarks: window.bookmarkData.bookmarks
                };
                if (!window.CoreModules.Utils.isDataEqual(currentData, defaultData)) {
                    if (confirm('⚠️当前书签数据已修改，确定要重置吗❓')) {
                        window.CoreModules.Storage.resetToDefault();
                        if (window.CoreModules.AppInitializer) {
                            window.CoreModules.AppInitializer.loadPage('home');
                        }
                    }
                } else {
                    if (confirm('⚠️确定重置书签？')) {
                        window.CoreModules.Storage.resetToDefault();
                        if (window.CoreModules.AppInitializer) {
                            window.CoreModules.AppInitializer.loadPage('home');
                        }
                    }
                }
            });
        }
    }

    // 初始化
    function init() {
        // 获取数据（只获取一次）
        currentData = window.CoreModules.Storage.getAppData();

        // 渲染动态内容
        renderSearchEngines();
        renderContent();

        // 绑定事件
        bindSearchEvents();
        bindBookmarkSearchEvents();
        bindToolbarEvents();

        console.log('HomePage 初始化完成');
    }

    // 清理资源
    function cleanup() {
        // currentGrid = null;
        // currentData = null;
    }

    return {
        render,
        init,
        cleanup
    };
})();

window.PageModules = window.PageModules || {};
window.PageModules.HomePage = HomePage;
