/**
 * Aether — Global Shell Layout (Shared Header, Footer, Cursor & Navigation)
 */
(function () {
  'use strict';

  function getCurrentPageName() {
    var path = window.location.pathname;
    var page = path.substring(path.lastIndexOf('/') + 1);
    if (!page || page === '') page = 'index.html';
    return page.toLowerCase();
  }

  window.Aether = window.Aether || {};

  var ICONS = {
    logo: '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="14" stroke="#FFFFFF" stroke-width="2.2"/><polygon points="16,6 25,21 7,21" stroke="#FFFFFF" stroke-width="1.8" fill="rgba(255,255,255,0.12)"/><circle cx="16" cy="16" r="3" fill="#FFFFFF"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>'
  };

  var NAV_ITEMS = [
    { name: 'Home', href: 'index.html' },
    { name: 'Learn', href: 'learn.html' },
    { name: 'Compare', href: 'compare.html' },
    { name: 'Lab', href: 'lab.html' },
    { name: 'Market', href: 'market.html' },
    { name: 'Wallet', href: 'wallet.html' },
    { name: 'Quiz', href: 'quiz.html' },
    { name: 'Resources', href: 'resources.html' }
  ];

  function renderHeader() {
    var currentPage = getCurrentPageName();
    var headerContainer = document.getElementById('site-header');
    if (!headerContainer) return;

    var navLinksHtml = NAV_ITEMS.map(function (item) {
      var isActive = (currentPage === item.href) || (currentPage === '' && item.href === 'index.html');
      return '<li><a href="' + item.href + '" class="nav-link' + (isActive ? ' is-active' : '') + '">' + item.name + '</a></li>';
    }).join('');

    var mobileNavLinksHtml = NAV_ITEMS.map(function (item) {
      var isActive = (currentPage === item.href) || (currentPage === '' && item.href === 'index.html');
      return '<li><a href="' + item.href + '" class="mobile-nav-link' + (isActive ? ' is-active' : '') + '">' + item.name + '</a></li>';
    }).join('');

    headerContainer.className = 'site-header';
    headerContainer.innerHTML = [
      '<div class="container">',
      '  <div class="nav-floating-bar">',
      '    <a href="index.html" class="site-logo" aria-label="Aether Homepage">',
      '      <span class="site-logo__icon">' + ICONS.logo + '</span>',
      '      <span>AETHER</span>',
      '      <span class="site-logo__badge">EDU</span>',
      '    </a>',
      '    <nav class="site-nav" aria-label="Main Navigation">',
      '      <ul class="nav-links">',
      navLinksHtml,
      '      </ul>',
      '    </nav>',
      '    <div class="header-actions">',
      '      <button class="wallet-pill" id="global-wallet-btn" aria-label="Connect Web3 wallet">',
      '        <span class="wallet-pill__icon">' + ICONS.wallet + '</span>',
      '        <span id="wallet-btn-label">Connect Wallet</span>',
      '      </button>',
      '      <button class="nav-toggle-btn" id="mobile-nav-toggle" aria-label="Open mobile navigation" aria-expanded="false" aria-controls="mobile-nav-drawer">',
      ICONS.menu,
      '      </button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<!-- Mobile Slide-in Drawer -->',
      '<div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>',
      '<aside class="mobile-nav-drawer" id="mobile-nav-drawer" aria-label="Mobile Navigation" aria-hidden="true" inert>',
      '  <div style="display:flex; justify-content:space-between; align-items:center;">',
      '    <span style="font-family:var(--font-display); font-weight:700; font-size:1.1rem; color:#FFFFFF;">Navigation</span>',
      '    <button id="mobile-drawer-close" aria-label="Close menu" tabindex="-1" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;">' + ICONS.close + '</button>',
      '  </div>',
      '  <ul class="mobile-nav-links">',
      mobileNavLinksHtml,
      '  </ul>',
      '</aside>'
    ].join('\n');
  }

  function renderFooter() {
    var footerContainer = document.getElementById('site-footer');
    if (!footerContainer) return;

    footerContainer.className = 'site-footer';
    footerContainer.innerHTML = [
      '<div class="container">',
      '  <div class="footer-top">',
      '    <div class="footer-brand">',
      '      <a href="index.html" class="site-logo">',
      '        <span class="site-logo__icon">' + ICONS.logo + '</span>',
      '        <span>AETHER</span>',
      '      </a>',
      '      <p>Demystifying the decentralized web through intuitive visual analogies, hands-on cryptography labs, and zero-hype educational guides.</p>',
      '    </div>',
      '    <div class="footer-col">',
      '      <h4>Explore</h4>',
      '      <ul class="footer-links">',
      '        <li><a href="learn.html">Core Concepts</a></li>',
      '        <li><a href="compare.html">Compare Web2 vs Web3</a></li>',
      '        <li><a href="lab.html">Interactive Labs</a></li>',
      '        <li><a href="market.html">Live Market Rates</a></li>',
      '      </ul>',
      '    </div>',
      '    <div class="footer-col">',
      '      <h4>Practice</h4>',
      '      <ul class="footer-links">',
      '        <li><a href="wallet.html">Wallet Safety Guide</a></li>',
      '        <li><a href="quiz.html">Web3 Quiz &amp; Flashcards</a></li>',
      '        <li><a href="resources.html">Glossary &amp; FAQ</a></li>',
      '        <li><a href="index.html#roadmap">Learning Roadmap</a></li>',
      '      </ul>',
      '    </div>',
      '    <div class="footer-col">',
      '      <h4>Information</h4>',
      '      <p class="footer-disclaimer-text" style="margin-bottom:8px;">',
      '        Educational content, not financial advice.',
      '      </p>',
      '      <p class="footer-disclaimer-text">',
      '        Coin names and symbols belong to their owners and are shown for education only.',
      '      </p>',
      '    </div>',
      '  </div>',
      '  <div class="footer-bottom">',
      '    <p class="footer-disclaimer-text">Educational content, not financial advice. Coin names and symbols belong to their owners and are shown for education only.</p>',
      '    <div id="footer-api-status" class="api-status-pill is-offline" aria-live="polite" title="Aether API Connectivity Status">',
      '      <span class="api-status-dot" aria-hidden="true"></span>',
      '      <span class="api-status-text">Offline mode</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function renderChainSidebar() {
    if (getCurrentPageName() !== 'index.html') return;
    if (document.querySelector('.chain-sidebar')) return;

    var sidebar = document.createElement('aside');
    sidebar.className = 'chain-sidebar';
    sidebar.setAttribute('aria-label', 'Blockchain lesson section progress');
    sidebar.innerHTML = [
      '<div class="chain-sidebar__line"></div>',
      '<div class="chain-node is-active" data-section-target="hero" title="Block #0: Genesis"></div>',
      '<div class="chain-node" data-section-target="foundations" title="Block #1: Foundations"></div>',
      '<div class="chain-node" data-section-target="real-world" title="Block #2: Ecosystem"></div>',
      '<div class="chain-node" data-section-target="tokens" title="Block #3: Tokens"></div>',
      '<div class="chain-node" data-section-target="roadmap" title="Block #4: Roadmap"></div>'
    ].join('\n');

    document.body.appendChild(sidebar);
  }

  function initMobileMenu() {
    var toggleBtn = document.getElementById('mobile-nav-toggle');
    var drawer = document.getElementById('mobile-nav-drawer');
    var backdrop = document.getElementById('mobile-nav-backdrop');
    var closeBtn = document.getElementById('mobile-drawer-close');

    if (!toggleBtn || !drawer || !backdrop) return;

    function openDrawer() {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      drawer.removeAttribute('inert');
      var focusables = drawer.querySelectorAll('a, button');
      focusables.forEach(function (el) { el.setAttribute('tabindex', '0'); });
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('inert', '');
      var focusables = drawer.querySelectorAll('a, button');
      focusables.forEach(function (el) { el.setAttribute('tabindex', '-1'); });
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', openDrawer);
    backdrop.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    var mobileLinks = drawer.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  function initScrollTracking() {
    var progressBar = document.querySelector('.scroll-progress');
    var backToTopBtn = document.querySelector('.back-to-top');
    var chainNodes = document.querySelectorAll('.chain-node');
    var sections = [
      { id: 'hero', el: document.querySelector('.hero-v4') },
      { id: 'foundations', el: document.getElementById('foundations') },
      { id: 'real-world', el: document.getElementById('real-world') },
      { id: 'tokens', el: document.getElementById('tokens') },
      { id: 'roadmap', el: document.getElementById('roadmap') }
    ];

    function onScroll() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (progressBar && docHeight > 0) {
        var progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        progressBar.style.width = progress + '%';
      }

      if (backToTopBtn) {
        if (scrollY > 350) {
          backToTopBtn.classList.add('is-visible');
        } else {
          backToTopBtn.classList.remove('is-visible');
        }
      }

      var scrollMiddle = scrollY + window.innerHeight * 0.35;
      sections.forEach(function (sec, idx) {
        if (!sec.el || !chainNodes[idx]) return;
        var top = sec.el.offsetTop;
        var bottom = top + sec.el.offsetHeight;

        if (scrollMiddle >= top && scrollMiddle < bottom) {
          chainNodes.forEach(function (n, nIdx) {
            if (nIdx < idx) {
              n.className = 'chain-node is-passed';
            } else if (nIdx === idx) {
              n.className = 'chain-node is-active';
            } else {
              n.className = 'chain-node';
            }
          });
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        var main = document.getElementById('main-content');
        if (main) main.scrollTop = 0;
      });
    }
  }

  /**
   * Delegated Navigation & Scroll-To-Top Handling
   */
  function initNavigationHandlers() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href) return;

      // Explicitly skip any href with a filename/path before '#' (e.g. "learn.html#blockchain")
      // so it falls through to normal browser navigation instead of being intercepted.
      if (href.indexOf('#') !== -1 && !href.startsWith('#')) {
        return;
      }

      var currentPage = getCurrentPageName();

      // Case A: Link is an in-page anchor (#something)
      if (href.startsWith('#')) {
        var targetId = href.slice(1);
        if (!targetId) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          var main = document.getElementById('main-content');
          if (main) main.scrollTop = 0;
          return;
        }
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          if (history.pushState) {
            history.pushState(null, null, href);
          } else {
            location.hash = href;
          }
          var headerOffset = 90;
          var targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
        return;
      }

      // Case B: Link points to the current page itself (e.g. clicking 'Learn' while on learn.html)
      var cleanHref = href.split('#')[0].split('?')[0];
      var hrefPage = cleanHref.substring(cleanHref.lastIndexOf('/') + 1).toLowerCase();
      if (!hrefPage) hrefPage = 'index.html';

      if (hrefPage === currentPage) {
        var hash = href.indexOf('#') !== -1 ? href.substring(href.indexOf('#') + 1) : '';
        if (!hash) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          var main = document.getElementById('main-content');
          if (main) main.scrollTop = 0;
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        } else {
          var targetEl = document.getElementById(hash);
          if (targetEl) {
            e.preventDefault();
            if (history.pushState) history.pushState(null, null, '#' + hash);
            var headerOffset = 90;
            var targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
          }
        }
      }
    });

    // Ensure scrolling to top on fresh page navigation
    if (!window.location.hash) {
      window.scrollTo(0, 0);
      var main = document.getElementById('main-content');
      if (main) main.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      setTimeout(function () {
        var el = document.getElementById(window.location.hash.slice(1));
        if (el) {
          var headerOffset = 90;
          var targetTop = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      }, 60);
    }
  }

  function initCustomCursor() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof window !== 'undefined' && (window.innerWidth < 768 || (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches))) {
      return;
    }

    var cursorDot = document.querySelector('.cursor-dot');
    var cursorOutline = document.querySelector('.cursor-outline');

    if (!cursorDot) {
      cursorDot = document.createElement('div');
      cursorDot.className = 'cursor-dot';
      document.body.appendChild(cursorDot);
    }
    if (!cursorOutline) {
      cursorOutline = document.createElement('div');
      cursorOutline.className = 'cursor-outline';
      document.body.appendChild(cursorOutline);
    }

    var mouseX = -100, mouseY = -100;
    var outlineX = -100, outlineY = -100;
    var isVisible = false;
    var targetScale = 1;
    var currentScale = 1;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        cursorDot.style.opacity = '1';
        cursorOutline.style.opacity = '1';
      }
    }, { passive: true });

    function renderCursor() {
      if (isVisible) {
        cursorDot.style.transform = 'translate3d(' + (mouseX - 3) + 'px, ' + (mouseY - 3) + 'px, 0)';
        outlineX += (mouseX - outlineX) * 0.20;
        outlineY += (mouseY - outlineY) * 0.20;
        currentScale += (targetScale - currentScale) * 0.20;
        cursorOutline.style.transform = 'translate3d(' + (outlineX - 17) + 'px, ' + (outlineY - 17) + 'px, 0) scale(' + currentScale.toFixed(3) + ')';
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    var interactiveSelectors = 'a, button, input, select, textarea, .ring-card, .marquee-card, .token-bento-card, .block-tx-item, [role="button"]';

    document.addEventListener('mouseover', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('.marquee-viewport, .ring-carousel-stage')) {
        cursorOutline.classList.add('cursor--drag');
        targetScale = 1.8;
      } else if (e.target.closest(interactiveSelectors)) {
        cursorOutline.classList.add('cursor--hover');
        targetScale = 1.4;
      }
    }, { passive: true });

    document.addEventListener('mouseout', function (e) {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('.marquee-viewport, .ring-carousel-stage')) {
        cursorOutline.classList.remove('cursor--drag');
        targetScale = 1.0;
      } else if (e.target.closest(interactiveSelectors)) {
        cursorOutline.classList.remove('cursor--hover');
        targetScale = 1.0;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      cursorDot.style.opacity = '0';
      cursorOutline.style.opacity = '0';
      isVisible = false;
    });
  }

  function initApiStatusIndicator() {
    var statusEl = document.getElementById('footer-api-status');
    if (!statusEl) return;
    var text = statusEl.querySelector('.api-status-text');

    if (window.Aether && window.Aether.api && typeof window.Aether.api.checkHealth === 'function') {
      window.Aether.api.checkHealth().then(function (isLive) {
        if (isLive) {
          statusEl.className = 'api-status-pill is-live';
          if (text) text.textContent = 'Live API';
        } else {
          statusEl.className = 'api-status-pill is-offline';
          if (text) text.textContent = 'Offline mode';
        }
      }).catch(function () {
        statusEl.className = 'api-status-pill is-offline';
        if (text) text.textContent = 'Offline mode';
      });
    } else {
      statusEl.className = 'api-status-pill is-offline';
      if (text) text.textContent = 'Offline mode';
    }
  }

  function checkDebugMode() {
    if (window.location.search.indexOf('debug=1') !== -1) {
      document.body.classList.add('debug-mode');
      console.info('[Aether Debug] 3D anchor slot debug boxes enabled.');
    }
  }

  function init() {
    renderHeader();
    renderFooter();
    renderChainSidebar();
    initMobileMenu();
    initScrollTracking();
    initNavigationHandlers();
    initCustomCursor();
    checkDebugMode();
    initApiStatusIndicator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();