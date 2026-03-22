// Pages/PageConfig.js
(function() {
    /**
     * 页面配置列表
     * @instruction  内嵌html页面：需要修改type和src属性
     * 修改导航按钮后，需要同步修改html的js导入
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
            id: 'changelog',
            name: '编辑器',
            icon: '📋',
            type: 'module',
            moduleName: 'ChangelogPage'
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
        
        // 内嵌html页面：需要修改type和src属性
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