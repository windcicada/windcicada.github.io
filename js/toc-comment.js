/**
 * 目录导航和评论侧边栏功能
 */

(function() {
    'use strict';

    // ==================== 目录导航功能 ====================
    function initTOC() {
        // 获取页面所有标题
        const headings = document.querySelectorAll('h1, h2, h3, h4');
        if (headings.length === 0) return;

        // 创建目录容器
        const tocContainer = document.createElement('div');
        tocContainer.className = 'toc-sidebar';
        tocContainer.innerHTML = '<div class="toc-title">📑 目录</div>';

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        // 生成目录项
        headings.forEach((heading, index) => {
            // 跳过导航栏、页脚、弹窗的标题
            if (heading.closest('.navbar') || heading.closest('footer') || heading.closest('#feishu-config-modal')) return;
            
            // 跳过包含特定文本的标题
            const text = heading.textContent.trim();
            if (text.includes('飞书通知配置') || text.includes('🔔')) return;

            // 为标题添加锚点ID
            if (!heading.id) {
                heading.id = 'heading-' + index;
            }

            const level = parseInt(heading.tagName.charAt(1));
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + heading.id;
            a.textContent = text;
            a.className = 'toc-h' + level;
            a.dataset.target = heading.id;

            // 点击平滑滚动
            a.addEventListener('click', function(e) {
                e.preventDefault();
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, null, '#' + heading.id);
            });

            li.appendChild(a);
            tocList.appendChild(li);
        });

        if (tocList.children.length === 0) return;

        tocContainer.appendChild(tocList);
        document.body.appendChild(tocContainer);

        // 滚动时高亮当前章节
        function highlightCurrentSection() {
            const scrollPos = window.scrollY + 150;
            let currentHeading = null;

            headings.forEach(heading => {
                if (heading.offsetTop <= scrollPos) {
                    currentHeading = heading;
                }
            });

            document.querySelectorAll('.toc-list a').forEach(link => {
                link.classList.remove('active');
                if (currentHeading && link.dataset.target === currentHeading.id) {
                    link.classList.add('active');
                }
            });
        }

        window.addEventListener('scroll', highlightCurrentSection);
        highlightCurrentSection();
    }

    // ==================== 评论侧边栏功能 ====================
    function initCommentSidebar() {
        // 先加载 Valine CSS
        const valineCss = document.createElement('link');
        valineCss.rel = 'stylesheet';
        valineCss.href = 'https://cdn.jsdelivr.net/npm/valine@1.5.1/dist/Valine.min.css';
        document.head.appendChild(valineCss);
        
        // 创建评论侧边栏
        const commentSidebar = document.createElement('div');
        commentSidebar.className = 'comment-sidebar collapsed'; // 默认收起
        commentSidebar.id = 'comment-sidebar';
        commentSidebar.innerHTML = `
            <div class="comment-header">
                <span class="comment-title">💬 评论</span>
                <button class="comment-toggle" onclick="toggleCommentSidebar()" title="展开评论">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </div>
            <div class="comment-content" id="valine-comments">
                <div style="text-align: center; padding: 40px 0; color: #95a5a6;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
                    <p>正在加载评论...</p>
                </div>
            </div>
        `;
        document.body.appendChild(commentSidebar);

        // 创建浮动按钮（用于展开评论）
        const floatingBtn = document.createElement('button');
        floatingBtn.className = 'comment-floating-btn';
        floatingBtn.id = 'comment-floating-btn';
        floatingBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
        floatingBtn.onclick = toggleCommentSidebar;
        floatingBtn.style.display = 'flex'; // 默认显示，因为评论默认收起
        document.body.appendChild(floatingBtn);

        // 加载 Valine JS
        const valineScript = document.createElement('script');
        valineScript.src = 'https://cdn.jsdelivr.net/npm/valine@1.5.1/dist/Valine.min.js';
        valineScript.onload = function() {
            console.log('Valine 加载完成');
            createValineInstance();
        };
        valineScript.onerror = function() {
            console.error('Valine 加载失败');
            document.getElementById('valine-comments').innerHTML = '<div style="text-align: center; padding: 40px 0; color: #e74c3c;">评论加载失败，请刷新页面重试</div>';
        };
        document.head.appendChild(valineScript);
    }

    // 切换评论侧边栏
    window.toggleCommentSidebar = function() {
        const sidebar = document.getElementById('comment-sidebar');
        const btn = document.getElementById('comment-floating-btn');
        const toggleIcon = sidebar.querySelector('.comment-toggle i');
        const toggleBtn = sidebar.querySelector('.comment-toggle');
        
        if (sidebar.classList.contains('collapsed')) {
            // 展开
            sidebar.classList.remove('collapsed');
            btn.style.display = 'none';
            if (toggleIcon) {
                toggleIcon.className = 'fas fa-chevron-right';
            }
            if (toggleBtn) {
                toggleBtn.title = '收起评论';
            }
        } else {
            // 收起
            sidebar.classList.add('collapsed');
            btn.style.display = 'flex';
            if (toggleIcon) {
                toggleIcon.className = 'fas fa-chevron-left';
            }
            if (toggleBtn) {
                toggleBtn.title = '展开评论';
            }
        }
    };



    function createValineInstance() {
        // 从 window.config 获取配置，如果没有则使用默认配置
        let valineConfig = window.config && window.config.valine;
        
        // 如果 window.config 中没有 valine 配置，使用硬编码配置
        if (!valineConfig) {
            valineConfig = {
                appId: 'ndzXwOy58BYrhDPC7eTav7HP-gzGzoHsz',
                appKey: 'SL9ydCelSxirpnPfFitBbCuB',
                placeholder: '欢迎评论交流~',
                avatar: 'mp',
                meta: ['nick', 'mail'],
                pageSize: 10,
                lang: 'zh-cn',
                visitor: true,
                recordIP: true,
                highlight: true,
                enableQQ: false,
                serverURLs: ''
            };
        }

        // 确保容器存在
        const el = document.getElementById('valine-comments');
        if (!el) {
            console.error('Valine 容器不存在');
            return;
        }

        try {
            new Valine({
                el: '#valine-comments',
                appId: valineConfig.appId,
                appKey: valineConfig.appKey,
                placeholder: valineConfig.placeholder || '欢迎评论交流~',
                avatar: valineConfig.avatar || 'mp',
                meta: valineConfig.meta || ['nick', 'mail'],
                pageSize: valineConfig.pageSize || 10,
                lang: valineConfig.lang || 'zh-cn',
                visitor: valineConfig.visitor !== false,
                recordIP: valineConfig.recordIP !== false,
                highlight: valineConfig.highlight !== false,
                enableQQ: valineConfig.enableQQ || false,
                serverURLs: valineConfig.serverURLs || '',
                path: window.location.pathname,
                // 评论提交后的回调
                afterSubmit: function(comment) {
                    // 发送飞书通知
                    sendFeishuNotification(comment);
                }
            });

            console.log('Valine 评论系统已初始化');

            // 监听新评论
            observeNewComments();
        } catch (error) {
            console.error('Valine 初始化失败:', error);
        }
    }

    // 监听新评论并发送通知
    function observeNewComments() {
        const commentsContainer = document.getElementById('valine-comments');
        if (!commentsContainer) return;

        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 检查是否有新评论
                    mutation.addedNodes.forEach(function(node) {
                        if (node.classList && node.classList.contains('vcard')) {
                            // 新评论添加，显示提示
                            showNewCommentBadge();
                        }
                    });
                }
            });
        });

        observer.observe(commentsContainer, { childList: true, subtree: true });
    }

    // 显示新评论提示
    function showNewCommentBadge() {
        const btn = document.getElementById('comment-floating-btn');
        const sidebar = document.getElementById('comment-sidebar');
        
        // 只有在评论收起状态才显示提示
        if (sidebar && sidebar.classList.contains('collapsed') && btn) {
            btn.classList.add('has-new');
            
            // 创建提示徽章
            if (!btn.querySelector('.new-comment-badge')) {
                const badge = document.createElement('span');
                badge.className = 'new-comment-badge';
                badge.textContent = '新';
                btn.appendChild(badge);
            }
        }
    }

    // 发送飞书通知
    function sendFeishuNotification(comment) {
        // 飞书 webhook URL - 需要用户配置自己的 webhook
        const FEISHU_WEBHOOK = localStorage.getItem('feishu_webhook') || '';
        
        if (!FEISHU_WEBHOOK) {
            console.log('飞书 webhook 未配置，跳过通知');
            return;
        }

        const pageTitle = document.title;
        const pageUrl = window.location.href;
        const commentContent = comment.content || '';
        const commentNick = comment.nick || '匿名';

        const message = {
            msg_type: 'text',
            content: {
                text: `📝 新评论通知\n\n📄 页面：${pageTitle}\n👤 评论者：${commentNick}\n💬 内容：${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}\n🔗 链接：${pageUrl}`
            }
        };

        fetch(FEISHU_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        }).then(response => {
            console.log('飞书通知已发送');
        }).catch(error => {
            console.error('飞书通知发送失败:', error);
        });
    }

    // ==================== 初始化 ====================
    function init() {
        // 页面加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initTOC();
                initCommentSidebar();
            });
        } else {
            initTOC();
            initCommentSidebar();
        }
    }

    init();

})();
