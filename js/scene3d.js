/**
 * AETHER 3D & LIQUID AURORA ENGINE (v4 Dark Monochrome)
 * Features:
 * 1. Full-screen domain-warped fractal noise liquid aurora background (GLSL ShaderMaterial)
 * 2. 10 3D procedural crypto coins in brand colors (BTC, ETH, SOL, BNB, USDT, POL, LINK, DEX, Wallet, NFT)
 * 3. Faint network connection lines with traveling light pulses
 * 4. Interactive coin click with educational fact tooltips
 * 5. Scroll-reactive parallax, camera dolly, and 55+ FPS optimization
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isWebGLAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (prefersReducedMotion || !isWebGLAvailable() || typeof THREE === 'undefined') {
    document.documentElement.classList.add('no-webgl');
    console.info('[Aether 3D] WebGL disabled or reduced motion preferred.');
    return;
  }

  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  // Scene Globals
  var canvas, renderer, scene, camera;
  var clock = new THREE.Clock();
  var mouse = { x: 0, y: 0, targetX: 0, targetY: 0, screenX: 0, screenY: 0 };
  var scroll = { current: 0, target: 0, velocity: 0, lastScrollY: 0 };
  var isTabActive = true;
  var raycaster = new THREE.Raycaster();
  var mouseNDC = new THREE.Vector2(-999, -999);

  // Aurora Background Uniforms
  var auroraMaterial, auroraMesh;
  var flowDrift = {
    angle1: 0.4,
    angle2: 2.1,
    targetAngle1: 0.4,
    targetAngle2: 2.1,
    lastDriftTime: 0
  };

  // Coins & Network Lines Collection
  var coinsList = [];
  var networkLinesMesh, networkLinePoints = [];
  var activeTooltipCoin = null;

  // FPS Tracker
  var fpsTracker = {
    frames: 0,
    lastTime: performance.now(),
    currentFPS: 60
  };

  /**
   * Coin Educational Database
   */
  var COIN_DATA = [
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', fact: 'First blockchain cryptocurrency, launched in 2009 by Satoshi Nakamoto with a 21M hard cap.', radius: 4.6, orbitSpeed: 0.12, initialAngle: 0.3, yOffset: 1.2 },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', fact: 'Introduced Turing-complete smart contracts in 2015, powering dApps, DeFi, and NFTs.', radius: 4.8, orbitSpeed: -0.14, initialAngle: 2.2, yOffset: -1.0 },
    { id: 'sol', name: 'Solana', symbol: 'SOL', color: '#14F195', fact: 'High-speed layer-1 blockchain utilizing Proof-of-History for sub-second confirmations.', radius: 5.2, orbitSpeed: 0.11, initialAngle: 4.0, yOffset: 1.8 },
    { id: 'bnb', name: 'BNB', symbol: 'BNB', color: '#F3BA2F', fact: 'Native utility asset powering the decentralized BNB Chain ecosystem and trading discounts.', radius: 5.0, orbitSpeed: -0.13, initialAngle: 5.4, yOffset: -1.8 },
    { id: 'usdt', name: 'Tether', symbol: 'USDT', color: '#26A17B', fact: 'Fiat-backed stablecoin pegged 1:1 to the US Dollar, facilitating 24/7 global liquidity.', radius: 5.5, orbitSpeed: 0.09, initialAngle: 1.2, yOffset: -2.4 },
    { id: 'pol', name: 'Polygon', symbol: 'POL', color: '#8247E5', fact: 'Proof-of-Stake network providing fast, low-cost execution and ZK-rollup scaling.', radius: 4.2, orbitSpeed: 0.15, initialAngle: 3.1, yOffset: 2.2 },
    { id: 'link', name: 'Chainlink', symbol: 'LINK', color: '#2A5ADA', fact: 'Decentralized oracle network feeding real-world asset prices and tamper-proof data into smart contracts.', radius: 5.4, orbitSpeed: -0.10, initialAngle: 4.8, yOffset: 0.4 },
    { id: 'dex', name: 'DEX Protocol', symbol: 'DEX', color: '#A9AFBA', fact: 'Automated Market Maker: Trade peer-to-pool without centralized order books or custody risk.', radius: 4.0, orbitSpeed: 0.16, initialAngle: 1.8, yOffset: -0.2 },
    { id: 'wallet', name: 'Self-Custody', symbol: 'KEY', color: '#A9AFBA', fact: 'Cryptographic self-custody: "Not your keys, not your coins." You hold the private cryptographic proof.', radius: 5.1, orbitSpeed: -0.12, initialAngle: 2.8, yOffset: 1.1 },
    { id: 'nft', name: 'NFT Standard', symbol: 'NFT', color: '#A9AFBA', fact: 'Non-Fungible Token: Verifiable cryptographic uniqueness enabling digital property rights.', radius: 4.4, orbitSpeed: 0.14, initialAngle: 0.9, yOffset: -1.5 }
  ];

  /**
   * Procedural High-Res Coin Canvas Texture Generator
   */
  function createCoinTexture(coin) {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');

    // Dark graphite metallic base disc
    var grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 256);
    grad.addColorStop(0, '#1C1E26');
    grad.addColorStop(0.85, '#12141A');
    grad.addColorStop(1, '#0C0D12');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.fill();

    // Metallic Outer Rim & Bevel Line
    ctx.strokeStyle = coin.color;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(256, 256, 235, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 215, 0, Math.PI * 2);
    ctx.stroke();

    // Central Brand Mark / Geometric Glyph
    ctx.save();
    ctx.translate(256, 256);

    if (coin.id === 'btc') {
      ctx.fillStyle = coin.color;
      ctx.font = 'bold 220px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₿', 8, 0);
    } else if (coin.id === 'eth') {
      // Ethereum Diamond
      ctx.fillStyle = coin.color;
      ctx.beginPath();
      ctx.moveTo(0, -110);
      ctx.lineTo(65, -5);
      ctx.lineTo(0, 30);
      ctx.lineTo(-65, -5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#92A8FC';
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(65, 12);
      ctx.lineTo(0, 110);
      ctx.lineTo(-65, 12);
      ctx.closePath();
      ctx.fill();
    } else if (coin.id === 'sol') {
      // Solana Slanted Bars
      var solGrad = ctx.createLinearGradient(-80, -80, 80, 80);
      solGrad.addColorStop(0, '#9945FF');
      solGrad.addColorStop(1, '#14F195');
      ctx.fillStyle = solGrad;

      function drawSolBar(y) {
        ctx.beginPath();
        ctx.moveTo(-75, y);
        ctx.lineTo(60, y);
        ctx.lineTo(75, y + 26);
        ctx.lineTo(-60, y + 26);
        ctx.closePath();
        ctx.fill();
      }
      drawSolBar(-65);
      drawSolBar(-13);
      drawSolBar(39);
    } else if (coin.id === 'bnb') {
      // BNB Diamond Cluster
      ctx.fillStyle = coin.color;
      function drawDiamond(cx, cy, s) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s, cy);
        ctx.lineTo(cx, cy + s);
        ctx.lineTo(cx - s, cy);
        ctx.closePath();
        ctx.fill();
      }
      drawDiamond(0, 0, 38);
      drawDiamond(0, -68, 24);
      drawDiamond(0, 68, 24);
      drawDiamond(-68, 0, 24);
      drawDiamond(68, 0, 24);
    } else if (coin.id === 'usdt') {
      // Tether T
      ctx.fillStyle = coin.color;
      ctx.fillRect(-70, -75, 140, 32);
      ctx.fillRect(-18, -75, 36, 150);
      ctx.strokeStyle = coin.color;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(0, 10, 80, 42, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (coin.id === 'pol') {
      // Polygon Hexagon
      ctx.strokeStyle = coin.color;
      ctx.lineWidth = 26;
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = (i * Math.PI) / 3;
        var hx = Math.cos(a) * 80;
        var hy = Math.sin(a) * 80;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (coin.id === 'link') {
      // Chainlink Hexagon
      ctx.strokeStyle = coin.color;
      ctx.lineWidth = 28;
      ctx.beginPath();
      for (var j = 0; j < 6; j++) {
        var ang = (j * Math.PI) / 3 - Math.PI / 6;
        var lx = Math.cos(ang) * 85;
        var ly = Math.sin(ang) * 85;
        if (j === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (coin.id === 'dex') {
      // DEX Swap Arrows
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 65, 0.2 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 65, 1.2 * Math.PI, 1.9 * Math.PI);
      ctx.stroke();
    } else if (coin.id === 'wallet') {
      // Wallet glyph
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 16;
      ctx.strokeRect(-65, -45, 130, 90);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(28, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // NFT Diamond Gem
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 16;
      ctx.strokeRect(-55, -55, 110, 110);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    var tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = true;
    return tex;
  }

  /**
   * GLSL Shaders for Domain-Warped Liquid Aurora Background
   */
  var AURORA_VERTEX_SHADER = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = vec4(position, 1.0);',
    '}'
  ].join('\n');

  var AURORA_FRAGMENT_SHADER = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform float uTime;',
    'uniform float uScroll;',
    'uniform float uScrollVelocity;',
    'uniform vec2 uResolution;',
    'uniform float uWarpAngle1;',
    'uniform float uWarpAngle2;',

    '// Smooth low-frequency value noise (no sharp ridge lines)',
    'float hash(vec2 p) {',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',

    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i);',
    '  float b = hash(i + vec2(1.0, 0.0));',
    '  float c = hash(i + vec2(0.0, 1.0));',
    '  float d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',

    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.55;',
    '  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);',
    '  for (int i = 0; i < 3; ++i) {',
    '    v += a * noise(p);',
    '    p = rot * p * 1.85;',
    '    a *= 0.45;',
    '  }',
    '  return v;',
    '}',

    'void main() {',
    '  // Normalized aspect ratio from vUv (100% viewport span, ZERO seams regardless of DPI scaling)',
    '  float aspect = uResolution.x / max(uResolution.y, 1.0);',
    '  vec2 st = (vUv - 0.5) * vec2(aspect, 1.0) * 1.5;',
    '',
    '  // Scroll push and velocity reaction',
    '  float scrollPush = uScrollVelocity * 0.035;',
    '  st.y += uScroll * 0.45 + scrollPush;',
    '',
    '  // Slow, serene natural drift',
    '  vec2 dir1 = vec2(cos(uWarpAngle1), sin(uWarpAngle1));',
    '  vec2 dir2 = vec2(cos(uWarpAngle2), sin(uWarpAngle2));',
    '  float t = uTime * 0.022;',
    '',
    '  // Smooth domain-warped liquid smoke flow',
    '  vec2 q = vec2(',
    '    fbm(st * 0.72 + dir1 * t),',
    '    fbm(st * 0.72 + dir2 * t + vec2(3.1, 1.7))',
    '  );',
    '',
    '  vec2 r = vec2(',
    '    fbm(st * 0.82 + 1.25 * q + dir2 * (t * 0.65) + vec2(1.4, 4.3)),',
    '    fbm(st * 0.82 + 1.25 * q + dir1 * (t * 0.65) + vec2(7.2, 2.8))',
    '  );',
    '',
    '  // Low contrast, completely smooth flow with no sharp ridge lines',
    '  float n = fbm(st * 0.9 + 1.35 * r);',
    '  n = smoothstep(0.18, 0.78, n);',
    '',
    '  // Edge vignette computed strictly from vUv (spans full viewport)',
    '  float vigX = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);',
    '  float vigY = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);',
    '  float vignette = clamp(pow(vigX * vigY, 0.35), 0.3, 1.0);',
    '',
    '  // Palette: black (#050506) to graphite (#16181D) to soft silver highlights (#2A2D35)',
    '  vec3 blackBase = vec3(0.02, 0.02, 0.024);',
    '  vec3 graphite = vec3(0.075, 0.082, 0.095);',
    '  vec3 silverHighlight = vec3(0.165, 0.175, 0.195);',
    '',
    '  vec3 col = mix(blackBase, graphite, n);',
    '  col = mix(col, silverHighlight, pow(n, 2.5) * 0.65);',
    '  col *= vignette;',
    '',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /**
   * Build Full-Screen Liquid Aurora Quad
   */
  function buildAuroraBackground() {
    var quadGeo = new THREE.PlaneGeometry(2, 2);
    auroraMaterial = new THREE.ShaderMaterial({
      vertexShader: AURORA_VERTEX_SHADER,
      fragmentShader: AURORA_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uScrollVelocity: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uWarpAngle1: { value: flowDrift.angle1 },
        uWarpAngle2: { value: flowDrift.angle2 }
      },
      depthWrite: false,
      depthTest: false
    });

    auroraMesh = new THREE.Mesh(quadGeo, auroraMaterial);
    auroraMesh.renderOrder = -1; // Draw first behind everything
    scene.add(auroraMesh);
  }

  /**
   * Build 3D Crypto Coins with Lathe/Cylinder Geometry & Canvas Texture
   * Sized ~2x larger with soft rim lighting and crisp brand marks
   */
  function buildCryptoCoins() {
    var isLearnPage = document.querySelector('.learn-page') !== null;
    if (isLearnPage) return; // On learn page, the 6-block chain takes the 3D focus

    var coinGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.28, 64);
    var isSmall = (isMobile || window.innerWidth < 768);
    var activeCoins = isSmall ? COIN_DATA.slice(0, 3) : COIN_DATA;

    activeCoins.forEach(function (data) {
      var faceTex = createCoinTexture(data);

      var edgeMat = new THREE.MeshStandardMaterial({
        color: 0x22252D,
        roughness: 0.28,
        metalness: 0.72
      });

      var faceMat = new THREE.MeshStandardMaterial({
        map: faceTex,
        roughness: 0.30,
        metalness: 0.65,
        color: 0xFFFFFF
      });

      // Face materials: [edge, top, bottom]
      var materials = [edgeMat, faceMat, faceMat];
      var mesh = new THREE.Mesh(coinGeo, materials);
      if (isSmall) {
        mesh.scale.set(0.65, 0.65, 0.65);
      }

      mesh.userData = {
        data: data,
        angle: data.initialAngle,
        radius: isSmall ? data.radius * 0.8 : data.radius,
        orbitSpeed: data.orbitSpeed,
        yOffset: data.yOffset,
        targetPos: new THREE.Vector3(),
        isHovered: false
      };

      coinsList.push(mesh);
      scene.add(mesh);
    });

    // Build Connecting Network Lines
    var lineMat = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.12
    });

    var maxLines = 16;
    var linePositions = new Float32Array(maxLines * 6);
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    networkLinesMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(networkLinesMesh);
  }

  /**
   * Update Network Connecting Lines between Nearby Coins
   */
  function updateNetworkLines() {
    if (!networkLinesMesh) return;
    var posAttr = networkLinesMesh.geometry.attributes.position;
    var lineIdx = 0;
    var maxDist = 4.8;

    for (var i = 0; i < coinsList.length; i++) {
      for (var j = i + 1; j < coinsList.length; j++) {
        if (lineIdx >= posAttr.count) break;

        var c1 = coinsList[i].position;
        var c2 = coinsList[j].position;
        var dist = c1.distanceTo(c2);

        if (dist < maxDist && coinsList[i].visible && coinsList[j].visible) {
          posAttr.setXYZ(lineIdx, c1.x, c1.y, c1.z);
          posAttr.setXYZ(lineIdx + 1, c2.x, c2.y, c2.z);
          lineIdx += 2;
        }
      }
    }

    // Clear unused lines
    for (var k = lineIdx; k < posAttr.count; k++) {
      posAttr.setXYZ(k, 0, 0, 0);
    }
    posAttr.needsUpdate = true;
  }

  function getOptimalPixelRatio() {
    var maxPr = window.innerWidth < 768 ? 1.5 : 2.0;
    return Math.min(window.devicePixelRatio || 1, maxPr);
  }

  /**
   * Initialize Three.js Scene, Camera, Lights, and Renderer
   */
  function initScene() {
    canvas = document.getElementById('scene3d');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'scene3d';
      document.body.prepend(canvas);
    }

    var width = window.innerWidth;
    var height = window.innerHeight;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(getOptimalPixelRatio());
      renderer.setSize(width, height, true);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch (e) {
      if (canvas) canvas.style.display = 'none';
      return;
    }

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    // Studio Lighting + Soft Rim Lighting
    var ambient = new THREE.AmbientLight(0xFFFFFF, 0.9);
    scene.add(ambient);

    var dirLight1 = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    dirLight1.position.set(6, 8, 7);
    scene.add(dirLight1);

    var dirLight2 = new THREE.DirectionalLight(0x9EA3AE, 0.9);
    dirLight2.position.set(-6, -4, 5);
    scene.add(dirLight2);

    // Soft Rim Light from behind to make coins read cleanly against dark background
    var rimLight1 = new THREE.DirectionalLight(0xE2E8F0, 1.8);
    rimLight1.position.set(-8, 7, -8);
    scene.add(rimLight1);

    var rimLight2 = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    rimLight2.position.set(8, -6, -6);
    scene.add(rimLight2);

    buildAuroraBackground();
    buildCryptoCoins();
    buildLearnBlocksChain();
    initTooltipElement();
  }

  /**
   * 3D Moment for learn.html: 6 Glowing Chain Blocks in Background
   */
  var learnBlocksList = [];
  var learnChainMesh = null;

  function buildLearnBlocksChain() {
    var isLearnPage = document.querySelector('.learn-page') !== null;
    if (!isLearnPage) return;

    var blockGeo = new THREE.BoxGeometry(0.72, 0.72, 0.72);
    var numBlocks = 6;
    var startY = 3.6;
    var stepY = 1.4;
    var chainX = 6.2; // side gutter
    var linePoints = [];

    for (var i = 0; i < numBlocks; i++) {
      var mat = new THREE.MeshStandardMaterial({
        color: 0x1A1C24,
        roughness: 0.35,
        metalness: 0.65,
        emissive: 0x111318
      });

      var edges = new THREE.EdgesGeometry(blockGeo);
      var lineMat = new THREE.LineBasicMaterial({ color: 0x555A66, transparent: true, opacity: 0.4 });
      var wireframe = new THREE.LineSegments(edges, lineMat);

      var mesh = new THREE.Mesh(blockGeo, mat);
      mesh.add(wireframe);
      mesh.position.set(chainX, startY - (i * stepY), 0.5);

      mesh.userData = {
        index: i,
        baseY: startY - (i * stepY),
        mat: mat,
        lineMat: lineMat
      };

      learnBlocksList.push(mesh);
      scene.add(mesh);
      linePoints.push(new THREE.Vector3(chainX, startY - (i * stepY), 0.5));
    }

    var chainLineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    var chainLineMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.16 });
    learnChainMesh = new THREE.Line(chainLineGeo, chainLineMat);
    scene.add(learnChainMesh);
  }

  function highlightLearnBlock(activeIdx) {
    if (!learnBlocksList.length) return;
    learnBlocksList.forEach(function (block, idx) {
      if (idx === activeIdx) {
        block.userData.mat.emissive.setHex(0x999999);
        block.userData.mat.color.setHex(0xFFFFFF);
        block.userData.lineMat.color.setHex(0xFFFFFF);
        block.userData.lineMat.opacity = 0.95;
        block.scale.lerp(new THREE.Vector3(1.25, 1.25, 1.25), 0.18);
      } else {
        block.userData.mat.emissive.setHex(0x111318);
        block.userData.mat.color.setHex(0x1A1C24);
        block.userData.lineMat.color.setHex(0x555A66);
        block.userData.lineMat.opacity = 0.35;
        block.scale.lerp(new THREE.Vector3(0.9, 0.9, 0.9), 0.12);
      }
    });
  }

  /**
   * Coin Click Tooltip Element
   */
  var tooltipEl;
  function initTooltipElement() {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'coin-tooltip-card';
    tooltipEl.innerHTML = [
      '<div class="coin-tooltip-title"><span id="tip-symbol" style="color:#FFF;"></span> <span id="tip-name"></span></div>',
      '<p class="coin-tooltip-fact" id="tip-fact"></p>'
    ].join('');
    document.body.appendChild(tooltipEl);

    // Window click outside closes tooltip
    window.addEventListener('click', function (e) {
      if (!e.target.closest('#scene3d') && activeTooltipCoin) {
        hideTooltip();
      }
    });
  }

  function showTooltip(coinData, clientX, clientY) {
    if (!tooltipEl) return;
    document.getElementById('tip-symbol').textContent = coinData.symbol;
    document.getElementById('tip-symbol').style.color = coinData.color;
    document.getElementById('tip-name').textContent = coinData.name;
    document.getElementById('tip-fact').textContent = coinData.fact;

    tooltipEl.style.left = clientX + 'px';
    tooltipEl.style.top = clientY + 'px';
    tooltipEl.classList.add('is-visible');
    activeTooltipCoin = coinData;
  }

  function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.classList.remove('is-visible');
    activeTooltipCoin = null;
  }

  /**
   * Raycast on click to detect coin interactions
   */
  function onPointerClick(e) {
    if (e.target && e.target.closest('button, a, input, select, textarea, .ring-card, .marquee-card, .token-bento-card, .block-tx-item, [role="button"]')) {
      return;
    }

    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseNDC, camera);
    var intersects = raycaster.intersectObjects(coinsList);

    if (intersects.length > 0) {
      var hitCoin = intersects[0].object;
      showTooltip(hitCoin.userData.data, e.clientX, e.clientY);
      // Accelerate spin on click
      hitCoin.userData.orbitSpeed *= 2.5;
      setTimeout(function () {
        hitCoin.userData.orbitSpeed = hitCoin.userData.data.orbitSpeed;
      }, 1200);
    } else {
      hideTooltip();
    }
  }

  /**
   * Smoothly Drift Flow Direction every 8-15 seconds
   */
  function updateFlowDrift(time) {
    if (time - flowDrift.lastDriftTime > 11.0) {
      flowDrift.targetAngle1 = Math.random() * Math.PI * 2;
      flowDrift.targetAngle2 = Math.random() * Math.PI * 2;
      flowDrift.lastDriftTime = time;
    }

    flowDrift.angle1 += (flowDrift.targetAngle1 - flowDrift.angle1) * 0.02;
    flowDrift.angle2 += (flowDrift.targetAngle2 - flowDrift.angle2) * 0.02;

    if (auroraMaterial) {
      auroraMaterial.uniforms.uWarpAngle1.value = flowDrift.angle1;
      auroraMaterial.uniforms.uWarpAngle2.value = flowDrift.angle2;
    }
  }

  /**
   * Render Loop (55+ FPS Target)
   */
  function animate() {
    if (!isTabActive) return;

    requestAnimationFrame(animate);

    var delta = clock.getDelta();
    var elapsedTime = clock.getElapsedTime();

    // FPS Measurement
    var now = performance.now();
    fpsTracker.frames++;
    if (now - fpsTracker.lastTime >= 1000) {
      fpsTracker.currentFPS = Math.round((fpsTracker.frames * 1000) / (now - fpsTracker.lastTime));
      fpsTracker.frames = 0;
      fpsTracker.lastTime = now;
    }

    // Scroll calculations
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var scrollProgress = docHeight > 0 ? scrollY / docHeight : 0;

    scroll.velocity = (scrollY - scroll.lastScrollY) * 0.1;
    scroll.lastScrollY = scrollY;
    scroll.current += (scrollProgress - scroll.current) * 0.08;

    // Update Aurora Uniforms
    if (auroraMaterial) {
      auroraMaterial.uniforms.uTime.value = elapsedTime;
      auroraMaterial.uniforms.uScroll.value = scroll.current;
      auroraMaterial.uniforms.uScrollVelocity.value = scroll.velocity;
      updateFlowDrift(elapsedTime);
    }

    // Camera Dolly on Scroll & Parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;

    camera.position.x = mouse.x * 0.5;
    camera.position.y = mouse.y * 0.35;
    camera.position.z = 11.0 + scroll.current * 2.5; // subtle camera dolly
    camera.lookAt(0, 0, 0);

    // Update Floating Orbiting Coins
    var vHeight = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    var vWidth = vHeight * camera.aspect;

    // Check data-scene-slot="coin" anchor element
    var coinSlotEl = document.querySelector('[data-scene-slot="coin"]');
    var slotWorldPos = null;
    if (coinSlotEl) {
      var rect = coinSlotEl.getBoundingClientRect();
      // Keep strictly within section bounds and below the top floating navbar
      if (rect.top >= 75 && rect.bottom <= window.innerHeight + 80) {
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        var ndcX = (centerX / window.innerWidth) * 2 - 1;
        var ndcY = -(centerY / window.innerHeight) * 2 + 1;
        var targetZ = 3.6;
        var vec = new THREE.Vector3(ndcX, ndcY, 0.5);
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        var dist = (targetZ - camera.position.z) / vec.z;
        slotWorldPos = camera.position.clone().add(vec.multiplyScalar(dist));
      }
    }

    coinsList.forEach(function (coin, idx) {
      var u = coin.userData;
      u.angle += u.orbitSpeed * delta * 0.8;

      var targetX, targetY, targetZ;

      // Dock the 2nd coin (Ethereum #627EEA) or 1st coin into data-scene-slot="coin" when visible
      if (slotWorldPos && idx === 1) {
        targetX = slotWorldPos.x;
        targetY = slotWorldPos.y;
        targetZ = slotWorldPos.z;
        // Scale to fit slot comfortably
        coin.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.12);
      } else {
        coin.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);

        // Keep coins in side gutters and outer gaps so cards and centered text never hide them
        var horizontalRadius = (vWidth * 0.44) + Math.sin(elapsedTime * 0.5 + idx) * 0.35;
        var verticalRadius = 3.2 + Math.cos(elapsedTime * 0.45 + idx) * 0.4;

        targetX = Math.cos(u.angle) * horizontalRadius;
        targetY = Math.sin(u.angle) * verticalRadius + (u.yOffset * 0.4);
        targetZ = Math.sin(u.angle * 2.0) * 1.5 - (scroll.current * 4.5); // coins drift with scroll

        // Cursor repel/attract effect
        var dx = targetX - (mouse.x * (vWidth / 2));
        var dy = targetY - (mouse.y * (vHeight / 2));
        var distToMouse = Math.sqrt(dx * dx + dy * dy);
        if (distToMouse < 3.5) {
          var repel = (3.5 - distToMouse) * 0.28;
          targetX += (dx / distToMouse) * repel;
          targetY += (dy / distToMouse) * repel;
        }
      }

      // Smooth position lerp
      coin.position.x += (targetX - coin.position.x) * 0.1;
      coin.position.y += (targetY - coin.position.y) * 0.1;
      coin.position.z += (targetZ - coin.position.z) * 0.1;

      // Tumble & spin
      coin.rotation.y += delta * (0.8 + idx * 0.05);
      coin.rotation.x = Math.sin(elapsedTime * 0.8 + idx) * 0.3 + (mouse.y * 0.3);
      coin.rotation.z = Math.cos(elapsedTime * 0.6 + idx) * 0.2;
    });

    // Animate glowing chain blocks on learn page
    if (learnBlocksList.length > 0) {
      learnBlocksList.forEach(function (block, idx) {
        block.rotation.y += delta * 0.45;
        block.rotation.x = Math.sin(elapsedTime * 0.6 + idx) * 0.2;
        block.position.y = block.userData.baseY + Math.sin(elapsedTime * 0.8 + idx) * 0.08 - (scroll.current * 1.5);
      });
    }

    updateNetworkLines();
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    if (!renderer || !camera) return;
    var w = window.innerWidth;
    var h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(getOptimalPixelRatio());
    renderer.setSize(w, h, true);

    if (auroraMaterial) {
      auroraMaterial.uniforms.uResolution.value.set(w, h);
    }
  }

  function onPointerMove(e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.screenX = e.clientX;
    mouse.screenY = e.clientY;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      isTabActive = false;
    } else {
      if (!isTabActive) {
        isTabActive = true;
        clock.getDelta();
        requestAnimationFrame(animate);
      }
    }
  }

  function init() {
    if (typeof window !== 'undefined') {
      var isMobile = window.innerWidth < 768 || (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches);
      var isHomeOrLearn = (function () {
        var p = window.location.pathname;
        var name = p.substring(p.lastIndexOf('/') + 1).toLowerCase();
        return !name || name === '' || name === 'index.html' || name === 'learn.html' || Boolean(document.querySelector('.learn-page, .hero-v4'));
      })();

      if (isMobile && !isHomeOrLearn) {
        document.documentElement.classList.add('no-webgl');
        return;
      }
    }
    initScene();
    window.addEventListener('resize', onWindowResize, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('click', onPointerClick);
    document.addEventListener('visibilitychange', onVisibilityChange);
    animate();
  }

  function triggerSuccessEffect() {
    if (!renderer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (coinsList && coinsList.length > 0) {
      var coin = coinsList[Math.floor(Math.random() * coinsList.length)];
      if (coin) {
        var startRot = coin.rotation.y;
        var startTime = performance.now();
        function spin(now) {
          var progress = (now - startTime) / 600;
          if (progress < 1) {
            coin.rotation.y = startRot + Math.PI * 4 * Math.sin(progress * Math.PI * 0.5);
            requestAnimationFrame(spin);
          }
        }
        requestAnimationFrame(spin);
      }
    }
  }

  window.Aether.scene3d = {
    init: init,
    getScene: function () { return scene; },
    getCamera: function () { return camera; },
    getRenderer: function () { return renderer; },
    getFPS: function () { return fpsTracker.currentFPS; },
    highlightLearnBlock: highlightLearnBlock,
    triggerSuccessEffect: triggerSuccessEffect
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
