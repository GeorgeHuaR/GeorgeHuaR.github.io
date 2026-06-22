/** ---------------------------------------------------
 * @brief:      轻量级待办编辑器页面模块
 * @file:       editorPage.js
 * @author:     GeorgeHua
 * @date:       2026/06/22
 * @note:       独立 localStorage 存储，与书签数据解耦
 *              使用单次事件委托，避免重复绑定
 *----------------------------------------------------*/

const EditorPage = (function() {
    // ==================== 常量 ====================
    const STORAGE_KEY = 'editorTodoData';
    const CSS_FILE = 'Pages/editorPage.css';
    const CSS_ID = 'editor-page-css';
    const PRIORITY_CYCLE = ['', 'high', 'medium', 'low'];

    // ==================== 状态 ====================
    let state = {
        currentListId: null,
        sortBy: 'createdAt',
        filterBy: 'active'
    };
    let container = null;
    let idCounter = Date.now();
    let editingListId = null;

    // ==================== 数据管理 ====================
    function getData() {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                let data = JSON.parse(raw);
                if (data && Array.isArray(data.lists)) return data;
            } catch (e) { /* 数据损坏，重建 */ }
        }
        return createDefaultData();
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function createDefaultData() {
        return {
            lists: [
                {
                    id: 'list-' + (idCounter++),
                    name: '默认清单',
                    items: [
                        {
                            id: 'todo-' + (idCounter++),
                            text: '这是一个示例待办，双击可编辑',
                            done: false,
                            priority: 'low',
                            createdAt: new Date().toISOString()
                        }
                    ]
                }
            ]
        };
    }

    function findList(data, listId) {
        return data.lists.find(l => l.id === listId);
    }

    // ==================== 清单操作 ====================
    function createList(name) {
        let data = getData();
        let list = { id: 'list-' + (idCounter++), name: name, items: [] };
        data.lists.push(list);
        saveData(data);
        return list;
    }

    function renameList(listId, name) {
        let data = getData();
        let list = findList(data, listId);
        if (list) { list.name = name; saveData(data); }
    }

    function deleteList(listId) {
        let data = getData();
        data.lists = data.lists.filter(l => l.id !== listId);
        saveData(data);
        if (state.currentListId === listId) {
            state.currentListId = data.lists[0]?.id || null;
        }
    }

    // ==================== 待办操作 ====================
    function addItem(listId, text) {
        let data = getData();
        let list = findList(data, listId);
        if (!list) return;
        list.items.push({
            id: 'todo-' + (idCounter++),
            text: text,
            done: false,
            priority: '',
            createdAt: new Date().toISOString()
        });
        saveData(data);
    }

    function editItem(listId, itemId, text) {
        let data = getData();
        let item = findList(data, listId)?.items.find(i => i.id === itemId);
        if (item) { item.text = text; saveData(data); }
    }

    function toggleItem(listId, itemId) {
        let data = getData();
        let item = findList(data, listId)?.items.find(i => i.id === itemId);
        if (item) { item.done = !item.done; saveData(data); }
    }

    function deleteItem(listId, itemId) {
        let data = getData();
        let list = findList(data, listId);
        if (list) {
            list.items = list.items.filter(i => i.id !== itemId);
            saveData(data);
        }
    }

    function cyclePriority(listId, itemId) {
        let data = getData();
        let item = findList(data, listId)?.items.find(i => i.id === itemId);
        if (!item) return;
        let idx = PRIORITY_CYCLE.indexOf(item.priority);
        item.priority = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
        saveData(data);
    }

    // ==================== 排序与过滤 ====================
    function getSortedFilteredItems(list) {
        if (!list) return [];
        let items = [...list.items];
        if (state.filterBy === 'active') {
            items = items.filter(i => !i.done);
        }
        items.sort((a, b) => {
            if (state.sortBy === 'priority') {
                let rank = { 'high': 0, 'medium': 1, 'low': 2, '': 3 };
                let cmp = (rank[a.priority] || 3) - (rank[b.priority] || 3);
                if (cmp !== 0) return cmp;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return items;
    }

    // ==================== HTML 渲染 ====================
    function escapeHtml(str) {
        let div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function render() {
        return '<div class="content-card editor-wrapper"><div class="editor-container" id="editor-container"></div></div>';
    }

    function renderFullUI() {
        let data = getData();
        if (!data.lists.length) {
            createList('默认清单');
            data = getData();
        }
        if (!state.currentListId || !findList(data, state.currentListId)) {
            state.currentListId = data.lists[0].id;
        }
        container.innerHTML = renderSidebar(data) + renderMainArea(data);
    }

    function renderSidebar(data) {
        return '<div class="editor-sidebar">'
            + '<div class="editor-sidebar-header"><h3>📋 清单</h3></div>'
            + '<div class="editor-list-list">'
            + data.lists.map(renderListItem).join('')
            + '</div>'
            + '<div class="editor-sidebar-footer"><button class="editor-btn-add-list">+ 新建清单</button></div>'
            + '</div>';
    }

    function renderListItem(list) {
        let active = list.id === state.currentListId ? ' active' : '';
        let activeCount = list.items.filter(i => !i.done).length;
        let isEditing = editingListId === list.id;
        let nameHtml = isEditing
            ? '<input type="text" class="editor-inline-input" value="' + escapeHtml(list.name) + '">'
            : '<span class="editor-list-name">' + escapeHtml(list.name) + '</span>';
        return '<div class="editor-list-item' + active + '" data-list-id="' + list.id + '">'
            + '<div class="editor-list-info">'
            + nameHtml
            + '<span class="editor-list-count">' + activeCount + '</span>'
            + '</div>'
            + '<div class="editor-list-actions">'
            + '<button class="editor-btn-list-edit">✏️</button>'
            + '<button class="editor-btn-list-delete">🗑️</button>'
            + '</div>'
            + '</div>';
    }

    function renderMainArea(data) {
        let list = findList(data, state.currentListId);
        if (!list) return '<div class="editor-main"><div class="editor-empty"><p>请选择一个清单</p></div></div>';
        return '<div class="editor-main">'
            + renderToolbar(list)
            + renderInputRow()
            + renderTodoList(list)
            + '</div>';
    }

    function renderToolbar(list) {
        let sortOpts = [
            { value: 'createdAt', label: '创建时间' },
            { value: 'priority', label: '优先级' }
        ];
        let filterBtns = [
            { value: 'active', label: '进行中' },
            { value: 'all', label: '全部' }
        ];
        return '<div class="editor-toolbar">'
            + '<h3>' + escapeHtml(list.name) + '</h3>'
            + '<div class="editor-toolbar-right">'
            + '<select class="editor-sort-select">'
            + sortOpts.map(o => '<option value="' + o.value + '"' + (state.sortBy === o.value ? ' selected' : '') + '>' + o.label + '</option>').join('')
            + '</select>'
            + '<div class="editor-filter-group">'
            + filterBtns.map(b => '<button class="editor-filter-btn' + (state.filterBy === b.value ? ' active' : '') + '" data-filter="' + b.value + '">' + b.label + '</button>').join('')
            + '</div>'
            + '</div>'
            + '</div>';
    }

    function renderInputRow() {
        return '<div class="editor-input-row">'
            + '<input type="text" class="editor-input" placeholder="添加待办..." id="editor-todo-input">'
            + '<button class="editor-btn-add">添加</button>'
            + '</div>';
    }

    function renderTodoList(list) {
        let items = getSortedFilteredItems(list);
        if (!items.length) {
            return '<div class="editor-todo-list"><div class="editor-empty"><p>暂无待办</p></div></div>';
        }
        return '<div class="editor-todo-list">'
            + items.map(item => renderTodoItem(item)).join('')
            + '</div>';
    }

    function renderTodoItem(item) {
        let doneClass = item.done ? ' done' : '';
        let priorityClass = item.priority ? ' priority-' + item.priority : '';
        return '<div class="editor-todo-item' + doneClass + '" data-todo-id="' + item.id + '" data-list-id="' + state.currentListId + '">'
            + '<span class="editor-todo-check">' + (item.done ? '☑' : '☐') + '</span>'
            + '<span class="editor-todo-text">' + escapeHtml(item.text) + '</span>'
            + '<span class="editor-todo-priority' + priorityClass + '"></span>'
            + '<span class="editor-todo-delete">🗑️</span>'
            + '</div>';
    }

    // ==================== CSS 动态加载 ====================
    function loadCSS() {
        if (document.getElementById(CSS_ID)) return;
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_FILE;
        link.id = CSS_ID;
        document.head.appendChild(link);
    }

    function unloadCSS() {
        let link = document.getElementById(CSS_ID);
        if (link) link.remove();
    }

    // ==================== 事件处理（单次委托） ====================
    function handleClick(e) {
        let target = e.target;

        // ---- 清单删除 ----
        let delBtn = target.closest('.editor-btn-list-delete');
        if (delBtn) {
            e.stopPropagation();
            let listId = delBtn.closest('.editor-list-item').dataset.listId;
            if (confirm('删除清单将同时删除其下所有待办，确定吗？')) {
                deleteList(listId);
                renderFullUI();
            }
            return;
        }

        // ---- 清单编辑（触发编辑清单名） ----
        let editBtn = target.closest('.editor-btn-list-edit');
        if (editBtn) {
            e.stopPropagation();
            let listId = editBtn.closest('.editor-list-item').dataset.listId;
            startListEdit(listId);
            return;
        }

        // ---- 切换清单 ----
        let listItem = target.closest('.editor-list-item');
        if (listItem) {
            let listId = listItem.dataset.listId;
            if (listId !== state.currentListId) {
                state.currentListId = listId;
                editingListId = null;
                renderFullUI();
            }
            return;
        }

        // ---- 新建清单 ----
        if (target.closest('.editor-btn-add-list')) {
            let name = prompt('请输入清单名称：');
            if (name && name.trim()) {
                let list = createList(name.trim());
                state.currentListId = list.id;
                renderFullUI();
            }
            return;
        }

        // ---- 待办：勾选 ----
        let checkEl = target.closest('.editor-todo-check');
        if (checkEl) {
            let item = checkEl.closest('.editor-todo-item');
            if (item) {
                toggleItem(item.dataset.listId, item.dataset.todoId);
                renderFullUI();
            }
            return;
        }

        // ---- 待办：删除 ----
        let delEl = target.closest('.editor-todo-delete');
        if (delEl) {
            let item = delEl.closest('.editor-todo-item');
            if (item) {
                deleteItem(item.dataset.listId, item.dataset.todoId);
                renderFullUI();
            }
            return;
        }

        // ---- 待办：优先级切换 ----
        let prioEl = target.closest('.editor-todo-priority');
        if (prioEl) {
            let item = prioEl.closest('.editor-todo-item');
            if (item) {
                cyclePriority(item.dataset.listId, item.dataset.todoId);
                renderFullUI();
            }
            return;
        }

        // ---- 待办：添加按钮 ----
        if (target.closest('.editor-btn-add')) {
            addTodoFromInput();
            return;
        }

        // ---- 过滤切换 ----
        let filterBtn = target.closest('.editor-filter-btn');
        if (filterBtn) {
            state.filterBy = filterBtn.dataset.filter;
            renderFullUI();
            return;
        }
    }

    function handleDblClick(e) {
        // ---- 清单名：双击重命名 ----
        let nameEl = e.target.closest('.editor-list-name');
        if (nameEl) {
            let listItem = nameEl.closest('.editor-list-item');
            if (listItem) startListEdit(listItem.dataset.listId);
            return;
        }

        // ---- 待办文本：双击行内编辑 ----
        let textEl = e.target.closest('.editor-todo-text');
        if (textEl) {
            let item = textEl.closest('.editor-todo-item');
            if (!item) return;
            let origText = textEl.textContent;
            let input = document.createElement('input');
            input.type = 'text';
            input.className = 'editor-inline-input';
            input.value = origText;
            textEl.textContent = '';
            textEl.appendChild(input);
            input.focus();
            input.select();

            let saved = false;
            let save = function() {
                if (saved) return;
                saved = true;
                let newText = input.value.trim();
                if (newText) editItem(item.dataset.listId, item.dataset.todoId, newText);
                renderFullUI();
            };

            input.addEventListener('blur', save);
            input.addEventListener('keydown', function(ev) {
                if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
                if (ev.key === 'Escape') { ev.preventDefault(); saved = true; renderFullUI(); }
            });
            return;
        }
    }

    function handleChange(e) {
        // ---- 排序切换 ----
        let sortSelect = e.target.closest('.editor-sort-select');
        if (sortSelect) {
            state.sortBy = sortSelect.value;
            renderFullUI();
            return;
        }
    }

    function handleKeyDown(e) {
        // ---- 待办输入框：回车添加 ----
        if (e.target.id === 'editor-todo-input' && e.key === 'Enter') {
            e.preventDefault();
            addTodoFromInput();
        }
    }

    function addTodoFromInput() {
        let input = document.getElementById('editor-todo-input');
        if (!input) return;
        let text = input.value.trim();
        if (!text) return;
        addItem(state.currentListId, text);
        input.value = '';
        renderFullUI();
    }

    // ==================== 行内编辑（清单名） ====================
    function startListEdit(listId) {
        if (editingListId === listId) return;
        editingListId = listId;
        renderFullUI();

        let listItem = container.querySelector('.editor-list-item[data-list-id="' + listId + '"]');
        if (!listItem) return;
        let input = listItem.querySelector('.editor-inline-input');
        if (!input) return;
        input.focus();
        input.select();

        let saved = false;
        let save = function() {
            if (saved) return;
            saved = true;
            let newName = input.value.trim();
            if (newName) renameList(listId, newName);
            editingListId = null;
            renderFullUI();
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { e.preventDefault(); saved = true; editingListId = null; renderFullUI(); }
        });
    }

    // ==================== 模块生命周期 ====================
    function init() {
        loadCSS();
        container = document.getElementById('editor-container');
        if (!container) return;

        // 单次事件委托（container 持久存活，不受 re-render 影响）
        container.addEventListener('click', handleClick);
        container.addEventListener('dblclick', handleDblClick);
        container.addEventListener('change', handleChange);
        container.addEventListener('keydown', handleKeyDown);

        renderFullUI();
    }

    function cleanup() {
        unloadCSS();
        container = null;
    }

    return { render: render, init: init, cleanup: cleanup };
})();

window.PageModules = window.PageModules || {};
window.PageModules.EditorPage = EditorPage;
