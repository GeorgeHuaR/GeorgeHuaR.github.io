/** ---------------------------------------------------
 * @brief:		关于页面模块
 * @file:		aboutPage.js
 * @author:		GeorgeHua
 * @date:		2026/03/21
 *----------------------------------------------------*/

const AboutPage = (function() {
    // 渲染页面HTML
    function render() {
        return `
            <div class="content-card">
                <h2>👤 关于我</h2>
                <p>GeorgeHua 的个人导航站，V5.0 演示版。</p>
            </div>
            <div class="content-card">
                <h2>🚧 个人项目介绍</h2>
                <p> 功能尚在开发中。</p>
                <p>配置路径: Html/resume.html</p>
            </div>
        `;
    }

    
    // 初始化事件绑定
    function init() {
        // console.log('AboutPage 初始化完成');
    }
    
    // 清理资源
    function cleanup() {
        // console.log('AboutPage 资源已清理');
    }
    
    return {
        render,
        init,
        cleanup
    };
})();

window.PageModules = window.PageModules || {};
window.PageModules.AboutPage = AboutPage;
