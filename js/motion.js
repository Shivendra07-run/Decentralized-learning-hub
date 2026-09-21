/**
 * AETHER MOTION & INTERACTION SUITE (v4 Dark Monochrome)
 * Includes:
 * 1. Rotating 3D Ring Carousel with drag, hover pause & perspective depth
 * 2. Interactive detail modal with live SHA-256 Web Crypto hashing, contract simulator & token minter
 * 3. Two-row infinite marquee with expand/flip cards
 * 4. Chain of Blocks roadmap with real SHA-256 hashing, progress rings, and block mining animations
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Helper: Generate real SHA-256 hash using native browser Web Crypto API
   */
  async function computeSha256(str) {
    if (!window.crypto || !window.crypto.subtle) {
      return '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f';
    }
    var buffer = new TextEncoder().encode(str);
    var hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  /**
   * Custom Cursor Follower & Drag Badge
   */
  function initCustomCursor() {
    if (prefersReducedMotion) return;

    var dot = document.querySelector('.cursor-dot');
    var outline = document.querySelector('.cursor-outline');

    if (!dot) {
      dot = document.createElement('div');
      dot.className = 'cursor-dot';
      document.body.appendChild(dot);
    }
    if (!outline) {
      outline = document.createElement('div');
      outline.className = 'cursor-outline';
      document.body.appendChild(outline);
    }

    var mouseX = -100, mouseY = -100;
    var outlineX = -100, outlineY = -100;
    var isVisible = false;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        dot.style.opacity = '1';
        outline.style.opacity = '1';
        isVisible = true;
      }
      dot.style.transform = 'translate(' + (mouseX - 3) + 'px, ' + (mouseY - 3) + 'px)';
    });

    function renderCursor() {
      if (isVisible) {
        outlineX += (mouseX - outlineX) * 0.18;
        outlineY += (mouseY - outlineY) * 0.18;
        outline.style.transform = 'translate(' + (outlineX - 17) + 'px, ' + (outlineY - 17) + 'px)';
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    var interactiveSelectors = 'a, button, input, select, textarea, .ring-card, .marquee-card, .token-bento-card, .block-tx-item, [role="button"]';

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('.marquee-viewport, .ring-carousel-stage')) {
        outline.classList.add('cursor--drag');
      } else if (e.target.closest(interactiveSelectors)) {
        outline.classList.add('cursor--hover');
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('.marquee-viewport, .ring-carousel-stage')) {
        outline.classList.remove('cursor--drag');
      }
      if (e.target.closest(interactiveSelectors)) {
        outline.classList.remove('cursor--hover');
      }
    });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      outline.style.opacity = '0';
      isVisible = false;
    });
  }

  /**
   * Magnetic Button Attraction
   */
  function initMagneticButtons() {
    if (prefersReducedMotion) return;

    var buttons = document.querySelectorAll('.btn-magnetic, .btn--primary');
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.22).toFixed(1) + 'px, ' + (y * 0.22).toFixed(1) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  /**
   * Scroll Reveal Transitions
   */
  function initScrollReveal() {
    var targets = document.querySelectorAll('.reveal-on-scroll');
    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

    targets.forEach(function (target, idx) {
      target.style.transitionDelay = (idx % 3 * 80) + 'ms';
      observer.observe(target);
    });
  }

  /**
   * SECTION 5: ROTATING 3D RING CAROUSEL (Three Building Blocks)
   */
  var ringCurrentAngle = 0;
  var isRingPaused = false;

  function initRingCarousel() {
    var track = document.getElementById('ring-track');
    var cards = document.querySelectorAll('.ring-card');
    var prevBtn = document.getElementById('ring-prev-btn');
    var nextBtn = document.getElementById('ring-next-btn');

    if (!track || cards.length < 3) return;

    var radius = 340; // 3D orbit radius in pixels
    var stepAngle = (2 * Math.PI) / cards.length;

    function updateCardPositions() {
      cards.forEach(function (card, idx) {
        var cardAngle = ringCurrentAngle + idx * stepAngle;
        var x = Math.sin(cardAngle) * radius;
        var z = Math.cos(cardAngle) * radius;

        // Front card is largest & brightest; rear cards are smaller & dimmer
        var depthNorm = (z + radius) / (2 * radius); // 0 (back) to 1 (front)
        var scale = 0.8 + 0.25 * depthNorm;
        var opacity = 0.45 + 0.55 * depthNorm;

        card.style.transform = 'translate3d(' + x.toFixed(1) + 'px, 0px, ' + z.toFixed(1) + 'px) scale(' + scale.toFixed(2) + ')';
        card.style.opacity = opacity.toFixed(2);
        card.style.zIndex = Math.round(depthNorm * 10);
      });
    }

    updateCardPositions();

    // Auto-rotation loop
    function autoRotate() {
      if (!isRingPaused && !prefersReducedMotion) {
        ringCurrentAngle += 0.003;
        updateCardPositions();
      }
      requestAnimationFrame(autoRotate);
    }
    requestAnimationFrame(autoRotate);

    // Pause on hover
    var stage = document.querySelector('.ring-carousel-stage');
    if (stage) {
      stage.addEventListener('mouseenter', function () { isRingPaused = true; });
      stage.addEventListener('mouseleave', function () { isRingPaused = false; });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        ringCurrentAngle -= stepAngle;
        updateCardPositions();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        ringCurrentAngle += stepAngle;
        updateCardPositions();
      });
    }

    // Drag-to-rotate support
    var isDragging = false;
    var startX = 0;
    if (stage) {
      stage.addEventListener('mousedown', function (e) {
        isDragging = true;
        startX = e.clientX;
      });
      window.addEventListener('mouseup', function () { isDragging = false; });
      window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        startX = e.clientX;
        ringCurrentAngle += dx * 0.006;
        updateCardPositions();
      });
    }
  }

  /**
   * SECTION 5B: INTERACTIVE DETAIL MODAL WITH MINI-APPS
   */
  var BLOCK_MODAL_DATA = {
    blockchain: {
      title: 'Blockchain: The Immutable Ledger',
      analogy: 'Imagine a public notebook where every page (block) is sealed with a digital wax seal (hash) that references the previous page. If anyone erases a single letter on page 2, all subsequent wax seals shatter across thousands of identical notebooks worldwide.',
      terms: ['SHA-256 Hashing', 'Consensus Mechanisms', 'Distributed Nodes'],
      fact: 'The Bitcoin blockchain has recorded transactions without a single second of global network downtime since January 2009.',
      widgetType: 'hasher'
    },
    contracts: {
      title: 'Smart Contracts: Self-Executing Agreements',
      analogy: 'Think of a digital vending machine. You insert cryptographic payment, the code verifies the exact currency amount, and it automatically dispenses the item. No clerk, escrow agent, or court needed.',
      terms: ['Turing-Complete', 'Gas Limit', 'Immutable Logic'],
      fact: 'Nick Szabo coined the term "Smart Contract" in 1994, over a decade before Bitcoin was invented.',
      widgetType: 'vending'
    },
    tokens: {
      title: 'Tokens & NFTs: Programmable Ownership',
      analogy: 'A token is like a programmable concert ticket that can also double as voting stock in the music festival, grant backstage access, and automatically reward you with loyal attendee perks.',
      terms: ['ERC-20 (Fungible)', 'ERC-721 (Unique)', 'Digital Provenance'],
      fact: 'The earliest NFTs on Ethereum were CryptoPunks and MoonCats, minted in 2017 before the official ERC-721 token standard was finalized.',
      widgetType: 'minter'
    }
  };

  function openBlockModal(type) {
    var data = BLOCK_MODAL_DATA[type];
    if (!data) return;

    var backdrop = document.getElementById('block-modal-backdrop');
    var dialog = document.getElementById('block-modal-dialog');
    if (!backdrop || !dialog) return;

    document.getElementById('modal-block-title').textContent = data.title;
    document.getElementById('modal-block-analogy').textContent = data.analogy;
    document.getElementById('modal-block-fact').textContent = data.fact;

    // Render key terms
    var termsContainer = document.getElementById('modal-block-terms');
    termsContainer.innerHTML = data.terms.map(function (t) {
      return '<span class="key-term-chip">' + t + '</span>';
    }).join('');

    // Render Interactive Widget
    var widgetContainer = document.getElementById('modal-block-widget');
    if (data.widgetType === 'hasher') {
      widgetContainer.innerHTML = [
        '<div class="widget-label"><span>Live SHA-256 Web Crypto Hasher</span> <span class="widget-demo-tag">Interactive Simulation</span></div>',
        '<p style="font-size:var(--text-xs); color:var(--text-secondary); margin-bottom:8px;">Type any text to watch the cryptographic hash change instantly:</p>',
        '<input type="text" id="live-hash-input" class="hash-input-field" value="Blockchain Transaction #1042">',
        '<div class="hash-output-display" id="live-hash-output">Calculating...</div>'
      ].join('');

      var input = document.getElementById('live-hash-input');
      var output = document.getElementById('live-hash-output');

      async function updateHash() {
        output.textContent = await computeSha256(input.value);
      }
      input.addEventListener('input', updateHash);
      updateHash();
    } else if (data.widgetType === 'vending') {
      widgetContainer.innerHTML = [
        '<div class="widget-label"><span>Smart Contract Vending Machine</span> <span class="widget-demo-tag">Simulation</span></div>',
        '<p style="font-size:var(--text-xs); color:var(--text-secondary); margin-bottom:12px;">Trigger state verification to execute the smart contract logic:</p>',
        '<div style="display:flex; justify-content:space-between; align-items:center; background:#050506; padding:12px; border-radius:8px; border:1px solid var(--border-line);">',
        '  <div><strong style="color:#FFF; font-size:var(--text-sm);">State:</strong> <span id="contract-state-text" style="color:#FBBF24; font-family:var(--font-mono); font-size:var(--text-xs);">Awaiting 0.05 ETH Deposit</span></div>',
        '  <button class="btn btn--primary btn--sm" id="contract-trigger-btn">Deposit 0.05 ETH</button>',
        '</div>',
        '<div id="contract-log" style="font-family:var(--font-mono); font-size:11px; color:#A9AFBA; margin-top:8px;">Contract initialized at address 0x3b8f...21a</div>'
      ].join('');

      var btn = document.getElementById('contract-trigger-btn');
      var stateText = document.getElementById('contract-state-text');
      var log = document.getElementById('contract-log');

      btn.addEventListener('click', function () {
        stateText.textContent = 'Verifying Deposit...';
        stateText.style.color = '#FFFFFF';
        btn.disabled = true;

        setTimeout(function () {
          stateText.textContent = 'Condition Met: Asset Dispensed!';
          stateText.style.color = '#10B981';
          log.textContent = 'Tx 0x892a...f71: 0.05 ETH received. Token transfer executed automatically.';
          Aether.showToast('Smart contract conditions met!');
        }, 700);
      });
    } else {
      var mintCount = 142;
      widgetContainer.innerHTML = [
        '<div class="widget-label"><span>Demo Token Minter</span> <span class="widget-demo-tag">Simulation</span></div>',
        '<div style="display:flex; justify-content:space-between; align-items:center; background:#050506; padding:12px; border-radius:8px; border:1px solid var(--border-line);">',
        '  <div><span style="color:var(--text-secondary); font-size:var(--text-xs);">Total Minted:</span> <strong id="mint-counter" style="color:#FFF; font-family:var(--font-mono); font-size:var(--text-lg); margin-left:6px;">' + mintCount + ' AETH</strong></div>',
        '  <button class="btn btn--primary btn--sm" id="mint-token-btn">Mint +1 Token</button>',
        '</div>',
        '<div id="mint-log" style="font-family:var(--font-mono); font-size:11px; color:#A9AFBA; margin-top:8px;">Standard: ERC-20 Fixed Decimals (18)</div>'
      ].join('');

      var mintBtn = document.getElementById('mint-token-btn');
      var counterEl = document.getElementById('mint-counter');
      var mintLog = document.getElementById('mint-log');

      mintBtn.addEventListener('click', function () {
        mintCount++;
        counterEl.textContent = mintCount + ' AETH';
        mintLog.textContent = 'Minted token #' + mintCount + ' to address 0x71C8...49b2';
        Aether.showToast('Minted 1 AETH Demo Token!');
      });
    }

    backdrop.classList.add('is-open');
    dialog.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeBlockModal() {
    var backdrop = document.getElementById('block-modal-backdrop');
    var dialog = document.getElementById('block-modal-dialog');
    if (backdrop && dialog) {
      backdrop.classList.remove('is-open');
      dialog.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  function initBuildingBlocksModal() {
    var cards = document.querySelectorAll('.ring-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var type = card.getAttribute('data-block-type');
        openBlockModal(type);
      });
    });

    var backdrop = document.getElementById('block-modal-backdrop');
    var closeBtn = document.getElementById('block-modal-close');
    if (backdrop) backdrop.addEventListener('click', closeBlockModal);
    if (closeBtn) closeBtn.addEventListener('click', closeBlockModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeBlockModal();
    });
  }

  /**
   * SECTION 6: REAL WORLD TWO-ROW MARQUEE EXPANDING CARDS
   */
  var REAL_WORLD_DETAILS = {
    defi: {
      how: 'Smart contracts act as automated liquidity pools without brokers or clearinghouses.',
      example: 'Uniswap enables decentralized trades; Aave allows peer-to-peer asset borrowing.',
      risk: 'Smart contract bugs or economic oracle exploits can lead to loss of funds.'
    },
    gaming: {
      how: 'Game items are stored as verifiable NFT tokens directly in the player\'s self-custody wallet.',
      example: 'Gods Unchained and Parallel allow players to buy, sell, or trade game cards openly.',
      risk: 'Poor gameplay incentives prioritizing speculative token earning over authentic player enjoyment.'
    },
    identity: {
      how: 'Cryptographic public-private key pairs allow users to prove credentials without revealing personal details.',
      example: 'Sign-in with Ethereum (SIWE) and Zero-Knowledge age verification proofs.',
      risk: 'Losing your private key or seed phrase means permanently losing access to your identity.'
    },
    supply: {
      how: 'Each handoff in the logistics chain is cryptographically timestamped on an immutable ledger.',
      example: 'Tracking ethical coffee beans from certified farms directly to the retail grocery shelf.',
      risk: '"Garbage in, garbage out" — physical fraud can still occur at the initial data entry point.'
    },
    creators: {
      how: 'Programmable smart contracts enforce automatic secondary sales royalties directly to artists.',
      example: 'Independent musicians releasing limited album drops directly to their most loyal patrons.',
      risk: 'Market saturation and differing platform implementations of royalty enforcement.'
    },
    voting: {
      how: 'Token-weighted or zero-knowledge ballots recorded publicly with mathematically verifiable counts.',
      example: 'MakerDAO and Uniswap token holders voting on protocol fee changes and treasury grants.',
      risk: 'Voter apathy or plutocratic governance where wealthy "whales" dominate proposal outcomes.'
    }
  };

  function initRealWorldMarquee() {
    var cards = document.querySelectorAll('.marquee-card');
    cards.forEach(function (card) {
      var categoryKey = card.getAttribute('data-category');
      var details = REAL_WORLD_DETAILS[categoryKey];
      if (details) {
        var expandContainer = card.querySelector('.marquee-card__expanded-content');
        if (expandContainer) {
          expandContainer.innerHTML = [
            '<div style="margin-bottom:4px;"><strong style="color:#FFF;">How it works:</strong> ' + details.how + '</div>',
            '<div style="margin-bottom:4px;"><strong style="color:#FFF;">Example:</strong> ' + details.example + '</div>',
            '<div><strong style="color:#FBBF24;">Risk to watch:</strong> ' + details.risk + '</div>'
          ].join('');
        }
      }

      card.addEventListener('click', function () {
        card.classList.toggle('is-expanded');
      });
    });
  }

  /**
   * SECTION 6B: BENTO TOKENS EXPANSION
   */
  var TOKEN_DETAILS = {
    payments: 'Tokens settle internationally within seconds with transaction fees measured in pennies, bypassing multi-day SWIFT banking delays.',
    governance: 'Holders create and vote on binding architectural proposals, protocol fee distributions, and foundation grant allocations.',
    staking: 'Locking tokens in Proof-of-Stake consensus validators secures the network against attacks in exchange for protocol rewards.',
    access: 'Holding a specific token functions as an unforgeable digital pass to dApp features, private developer APIs, or private Discord servers.',
    rewards: 'Early users and liquidity providers earn protocol tokens, aligning long-term stakeholder incentives without central ad tracking.',
    collectibles: 'Tokens with unique token IDs (NFTs) prove immutable historical provenance for digital artwork, virtual plots, and digital goods.'
  };

  function initBentoTokens() {
    var cards = document.querySelectorAll('.token-bento-card');
    cards.forEach(function (card) {
      var key = card.getAttribute('data-token-key');
      var exampleEl = card.querySelector('.token-bento-card__example');
      if (exampleEl && TOKEN_DETAILS[key]) {
        exampleEl.innerHTML = '<strong>Scenario:</strong> ' + TOKEN_DETAILS[key];
      }

      card.addEventListener('click', function () {
        card.classList.toggle('is-expanded');
      });
    });
  }

  /**
   * SECTION 8: "CHAIN OF BLOCKS" ROADMAP (Real SHA-256 Hashing & Mining)
   */
  var ROADMAP_BLOCKS = [
    {
      id: 1,
      title: 'Beginner',
      hashPrefix: '0x1a8f',
      items: [
        { id: 'b1', text: 'Understand how a blockchain ledger records transactions irreversibly', tag: 'Ledger' },
        { id: 'b2', text: 'Learn how distributed nodes reach Byzantine Fault Tolerant consensus', tag: 'Nodes' },
        { id: 'b3', text: 'Set up your first self-custody wallet and securely store your seed phrase', tag: 'Wallet' }
      ]
    },
    {
      id: 2,
      title: 'Builder',
      hashPrefix: '0x4b7c',
      items: [
        { id: 'm1', text: 'Explore the anatomy of a Solidity smart contract vending machine', tag: 'Contracts' },
        { id: 'm2', text: 'Understand gas fees, execution limits, and transaction state changes', tag: 'EVM' },
        { id: 'm3', text: 'Simulate an Automated Market Maker (AMM) token swap with slippage calculation', tag: 'DeFi' }
      ]
    },
    {
      id: 3,
      title: 'Explorer',
      hashPrefix: '0x9d2e',
      items: [
        { id: 'e1', text: 'Participate in token-weighted mini DAO voting and observe quorum reach', tag: 'DAO' },
        { id: 'e2', text: 'Calculate proof-of-stake staking yields and understand slashing risks', tag: 'Staking' },
        { id: 'e3', text: 'Test your knowledge on the 10-question Aether certification quiz', tag: 'Quiz' }
      ]
    }
  ];

  function initChainRoadmap() {
    var savedState = JSON.parse(localStorage.getItem('aether_chain_roadmap') || '{}');

    ROADMAP_BLOCKS.forEach(async function (block, idx) {
      var blockCard = document.getElementById('chain-block-' + block.id);
      var hashPill = document.getElementById('block-hash-' + block.id);
      var txList = document.getElementById('block-tx-list-' + block.id);
      var ringCircle = document.getElementById('ring-circle-' + block.id);
      var ringText = document.getElementById('ring-text-' + block.id);
      var connector = document.getElementById('chain-connector-' + block.id);

      if (!blockCard || !txList) return;

      // Calculate real SHA-256 hash for block header
      var fullHash = await computeSha256(block.title + JSON.stringify(block.items));
      if (hashPill) hashPill.textContent = fullHash.substring(0, 10) + '...';

      // Render transactions
      txList.innerHTML = '';
      var checkedCount = 0;

      block.items.forEach(function (item) {
        var isChecked = Boolean(savedState[item.id]);
        if (isChecked) checkedCount++;

        var itemEl = document.createElement('div');
        itemEl.className = 'block-tx-item' + (isChecked ? ' is-checked' : '');
        itemEl.setAttribute('role', 'checkbox');
        itemEl.setAttribute('aria-checked', isChecked ? 'true' : 'false');
        itemEl.setAttribute('tabindex', '0');

        itemEl.innerHTML = [
          '<span class="tx-check-circle">',
          isChecked ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '',
          '</span>',
          '<span class="tx-text">' + item.text + '</span>',
          '<span class="tx-tag">' + item.tag + '</span>'
        ].join('');

        async function toggleItem() {
          var nowChecked = !savedState[item.id];
          savedState[item.id] = nowChecked;
          localStorage.setItem('aether_chain_roadmap', JSON.stringify(savedState));
          initChainRoadmap(); // re-evaluate chain
        }

        itemEl.addEventListener('click', toggleItem);
        itemEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleItem();
          }
        });

        txList.appendChild(itemEl);
      });

      // Update progress ring
      var pct = Math.round((checkedCount / block.items.length) * 100);
      if (ringText) ringText.textContent = pct + '%';
      if (ringCircle) {
        var circumference = 2 * Math.PI * 14;
        ringCircle.style.strokeDasharray = circumference;
        ringCircle.style.strokeDashoffset = circumference - (pct / 100) * circumference;
      }

      // Check if block is fully mined
      if (checkedCount === block.items.length) {
        blockCard.classList.add('is-mined');
        if (hashPill) hashPill.textContent = 'SEALED #' + block.id;
        if (connector) connector.classList.add('is-active');

        // Unlock next block visually
        var nextBlock = document.getElementById('chain-block-' + (block.id + 1));
        if (nextBlock) nextBlock.classList.add('is-unlocked');
      } else {
        blockCard.classList.remove('is-mined');
        if (connector) connector.classList.remove('is-active');
      }
    });

    // Reset Chain Button
    var resetBtn = document.getElementById('reset-chain-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        localStorage.removeItem('aether_chain_roadmap');
        Aether.showToast('Blockchain roadmap progress reset.');
        initChainRoadmap();
      });
    }
  }

  function init() {
    initCustomCursor();
    initMagneticButtons();
    initScrollReveal();
    initRingCarousel();
    initBuildingBlocksModal();
    initRealWorldMarquee();
    initBentoTokens();
    initChainRoadmap();
  }

  window.Aether.Motion = {
    init: init,
    openBlockModal: openBlockModal,
    closeBlockModal: closeBlockModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
