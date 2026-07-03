/* 返回随机颜色 */
function randomColor() {
	return "rgb("+~~(255*Math.random())+","+~~(255*Math.random())+","+~~(255*Math.random())+")";
}

/* 鼠标点击文字特效 
var a_idx = 0;
var a_click = 1;
var a = new Array("富强", "民主", "文明", "和谐", "自由", "平等", "公正" ,"法治", "爱国", "敬业", "诚信", "友善");
jQuery(document).ready(function($) {
    $("body").click(function(e) {
		var frequency = 1;
		if (a_click % frequency === 0) {
			
			var $i = $("<span/>").text(a[a_idx]);
			a_idx = (a_idx + 1) % a.length;
			var x = e.pageX,
			y = e.pageY;
			$i.css({
				"z-index": 9999,
				"top": y - 20,
				"left": x,
				"position": "absolute",
				"font-weight": "bold",
				"color": randomColor(),
				"-webkit-user-select": "none",
				"-moz-user-select": "none",
				"-ms-user-select": "none",
				"user-select": "none"
			});
			$("body").append($i);
			$i.animate({
				"top": y - 180,
				"opacity": 0
			},
			1500,
			function() {
				$i.remove();
			});
			
		}
	a_click ++;
		
    });
});

/* 背景图片已移除 - 平面化设计风格 */

/* ========================================
   简洁导航栏交互
   ======================================== */

(function() {
    'use strict';
    
    // 移动端菜单切换
    function initMobileMenu() {
        var mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        var mobileMenu = document.getElementById('mobile-menu');
        
        if (!mobileMenuToggle || !mobileMenu) {
            console.log('Mobile menu elements not found');
            return;
        }
        
        console.log('Mobile menu initialized');
        
        function toggleMobileMenu(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            var isOpen = mobileMenu.classList.contains('show');
            
            if (isOpen) {
                mobileMenu.classList.remove('show');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
            } else {
                mobileMenu.classList.add('show');
                mobileMenuToggle.setAttribute('aria-expanded', 'true');
                mobileMenu.setAttribute('aria-hidden', 'false');
            }
            
            var icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (mobileMenu.classList.contains('show')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
            
            console.log('Mobile menu toggled:', mobileMenu.classList.contains('show'));
        }
        
        // 移动端菜单点击切换
        mobileMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleMobileMenu(e);
        });
        
        // 点击菜单外部关闭菜单
        document.addEventListener('click', function(e) {
            if (mobileMenu.classList.contains('show') && 
                !mobileMenu.contains(e.target) && 
                !mobileMenuToggle.contains(e.target)) {
                toggleMobileMenu();
            }
        });
        
        // 点击菜单链接后关闭菜单
        var mobileNavLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
        for (var i = 0; i < mobileNavLinks.length; i++) {
            mobileNavLinks[i].addEventListener('click', function() {
                toggleMobileMenu();
            });
        }
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }
    
    // 搜索功能
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    
    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', function() {
            searchOverlay.classList.add('show');
            if (searchInput) searchInput.focus();
        });
    }
    
    if (searchClose && searchOverlay) {
        searchClose.addEventListener('click', function() {
            searchOverlay.classList.remove('show');
        });
    }
    
    if (searchOverlay) {
        searchOverlay.addEventListener('click', function(e) {
            if (e.target === searchOverlay) {
                searchOverlay.classList.remove('show');
            }
        });
    }
    
    // ESC键关闭搜索
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchOverlay) {
            searchOverlay.classList.remove('show');
        }
    });
    
    // 主题切换
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var body = document.body;
            var currentTheme = body.getAttribute('theme');
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            body.setAttribute('theme', newTheme);
            if (window.localStorage) {
                localStorage.setItem('theme', newTheme);
            }
        });
    }
    

    // 语言切换高亮
    function initLangSwitcher() {
        var switcher = document.getElementById('lang-switcher');
        if (!switcher) return;
        var path = window.location.pathname;
        var links = switcher.querySelectorAll('.lang-link');
        for (var i = 0; i < links.length; i++) {
            links[i].classList.remove('active');
            var href = links[i].getAttribute('href');
            if (href === '/') { continue; }
            if (path.startsWith(href) || (href.indexOf('/software') >= 0 && path.indexOf('/coast-software') >= 0)) {
                links[i].classList.add('active');
            }
        }
    }
    document.addEventListener('DOMContentLoaded', initLangSwitcher);
    initLangSwitcher();

})();

/* 拉姆蕾姆回到顶部或底部按钮 */
$(function() {
	$("#lamu img").eq(0).click(function() {
		$("html,body").animate({scrollTop:$(document).height()},800);
		return false;
	});
	$("#leimu img").eq(0).click(function() {
		$("html,body").animate({scrollTop:0},800);
		return false;
	});
});

/* 后置加载页面组件的背景图片 
$(function() {
	/* 首页头像div加载GitHub Chart作为背景图片 
	$("div.home-avatar").attr('style', "background: url(https://ghchart.rshah.org/FFA500/lewky);background-repeat: no-repeat;background-position: center;background-size: auto 7.5rem;");

	/* 评论框加载背景图片 
	$(".v[data-class=v] .veditor").attr('style', "background-image: url(" + $cdnPrefix + "/images/common/valinebg.webp) !important;");
});

function getCurrentDateString() {
	var now = new Date();
	var month = now.getMonth() + 1;
	var day = now.getDate();
	var hour = now.getHours();
	return "" + now.getFullYear() + (month < 10 ? "0" + month : month) + (day < 10 ? "0" + day : day) + (hour < 10 ? "0" + hour : hour);
}

/* 离开当前页面时修改网页标题，回到当前页面时恢复原来标题
window.onload = function() {
  var OriginTitile = document.title;
  var titleTime;
  document.addEventListener('visibilitychange', function() {
    if(document.hidden) {
      $('[rel="icon"]').attr('href', "/failure.ico");
      $('[rel="shortcut icon"]').attr('href', "/failure.ico");
      document.title = '喔唷，崩溃啦！';
      clearTimeout(titleTime);
    } else {
      $('[rel="icon"]').attr('href', "/favicon-32x32.png");
      $('[rel="shortcut icon"]').attr('href', "/favicon-32x32.png");
      document.title = '咦，页面又好了！';
      titleTime = setTimeout(function() {
        document.title = OriginTitile;
      }, 2000);
	}
  });
}

/* 站点运行时间
function runtime() {
	window.setTimeout("runtime()", 1000);
	/* 请修改这里的起始时间 
    let startTime = new Date('04/24/2018 15:00:00');
    let endTime = new Date();
    let usedTime = endTime - startTime;
    let days = Math.floor(usedTime / (24 * 3600 * 1000));
    let leavel = usedTime % (24 * 3600 * 1000);
    let hours = Math.floor(leavel / (3600 * 1000));
    let leavel2 = leavel % (3600 * 1000);
    let minutes = Math.floor(leavel2 / (60 * 1000));
    let leavel3 = leavel2 % (60 * 1000);
    let seconds = Math.floor(leavel3 / (1000));
    let runbox = document.getElementById('run-time');
    runbox.innerHTML = '本站已运行<i class="far fa-clock fa-fw"></i> '
        + ((days < 10) ? '0' : '') + days + ' 天 '
        + ((hours < 10) ? '0' : '') + hours + ' 时 '
        + ((minutes < 10) ? '0' : '') + minutes + ' 分 '
        + ((seconds < 10) ? '0' : '') + seconds + ' 秒 ';
}
runtime();
*/