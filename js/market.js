/**
 * AETHER CRYPTO MARKET CONTROLLER (IIFE + window.Aether)
 * Features:
 * 1. CoinGecko Public API integration with strict ID validation
 * 2. 60-second in-memory and localStorage cache with rate-limit throttling
 * 3. Graceful offline/error fallback with last-known data & Retry button
 * 4. Interactive 7-day historical price modal with responsive SVG sparkline
 * 5. Accessible modal with ESC / click-outside dismissal
 * 6. Dual-source price proxy via Aether API with automatic direct fallback
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var COINS_CONFIG = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#F7931A"/><path d="M22.5 13.7c.3-2.1-1.3-3.2-3.5-4l.7-2.9-1.8-.4-.7 2.8c-.5-.1-1-.2-1.5-.3l.7-2.9-1.8-.4-.7 2.9c-.4-.1-.8-.2-1.2-.3l-2.4-.6-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-.8 3.3c0 .1.1.1.1.2l-.1-.1-1.2 4.7c-.1.2-.3.6-.8.5 0 0-1.3-.3-1.3-.3l-.9 2.1 2.3.6c.4.1.9.2 1.3.3l-.7 3 1.8.4.7-2.9c.5.1 1 .2 1.5.3l-.7 2.9 1.8.4.7-2.9c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.4c-.5 2.1-3.9 1-5 1.3l.9-3.6c1.1.3 4.6.8 4.1 2.3zm.5-5.6c-.5 1.9-3.4.9-4.3 1.2l.8-3.3c1 .3 3.9.7 3.5 2.1z" fill="#FFF"/></svg>' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#627EEA"/><path d="M16 4l-7.5 12.5L16 20.8l7.5-4.3L16 4z" fill="#FFF" fill-opacity=".6"/><path d="M16 4v16.8l7.5-4.3L16 4z" fill="#FFF"/><path d="M16 22.3L8.5 18 16 28.5 23.5 18 16 22.3z" fill="#FFF" fill-opacity=".6"/><path d="M16 22.3v6.2l7.5-10.5L16 22.3z" fill="#FFF"/></svg>' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', icon: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#000"/><path d="M9 20.2l2.3-2.3c.2-.2.5-.3.8-.3h10.3c.5 0 .8.6.4 1l-2.3 2.3c-.2.2-.5.3-.8.3H9.4c-.5 0-.8-.6-.4-1zm0-8.4l2.3-2.3c.2-.2.5-.3.8-.3h10.3c.5 0 .8.6.4 1l-2.3 2.3c-.2.2-.5.3-.8.3H9.4c-.5 0-.8-.6-.4-1zm14 4.2l-2.3 2.3c-.2.2-.5.3-.8.3H9.6c-.5 0-.8-.6-.4-1l2.3-2.3c.2-.2.5-.3.8-.3h10.3c.5 0 .8.6.4 1z" fill="#14F195"/></svg>' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#F3BA2F"/><path d="M12.1 14.2l3.9-3.9 3.9 3.9 2.3-2.3-6.2-6.2-6.2 6.2 2.3 2.3zm-3.9 1.8l-2.3 2.3 2.3 2.3 2.3-2.3-2.3-2.3zm7.8 7.8l-3.9-3.9-3.9 3.9 2.3 2.3 6.2 6.2 6.2-6.2-2.3-2.3-4.6 4z" fill="#FFF"/></svg>' },
    { id: 'tether', symbol: 'USDT', name: 'Tether', icon: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#26A17B"/><path d="M17.9 15.5v-2.3h5.2V11H8.9v2.2h5.2v2.3c-4.4.2-7.7 1.1-7.7 2.1 0 1.1 3.3 1.9 7.7 2.1v6.5h3.8v-6.5c4.4-.2 7.7-1.1 7.7-2.1 0-1.1-3.3-1.9-7.7-2.1zm0 3.3v-.1c-3.7-.2-6.4-.8-6.4-1.6 0-.8 2.8-1.4 6.4-1.6v3.3zm0 0" fill="#FFF"/></svg>' },
    { id: 'polygon-ecosystem-token', symbol: 'POL', name: 'Polygon', icon: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#7B3FE4"/><path d="M20.5 12.3l-3.9-2.2c-.4-.2-.9-.2-1.3 0l-3.8 2.2c-.4.2-.6.7-.6 1.1v4.5c0 .5.2.9.6 1.1l3.8 2.2c.4.2.9.2 1.3 0l3.9-2.2c.4-.2.6-.7.6-1.1v-4.5c0-.4-.2-.9-.6-1.1z" fill="#FFF"/></svg>' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', icon: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#375BD2"/><path d="M16 6l-8.7 5v10l8.7 5 8.7-5V11L16 6zm5.8 13.3L16 22.5l-5.8-3.3v-6.5L16 9.5l5.8 3.3v6.5z" fill="#FFF"/></svg>' }
  ];

  var API_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,tether,polygon-ecosystem-token,chainlink&vs_currencies=usd&include_24hr_change=true';
  var CACHE_KEY_PRICES = 'aether_market_prices_cache';
  var CACHE_KEY_TIME = 'aether_market_prices_timestamp';
  var CACHE_KEY_SOURCE = 'aether_market_prices_source';
  var CACHE_TTL_MS = 60 * 1000; // 60 seconds
  var lastFetchTime = 0;
  var memoryPriceCache = null;
  var currentSource = 'via Aether API';

  // 7-day Chart Cache (in-memory)
  var chartCache = {};

  function formatCurrency(num) {
    if (num === null || num === undefined || isNaN(num)) return '$0.00';
    if (num >= 1000) {
      return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (num >= 1) {
      return '$' + num.toFixed(2);
    }
    return '$' + num.toFixed(4);
  }

  function getStoredCache() {
    try {
      var saved = localStorage.getItem(CACHE_KEY_PRICES);
      var time = parseInt(localStorage.getItem(CACHE_KEY_TIME) || '0', 10);
      var src = localStorage.getItem(CACHE_KEY_SOURCE) || 'cached';
      if (saved && time) {
        return { data: JSON.parse(saved), time: time, source: src };
      }
    } catch (e) {}
    return null;
  }

  function saveCache(data, sourceLabel) {
    try {
      var now = Date.now();
      localStorage.setItem(CACHE_KEY_PRICES, JSON.stringify(data));
      localStorage.setItem(CACHE_KEY_TIME, now.toString());
      if (sourceLabel) localStorage.setItem(CACHE_KEY_SOURCE, sourceLabel);
      memoryPriceCache = data;
      lastFetchTime = now;
      if (sourceLabel) currentSource = sourceLabel;
    } catch (e) {}
  }

  /**
   * Fetch Live Prices:
   * 1. Try Aether backend proxy (/api/prices) first.
   * 2. If it fails, fall back to direct CoinGecko public API.
   * 3. If that fails, fall back to localStorage cached data, then simulation.
   */
  async function fetchMarketPrices(force) {
    var now = Date.now();
    var cached = memoryPriceCache ? { data: memoryPriceCache, time: lastFetchTime, source: currentSource } : getStoredCache();

    // Respect 60-second rate limit unless forced and cache expired
    if (!force && cached && (now - cached.time < CACHE_TTL_MS)) {
      renderCards(cached.data, false);
      updateStatusBar('Live data synchronized', false, cached.time, false, cached.source || 'cached');
      return;
    }

    updateStatusBar('Fetching live rates...', true);

    // STEP 1: Try Aether Backend API Proxy
    if (window.Aether && window.Aether.api && typeof window.Aether.api.get === 'function') {
      try {
        var apiRes = await window.Aether.api.get('/api/prices');
        if (apiRes && apiRes.ok && apiRes.data) {
          var list = apiRes.data.prices || apiRes.data.data || (Array.isArray(apiRes.data) ? apiRes.data : null);
          if (list && Array.isArray(list) && list.length > 0) {
            var validatedFromApi = {};
            list.forEach(function (coin) {
              if (coin && coin.id && typeof coin.usd === 'number') {
                validatedFromApi[coin.id] = {
                  usd: coin.usd,
                  usd_24h_change: typeof coin.change24h === 'number' ? coin.change24h : (coin.usd_24h_change || 0)
                };
              }
            });

            if (Object.keys(validatedFromApi).length > 0) {
              saveCache(validatedFromApi, 'via Aether API');
              renderCards(validatedFromApi, false);
              var isStale = Boolean(apiRes.data.stale);
              updateStatusBar(isStale ? 'Prices updated (cached)' : 'Prices updated live', false, Date.now(), false, 'via Aether API');
              return;
            }
          }
        }
      } catch (errApi) {
        console.warn('[Aether Market] Backend API fallback:', errApi.message);
      }
    }

    // STEP 2: Fall back to direct CoinGecko Public API call
    try {
      var res = await fetch(API_PRICE_URL);
      if (!res.ok) {
        throw new Error('CoinGecko returned HTTP ' + res.status);
      }
      var json = await res.json();

      var validatedData = {};
      COINS_CONFIG.forEach(function (coin) {
        if (json[coin.id] && typeof json[coin.id].usd === 'number') {
          validatedData[coin.id] = {
            usd: json[coin.id].usd,
            usd_24h_change: json[coin.id].usd_24h_change || 0
          };
        }
      });

      if (Object.keys(validatedData).length === 0) {
        throw new Error('No valid coin data received');
      }

      saveCache(validatedData, 'direct');
      renderCards(validatedData, false);
      updateStatusBar('Prices updated live', false, Date.now(), false, 'direct');
      return;
    } catch (err) {
      console.warn('[Aether Market] Direct API warning:', err.message);

      // STEP 3: Fall back to localStorage cache or simulation
      if (cached && cached.data) {
        renderCards(cached.data, true);
        updateStatusBar('Offline / Cached (CoinGecko rate-limited). Click Retry.', false, cached.time, true, 'cached');
      } else {
        renderFallbackMockData();
        updateStatusBar('Simulation / Offline mode active. Click Retry.', false, Date.now(), true, 'simulation');
      }
    }
  }

  function updateStatusBar(text, isLoading, time, isOffline, sourceLabel) {
    var dot = document.getElementById('market-status-indicator');
    var label = document.getElementById('market-status-text');
    var badge = document.getElementById('cache-time-badge');

    if (label) label.textContent = text;
    if (dot) {
      dot.className = 'market-status-indicator ' + (isLoading ? 'is-loading' : (isOffline ? 'is-offline' : 'is-live'));
    }

    // Ensure source badge element exists
    var sourceBadge = document.getElementById('market-source-badge');
    if (!sourceBadge && badge && badge.parentNode) {
      sourceBadge = document.createElement('span');
      sourceBadge.id = 'market-source-badge';
      sourceBadge.className = 'cache-time-badge';
      sourceBadge.style.marginLeft = '6px';
      badge.parentNode.appendChild(sourceBadge);
    }

    if (sourceBadge) {
      if (sourceLabel && !isLoading) {
        sourceBadge.textContent = sourceLabel;
        sourceBadge.style.display = 'inline-block';
      } else {
        sourceBadge.style.display = 'none';
      }
    }

    if (badge) {
      if (time && !isLoading) {
        var d = new Date(time);
        badge.textContent = (isOffline ? 'Offline Cache: ' : 'Updated: ') + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function renderCards(priceMap, isCached) {
    var container = document.getElementById('market-cards-container');
    if (!container) return;

    // Filter to only coins present in priceMap (drops invalid IDs safely)
    var validCoins = COINS_CONFIG.filter(function (coin) {
      return Boolean(priceMap[coin.id]);
    });

    container.innerHTML = validCoins.map(function (coin) {
      var info = priceMap[coin.id];
      var change24h = info.usd_24h_change || 0;
      var isPositive = change24h >= 0;
      var arrowGlyph = isPositive ? '▲' : '▼';
      var changeClass = isPositive ? 'price-change--positive' : 'price-change--negative';

      return [
        '<div class="market-coin-card" data-coin-id="' + coin.id + '" role="button" tabindex="0" aria-label="View 7-day chart for ' + coin.name + '">',
        '  <div class="market-coin-card__head">',
        '    <div class="coin-brand-wrap">',
        '      <div class="coin-svg-icon">' + coin.icon + '</div>',
        '      <div>',
        '        <h3 class="coin-name-text">' + coin.name + '</h3>',
        '        <span class="coin-ticker-badge">' + coin.symbol + '</span>',
        '      </div>',
        '    </div>',
        '    <span class="chart-prompt-hint">7D Chart &rarr;</span>',
        '  </div>',
        '  <div class="market-coin-card__body">',
        '    <strong class="coin-price-display">' + formatCurrency(info.usd) + '</strong>',
        '    <div class="coin-change-row ' + changeClass + '">',
        '      <span class="change-arrow" aria-hidden="true">' + arrowGlyph + '</span>',
        '      <span class="change-val">' + Math.abs(change24h).toFixed(2) + '% (24h)</span>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    // Attach Click and Keyboard Listeners
    container.querySelectorAll('.market-coin-card').forEach(function (card) {
      function open() {
        var id = card.getAttribute('data-coin-id');
        open7dChartModal(id, priceMap[id]);
      }

      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function renderFallbackMockData() {
    var fallback = {
      'bitcoin': { usd: 63840.00, usd_24h_change: 2.15 },
      'ethereum': { usd: 3450.50, usd_24h_change: -1.24 },
      'solana': { usd: 148.20, usd_24h_change: 4.80 },
      'binancecoin': { usd: 585.10, usd_24h_change: 0.45 },
      'tether': { usd: 1.00, usd_24h_change: 0.01 },
      'polygon-ecosystem-token': { usd: 0.42, usd_24h_change: -2.10 },
      'chainlink': { usd: 11.85, usd_24h_change: 1.95 }
    };
    renderCards(fallback, true);
  }

  /**
   * 7-Day Chart Modal Logic
   */
  async function open7dChartModal(coinId, currentPriceInfo) {
    var coin = COINS_CONFIG.find(function (c) { return c.id === coinId; });
    if (!coin) return;

    var modal = document.getElementById('chart-modal-dialog');
    var backdrop = document.getElementById('chart-modal-backdrop');
    var titleEl = document.getElementById('chart-modal-title');
    var iconEl = document.getElementById('modal-coin-icon');
    var priceEl = document.getElementById('modal-current-price');
    var spinner = document.getElementById('modal-chart-spinner');
    var svg = document.getElementById('modal-7d-svg');

    if (!modal || !backdrop) return;

    if (titleEl) titleEl.textContent = coin.name + ' (' + coin.symbol + ')';
    if (iconEl) iconEl.innerHTML = coin.icon;
    if (priceEl && currentPriceInfo) priceEl.textContent = formatCurrency(currentPriceInfo.usd);

    modal.classList.add('is-open');
    backdrop.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    if (spinner) spinner.style.display = 'block';
    if (svg) svg.innerHTML = '';

    // Fetch 7-day data from Aether proxy or CoinGecko fallback
    var chartResult = await fetch7dData(coinId);
    if (spinner) spinner.style.display = 'none';

    var prices = chartResult && chartResult.prices ? chartResult.prices : chartResult;
    var chartSource = chartResult && chartResult.source ? chartResult.source : '';

    var attribution = document.querySelector('.chart-attribution-note');
    if (attribution) {
      var sourceText = chartSource ? ' (' + chartSource + ')' : '';
      attribution.textContent = 'Data provided by CoinGecko' + sourceText + '. Token names and logos belong to their respective project owners.';
    }

    if (prices && prices.length > 0) {
      render7dChartSVG(prices, currentPriceInfo ? currentPriceInfo.usd : null);
    } else {
      if (svg) {
        svg.innerHTML = '<text x="320" y="140" fill="#A0AEC0" text-anchor="middle" font-family="JetBrains Mono" font-size="12">Historical telemetry unavailable or rate limited</text>';
      }
    }
  }

  function close7dChartModal() {
    var modal = document.getElementById('chart-modal-dialog');
    var backdrop = document.getElementById('chart-modal-backdrop');
    if (modal && backdrop) {
      modal.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  async function fetch7dData(coinId) {
    var now = Date.now();
    if (chartCache[coinId] && (now - chartCache[coinId].time < 120000)) {
      return chartCache[coinId];
    }

    // 1. Try Aether API proxy first
    if (window.Aether && window.Aether.api && typeof window.Aether.api.get === 'function') {
      try {
        var apiRes = await window.Aether.api.get('/api/chart?id=' + encodeURIComponent(coinId));
        if (apiRes && apiRes.ok && apiRes.data) {
          var raw = apiRes.data;
          var pts = Array.isArray(raw) ? raw : (raw.prices || raw.points || []);
          if (pts.length > 0) {
            var normalized = pts.map(function (p) {
              if (Array.isArray(p)) return [p[0], p[1]];
              return [p.t || p.time || 0, p.price || 0];
            });
            chartCache[coinId] = { prices: normalized, source: 'via Aether API', time: now };
            return chartCache[coinId];
          }
        }
      } catch (e) {
        console.warn('[Aether Market] API chart fetch fallback for ' + coinId, e.message);
      }
    }

    // 2. Fall back to direct CoinGecko call
    var url = 'https://api.coingecko.com/api/v3/coins/' + coinId + '/market_chart?vs_currency=usd&days=7';
    try {
      var res = await fetch(url);
      if (!res.ok) throw new Error('Status ' + res.status);
      var data = await res.json();
      if (data && data.prices && Array.isArray(data.prices)) {
        chartCache[coinId] = { prices: data.prices, source: 'direct', time: now };
        return chartCache[coinId];
      }
    } catch (e) {
      console.warn('[Aether Market] Chart fetch fallback for ' + coinId, e.message);
    }

    // 3. Fallback deterministic simulation curve if API rate-limited
    var mockPrices = [];
    var base = 100;
    for (var i = 0; i < 50; i++) {
      base += (Math.sin(i * 0.4) * 3) + (Math.cos(i * 0.2) * 2);
      mockPrices.push([now - (50 - i) * 3600000, base]);
    }
    return { prices: mockPrices, source: 'simulation', time: now };
  }

  function render7dChartSVG(prices, fallbackCurrent) {
    var svg = document.getElementById('modal-7d-svg');
    if (!svg || prices.length < 2) return;

    var width = 640;
    var height = 280;
    var pad = 40;

    var priceVals = prices.map(function (p) {
      return typeof p.price === 'number' ? p.price : (Array.isArray(p) ? p[1] : 0);
    });
    var minP = Math.min.apply(null, priceVals);
    var maxP = Math.max.apply(null, priceVals);
    var firstP = priceVals[0];
    var lastP = priceVals[priceVals.length - 1];

    var change7d = firstP !== 0 ? (((lastP - firstP) / firstP) * 100) : 0;
    var isUp = change7d >= 0;
    var strokeColor = isUp ? '#10B981' : '#EF4444';

    // Update Modal Stats
    var changeEl = document.getElementById('modal-7d-change');
    var highEl = document.getElementById('modal-7d-high');
    var lowEl = document.getElementById('modal-7d-low');

    if (changeEl) {
      changeEl.textContent = (isUp ? '+' : '') + change7d.toFixed(2) + '%';
      changeEl.style.color = strokeColor;
    }
    if (highEl) highEl.textContent = formatCurrency(maxP);
    if (lowEl) lowEl.textContent = formatCurrency(minP);

    var range = Math.max(maxP - minP, 0.0001);

    function sx(idx) { return pad + (idx / (prices.length - 1)) * (width - pad * 2); }
    function sy(val) { return height - pad - ((val - minP) / range) * (height - pad * 2); }

    var lineD = '';
    var areaD = '';

    prices.forEach(function (pt, i) {
      var val = typeof pt.price === 'number' ? pt.price : (Array.isArray(pt) ? pt[1] : 0);
      var x = sx(i);
      var y = sy(val);
      if (i === 0) {
        lineD += 'M ' + x + ' ' + y;
        areaD += 'M ' + x + ' ' + (height - pad) + ' L ' + x + ' ' + y;
      } else {
        lineD += ' L ' + x + ' ' + y;
        areaD += ' L ' + x + ' ' + y;
      }
    });

    areaD += ' L ' + sx(prices.length - 1) + ' ' + (height - pad) + ' Z';

    svg.innerHTML = [
      '<defs>',
      '  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">',
      '    <stop offset="0%" stop-color="' + strokeColor + '" stop-opacity="0.28"/>',
      '    <stop offset="100%" stop-color="' + strokeColor + '" stop-opacity="0.0"/>',
      '  </linearGradient>',
      '</defs>',

      // Grid Lines
      '<line x1="' + pad + '" y1="' + pad + '" x2="' + (width - pad) + '" y2="' + pad + '" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>',
      '<line x1="' + pad + '" y1="' + (height / 2) + '" x2="' + (width - pad) + '" y2="' + (height / 2) + '" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>',
      '<line x1="' + pad + '" y1="' + (height - pad) + '" x2="' + (width - pad) + '" y2="' + (height - pad) + '" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>',

      // Time Labels
      '<text x="' + pad + '" y="' + (height - pad + 18) + '" fill="#718096" font-size="10" font-family="JetBrains Mono">7 Days Ago</text>',
      '<text x="' + (width - pad) + '" y="' + (height - pad + 18) + '" fill="#718096" font-size="10" font-family="JetBrains Mono" text-anchor="end">Present</text>',

      // Paths
      '<path d="' + areaD + '" fill="url(#chartGrad)"/>',
      '<path d="' + lineD + '" fill="none" stroke="' + strokeColor + '" stroke-width="2.2" stroke-linecap="round"/>',

      // End Marker
      '<circle cx="' + sx(prices.length - 1) + '" cy="' + sy(lastP) + '" r="5" fill="' + strokeColor + '" stroke="#050506" stroke-width="2"/>'
    ].join('');
  }

  function init() {
    fetchMarketPrices(false);

    var refreshBtn = document.getElementById('btn-market-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        fetchMarketPrices(true);
      });
    }

    var statusText = document.getElementById('market-status-text');
    if (statusText) {
      statusText.addEventListener('click', function () {
        fetchMarketPrices(true);
      });
    }

    var closeBtn = document.getElementById('chart-modal-close-btn');
    var backdrop = document.getElementById('chart-modal-backdrop');

    if (closeBtn) closeBtn.addEventListener('click', close7dChartModal);
    if (backdrop) backdrop.addEventListener('click', close7dChartModal);

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close7dChartModal();
    });
  }

  window.Aether.Market = {
    init: init,
    refresh: function () { fetchMarketPrices(true); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
