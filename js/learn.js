/**
 * Aether — Learn Page Interactive Modules & Progress Tracking
 */
(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var SECTIONS = [
    { id: 'blockchain', roadmapId: 'b1', title: 'Blockchain' },
    { id: 'decentralization', roadmapId: 'b2', title: 'Decentralization' },
    { id: 'cryptocurrency', roadmapId: 'b3', title: 'Cryptocurrency' },
    { id: 'smart-contracts', roadmapId: 'm1', title: 'Smart Contracts' },
    { id: 'nfts', roadmapId: 'm3', title: 'NFTs & Tokens' },
    { id: 'daos', roadmapId: 'e1', title: 'DAOs' }
  ];

  /**
   * Pure JS SHA-256 implementation
   */
  function sha256Pure(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }

    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';

    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;

    var hash = [];
    var k = [];
    var primeCounter = 0;

    var isPrime = function (candidate) {
      for (var factor = 2; factor <= Math.sqrt(candidate); factor++) {
        if (candidate % factor === 0) return false;
      }
      return true;
    };

    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (isPrime(candidate)) {
        if (primeCounter < 8) {
          hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        }
        k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter++;
      }
    }

    words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
    words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

    for (i = 0; i < ascii[lengthProperty]; i++) {
      words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
    }

    for (j = 0; j < words[lengthProperty]; j += 16) {
      var w = words.slice(j, j + 16);
      var oldHash = hash.slice(0);

      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];

        var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (i < 16) ? (w[i] | 0) : (((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0)) | 0;

        var s1Major = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
        var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        var temp1 = ((((hash[7] + s1Major) | 0) + ch) | 0) + ((k[i] + w[i]) | 0);
        var s0Major = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
        var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        var temp2 = (s0Major + maj) | 0;

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        var b = (hash[i] >> (8 * j)) & 255;
        result += ((b < 16) ? '0' : '') + b.toString(16);
      }
    }
    return '0x' + result;
  }

  /**
   * Universal SHA-256 (Web Crypto with Pure-JS Fallback)
   */
  async function computeSha256(str) {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      try {
        var buffer = new TextEncoder().encode(str);
        var hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return '0x' + hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      } catch (e) {
        return sha256Pure(str);
      }
    }
    return sha256Pure(str);
  }

  window.Aether.computeSha256 = computeSha256;

  /**
   * Interactive Moment: Blockchain SHA-256 Hasher
   */
  function initBlockchainHasher() {
    var input = document.getElementById('learn-hash-input');
    var output = document.getElementById('learn-hash-output');
    if (!input || !output) return;

    async function update() {
      var val = input.value || '';
      var hash = await computeSha256(val);
      output.textContent = hash;
    }

    input.addEventListener('input', update);
    update();
  }

  /**
   * Reading Progress & RoadMap Sync
   */
  function getReadState() {
    try {
      return JSON.parse(localStorage.getItem('aether_learn_progress') || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveReadState(state) {
    try {
      localStorage.setItem('aether_learn_progress', JSON.stringify(state));

      var roadmapState = {};
      try {
        roadmapState = JSON.parse(localStorage.getItem('aether_chain_roadmap') || '{}');
      } catch (err) {
        roadmapState = {};
      }

      SECTIONS.forEach(function (sec) {
        if (state[sec.id]) {
          roadmapState[sec.roadmapId] = true;
        }
      });
      localStorage.setItem('aether_chain_roadmap', JSON.stringify(roadmapState));

      if (window.Aether && window.Aether.Progress && typeof window.Aether.Progress.scheduleProgressPut === 'function') {
        window.Aether.Progress.scheduleProgressPut();
      }
    } catch (e) {
      console.warn('[Aether Learn] Storage unavailable:', e);
    }
  }

  function updateReadingProgressUI() {
    var state = getReadState();
    var readCount = 0;

    SECTIONS.forEach(function (sec) {
      var isRead = Boolean(state[sec.id]);
      if (isRead) readCount++;

      var sectionEl = document.getElementById(sec.id);
      var btn = document.querySelector('.btn-mark-read[data-section-id="' + sec.id + '"]');
      var tocLink = document.querySelector('.learn-toc-link[data-target="' + sec.id + '"]');

      if (sectionEl) {
        if (isRead) {
          sectionEl.classList.add('is-section-read');
        } else {
          sectionEl.classList.remove('is-section-read');
        }
      }

      if (btn) {
        if (isRead) {
          btn.classList.add('is-read');
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Completed</span>';
        } else {
          btn.classList.remove('is-read');
          btn.innerHTML = '<span>Mark as read</span>';
        }
      }

      if (tocLink) {
        if (isRead) {
          tocLink.classList.add('is-read');
        } else {
          tocLink.classList.remove('is-read');
        }
      }
    });

    var countEl = document.getElementById('learn-progress-count');
    var barFill = document.getElementById('learn-progress-bar-fill');
    var pct = Math.round((readCount / SECTIONS.length) * 100);

    if (countEl) countEl.textContent = readCount + ' of ' + SECTIONS.length + ' completed';
    if (barFill) {
      barFill.style.width = pct + '%';
      barFill.setAttribute('aria-valuenow', pct);
    }
  }

  function initMarkReadButtons() {
    var buttons = document.querySelectorAll('.btn-mark-read');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var secId = btn.getAttribute('data-section-id');
        var state = getReadState();
        var wasRead = Boolean(state[secId]);
        state[secId] = !wasRead;
        saveReadState(state);
        updateReadingProgressUI();

        if (!wasRead) {
          Aether.showToast('Marked ' + secId.charAt(0).toUpperCase() + secId.slice(1) + ' as completed!');
        }
      });
    });

    updateReadingProgressUI();
  }

  /**
   * Scroll-Spy for Table of Contents & Mobile Chips & 3D Chain Block Lighting
   */
  function initScrollSpy() {
    var tocLinks = document.querySelectorAll('.learn-toc-link');
    var mobileChips = document.querySelectorAll('.learn-mobile-chip');
    var sectionEls = SECTIONS.map(function (s) { return document.getElementById(s.id); }).filter(Boolean);

    function onScroll() {
      var scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      var triggerPoint = scrollPos + 180;
      var activeIdx = 0;

      for (var i = 0; i < sectionEls.length; i++) {
        var el = sectionEls[i];
        if (el.offsetTop <= triggerPoint) {
          activeIdx = i;
        }
      }

      tocLinks.forEach(function (link, idx) {
        if (idx === activeIdx) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });

      mobileChips.forEach(function (chip, idx) {
        if (idx === activeIdx) {
          chip.classList.add('is-active');
          // Smooth horizontal scrolling within chips container ONLY (does NOT scroll the window)
          var navContainer = chip.parentElement;
          if (navContainer && navContainer.classList.contains('learn-mobile-chips')) {
            var chipLeft = chip.offsetLeft - (navContainer.clientWidth / 2) + (chip.clientWidth / 2);
            navContainer.scrollTo({ left: chipLeft, behavior: 'smooth' });
          }
        } else {
          chip.classList.remove('is-active');
        }
      });

      // Highlight 3D chain block in Three.js background if available
      if (window.Aether.scene3d && typeof window.Aether.scene3d.highlightLearnBlock === 'function') {
        window.Aether.scene3d.highlightLearnBlock(activeIdx);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /**
   * Internal Sub-navigation handling for Learn TOC and Mobile Chips
   */
  function initSubNavigation() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('.learn-toc-link, .learn-mobile-chip');
      if (!link) return;

      var href = link.getAttribute('href') || ('#' + link.getAttribute('data-target'));
      if (href && href.startsWith('#')) {
        var targetId = href.slice(1);
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          var headerOffset = 90;
          var topPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
          var main = document.getElementById('main-content');
          if (main) main.scrollTop = 0;
          if (history.pushState) history.pushState(null, null, href);
        }
      }
    });

    // Ensure Learn page starts at (0, 0) when opened without hash
    if (!window.location.hash) {
      window.scrollTo(0, 0);
      var main = document.getElementById('main-content');
      if (main) main.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }

  function init() {
    initBlockchainHasher();
    initMarkReadButtons();
    initScrollSpy();
    initSubNavigation();
  }

  window.Aether.updateReadingProgressUI = updateReadingProgressUI;

  window.Aether.Learn = {
    init: init,
    computeSha256: computeSha256,
    updateProgress: updateReadingProgressUI
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();