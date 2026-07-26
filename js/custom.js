/* Site-wide interactions. Keep this file dependency-free for reliable mobile use. */
(function () {
    'use strict';

    function initializeMobileMenu() {
        var toggle = document.getElementById('mobile-menu-toggle');
        var menu = document.getElementById('mobile-menu');

        if (!toggle || !menu) {
            return;
        }

        function setMenuOpen(open) {
            menu.classList.toggle('show', open);
            menu.setAttribute('aria-hidden', open ? 'false' : 'true');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

            var icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !open);
                icon.classList.toggle('fa-times', open);
            }
        }

        toggle.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen(!menu.classList.contains('show'));
        });

        document.addEventListener('click', function (event) {
            if (menu.classList.contains('show') && !menu.contains(event.target) && !toggle.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        menu.addEventListener('click', function (event) {
            if (event.target.closest('.mobile-nav-link')) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        });

        var mediaQuery = window.matchMedia('(min-width: 769px)');
        function closeOnDesktop(event) {
            if (event.matches) {
                setMenuOpen(false);
            }
        }
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', closeOnDesktop);
        } else {
            mediaQuery.addListener(closeOnDesktop);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMobileMenu);
    } else {
        initializeMobileMenu();
    }
}());
