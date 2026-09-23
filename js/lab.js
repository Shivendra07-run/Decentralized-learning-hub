/**
 * AETHER LAB WORKSPACE CONTROLLER (IIFE + window.Aether)
 * 5 In-Memory Web3 Mechanics Simulations:
 * 1. Linked Blockchain with Nonce Mining & SHA-256
 * 2. Smart Contract Vending Machine with EVM Trace
 * 3. Constant-Product AMM DEX Swap (x * y = k)
 * 4. Staking APY Yield Compounder & SVG Curve
 * 5. DAO Token-Weighted Ballot & Quorum Simulator
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  /**
   * Pure-JS Synchronous SHA-256 Implementation (for instantaneous Proof-of-Work mining)
   */
  function sha256Sync(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }

    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var i, j;
    var result = '';

    var words = [];
    var asciiBitLength = ascii.length * 8;
    var hash = [];
    var k = [];
    var primeCounter = 0;

    var isPrime = function (n) {
      for (var factor = 2; factor <= Math.sqrt(n); factor++) {
        if (n % factor === 0) return false;
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

    for (i = 0; i < ascii.length; i++) {
      words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
    }

    for (j = 0; j < words.length; j += 16) {
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
    return result;
  }

  function trigger3DFeedback() {
    if (window.Aether && window.Aether.scene3d && typeof window.Aether.scene3d.triggerSuccessEffect === 'function') {
      window.Aether.scene3d.triggerSuccessEffect();
    }
  }

  /* ==========================================================================
     TABS NAVIGATION CONTROLLER (Keyboard Accessible ARIA)
     ========================================================================== */
  function initTabs() {
    var tabs = Array.from(document.querySelectorAll('.lab-tab-btn'));
    var panels = Array.from(document.querySelectorAll('.lab-panel'));

    function selectTab(newTab) {
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });

      panels.forEach(function (p) {
        p.classList.remove('is-active');
        p.hidden = true;
      });

      newTab.classList.add('is-active');
      newTab.setAttribute('aria-selected', 'true');
      newTab.setAttribute('tabindex', '0');
      newTab.focus();

      var panelId = newTab.getAttribute('aria-controls');
      var panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('is-active');
        panel.hidden = false;
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        selectTab(tab);
      });

      tab.addEventListener('keydown', function (e) {
        var targetIndex = -1;
        if (e.key === 'ArrowRight') {
          targetIndex = (index + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
          targetIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = tabs.length - 1;
        }

        if (targetIndex !== -1) {
          e.preventDefault();
          selectTab(tabs[targetIndex]);
        }
      });
    });
  }

  /* ==========================================================================
     DEMO 1: BLOCK CHAIN (SHA-256 Proof-of-Work Mining)
     ========================================================================== */
  var initialChain = [
    { id: 1, title: 'Block #1 (Genesis)', data: 'Genesis: Alice created protocol', nonce: 1472, prev: '0000000000000000000000000000000000000000000000000000000000000000' },
    { id: 2, title: 'Block #2', data: 'Alice sends 10 AETH to Bob', nonce: 843, prev: '' },
    { id: 3, title: 'Block #3', data: 'Bob deploys staking contract', nonce: 3180, prev: '' }
  ];

  var chain = [];

  function calculateBlockHash(block) {
    var raw = block.id + '|' + block.data + '|' + block.prev + '|' + block.nonce;
    return sha256Sync(raw);
  }

  function validateChain() {
    var isValid = true;
    for (var i = 0; i < chain.length; i++) {
      var b = chain[i];
      if (i === 0) {
        b.prev = '0000000000000000000000000000000000000000000000000000000000000000';
      } else {
        b.prev = chain[i - 1].hash;
      }
      b.hash = calculateBlockHash(b);

      // Check Proof-of-Work condition: starts with "000"
      var powOk = b.hash.indexOf('000') === 0;
      if (!powOk || !isValid) {
        b.isValid = false;
        isValid = false; // Downstream blocks immediately break
      } else {
        b.isValid = true;
      }
    }
  }

  function renderBlockchain() {
    validateChain();
    var container = document.getElementById('blockchain-grid');
    if (!container) return;

    container.innerHTML = chain.map(function (b, idx) {
      var statusClass = b.isValid ? 'is-valid' : 'is-broken';
      var statusLabel = b.isValid ? 'VALID' : 'BROKEN LINK';

      return [
        '<div class="chain-block-node ' + statusClass + '" data-block-index="' + idx + '">',
        '  <div class="chain-block-node__head">',
        '    <span class="block-num">' + b.title + '</span>',
        '    <span class="block-status-tag ' + statusClass + '">' + statusLabel + '</span>',
        '  </div>',
        '  <div class="chain-block-node__body">',
        '    <label class="block-field-label">Transaction Data</label>',
        '    <textarea class="block-data-input" data-idx="' + idx + '" rows="2">' + b.data + '</textarea>',
        '    <div class="block-field-row">',
        '      <label class="block-field-label">Nonce</label>',
        '      <input type="number" class="block-nonce-input" data-idx="' + idx + '" value="' + b.nonce + '">',
        '    </div>',
        '    <div class="block-hash-row">',
        '      <span class="block-field-label">Previous Hash</span>',
        '      <div class="block-hash-code">' + b.prev + '</div>',
        '    </div>',
        '    <div class="block-hash-row">',
        '      <span class="block-field-label">Current Hash</span>',
        '      <div class="block-hash-code hash-val">' + b.hash + '</div>',
        '    </div>',
        '  </div>',
        '  <div class="chain-block-node__footer">',
        '    <button type="button" class="btn btn--secondary btn--sm btn-mine-block" data-idx="' + idx + '">',
        '      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        '      <span>Mine Block (PoW)</span>',
        '    </button>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    // Attach Input Event Listeners
    container.querySelectorAll('.block-data-input').forEach(function (input) {
      input.addEventListener('input', function () {
        var idx = parseInt(input.getAttribute('data-idx'), 10);
        chain[idx].data = input.value;
        renderBlockchain();
      });
    });

    container.querySelectorAll('.block-nonce-input').forEach(function (input) {
      input.addEventListener('input', function () {
        var idx = parseInt(input.getAttribute('data-idx'), 10);
        chain[idx].nonce = parseInt(input.value || '0', 10);
        renderBlockchain();
      });
    });

    // Attach Mine Button Listeners
    container.querySelectorAll('.btn-mine-block').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        mineBlock(idx, btn);
      });
    });
  }

  function mineBlock(idx, btn) {
    var b = chain[idx];
    btn.disabled = true;
    btn.innerHTML = '<span>Mining...</span>';

    setTimeout(function () {
      var nonce = 0;
      var maxIterations = 50000;
      var found = false;

      while (nonce < maxIterations) {
        b.nonce = nonce;
        var h = calculateBlockHash(b);
        if (h.indexOf('000') === 0) {
          found = true;
          break;
        }
        nonce++;
      }

      if (found) {
        trigger3DFeedback();
        Aether.showToast('Block #' + b.id + ' successfully mined with nonce ' + b.nonce + '!');
      } else {
        Aether.showToast('Mining iteration cap reached. Try adjusting data.');
      }

      renderBlockchain();
    }, 40);
  }

  function initBlockchainDemo() {
    chain = JSON.parse(JSON.stringify(initialChain));
    renderBlockchain();

    var resetBtn = document.querySelector('.btn-lab-reset[data-reset="blockchain"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        chain = JSON.parse(JSON.stringify(initialChain));
        renderBlockchain();
        Aether.showToast('Blockchain demo reset to genesis state.');
      });
    }
  }

  /* ==========================================================================
     DEMO 2: SMART CONTRACT VENDING MACHINE
     ========================================================================== */
  var VENDING_ITEMS = [
    { id: 0, name: 'Decentralized Soda', price: 0.04, stock: 5 },
    { id: 1, name: 'Protocol Coffee', price: 0.08, stock: 3 },
    { id: 2, name: 'Crypto Energy Bar', price: 0.02, stock: 4 }
  ];

  var vendingState = {
    selectedItem: 0,
    balance: 0.00,
    isExecuting: false
  };

  function renderVendingItems() {
    var container = document.getElementById('vending-items');
    if (!container) return;

    container.innerHTML = VENDING_ITEMS.map(function (item) {
      var isSelected = (item.id === vendingState.selectedItem);
      return [
        '<div class="vending-item-card ' + (isSelected ? 'is-selected' : '') + '" data-item-id="' + item.id + '">',
        '  <div class="vending-item-info">',
        '    <strong class="item-name">' + item.name + '</strong>',
        '    <span class="item-price">' + item.price.toFixed(2) + ' AETH</span>',
        '  </div>',
        '  <span class="item-stock">Stock: ' + item.stock + '</span>',
        '</div>'
      ].join('');
    }).join('');

    container.querySelectorAll('.vending-item-card').forEach(function (card) {
      card.addEventListener('click', function () {
        if (vendingState.isExecuting) return;
        vendingState.selectedItem = parseInt(card.getAttribute('data-item-id'), 10);
        renderVendingItems();
      });
    });
  }

  function highlightCodeLine(lineNum, delay) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        document.querySelectorAll('#vending-code-trace .code-line').forEach(function (el) {
          el.classList.remove('is-active');
        });
        var target = document.getElementById('vline-' + lineNum);
        if (target) target.classList.add('is-active');
        resolve();
      }, delay);
    });
  }

  async function executeVendingContract() {
    if (vendingState.isExecuting) return;
    vendingState.isExecuting = true;

    var item = VENDING_ITEMS[vendingState.selectedItem];
    var terminalMsg = document.getElementById('vending-status-msg');
    var buyBtn = document.getElementById('btn-vending-buy');
    if (buyBtn) buyBtn.disabled = true;

    terminalMsg.textContent = 'Transaction initiated. Calling purchase(' + item.id + ')...';

    await highlightCodeLine(1, 150);
    await highlightCodeLine(2, 250);

    if (item.stock <= 0) {
      terminalMsg.textContent = 'REVERT: Out of stock. Transaction rolled back.';
      vendingState.isExecuting = false;
      if (buyBtn) buyBtn.disabled = false;
      return;
    }

    await highlightCodeLine(3, 250);

    if (vendingState.balance < item.price) {
      terminalMsg.innerHTML = '<span style="color:#EF4444;">REVERT: Insufficient payment (' + vendingState.balance.toFixed(2) + ' &lt; ' + item.price.toFixed(2) + ' AETH). All coins refunded.</span>';
      await highlightCodeLine(1, 200);
      vendingState.isExecuting = false;
      if (buyBtn) buyBtn.disabled = false;
      return;
    }

    await highlightCodeLine(4, 250);
    item.stock--;

    await highlightCodeLine(5, 250);
    var change = Number((vendingState.balance - item.price).toFixed(4));

    await highlightCodeLine(6, 250);
    if (change > 0) {
      await highlightCodeLine(7, 250);
    }

    vendingState.balance = 0;
    document.getElementById('vending-balance').textContent = '0.00 AETH';
    renderVendingItems();

    terminalMsg.innerHTML = '<span style="color:#10B981;">SUCCESS: Dispensed ' + item.name + '! Change returned: ' + change.toFixed(2) + ' AETH. Zero middleman.</span>';
    trigger3DFeedback();
    Aether.showToast('Smart contract completed successfully!');

    setTimeout(function () {
      document.querySelectorAll('#vending-code-trace .code-line').forEach(function (el) {
        el.classList.remove('is-active');
      });
      vendingState.isExecuting = false;
      if (buyBtn) buyBtn.disabled = false;
    }, 600);
  }

  function initVendingDemo() {
    renderVendingItems();

    var balanceDisplay = document.getElementById('vending-balance');

    document.querySelectorAll('.btn-insert-coin').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (vendingState.isExecuting) return;
        var val = parseFloat(btn.getAttribute('data-val'));
        vendingState.balance = Number((vendingState.balance + val).toFixed(4));
        if (balanceDisplay) balanceDisplay.textContent = vendingState.balance.toFixed(2) + ' AETH';
      });
    });

    var buyBtn = document.getElementById('btn-vending-buy');
    if (buyBtn) {
      buyBtn.addEventListener('click', executeVendingContract);
    }

    var refundBtn = document.getElementById('btn-vending-refund');
    if (refundBtn) {
      refundBtn.addEventListener('click', function () {
        if (vendingState.isExecuting) return;
        var refunded = vendingState.balance;
        vendingState.balance = 0;
        if (balanceDisplay) balanceDisplay.textContent = '0.00 AETH';
        var terminalMsg = document.getElementById('vending-status-msg');
        if (terminalMsg) terminalMsg.textContent = 'Refunded ' + refunded.toFixed(2) + ' AETH back to wallet.';
      });
    }

    var resetBtn = document.querySelector('.btn-lab-reset[data-reset="vending"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        VENDING_ITEMS[0].stock = 5;
        VENDING_ITEMS[1].stock = 3;
        VENDING_ITEMS[2].stock = 4;
        vendingState.balance = 0;
        vendingState.selectedItem = 0;
        if (balanceDisplay) balanceDisplay.textContent = '0.00 AETH';
        renderVendingItems();
        var terminalMsg = document.getElementById('vending-status-msg');
        if (terminalMsg) terminalMsg.textContent = 'Machine reset to default inventory state.';
      });
    }
  }

  /* ==========================================================================
     DEMO 3: DEX SWAP (x * y = k AMM Pool)
     ========================================================================== */
  var dexState = {
    reserveA: 1000.0,
    reserveB: 100.0,
    k: 100000.0
  };

  function updateDexCalculations() {
    var inputEl = document.getElementById('swap-amount-in');
    if (!inputEl) return;

    var dx = parseFloat(inputEl.value) || 0;
    if (dx <= 0) dx = 1;

    var fee = dx * 0.003;
    var dxNet = dx - fee;
    var newReserveA = dexState.reserveA + dxNet;
    var newReserveB = dexState.k / newReserveA;
    var dy = dexState.reserveB - newReserveB;

    var spotPrice = dexState.reserveA / dexState.reserveB; // 10 USDC per ETH
    var effectivePrice = dx / (dy > 0 ? dy : 0.0001);
    var priceImpact = ((effectivePrice - spotPrice) / spotPrice) * 100;

    // Update UI elements
    document.getElementById('reserve-a').textContent = dexState.reserveA.toFixed(2);
    document.getElementById('reserve-b').textContent = dexState.reserveB.toFixed(2);
    document.getElementById('reserve-k').textContent = Math.round(dexState.k).toLocaleString();

    document.getElementById('quote-amount-out').textContent = dy.toFixed(3) + ' AETH';
    document.getElementById('quote-spot-price').textContent = spotPrice.toFixed(2) + ' USDC / AETH';
    document.getElementById('quote-effective-price').textContent = effectivePrice.toFixed(2) + ' USDC / AETH';
    document.getElementById('quote-fee').textContent = fee.toFixed(3) + ' USDC';

    var impactEl = document.getElementById('quote-impact');
    if (impactEl) {
      impactEl.textContent = priceImpact.toFixed(2) + '%';
      impactEl.className = 'pill-price-impact ' + (priceImpact > 5 ? 'pill-price-impact--high' : '');
    }

    renderDexCurveSVG(newReserveA, newReserveB);
  }

  function renderDexCurveSVG(targetX, targetY) {
    var svg = document.getElementById('dex-curve-svg');
    if (!svg) return;

    var width = 400;
    var height = 240;
    var pad = 35;

    // Coordinate mapping ranges
    var minX = 400, maxX = 2200;
    var minY = 20, maxY = 220;

    function scaleX(x) { return pad + ((x - minX) / (maxX - minX)) * (width - pad * 2); }
    function scaleY(y) { return height - pad - ((y - minY) / (maxY - minY)) * (height - pad * 2); }

    // Generate smooth curve points
    var pathD = '';
    var steps = 40;
    for (var i = 0; i <= steps; i++) {
      var xVal = minX + (i / steps) * (maxX - minX);
      var yVal = dexState.k / xVal;
      var sx = scaleX(xVal);
      var sy = scaleY(yVal);
      if (i === 0) pathD += 'M ' + sx + ' ' + sy;
      else pathD += ' L ' + sx + ' ' + sy;
    }

    var currentPx = scaleX(dexState.reserveA);
    var currentPy = scaleY(dexState.reserveB);

    svg.innerHTML = [
      // Grid & Axes
      '<line x1="' + pad + '" y1="' + (height - pad) + '" x2="' + (width - pad) + '" y2="' + (height - pad) + '" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>',
      '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (height - pad) + '" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>',
      '<text x="' + (width - pad) + '" y="' + (height - pad + 18) + '" fill="#718096" font-size="10" font-family="JetBrains Mono" text-anchor="end">Token A (x)</text>',
      '<text x="' + pad + '" y="' + (pad - 10) + '" fill="#718096" font-size="10" font-family="JetBrains Mono">Token B (y)</text>',

      // Curve Path
      '<path d="' + pathD + '" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>',

      // Current State Point
      '<circle cx="' + currentPx + '" cy="' + currentPy + '" r="6" fill="#FFFFFF" stroke="#050506" stroke-width="2"/>',
      '<circle cx="' + currentPx + '" cy="' + currentPy + '" r="12" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>'
    ].join('');

    var readout = document.getElementById('chart-point-readout');
    if (readout) readout.textContent = '(x: ' + Math.round(dexState.reserveA) + ', y: ' + Math.round(dexState.reserveB) + ')';
  }

  function initDexDemo() {
    var inputEl = document.getElementById('swap-amount-in');
    if (inputEl) {
      inputEl.addEventListener('input', updateDexCalculations);
    }

    var swapBtn = document.getElementById('btn-execute-swap');
    if (swapBtn) {
      swapBtn.addEventListener('click', function () {
        var dx = parseFloat(inputEl.value) || 0;
        if (dx <= 0) return;

        var fee = dx * 0.003;
        var dxNet = dx - fee;
        var newReserveA = dexState.reserveA + dxNet;
        var newReserveB = dexState.k / newReserveA;
        var dy = dexState.reserveB - newReserveB;

        dexState.reserveA = newReserveA;
        dexState.reserveB = newReserveB;
        updateDexCalculations();

        trigger3DFeedback();
        Aether.showToast('Swap executed: +' + dx.toFixed(1) + ' USDC for ' + dy.toFixed(3) + ' AETH');
      });
    }

    var resetBtn = document.querySelector('.btn-lab-reset[data-reset="dex"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        dexState.reserveA = 1000.0;
        dexState.reserveB = 100.0;
        dexState.k = 100000.0;
        if (inputEl) inputEl.value = '25';
        updateDexCalculations();
        Aether.showToast('Liquidity pool reset to initial 1000 USDC / 100 AETH reserves.');
      });
    }

    updateDexCalculations();
  }

  /* ==========================================================================
     DEMO 4: STAKING CALCULATOR
     ========================================================================== */
  function updateStakingCalc() {
    var amountEl = document.getElementById('stake-amount');
    var apyEl = document.getElementById('stake-apy');
    var monthsEl = document.getElementById('stake-months');
    var monthsValDisplay = document.getElementById('stake-months-val');

    if (!amountEl || !apyEl || !monthsEl) return;

    var principal = parseFloat(amountEl.value) || 0;
    var apyPercent = parseFloat(apyEl.value) || 0;
    var months = parseInt(monthsEl.value, 10) || 12;

    if (monthsValDisplay) monthsValDisplay.textContent = months + ' Months';

    var r = (apyPercent / 100) / 12;
    var trajectory = [];
    var currentBal = principal;

    for (var m = 0; m <= months; m++) {
      trajectory.push({ month: m, balance: currentBal });
      currentBal *= (1 + r);
    }

    var finalBal = trajectory[trajectory.length - 1].balance;
    var totalRewards = finalBal - principal;

    document.getElementById('res-rewards').textContent = '+' + totalRewards.toFixed(2) + ' AETH';
    document.getElementById('res-total').textContent = finalBal.toFixed(2) + ' AETH';

    var readout = document.getElementById('stake-final-readout');
    if (readout) readout.textContent = 'Month ' + months + ': ' + finalBal.toFixed(2) + ' AETH';

    renderStakingChart(trajectory, principal, finalBal, months);
  }

  function renderStakingChart(trajectory, minBal, maxBal, maxMonths) {
    var svg = document.getElementById('staking-chart-svg');
    if (!svg) return;

    var width = 400;
    var height = 240;
    var pad = 35;

    var ySpread = Math.max((maxBal - minBal) * 1.35, 2.0);
    var yFloor = Math.max(minBal - (ySpread * 0.1), 0);

    function sx(m) { return pad + (m / maxMonths) * (width - pad * 2); }
    function sy(b) { return height - pad - ((b - yFloor) / ySpread) * (height - pad * 2); }

    var lineD = '';
    var areaD = '';

    trajectory.forEach(function (pt, idx) {
      var px = sx(pt.month);
      var py = sy(pt.balance);
      if (idx === 0) {
        lineD += 'M ' + px + ' ' + py;
        areaD += 'M ' + px + ' ' + (height - pad) + ' L ' + px + ' ' + py;
      } else {
        lineD += ' L ' + px + ' ' + py;
        areaD += ' L ' + px + ' ' + py;
      }
    });

    var lastPt = trajectory[trajectory.length - 1];
    areaD += ' L ' + sx(lastPt.month) + ' ' + (height - pad) + ' Z';

    svg.innerHTML = [
      // Gradient Definition
      '<defs>',
      '  <linearGradient id="stakeGrad" x1="0%" y1="0%" x2="0%" y2="100%">',
      '    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/>',
      '    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0"/>',
      '  </linearGradient>',
      '</defs>',

      // Axes
      '<line x1="' + pad + '" y1="' + (height - pad) + '" x2="' + (width - pad) + '" y2="' + (height - pad) + '" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>',
      '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (height - pad) + '" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>',
      '<text x="' + pad + '" y="' + (height - pad + 18) + '" fill="#718096" font-size="10" font-family="JetBrains Mono">Month 0</text>',
      '<text x="' + (width - pad) + '" y="' + (height - pad + 18) + '" fill="#718096" font-size="10" font-family="JetBrains Mono" text-anchor="end">Month ' + maxMonths + '</text>',

      // Filled Area & Trajectory Line
      '<path d="' + areaD + '" fill="url(#stakeGrad)"/>',
      '<path d="' + lineD + '" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>',

      // Highlight Endpoint Dot
      '<circle cx="' + sx(lastPt.month) + '" cy="' + sy(lastPt.balance) + '" r="5" fill="#FFFFFF" stroke="#050506" stroke-width="2"/>'
    ].join('');
  }

  function initStakingDemo() {
    ['stake-amount', 'stake-apy', 'stake-months'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateStakingCalc);
    });

    var resetBtn = document.querySelector('.btn-lab-reset[data-reset="staking"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        document.getElementById('stake-amount').value = '100';
        document.getElementById('stake-apy').value = '6.5';
        document.getElementById('stake-months').value = '12';
        updateStakingCalc();
        Aether.showToast('Calculator reset to default parameters.');
      });
    }

    updateStakingCalc();
  }

  /* ==========================================================================
     DEMO 5: DAO GOVERNANCE VOTE
     ========================================================================== */
  var initialVoters = [
    { id: 'whale', name: 'Whale Protocol Fund', tokens: 480, vote: 'yes' },
    { id: 'devs', name: 'Core Contributors Guild', tokens: 180, vote: 'yes' },
    { id: 'member_a', name: 'Community Delegate A', tokens: 80, vote: 'no' },
    { id: 'member_b', name: 'Community Delegate B', tokens: 60, vote: 'abstain' }
  ];

  var daoVoters = [];

  function renderDaoVoters() {
    var container = document.getElementById('dao-voters-list');
    if (!container) return;

    container.innerHTML = daoVoters.map(function (v, idx) {
      return [
        '<div class="dao-voter-card">',
        '  <div class="voter-info-row">',
        '    <strong class="voter-name">' + v.name + '</strong>',
        '    <div class="voter-weight-input-wrap">',
        '      <span>Weight:</span>',
        '      <input type="number" class="voter-tokens-input" data-idx="' + idx + '" value="' + v.tokens + '" min="0" step="10">',
        '      <span>tokens</span>',
        '    </div>',
        '  </div>',
        '  <div class="voter-btn-group" role="group" aria-label="Vote options for ' + v.name + '">',
        '    <button type="button" class="btn-vote-choice ' + (v.vote === 'yes' ? 'is-selected-yes' : '') + '" data-idx="' + idx + '" data-choice="yes">Yes</button>',
        '    <button type="button" class="btn-vote-choice ' + (v.vote === 'no' ? 'is-selected-no' : '') + '" data-idx="' + idx + '" data-choice="no">No</button>',
        '    <button type="button" class="btn-vote-choice ' + (v.vote === 'abstain' ? 'is-selected-abstain' : '') + '" data-idx="' + idx + '" data-choice="abstain">Abstain</button>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    container.querySelectorAll('.voter-tokens-input').forEach(function (input) {
      input.addEventListener('input', function () {
        var idx = parseInt(input.getAttribute('data-idx'), 10);
        daoVoters[idx].tokens = Math.max(parseInt(input.value || '0', 10), 0);
        updateDaoCalculations();
      });
    });

    container.querySelectorAll('.btn-vote-choice').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var choice = btn.getAttribute('data-choice');
        daoVoters[idx].vote = choice;
        renderDaoVoters();
        updateDaoCalculations();
      });
    });
  }

  function updateDaoCalculations() {
    var totalTokens = 0;
    var yesTokens = 0;
    var noTokens = 0;
    var abstainTokens = 0;

    daoVoters.forEach(function (v) {
      totalTokens += v.tokens;
      if (v.vote === 'yes') yesTokens += v.tokens;
      else if (v.vote === 'no') noTokens += v.tokens;
      else if (v.vote === 'abstain') abstainTokens += v.tokens;
    });

    var participatingTokens = yesTokens + noTokens + abstainTokens;
    var quorumThreshold = totalTokens * 0.50;
    var quorumReached = participatingTokens >= quorumThreshold && totalTokens > 0;
    var quorumPct = totalTokens > 0 ? (participatingTokens / totalTokens) * 100 : 0;

    var decisiveVotes = yesTokens + noTokens;
    var approvalPct = decisiveVotes > 0 ? (yesTokens / decisiveVotes) * 100 : 0;
    var passed = quorumReached && approvalPct > 60;

    // Update Quorum Bar
    document.getElementById('dao-quorum-val').textContent = participatingTokens + ' / ' + totalTokens + ' (' + quorumPct.toFixed(1) + '%)';
    document.getElementById('dao-quorum-bar').style.width = Math.min(quorumPct, 100) + '%';

    // Update Approval Bar
    document.getElementById('dao-approval-val').textContent = approvalPct.toFixed(1) + '% Yes (' + yesTokens + ' For, ' + noTokens + ' Against)';
    document.getElementById('dao-yes-bar').style.width = approvalPct + '%';
    document.getElementById('dao-no-bar').style.width = (100 - approvalPct) + '%';

    // Update Outcome Badge Card
    var outcomeCard = document.getElementById('dao-outcome-card');
    var outcomeTitle = document.getElementById('dao-outcome-title');
    var outcomeDesc = document.getElementById('dao-outcome-desc');

    if (!quorumReached) {
      outcomeCard.className = 'dao-status-badge-card dao-status--rejected';
      outcomeTitle.textContent = 'PROPOSAL FAILED: QUORUM NOT MET';
      outcomeDesc.textContent = 'Requires 50% participation (' + Math.ceil(quorumThreshold) + ' tokens). Current turnout is ' + quorumPct.toFixed(1) + '%.';
    } else if (passed) {
      outcomeCard.className = 'dao-status-badge-card dao-status--passed';
      outcomeTitle.textContent = 'PROPOSAL PASSED';
      outcomeDesc.textContent = 'Quorum met (' + quorumPct.toFixed(1) + '%) and approval passed with ' + approvalPct.toFixed(1) + '% Yes (>60% required).';
      trigger3DFeedback();
    } else {
      outcomeCard.className = 'dao-status-badge-card dao-status--rejected';
      outcomeTitle.textContent = 'PROPOSAL REJECTED';
      outcomeDesc.textContent = 'Quorum met, but approval was only ' + approvalPct.toFixed(1) + '% (failed to achieve >60% supermajority).';
    }

    // Mathematical Breakdown
    var mathSummary = document.getElementById('dao-math-summary');
    if (mathSummary) {
      mathSummary.innerHTML = [
        '<div class="summary-line"><span>Total Governance Supply:</span> <strong>' + totalTokens + ' Tokens</strong></div>',
        '<div class="summary-line"><span>Turnout (Participation):</span> <strong>' + participatingTokens + ' Tokens (' + quorumPct.toFixed(1) + '%)</strong></div>',
        '<div class="summary-line"><span>Yes Weight:</span> <strong>' + yesTokens + ' Tokens (' + (decisiveVotes > 0 ? ((yesTokens / decisiveVotes) * 100).toFixed(1) : '0') + '%)</strong></div>',
        '<div class="summary-line"><span>No Weight:</span> <strong>' + noTokens + ' Tokens (' + (decisiveVotes > 0 ? ((noTokens / decisiveVotes) * 100).toFixed(1) : '0') + '%)</strong></div>'
      ].join('');
    }
  }

  function initDaoDemo() {
    daoVoters = JSON.parse(JSON.stringify(initialVoters));
    renderDaoVoters();
    updateDaoCalculations();

    var resetBtn = document.querySelector('.btn-lab-reset[data-reset="dao"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        daoVoters = JSON.parse(JSON.stringify(initialVoters));
        renderDaoVoters();
        updateDaoCalculations();
        Aether.showToast('DAO voting slate restored to default distribution.');
      });
    }

    initDaoLiveVote();
  }

  /* ==========================================================================
     DEMO 5B: LIVE COMMUNITY VOTE (1-Wallet, 1-Vote via /api/dao)
     ========================================================================== */
  var daoLivePollTimer = null;
  var isDaoSubmittingVote = false;

  async function fetchLiveDaoVote() {
    if (!window.Aether.api) return;

    try {
      var res = await window.Aether.api.get('/api/dao/proposal');
      if (res && res.ok && res.data) {
        var counts = res.data.counts || { for: 0, against: 0, abstain: 0, total: 0 };
        var total = counts.total || 0;
        var userChoice = res.data.userChoice || null;

        var pctFor = total > 0 ? ((counts.for / total) * 100).toFixed(1) : '0.0';
        var pctAgainst = total > 0 ? ((counts.against / total) * 100).toFixed(1) : '0.0';
        var pctAbstain = total > 0 ? ((counts.abstain / total) * 100).toFixed(1) : '0.0';

        var totalEl = document.getElementById('dao-live-total-cast');
        var segFor = document.getElementById('dao-seg-for');
        var segAgainst = document.getElementById('dao-seg-against');
        var segAbstain = document.getElementById('dao-seg-abstain');

        var pctForEl = document.getElementById('dao-pct-for');
        var countForEl = document.getElementById('dao-count-for');
        var pctAgainstEl = document.getElementById('dao-pct-against');
        var countAgainstEl = document.getElementById('dao-count-against');
        var pctAbstainEl = document.getElementById('dao-pct-abstain');
        var countAbstainEl = document.getElementById('dao-count-abstain');

        if (totalEl) totalEl.textContent = total + (total === 1 ? ' Vote Cast' : ' Votes Cast');
        if (segFor) segFor.style.width = pctFor + '%';
        if (segAgainst) segAgainst.style.width = pctAgainst + '%';
        if (segAbstain) segAbstain.style.width = pctAbstain + '%';

        if (pctForEl) pctForEl.textContent = pctFor + '%';
        if (countForEl) countForEl.textContent = counts.for + (counts.for === 1 ? ' vote' : ' votes');

        if (pctAgainstEl) pctAgainstEl.textContent = pctAgainst + '%';
        if (countAgainstEl) countAgainstEl.textContent = counts.against + (counts.against === 1 ? ' vote' : ' votes');

        if (pctAbstainEl) pctAbstainEl.textContent = pctAbstain + '%';
        if (countAbstainEl) countAbstainEl.textContent = counts.abstain + (counts.abstain === 1 ? ' vote' : ' votes');

        // Update vote buttons active state
        var btnFor = document.getElementById('btn-dao-vote-for');
        var btnAgainst = document.getElementById('btn-dao-vote-against');
        var btnAbstain = document.getElementById('btn-dao-vote-abstain');
        if (btnFor) btnFor.classList.toggle('is-active', userChoice === 'for');
        if (btnAgainst) btnAgainst.classList.toggle('is-active', userChoice === 'against');
        if (btnAbstain) btnAbstain.classList.toggle('is-active', userChoice === 'abstain');

        var banner = document.getElementById('dao-user-vote-banner');
        if (banner) {
          if (userChoice) {
            banner.style.display = 'block';
            banner.textContent = '✓ Your wallet voted: ' + userChoice.toUpperCase() + '. You can update your choice anytime.';
          } else {
            banner.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.warn('[Live DAO] Fetch warning:', err);
    }
  }

  function updateDaoAuthUI() {
    var authPrompt = document.getElementById('dao-live-auth-prompt');
    var btnBar = document.getElementById('dao-live-btn-bar');
    var isSignedIn = Boolean(window.Aether.Wallet && window.Aether.Wallet.getAuthState().isSignedIn);

    if (isSignedIn) {
      if (authPrompt) authPrompt.style.display = 'none';
      if (btnBar) btnBar.style.display = 'flex';
    } else {
      if (authPrompt) authPrompt.style.display = 'flex';
      if (btnBar) btnBar.style.display = 'none';
      var banner = document.getElementById('dao-user-vote-banner');
      if (banner) banner.style.display = 'none';
    }
  }

  async function castLiveDaoVote(choice) {
    if (isDaoSubmittingVote) return;
    if (!window.Aether.Wallet || !window.Aether.Wallet.getAuthState().isSignedIn) {
      if (window.Aether.Wallet) window.Aether.Wallet.openModal();
      return;
    }

    isDaoSubmittingVote = true;
    var btns = document.querySelectorAll('.dao-vote-btn');
    btns.forEach(function (b) { b.disabled = true; });

    try {
      var res = await window.Aether.api.post('/api/dao/vote', {
        proposalId: 'p1',
        choice: choice
      });

      if (res && res.ok) {
        Aether.showToast('Your vote for AIP-09 was recorded on-chain!');
        await fetchLiveDaoVote();
      } else {
        Aether.showToast('Vote error: ' + (res && res.error ? res.error : 'Could not submit'));
      }
    } catch (err) {
      Aether.showToast('Network error while submitting vote');
    } finally {
      isDaoSubmittingVote = false;
      btns.forEach(function (b) { b.disabled = false; });
    }
  }

  function initDaoLiveVote() {
    updateDaoAuthUI();
    fetchLiveDaoVote();

    // Attach vote button listeners
    ['for', 'against', 'abstain'].forEach(function (choice) {
      var btn = document.getElementById('btn-dao-vote-' + choice);
      if (btn) {
        btn.addEventListener('click', function () {
          castLiveDaoVote(choice);
        });
      }
    });

    // Sign in button
    var signInBtn = document.getElementById('btn-dao-signin');
    if (signInBtn) {
      signInBtn.addEventListener('click', function () {
        if (window.Aether.Wallet) {
          var state = window.Aether.Wallet.getState();
          if (!state.isConnected) {
            window.Aether.Wallet.openModal();
          } else {
            window.Aether.Wallet.signIn();
          }
        }
      });
    }

    // Polling interval: every 15s while tab is visible and panel-dao is active
    if (daoLivePollTimer) clearInterval(daoLivePollTimer);
    daoLivePollTimer = setInterval(function () {
      var panel = document.getElementById('panel-dao');
      if (panel && !panel.hidden && document.visibilityState === 'visible') {
        fetchLiveDaoVote();
      }
    }, 15000);

    document.addEventListener('visibilitychange', function () {
      var panel = document.getElementById('panel-dao');
      if (document.visibilityState === 'visible' && panel && !panel.hidden) {
        fetchLiveDaoVote();
      }
    });

    window.addEventListener('aether:authState', function () {
      updateDaoAuthUI();
      fetchLiveDaoVote();
    });
  }

  /* ==========================================================================
     GLOBAL LAB INITIALIZATION
     ========================================================================== */
  function init() {
    initTabs();
    initBlockchainDemo();
    initVendingDemo();
    initDexDemo();
    initStakingDemo();
    initDaoDemo();
  }

  window.Aether.Lab = {
    init: init,
    sha256Sync: sha256Sync
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
