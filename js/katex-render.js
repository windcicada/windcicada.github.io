/**
 * KaTeX 公式渲染
 * 手动渲染页面中的 LaTeX 公式
 */

(function() {
    'use strict';

    // 修复被 Markdown 错误转义的公式
    function fixEscapedMath() {
        // 查找所有包含 <em> 标签的段落
        const paragraphs = document.querySelectorAll('p');
        paragraphs.forEach(p => {
            const html = p.innerHTML;
            // 检查是否包含 $$ 或 $ 包围的公式
            if (html.includes('$$') || (html.includes('$') && !html.includes('$$'))) {
                // 修复 <em> 标签导致的下划线转义问题
                // 将 <em> 和 </em> 替换回 _
                let fixedHtml = html.replace(/<em>/g, '_').replace(/<\/em>/g, '_');
                if (fixedHtml !== html) {
                    p.innerHTML = fixedHtml;
                    console.log('修复了公式中的转义问题');
                }
            }
        });
    }

    function initKaTeX() {
        // 先修复被转义的公式
        fixEscapedMath();

        // 检查 KaTeX 是否已加载
        if (typeof katex === 'undefined' || typeof renderMathInElement === 'undefined') {
            console.log('KaTeX 未加载，等待中...');
            setTimeout(initKaTeX, 500);
            return;
        }

        console.log('KaTeX 已加载，开始渲染公式');

        // 获取 math 配置
        const mathConfig = window.config && window.config.math;
        
        // 渲染整个页面的公式
        try {
            renderMathInElement(document.body, {
                delimiters: mathConfig && mathConfig.delimiters ? mathConfig.delimiters : [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false,
                strict: false,
                trust: true,
                // 忽略特定的 HTML 标签
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                // 忽略包含特定类的元素
                ignoredClasses: ['katex', 'katex-display', 'toc-sidebar', 'comment-sidebar'],
                // 错误处理
                errorCallback: function(msg, err) {
                    console.warn('KaTeX 渲染警告:', msg, err);
                }
            });
            console.log('KaTeX 公式渲染完成');
        } catch (error) {
            console.error('KaTeX 渲染失败:', error);
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKaTeX);
    } else {
        // 延迟一点时间确保其他脚本已加载
        setTimeout(initKaTeX, 1000);
    }

    // 当页面内容动态变化时重新渲染（针对单页应用或延迟加载内容）
    let renderTimeout;
    const observer = new MutationObserver(function(mutations) {
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(function() {
            // 检查是否有未渲染的公式
            const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let hasUnrenderedMath = false;
            let node;
            while (node = textNodes.nextNode()) {
                if (node.textContent.match(/\$[^\s].*?[^\s]\$/)) {
                    hasUnrenderedMath = true;
                    break;
                }
            }
            if (hasUnrenderedMath) {
                console.log('检测到未渲染公式，重新渲染...');
                initKaTeX();
            }
        }, 500);
    });

    // 页面加载完成后开始观察
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        observer.observe(document.body, { childList: true, subtree: true });
    }

})();
