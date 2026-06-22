// Pages/PageConfig.js
(function() {
    /**
     * 页面配置列表
     * @instruction  内嵌 html 页面：使用 type: 'iframe' 并配置 src 属性。
     * V6.1.2：当前暂不启用页面脚本懒加载；新增 module 页面时，需要同步在 index.html 中引入对应 Pages/*.js。
     * V6.1.2：moduleName 必须与页面脚本最终注册到 window.PageModules 的名称一致，否则路由无法找到页面模块。
     */

    /** ---------------------------------------------------
     * @brief:		导航栏Page配置信息
     * @type {PageConfigItem[]}
     *----------------------------------------------------*/
    window.PageConfig = [
        {
            id: 'home',
            name: 'GH-主页',
            icon: '🏠',
            type: 'module',
            moduleName: 'HomePage',
            isDefault: true // 明确指定首页
        },
        {
            id: 'about',
            name: '个人介绍',
            icon: '😏',
            type: 'module',
            moduleName: 'AboutPage'
            // ,isDefault: true 
        },
        {
            id: 'editor',
            name: '编辑器',
            icon: '📋',
            type: 'module',
            moduleName: 'EditorPage'
        },
        {
            id: 'settings',
            name: '设置',
            icon: '⚙️',
            type: 'module',
            moduleName: 'SettingsPage'
        },
        // {
        //     id: 'tools',
        //     name: '工具集',
        //     icon: '🔧',
        //     type: 'module',
        //     moduleName: 'ToolsPage'
        // },
        
        // V6.1.2：iframe 页面只需要配置 src，不需要在 index.html 中新增页面模块脚本。
        {
            id: 'calculator',
            name: '外部主页',
            icon: '🌐',
            type: 'iframe',
            src: 'Html/GH_本地主页.html'
        }
    ];

    /** ---------------------------------------------------
     * @brief:		根据页面ID获取配置项
     * @param {string} pageId 
     * @returns {PageConfigItem | undefined}
     *----------------------------------------------------*/
    window.PageConfig.getConfig = function(pageId) {
        return this.find(item => item.id === pageId);
    };
})();
