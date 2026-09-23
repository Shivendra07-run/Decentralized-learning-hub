/**
 * AETHER WEB2 VS WEB3 COMPARE CONTROLLER (IIFE + window.Aether)
 * Features:
 * 1. Accessible Master Paradigm Switch (Web2 <-> Web3)
 * 2. Morphing comparison grid content with smooth CSS animation
 * 3. 2D Canvas animated network topology diagram (Server-Client -> Mesh)
 * 4. Full keyboard navigation and prefers-reduced-motion support
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var COMPARISON_DATA = [
    {
      title: 'Login and Identity',
      icon: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      web2: {
        badge: 'Centralized Account',
        desc: 'You sign in using an email, password, or corporate OAuth (Sign in with Google/Apple). The platform issues session tokens and retains unilateral power to freeze, reset, or delete your identity at will.',
        mechanic: 'Relational databases, password hashes, corporate identity providers'
      },
      web3: {
        badge: 'Self-Sovereign Keypair',
        desc: 'You authenticate using your cryptographic wallet (public/private keypair). No corporate intermediary holds your credentials, and your identity persists seamlessly across all decentralized applications without passwords.',
        mechanic: 'ECDSA / Ed25519 signatures, SIWE (Sign-In with Ethereum)'
      }
    },
    {
      title: 'Who Owns Your Data',
      icon: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
      web2: {
        badge: 'Corporate Custody',
        desc: 'Your photos, social graphs, post history, and documents live on company-owned cloud databases. Platforms monetize your behavioral telemetry and can revoke your audience access without warning.',
        mechanic: 'Proprietary server silos, Terms of Service agreements, data brokers'
      },
      web3: {
        badge: 'User Ownership',
        desc: 'Data and digital property are anchored on open, public ledgers or decentralized storage (IPFS/Arweave). You retain provable cryptographic ownership and can freely migrate your assets to any competing interface.',
        mechanic: 'Content-addressed storage (CIDs), smart contract registries, ERC standards'
      }
    },
    {
      title: 'How Payments Work',
      icon: '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
      web2: {
        badge: 'Intermediated Rails',
        desc: 'Transactions route through card networks, clearinghouses, and banking rails (Visa, Stripe, SWIFT). Payments take 1–3 business days to clear, incur 2–4% processing fees, and can be chargebacked or frozen.',
        mechanic: 'Correspondent banking, merchant processors, credit checks'
      },
      web3: {
        badge: 'Peer-to-Peer Settlement',
        desc: 'Value transfers directly between cryptographic addresses in minutes without bank authorization, merchant account approval, or currency conversion fees. Settlement is definitive and irreversible.',
        mechanic: 'Native crypto tokens, stablecoins, decentralized liquidity pools'
      }
    },
    {
      title: 'Who You Have to Trust',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
      web2: {
        badge: 'Trusted Intermediaries',
        desc: 'You trust corporate executives, internal database administrators, cloud providers, and legal contracts not to leak your data, alter account balances, or alter API access rules unexpectedly.',
        mechanic: 'Legal jurisdiction, corporate compliance, closed-source audits'
      },
      web3: {
        badge: 'Cryptographic Verification',
        desc: 'You verify transparent math, open-source smart contracts, and distributed consensus instead of relying on human honesty. "Don\'t trust, verify" is the foundational engineering philosophy.',
        mechanic: 'Zero-knowledge proofs, consensus rules, deterministic bytecodes'
      }
    },
    {
      title: 'Censorship Resistance',
      icon: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      web2: {
        badge: 'Centralized Control',
        desc: 'Content, accounts, and financial access can be deplatformed, frozen, or geo-restricted at the discretion of platform executives, court subpoenas, or payment processor policy bans.',
        mechanic: 'DNS blacklisting, account deactivation, database deletion'
      },
      web3: {
        badge: 'Unstoppable Protocols',
        desc: 'Transactions that comply with mathematical consensus rules cannot be censored, halted, or retroactively altered by any government, corporation, or network validator node.',
        mechanic: 'Byzantine Fault Tolerant consensus, immutable state machines'
      }
    },
    {
      title: 'What Happens When a Server Fails',
      icon: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
      web2: {
        badge: 'Service Outage',
        desc: 'If the primary hosting provider (e.g. AWS, Cloudflare) experiences an outage, or if the central database crashes, the entire application becomes unreachable for all global users simultaneously.',
        mechanic: 'Single point of failure (SPOF), regional data center outages'
      },
      web3: {
        badge: 'Redundant Global Mesh',
        desc: 'If hundreds of validator nodes drop offline or disconnect, the remaining thousands of independent peer nodes operating across the globe maintain uptime without missing a single block.',
        mechanic: 'Thousands of independent nodes, global peer-to-peer gossip protocol'
      }
    }
  ];

  var currentMode = 'web2'; // 'web2' or 'web3'

  /**
   * DOM Elements
   */
  var btnWeb2 = null;
  var btnWeb3 = null;
  var statusDot = null;
  var modeTitle = null;
  var legendServerIcon = null;
  var legendServerText = null;

  /**
   * Update Comparison Grid with Smooth Morph Animation
   */
  function updateComparisonGrid(mode) {
    var cards = document.querySelectorAll('.compare-row-card');

    cards.forEach(function (card, index) {
      var data = COMPARISON_DATA[index];
      if (!data) return;

      var info = data[mode];
      var badgeEl = document.getElementById('badge-row-' + index);
      var contentEl = document.getElementById('content-row-' + index);

      if (contentEl) {
        // Quick subtle fade transition
        contentEl.style.opacity = '0';
        contentEl.style.transform = 'translateY(4px)';

        setTimeout(function () {
          if (badgeEl) {
            badgeEl.textContent = info.badge;
            badgeEl.className = 'compare-state-pill ' + (mode === 'web3' ? 'compare-state-pill--web3' : '');
          }

          contentEl.innerHTML = [
            '<p class="compare-desc">' + info.desc + '</p>',
            '<div class="compare-detail-footer">',
            '  <span class="detail-key">Mechanic:</span>',
            '  <span class="detail-val">' + info.mechanic + '</span>',
            '</div>'
          ].join('');

          contentEl.style.opacity = '1';
          contentEl.style.transform = 'translateY(0)';
        }, 120);
      }
    });
  }

  /**
   * Set Master Paradigm Mode
   */
  function setMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;

    var isWeb3 = mode === 'web3';

    if (btnWeb2) {
      btnWeb2.classList.toggle('is-active', !isWeb3);
      btnWeb2.setAttribute('aria-pressed', !isWeb3 ? 'true' : 'false');
    }

    if (btnWeb3) {
      btnWeb3.classList.toggle('is-active', isWeb3);
      btnWeb3.setAttribute('aria-pressed', isWeb3 ? 'true' : 'false');
    }

    if (statusDot) {
      statusDot.classList.toggle('compare-status-dot--web3', isWeb3);
    }

    if (modeTitle) {
      modeTitle.textContent = isWeb3 
        ? 'Decentralized Peer-to-Peer Mesh Architecture (Web3)' 
        : 'Centralized Client-Server Architecture (Web2)';
    }

    if (legendServerIcon && legendServerText) {
      if (isWeb3) {
        legendServerIcon.style.opacity = '0.2';
        legendServerText.innerHTML = '<span style="text-decoration:line-through; color:var(--text-tertiary);">Central Server (Dissolved)</span> <strong style="color:#FFF; margin-left:6px;">No Single Point of Failure</strong>';
      } else {
        legendServerIcon.style.opacity = '1';
        legendServerText.textContent = 'Central Cloud Server (Single Authority & Point of Failure)';
      }
    }

    updateComparisonGrid(mode);

    if (window.Aether && typeof window.Aether.showToast === 'function') {
      Aether.showToast('Switched view to ' + (isWeb3 ? 'Web3 (Decentralized)' : 'Web2 (Centralized)'));
    }
  }

  /**
   * 2D Canvas Animated Network Topology Diagram
   */
  var canvas, ctx;
  var nodes = [];
  var packets = [];
  var centralServer = { x: 0, y: 0, radius: 24, alpha: 1, scale: 1 };
  var numNodes = 8;
  var animFrameId = null;
  var lastTimestamp = 0;

  function initDiagramCanvas() {
    canvas = document.getElementById('network-diagram-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Setup initial nodes
    nodes = [];
    var cw = canvas.width / (window.devicePixelRatio || 1);
    var ch = canvas.height / (window.devicePixelRatio || 1);
    var centerX = cw / 2;
    var centerY = ch / 2;

    centralServer.x = centerX;
    centralServer.y = centerY;

    var web2Radius = Math.min(cw * 0.38, 130);
    var web3RadiusX = cw * 0.40;
    var web3RadiusY = ch * 0.38;

    for (var i = 0; i < numNodes; i++) {
      var angle = (i / numNodes) * Math.PI * 2;
      
      // Web2: circular arrangement around central server
      var w2x = centerX + Math.cos(angle) * web2Radius;
      var w2y = centerY + Math.sin(angle) * web2Radius;

      // Web3: distributed elliptical mesh arrangement
      var w3Angle = angle + 0.15;
      var w3x = centerX + Math.cos(w3Angle) * (web3RadiusX * (0.85 + (i % 2) * 0.25));
      var w3y = centerY + Math.sin(w3Angle) * (web3RadiusY * (0.82 + ((i + 1) % 2) * 0.3));

      nodes.push({
        x: w2x,
        y: w2y,
        targetX: w2x,
        targetY: w2y,
        web2X: w2x,
        web2Y: w2y,
        web3X: w3x,
        web3Y: w3y,
        radius: 8,
        pulse: 0,
        pulseSpeed: 1.5 + (i * 0.2)
      });
    }

    // Setup animated packets
    packets = [];
    for (var p = 0; p < 12; p++) {
      packets.push({
        fromIndex: p % numNodes,
        toServer: (p % 2 === 0),
        progress: (p / 12),
        speed: 0.008 + (p * 0.001)
      });
    }

    renderDiagram(0);
  }

  function resizeCanvas() {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    if (ctx) ctx.scale(dpr, dpr);
  }

  function renderDiagram(timestamp) {
    if (!ctx || !canvas) return;

    var dt = (timestamp - lastTimestamp) * 0.001;
    lastTimestamp = timestamp;
    if (dt > 0.1) dt = 0.016;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = canvas.width / dpr;
    var ch = canvas.height / dpr;
    var centerX = cw / 2;
    var centerY = ch / 2;

    ctx.clearRect(0, 0, cw, ch);

    var isWeb3 = currentMode === 'web3';

    // Lerp central server target opacity & scale
    var targetServerAlpha = isWeb3 ? 0 : 1;
    var targetServerScale = isWeb3 ? 0.3 : 1;
    centralServer.alpha += (targetServerAlpha - centralServer.alpha) * 0.08;
    centralServer.scale += (targetServerScale - centralServer.scale) * 0.08;

    // Update node positions towards current target topology
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var tx = isWeb3 ? n.web3X : n.web2X;
      var ty = isWeb3 ? n.web3Y : n.web2Y;

      // Small floating breathing motion
      var floatOffset = Math.sin(timestamp * 0.002 * n.pulseSpeed + i) * 3;

      n.x += (tx - n.x) * 0.08;
      n.y += (ty + floatOffset - n.y) * 0.08;
      n.pulse += dt * n.pulseSpeed;
    }

    // DRAW LINES:
    // In Web2 mode: draw radial lines between central server and each client node
    if (centralServer.alpha > 0.02) {
      ctx.lineWidth = 1.5;
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.18 * centralServer.alpha) + ')';
        ctx.stroke();
      }
    }

    // In Web3 mode: draw mesh lines between neighbor client nodes
    var meshAlpha = isWeb3 ? (1 - centralServer.alpha) : (1 - centralServer.alpha * 1.5);
    if (meshAlpha > 0.02) {
      ctx.lineWidth = 1.2;
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dist = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
          if (dist < cw * 0.42) {
            var lineStrength = (1 - dist / (cw * 0.42)) * 0.28 * meshAlpha;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + lineStrength + ')';
            ctx.stroke();
          }
        }
      }
    }

    // DRAW PACKETS:
    for (var p = 0; p < packets.length; p++) {
      var pkt = packets[p];
      pkt.progress += pkt.speed;
      if (pkt.progress > 1) pkt.progress = 0;

      var px, py;
      var srcNode = nodes[pkt.fromIndex];

      if (!isWeb3 && centralServer.alpha > 0.2) {
        // Web2: travels between central server and node
        if (pkt.toServer) {
          px = srcNode.x + (centerX - srcNode.x) * pkt.progress;
          py = srcNode.y + (centerY - srcNode.y) * pkt.progress;
        } else {
          px = centerX + (srcNode.x - centerX) * pkt.progress;
          py = centerY + (srcNode.y - centerY) * pkt.progress;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (isWeb3 && meshAlpha > 0.2) {
        // Web3: travels between peer nodes
        var targetPeerIndex = (pkt.fromIndex + 1) % nodes.length;
        var destNode = nodes[targetPeerIndex];

        px = srcNode.x + (destNode.x - srcNode.x) * pkt.progress;
        py = srcNode.y + (destNode.y - srcNode.y) * pkt.progress;

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // DRAW CENTRAL SERVER (Web2):
    if (centralServer.alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = centralServer.alpha;
      ctx.translate(centerX, centerY);
      ctx.scale(centralServer.scale, centralServer.scale);

      // Outer glow circle
      var pulseR = centralServer.radius + Math.sin(timestamp * 0.003) * 4;
      ctx.beginPath();
      ctx.arc(0, 0, pulseR + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();

      // Main server body
      ctx.beginPath();
      ctx.arc(0, 0, centralServer.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1E2129';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Server icon / rack lines
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-10, -6, 20, 3);
      ctx.fillRect(-10, 0, 20, 3);
      ctx.fillRect(-10, 6, 20, 3);

      ctx.restore();
    }

    // DRAW CLIENT / PEER NODES:
    for (var k = 0; k < nodes.length; k++) {
      var nd = nodes[k];

      // Soft glow ring
      var glowSize = nd.radius + Math.sin(nd.pulse) * 3;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, glowSize + 4, 0, Math.PI * 2);
      ctx.fillStyle = isWeb3 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(160, 170, 185, 0.08)';
      ctx.fill();

      // Inner node circle
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, nd.radius, 0, Math.PI * 2);
      ctx.fillStyle = isWeb3 ? '#FFFFFF' : '#14161C';
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = isWeb3 ? '#A0AEC0' : '#718096';
      ctx.stroke();

      // Node label
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = isWeb3 ? '#FFFFFF' : '#A0AEC0';
      ctx.textAlign = 'center';
      var label = isWeb3 ? ('Peer ' + (k + 1)) : ('User ' + (k + 1));
      ctx.fillText(label, nd.x, nd.y + nd.radius + 14);
    }

    animFrameId = requestAnimationFrame(renderDiagram);
  }

  /**
   * Initialize Event Listeners
   */
  function init() {
    btnWeb2 = document.getElementById('btn-switch-web2');
    btnWeb3 = document.getElementById('btn-switch-web3');
    statusDot = document.getElementById('diagram-status-dot');
    modeTitle = document.getElementById('diagram-mode-title');
    legendServerIcon = document.getElementById('legend-server-icon');
    legendServerText = document.getElementById('legend-server-text');

    if (btnWeb2) {
      btnWeb2.addEventListener('click', function () {
        setMode('web2');
      });
    }

    if (btnWeb3) {
      btnWeb3.addEventListener('click', function () {
        setMode('web3');
      });
    }

    // Keyboard support: Arrow keys switch modes when focused on switch group
    var switchGroup = document.querySelector('.compare-switch-control');
    if (switchGroup) {
      switchGroup.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setMode('web3');
          if (btnWeb3) btnWeb3.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setMode('web2');
          if (btnWeb2) btnWeb2.focus();
        }
      });
    }

    initDiagramCanvas();
    loadCompareRows();
    initPoll();
    initControlSimulation();
  }

  /**
   * Load compare rows from API with fallback to built-in content
   */
  async function loadCompareRows() {
    var sourceBadge = document.getElementById('compare-rows-source-badge');
    if (!window.Aether || !window.Aether.api || typeof window.Aether.api.get !== 'function') {
      if (sourceBadge) sourceBadge.textContent = 'built-in';
      return;
    }

    try {
      var res = await window.Aether.api.get('/api/compare/rows');
      if (res && res.ok && Array.isArray(res.data) && res.data.length > 0) {
        res.data.forEach(function (row, idx) {
          if (idx < COMPARISON_DATA.length) {
            if (row.topic) COMPARISON_DATA[idx].title = row.topic;
            if (row.web2) {
              if (row.web2.title) COMPARISON_DATA[idx].web2.badge = row.web2.title;
              if (row.web2.text) COMPARISON_DATA[idx].web2.desc = row.web2.text;
            }
            if (row.web3) {
              if (row.web3.title) COMPARISON_DATA[idx].web3.badge = row.web3.title;
              if (row.web3.text) COMPARISON_DATA[idx].web3.desc = row.web3.text;
            }
          }
        });
        if (sourceBadge) {
          sourceBadge.textContent = 'from API';
          sourceBadge.style.color = '#10B981';
        }
        updateComparisonGrid(currentMode);
      } else {
        if (sourceBadge) sourceBadge.textContent = 'built-in';
      }
    } catch (e) {
      if (sourceBadge) sourceBadge.textContent = 'built-in';
    }
  }

  /**
   * Interactive Community Poll Logic
   */
  async function initPoll() {
    var offlineMsg = document.getElementById('poll-offline-msg');
    var resultsBox = document.getElementById('poll-results-box');
    var statusBadge = document.getElementById('poll-status-badge');
    var pollBtnW2 = document.getElementById('poll-btn-web2');
    var pollBtnW3 = document.getElementById('poll-btn-web3');
    var pollBtnDep = document.getElementById('poll-btn-depends');

    if (!pollBtnW2 || !pollBtnW3 || !pollBtnDep) return;

    function renderPollCounts(counts, userChoice) {
      if (!counts) return;
      var total = counts.total || 0;
      var w2 = counts.web2 || 0;
      var w3 = counts.web3 || 0;
      var dep = counts.depends || 0;

      var p2 = total > 0 ? Math.round((w2 / total) * 100) : 0;
      var p3 = total > 0 ? Math.round((w3 / total) * 100) : 0;
      var pDep = total > 0 ? (100 - p2 - p3) : 0;
      if (pDep < 0) pDep = 0;

      var statW2 = document.getElementById('poll-stat-web2');
      var statW3 = document.getElementById('poll-stat-web3');
      var statDep = document.getElementById('poll-stat-depends');

      var fillW2 = document.getElementById('poll-fill-web2');
      var fillW3 = document.getElementById('poll-fill-web3');
      var fillDep = document.getElementById('poll-fill-depends');

      var totalEl = document.getElementById('poll-total-votes');
      var votedMsg = document.getElementById('poll-user-voted-msg');

      if (statW2) statW2.textContent = p2 + '% (' + w2 + ' votes)';
      if (statW3) statW3.textContent = p3 + '% (' + w3 + ' votes)';
      if (statDep) statDep.textContent = pDep + '% (' + dep + ' votes)';

      if (fillW2) fillW2.style.width = p2 + '%';
      if (fillW3) fillW3.style.width = p3 + '%';
      if (fillDep) fillDep.style.width = pDep + '%';

      if (totalEl) totalEl.textContent = 'Total Votes: ' + total;

      [pollBtnW2, pollBtnW3, pollBtnDep].forEach(function (btn) {
        var choice = btn.getAttribute('data-choice');
        var isSelected = (choice === userChoice);
        btn.classList.toggle('is-voted', isSelected);
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      });

      if (votedMsg && userChoice) {
        var label = userChoice === 'web2' ? 'Web2' : (userChoice === 'web3' ? 'Web3' : 'It depends');
        votedMsg.textContent = 'Your vote: ' + label + '. Click any option to change your choice.';
      }

      if (resultsBox) resultsBox.style.display = 'flex';
      if (offlineMsg) offlineMsg.style.display = 'none';
      if (statusBadge) {
        statusBadge.textContent = 'Live Poll';
        statusBadge.style.color = '#10B981';
      }
    }

    async function castVote(choice) {
      if (!window.Aether || !window.Aether.api || typeof window.Aether.api.post !== 'function') {
        if (offlineMsg) offlineMsg.style.display = 'block';
        return;
      }
      try {
        var res = await window.Aether.api.post('/api/compare/poll', {
          poll: 'web2-vs-web3',
          choice: choice
        });
        if (res && res.ok && res.data) {
          renderPollCounts(res.data, choice);
          if (window.Aether.showToast) {
            Aether.showToast('Vote recorded: ' + (choice === 'web2' ? 'Web2' : (choice === 'web3' ? 'Web3' : 'It depends')));
          }
        } else {
          if (offlineMsg) offlineMsg.style.display = 'block';
        }
      } catch (err) {
        if (offlineMsg) offlineMsg.style.display = 'block';
      }
    }

    [pollBtnW2, pollBtnW3, pollBtnDep].forEach(function (btn) {
      btn.addEventListener('click', function () {
        var choice = this.getAttribute('data-choice');
        castVote(choice);
      });
    });

    if (window.Aether && window.Aether.api && typeof window.Aether.api.get === 'function') {
      try {
        var res = await window.Aether.api.get('/api/compare/poll?poll=web2-vs-web3');
        if (res && res.ok && res.data) {
          renderPollCounts(res.data, null);
        } else {
          if (offlineMsg) offlineMsg.style.display = 'block';
          if (statusBadge) {
            statusBadge.textContent = 'Poll Offline';
            statusBadge.style.color = '';
          }
        }
      } catch (e) {
        if (offlineMsg) offlineMsg.style.display = 'block';
        if (statusBadge) {
          statusBadge.textContent = 'Poll Offline';
          statusBadge.style.color = '';
        }
      }
    } else {
      if (offlineMsg) offlineMsg.style.display = 'block';
    }
  }

  /**
   * "Who is in control" Hands-On Simulation
   */
  async function initControlSimulation() {
    // --- Web2 Panel ---
    var freezeToggle = document.getElementById('web2-freeze-toggle');
    var statusPill = document.getElementById('web2-demo-status-pill');
    var loginBtn = document.getElementById('btn-web2-demo-login');
    var feedback = document.getElementById('web2-login-feedback');

    function updateWeb2Status(frozen) {
      if (!statusPill) return;
      if (frozen) {
        statusPill.textContent = 'Frozen (403)';
        statusPill.style.color = '#EF4444';
        statusPill.style.background = 'rgba(239,68,68,0.15)';
      } else {
        statusPill.textContent = 'Active';
        statusPill.style.color = '#10B981';
        statusPill.style.background = 'rgba(16,185,129,0.15)';
      }
    }

    if (window.Aether && window.Aether.api && typeof window.Aether.api.get === 'function') {
      try {
        var stateRes = await window.Aether.api.get('/api/compare/demo-state');
        if (stateRes && stateRes.ok && stateRes.data) {
          var isFrozen = Boolean(stateRes.data.frozen);
          if (freezeToggle) freezeToggle.checked = isFrozen;
          updateWeb2Status(isFrozen);
        }
      } catch (e) {}
    }

    if (freezeToggle) {
      freezeToggle.addEventListener('change', async function () {
        var shouldFreeze = freezeToggle.checked;
        updateWeb2Status(shouldFreeze);

        if (window.Aether && window.Aether.api && typeof window.Aether.api.post === 'function') {
          try {
            var res = await window.Aether.api.post('/api/compare/demo-freeze', { frozen: shouldFreeze });
            if (res && res.ok) {
              if (window.Aether.showToast) {
                Aether.showToast(shouldFreeze ? 'Platform admin: demo account frozen.' : 'Platform admin: demo account unfrozen.');
              }
            } else if (res && res.error) {
              if (window.Aether.showToast) Aether.showToast(res.error);
            }
          } catch (e) {
            if (window.Aether.showToast) Aether.showToast('Could not update admin freeze state.');
          }
        }
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', async function () {
        if (!window.Aether || !window.Aether.api || typeof window.Aether.api.post !== 'function') {
          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.background = 'rgba(255,255,255,0.05)';
            feedback.style.color = 'var(--text-secondary)';
            feedback.style.border = '1px solid var(--border-line)';
            feedback.textContent = 'API client unavailable (Local simulation mode).';
          }
          return;
        }

        try {
          var res = await window.Aether.api.post('/api/compare/demo-login', {});
          if (feedback) feedback.style.display = 'block';

          if (res && res.ok) {
            feedback.style.background = 'rgba(16,185,129,0.1)';
            feedback.style.border = '1px solid rgba(16,185,129,0.3)';
            feedback.style.color = '#10B981';
            feedback.textContent = '✓ Logged in as demo_user. Centralized platform session active.';
          } else {
            feedback.style.background = 'rgba(239,68,68,0.1)';
            feedback.style.border = '1px solid rgba(239,68,68,0.3)';
            feedback.style.color = '#EF4444';
            var msg = (res && res.error) ? res.error : 'Account frozen by the platform (HTTP 403 Forbidden)';
            feedback.textContent = '✕ ' + msg + '. Platform administrator has revoked access.';
          }
        } catch (e) {
          if (feedback) {
            feedback.style.display = 'block';
            feedback.style.background = 'rgba(239,68,68,0.1)';
            feedback.style.border = '1px solid rgba(239,68,68,0.3)';
            feedback.style.color = '#EF4444';
            feedback.textContent = '✕ Login request failed.';
          }
        }
      });
    }

    // --- Web3 Panel ---
    var web3Display = document.getElementById('web3-wallet-account-display');
    var web3Btn = document.getElementById('btn-web3-demo-signin');
    var web3Feedback = document.getElementById('web3-auth-feedback');
    var web3Pill = document.getElementById('web3-demo-status-pill');

    function updateWeb3ControlState() {
      var auth = (window.Aether && window.Aether.Wallet && typeof window.Aether.Wallet.getAuthState === 'function')
        ? window.Aether.Wallet.getAuthState()
        : { isSignedIn: false, address: null };

      var walletState = (window.Aether && window.Aether.Wallet && typeof window.Aether.Wallet.getState === 'function')
        ? window.Aether.Wallet.getState()
        : { isConnected: false, address: null };

      if (auth.isSignedIn && auth.address) {
        if (web3Display) web3Display.textContent = auth.address;
        if (web3Pill) {
          web3Pill.textContent = 'Self-Custodied (Active)';
          web3Pill.style.color = '#10B981';
        }
        if (web3Feedback) {
          web3Feedback.innerHTML = '<strong>Cryptographically Verified:</strong> You signed in via ECDSA signature. The platform can verify your identity via <code>/api/auth/me</code>, but has no button to freeze your wallet.';
        }
        if (web3Btn) {
          web3Btn.innerHTML = '<span>Signed in as ' + auth.address.substring(0, 6) + '...' + auth.address.substring(auth.address.length - 4) + '</span>';
          web3Btn.disabled = true;
        }
      } else if (walletState.isConnected && walletState.address) {
        if (web3Display) web3Display.textContent = walletState.address;
        if (web3Pill) {
          web3Pill.textContent = 'Connected (Unsigned)';
          web3Pill.style.color = '';
        }
        if (web3Feedback) {
          web3Feedback.textContent = 'Wallet connected. Click below to sign in cryptographically.';
        }
        if (web3Btn) {
          web3Btn.innerHTML = '<span>Sign in with Wallet</span>';
          web3Btn.disabled = false;
        }
      } else {
        if (web3Display) web3Display.textContent = 'Not Signed In';
        if (web3Pill) {
          web3Pill.textContent = 'Self-Custodied';
          web3Pill.style.color = '';
        }
        if (web3Feedback) {
          web3Feedback.textContent = 'The platform can verify your signature but has no button to freeze your wallet.';
        }
        if (web3Btn) {
          web3Btn.innerHTML = '<span>Sign in with Wallet</span>';
          web3Btn.disabled = false;
        }
      }
    }

    updateWeb3ControlState();

    if (web3Btn) {
      web3Btn.addEventListener('click', async function () {
        if (!window.Aether || !window.Aether.Wallet) return;
        var walletState = window.Aether.Wallet.getState();
        if (!walletState.isConnected) {
          window.Aether.Wallet.connect();
          return;
        }
        await window.Aether.Wallet.signIn();
        updateWeb3ControlState();
      });
    }

    window.addEventListener('aether:walletState', updateWeb3ControlState);
    window.addEventListener('aether:authState', updateWeb3ControlState);
  }

  window.Aether.Compare = {
    init: init,
    setMode: setMode,
    getMode: function () { return currentMode; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
