/**
 * AETHER METAMASK WEB3 WALLET INTEGRATION (v2)
 * Supports Ethereum Mainnet (0x1), Sepolia (0xaa36a7), Polygon (0x89), Polygon Amoy (0x13882).
 * Default state: Disconnected ("Connect Wallet"). Demo simulation only triggers
 * upon user click if no MetaMask extension is detected.
 * Includes cryptographic sign-in with Aether backend API (SIWE-inspired).
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  // Supported EVM Networks (Omitting deprecated Mumbai)
  var NETWORKS = {
    '0x1': {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      shortName: 'Ethereum',
      currency: 'ETH',
      rpcUrls: ['https://cloudflare-eth.com'],
      blockExplorer: 'https://etherscan.io'
    },
    '0xaa36a7': {
      chainId: '0xaa36a7',
      name: 'Sepolia Testnet',
      shortName: 'Sepolia',
      currency: 'SepoliaETH',
      rpcUrls: ['https://rpc.sepolia.org'],
      blockExplorer: 'https://sepolia.etherscan.io'
    },
    '0x89': {
      chainId: '0x89',
      name: 'Polygon Mainnet',
      shortName: 'Polygon',
      currency: 'POL',
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorer: 'https://polygonscan.com'
    },
    '0x13882': {
      chainId: '0x13882',
      name: 'Polygon Amoy Testnet',
      shortName: 'Amoy',
      currency: 'POL',
      rpcUrls: ['https://rpc-amoy.polygon.technology'],
      blockExplorer: 'https://amoy.polygonscan.com'
    }
  };

  // Internal State (Default: Disconnected)
  var state = {
    isConnected: false,
    isDemoMode: false,
    address: null,
    chainId: '0x1',
    balance: '0.0000',
    isConnecting: false
  };

  // Auth State
  var authState = {
    isSignedIn: false,
    address: null,
    isSigningIn: false
  };

  var DEMO_ACCOUNT = {
    address: '0x71C8A3674e7d95362a74c20f1F424560aA5649b2',
    balance: '2.4500',
    chainId: '0x1'
  };

  function truncateAddress(addr) {
    if (!addr) return '';
    return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
  }

  function generateIdenticonSvg(addr) {
    if (!addr) return '';
    var hash = 0;
    for (var i = 0; i < addr.length; i++) {
      hash = addr.charCodeAt(i) + ((hash << 5) - hash);
    }
    var c1 = '#' + ((hash & 0x00ffffff).toString(16).padStart(6, '0'));
    var c2 = '#' + (((hash >> 4) & 0x00ffffff).toString(16).padStart(6, '0'));
    var c3 = '#' + (((hash >> 8) & 0x00ffffff).toString(16).padStart(6, '0'));

    return '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style="border-radius:50%; vertical-align:middle;">' +
      '<rect width="20" height="20" fill="' + c1 + '"/>' +
      '<circle cx="6" cy="6" r="4" fill="' + c2 + '"/>' +
      '<rect x="9" y="9" width="8" height="8" rx="2" fill="' + c3 + '"/>' +
      '</svg>';
  }

  function formatEthBalance(hexBalance) {
    if (!hexBalance) return '0.0000';
    try {
      var wei = BigInt(hexBalance);
      var divisor = BigInt(100000000000000);
      var ethDec = Number(wei / divisor) / 10000;
      return ethDec.toFixed(4);
    } catch (e) {
      return '0.0000';
    }
  }

  function injectWalletModal() {
    if (document.getElementById('wallet-modal-container')) return;

    var container = document.createElement('div');
    container.id = 'wallet-modal-container';
    container.innerHTML = [
      '<div class="wallet-modal-backdrop" id="wallet-modal-backdrop"></div>',
      '<div class="wallet-modal" id="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-modal-title">',
      '  <div class="wallet-modal__header">',
      '    <h3 id="wallet-modal-title" style="font-size:1.15rem; margin:0; font-family:var(--font-display); color:#FFFFFF;">Web3 Wallet</h3>',
      '    <button class="wallet-modal__close" id="wallet-modal-close-btn" aria-label="Close modal">',
      '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      '    </button>',
      '  </div>',
      '  <div class="wallet-modal__content">',
      '',
      '    <!-- 1. Disconnected State View -->',
      '    <div id="wallet-unconnected-view">',
      '      <div style="text-align:center; padding:var(--space-md) 0 var(--space-lg);">',
      '        <div style="width:54px; height:54px; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid var(--border-line); display:inline-flex; align-items:center; justify-content:center; color:#FFFFFF; margin-bottom:var(--space-sm);">',
      '          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>',
      '        </div>',
      '        <h4 id="wallet-detect-heading" style="color:#FFFFFF; font-size:var(--text-lg); margin-bottom:6px;">Connect a Web3 Wallet</h4>',
      '        <p id="wallet-detect-desc" style="font-size:var(--text-xs); color:var(--text-secondary); max-width:340px; margin:0 auto var(--space-lg); line-height:1.5;">Connect MetaMask to interact with decentralized networks, or launch our interactive simulation.</p>',
      '        <div style="display:flex; flex-direction:column; gap:var(--space-sm); max-width:320px; margin:0 auto;">',
      '          <button class="btn btn--primary btn--md btn-magnetic" id="btn-connect-real-wallet" style="justify-content:center;">',
      '            <span>Connect with MetaMask</span>',
      '          </button>',
      '          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" class="btn btn--secondary btn--md" id="btn-install-metamask" style="justify-content:center; display:none;">',
      '            <span>Install MetaMask &rarr;</span>',
      '          </a>',
      '          <button class="btn btn--secondary btn--md btn-magnetic" id="btn-activate-demo-wallet" style="justify-content:center;">',
      '            <span>Try demo wallet (Simulation)</span>',
      '          </button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '',
      '    <!-- 2. Connected State View -->',
      '    <div id="wallet-connected-view" style="display:none;">',
      '      <!-- Simulation Mode Alert -->',
      '      <div class="demo-mode-alert" id="demo-mode-alert" style="display:none; margin-bottom:var(--space-md); padding:10px 12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.15); border-radius:var(--radius-sm); font-size:var(--text-xs); color:var(--text-secondary); align-items:center; gap:8px;">',
      '        <span style="padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.15); color:#FFFFFF; font-weight:700; font-family:var(--font-mono);">Demo</span>',
      '        <span>Running in simulated sandbox. No real funds used.</span>',
      '      </div>',
      '',
      '      <!-- Active Wallet Card -->',
      '      <div class="wallet-card-info" id="wallet-card-info">',
      '        <div class="wallet-address-row">',
      '          <div style="display:flex; align-items:center; gap:8px;">',
      '            <div id="modal-identicon"></div>',
      '            <span class="wallet-address-text" id="modal-address-text">0x...</span>',
      '          </div>',
      '          <button class="wallet-copy-btn" id="modal-copy-address-btn" title="Copy Address">Copy</button>',
      '        </div>',
      '        <div class="wallet-balance-row">',
      '          <span style="font-size:var(--text-xs); color:var(--text-tertiary);">Balance</span>',
      '          <div>',
      '            <span class="wallet-balance-amount" id="modal-balance-amount">0.0000</span>',
      '            <span style="font-size:var(--text-sm); font-weight:600; color:var(--text-secondary); margin-left:4px;" id="modal-currency-symbol">ETH</span>',
      '          </div>',
      '        </div>',
      '      </div>',
      '',
      '      <!-- Backend Sign In Section in Modal -->',
      '      <div id="modal-auth-section" style="margin-bottom:var(--space-md); padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border-line); border-radius:var(--radius-sm);">',
      '        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">',
      '          <span style="font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-secondary);">Aether Account</span>',
      '          <span id="modal-auth-badge" class="cache-time-badge" style="font-size:0.65rem;">Not Signed In</span>',
      '        </div>',
      '        <div id="modal-auth-unsigned">',
      '          <p id="modal-auth-desc" style="font-size:var(--text-xs); color:var(--text-tertiary); margin:0 0 8px 0; line-height:1.4;">Verify account ownership via gasless signature.</p>',
      '          <button type="button" class="btn btn--primary btn--xs" id="btn-modal-signin" style="width:100%; justify-content:center;">',
      '            <span>Sign in to Aether</span>',
      '          </button>',
      '          <div id="modal-auth-demo-note" style="display:none; font-size:var(--text-xs); color:#F59E0B; margin-top:4px;">Demo wallet cannot sign in (MetaMask required).</div>',
      '        </div>',
      '        <div id="modal-auth-signed" style="display:none;">',
      '          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">',
      '            <span id="modal-auth-signed-text" style="font-size:var(--text-xs); font-weight:600; color:#10B981;">Signed in as 0x...</span>',
      '            <button type="button" class="btn btn--secondary btn--xs" id="btn-modal-signout">Sign Out</button>',
      '          </div>',
      '          <small style="display:block; margin-top:4px; font-size:0.68rem; color:var(--text-tertiary);">Sign out clears token; wallet stays connected in MetaMask.</small>',
      '        </div>',
      '      </div>',
      '',
      '      <!-- Switch Network Section -->',
      '      <div style="margin-bottom:var(--space-md);">',
      '        <label style="font-size:var(--text-xs); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-secondary); display:block; margin-bottom:6px;">Select Network</label>',
      '        <div class="network-selector-grid">',
      '          <button class="network-select-btn" data-chain-id="0x1">',
      '            <span style="width:8px; height:8px; border-radius:50%; background:#627EEA;"></span> Ethereum',
      '          </button>',
      '          <button class="network-select-btn" data-chain-id="0xaa36a7">',
      '            <span style="width:8px; height:8px; border-radius:50%; background:#F6851B;"></span> Sepolia',
      '          </button>',
      '          <button class="network-select-btn" data-chain-id="0x89">',
      '            <span style="width:8px; height:8px; border-radius:50%; background:#8247E5;"></span> Polygon',
      '          </button>',
      '          <button class="network-select-btn" data-chain-id="0x13882">',
      '            <span style="width:8px; height:8px; border-radius:50%; background:#A855F7;"></span> Amoy Testnet',
      '          </button>',
      '        </div>',
      '      </div>',
      '',
      '      <!-- Actions Row -->',
      '      <div style="display:flex; gap:var(--space-xs); margin-top:var(--space-xs);">',
      '        <a href="wallet.html" class="btn btn--secondary btn--sm" style="flex:1; justify-content:center;">Wallet Safety Guide</a>',
      '        <button class="btn btn--ghost btn--sm" id="modal-disconnect-btn" style="color:#E11D48;">Disconnect</button>',
      '      </div>',
      '    </div>',
      '',
      '  </div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(container);
    bindModalEvents();
  }

  function bindModalEvents() {
    var modal = document.getElementById('wallet-modal');
    var backdrop = document.getElementById('wallet-modal-backdrop');
    var closeBtn = document.getElementById('wallet-modal-close-btn');
    var disconnectBtn = document.getElementById('modal-disconnect-btn');
    var copyBtn = document.getElementById('modal-copy-address-btn');
    var networkBtns = document.querySelectorAll('.network-select-btn');
    var connectRealBtn = document.getElementById('btn-connect-real-wallet');
    var demoWalletBtn = document.getElementById('btn-activate-demo-wallet');
    var modalSignInBtn = document.getElementById('btn-modal-signin');
    var modalSignOutBtn = document.getElementById('btn-modal-signout');

    if (backdrop) backdrop.addEventListener('click', closeWalletModal);
    if (closeBtn) closeBtn.addEventListener('click', closeWalletModal);

    if (connectRealBtn) {
      connectRealBtn.addEventListener('click', function () {
        connectWallet();
      });
    }

    if (demoWalletBtn) {
      demoWalletBtn.addEventListener('click', function () {
        activateDemoMode();
      });
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', function () {
        disconnectWallet();
        closeWalletModal();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (state.address) {
          navigator.clipboard.writeText(state.address).then(function () {
            Aether.showToast('Address copied to clipboard!');
          }).catch(function () {
            Aether.showToast('Copied: ' + state.address);
          });
        }
      });
    }

    if (modalSignInBtn) {
      modalSignInBtn.addEventListener('click', function () {
        signInToAether();
      });
    }

    if (modalSignOutBtn) {
      modalSignOutBtn.addEventListener('click', function () {
        signOutFromAether();
      });
    }

    networkBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetChainId = this.getAttribute('data-chain-id');
        switchNetwork(targetChainId);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeWalletModal();
      }
    });
  }

  function openWalletModal() {
    var modal = document.getElementById('wallet-modal');
    var backdrop = document.getElementById('wallet-modal-backdrop');
    if (modal && backdrop) {
      updateModalContent();
      modal.classList.add('is-open');
      backdrop.classList.add('is-open');
    }
  }

  function closeWalletModal() {
    var modal = document.getElementById('wallet-modal');
    var backdrop = document.getElementById('wallet-modal-backdrop');
    if (modal && backdrop) {
      modal.classList.remove('is-open');
      backdrop.classList.remove('is-open');
    }
  }

  function updateModalContent() {
    var unconView = document.getElementById('wallet-unconnected-view');
    var conView = document.getElementById('wallet-connected-view');
    var connectRealBtn = document.getElementById('btn-connect-real-wallet');
    var installMetaMaskBtn = document.getElementById('btn-install-metamask');
    var detectHeading = document.getElementById('wallet-detect-heading');
    var detectDesc = document.getElementById('wallet-detect-desc');

    if (!state.isConnected) {
      if (unconView) unconView.style.display = 'block';
      if (conView) conView.style.display = 'none';

      if (hasEthereum()) {
        if (connectRealBtn) connectRealBtn.style.display = 'inline-flex';
        if (installMetaMaskBtn) installMetaMaskBtn.style.display = 'none';
        if (detectHeading) detectHeading.textContent = 'MetaMask Detected';
        if (detectDesc) detectDesc.textContent = 'Click below to connect your MetaMask wallet, or try our demo simulation.';
      } else {
        if (connectRealBtn) connectRealBtn.style.display = 'none';
        if (installMetaMaskBtn) installMetaMaskBtn.style.display = 'inline-flex';
        if (detectHeading) detectHeading.textContent = 'No Web3 Wallet Detected';
        if (detectDesc) detectDesc.textContent = 'Install MetaMask to interact on-chain, or test our simulated sandbox.';
      }
      return;
    }

    // Connected State
    if (unconView) unconView.style.display = 'none';
    if (conView) conView.style.display = 'block';

    var addrText = document.getElementById('modal-address-text');
    var identicon = document.getElementById('modal-identicon');
    var balanceText = document.getElementById('modal-balance-amount');
    var currencySymbol = document.getElementById('modal-currency-symbol');
    var demoAlert = document.getElementById('demo-mode-alert');
    var networkBtns = document.querySelectorAll('.network-select-btn');

    var currentNetwork = NETWORKS[state.chainId] || { name: 'Unknown', currency: 'ETH' };

    if (addrText) addrText.textContent = truncateAddress(state.address);
    if (identicon) identicon.innerHTML = generateIdenticonSvg(state.address);
    if (balanceText) balanceText.textContent = state.balance;
    if (currencySymbol) {
      currencySymbol.textContent = currentNetwork.currency + (state.isDemoMode ? ' (Demo)' : '');
    }

    if (demoAlert) {
      demoAlert.style.display = state.isDemoMode ? 'flex' : 'none';
    }

    // Update Auth section in modal
    var authUnsigned = document.getElementById('modal-auth-unsigned');
    var authSigned = document.getElementById('modal-auth-signed');
    var authSignedText = document.getElementById('modal-auth-signed-text');
    var authBadge = document.getElementById('modal-auth-badge');
    var authDemoNote = document.getElementById('modal-auth-demo-note');
    var signinBtn = document.getElementById('btn-modal-signin');

    if (authState.isSignedIn) {
      if (authUnsigned) authUnsigned.style.display = 'none';
      if (authSigned) authSigned.style.display = 'block';
      if (authSignedText) authSignedText.textContent = 'Signed in as ' + truncateAddress(authState.address);
      if (authBadge) {
        authBadge.textContent = 'Authenticated';
        authBadge.style.color = '#10B981';
      }
    } else {
      if (authUnsigned) authUnsigned.style.display = 'block';
      if (authSigned) authSigned.style.display = 'none';
      if (authBadge) {
        authBadge.textContent = 'Not Signed In';
        authBadge.style.color = '';
      }
      if (state.isDemoMode) {
        if (signinBtn) signinBtn.style.display = 'none';
        if (authDemoNote) authDemoNote.style.display = 'block';
      } else {
        if (signinBtn) {
          signinBtn.style.display = 'inline-flex';
          signinBtn.disabled = authState.isSigningIn;
          signinBtn.innerHTML = authState.isSigningIn ? '<span>Signing in...</span>' : '<span>Sign in to Aether</span>';
        }
        if (authDemoNote) authDemoNote.style.display = 'none';
      }
    }

    networkBtns.forEach(function (btn) {
      var chain = btn.getAttribute('data-chain-id');
      if (chain === state.chainId) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    notifyStateChange();
  }

  function notifyStateChange(extra) {
    try {
      var detail = Object.assign({}, state, extra || {});
      window.dispatchEvent(new CustomEvent('aether:walletState', { detail: detail }));
    } catch (e) {}
  }

  function notifyAuthStateChange() {
    updateModalContent();
    if (authState.isSignedIn && typeof syncProgressFromServer === 'function') {
      syncProgressFromServer();
    }
    try {
      window.dispatchEvent(new CustomEvent('aether:authState', { detail: Object.assign({}, authState) }));
    } catch (e) {}
  }

  function syncWalletPill() {
    var pill = document.getElementById('global-wallet-btn');
    if (!pill) return;

    if (state.isConnected) {
      var currentNet = NETWORKS[state.chainId] || { shortName: 'EVM' };
      var badgeText = state.isDemoMode ? 'Demo' : currentNet.shortName;

      pill.innerHTML = [
        '<span style="display:flex; align-items:center;">' + generateIdenticonSvg(state.address) + '</span>',
        '<span>' + truncateAddress(state.address) + '</span>',
        '<span style="font-size:0.65rem; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.12); color:#FFFFFF; font-weight:700; font-family:var(--font-mono);">' + badgeText + '</span>'
      ].join('');
    } else {
      pill.innerHTML = [
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>',
        '<span>Connect Wallet</span>'
      ].join('');
    }
  }

  function hasEthereum() {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  function connectWallet() {
    if (state.isConnected) {
      openWalletModal();
      return;
    }

    if (hasEthereum()) {
      if (state.isConnecting) return;
      state.isConnecting = true;

      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(function (accounts) {
          state.isConnecting = false;
          if (accounts && accounts.length > 0) {
            handleAccountsChanged(accounts);
            fetchNetworkAndBalance();
            Aether.showToast('Wallet connected successfully!');
          }
        })
        .catch(function (error) {
          state.isConnecting = false;
          notifyStateChange({ error: error });
          if (error.code === 4001) {
            Aether.showToast('Connection rejected by user (4001).');
          } else if (error.code === -32002) {
            Aether.showToast('Request already pending in MetaMask.');
          } else {
            Aether.showToast('Connection error: ' + (error.message || 'Unknown'));
          }
        });
    } else {
      openWalletModal();
    }
  }

  function activateDemoMode() {
    state.isConnected = true;
    state.isDemoMode = true;
    state.address = DEMO_ACCOUNT.address;
    state.balance = DEMO_ACCOUNT.balance;
    state.chainId = DEMO_ACCOUNT.chainId;

    // Reset any real auth state on demo activation
    if (window.Aether.api) window.Aether.api.setToken(null);
    authState.isSignedIn = false;
    authState.address = null;

    syncWalletPill();
    updateModalContent();
    notifyAuthStateChange();
    Aether.showToast('Demo simulation mode activated');
  }

  function disconnectWallet() {
    state.isConnected = false;
    state.isDemoMode = false;
    state.address = null;
    state.balance = '0.0000';
    state.chainId = '0x1';

    // Clear backend session token
    if (window.Aether.api) {
      window.Aether.api.setToken(null);
    }
    authState.isSignedIn = false;
    authState.address = null;
    authState.isSigningIn = false;

    localStorage.removeItem('aether_real_wallet_connected');
    syncWalletPill();
    updateModalContent();
    notifyAuthStateChange();
    Aether.showToast('Wallet disconnected.');
  }

  function switchNetwork(targetChainId) {
    var netConfig = NETWORKS[targetChainId];
    if (!netConfig) return;

    if (state.isDemoMode || !hasEthereum()) {
      state.chainId = targetChainId;
      syncWalletPill();
      updateModalContent();
      Aether.showToast('Switched network to ' + netConfig.name + ' (Demo)');
      return;
    }

    window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }]
    })
      .then(function () {
        state.chainId = targetChainId;
        fetchNetworkAndBalance();
        Aether.showToast('Switched to ' + netConfig.name);
      })
      .catch(function (switchError) {
        if (switchError.code === 4902) {
          addNetwork(targetChainId);
        } else if (switchError.code === 4001) {
          Aether.showToast('Network switch rejected by user.');
        } else {
          Aether.showToast('Failed to switch network: ' + switchError.message);
        }
      });
  }

  function addNetwork(targetChainId) {
    var net = NETWORKS[targetChainId];
    if (!net) return;

    window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: net.chainId,
        chainName: net.name,
        nativeCurrency: { name: net.currency, symbol: net.currency, decimals: 18 },
        rpcUrls: net.rpcUrls,
        blockExplorerUrls: [net.blockExplorer]
      }]
    }).then(function () {
      state.chainId = targetChainId;
      fetchNetworkAndBalance();
    }).catch(function (err) {
      Aether.showToast('Could not add network: ' + err.message);
    });
  }

  function fetchNetworkAndBalance() {
    if (!hasEthereum() || !state.address) return;

    window.ethereum.request({ method: 'eth_chainId' })
      .then(function (chainId) {
        state.chainId = chainId.toLowerCase();
        return window.ethereum.request({
          method: 'eth_getBalance',
          params: [state.address, 'latest']
        });
      })
      .then(function (hexBal) {
        state.balance = formatEthBalance(hexBal);
        syncWalletPill();
        updateModalContent();
      })
      .catch(function (err) {
        console.warn('[Aether Wallet] Balance fetch warning:', err);
      });
  }

  function handleAccountsChanged(accounts) {
    // Clear backend token on account switch as per security requirements
    if (authState.isSignedIn || (window.Aether.api && window.Aether.api.getToken())) {
      if (window.Aether.api) window.Aether.api.setToken(null);
      authState.isSignedIn = false;
      authState.address = null;
      notifyAuthStateChange();
      Aether.showToast('Account changed. Signed out.');
    }

    if (!accounts || accounts.length === 0) {
      disconnectWallet();
    } else {
      state.isConnected = true;
      state.isDemoMode = false;
      state.address = accounts[0];
      localStorage.setItem('aether_real_wallet_connected', 'true');
      fetchNetworkAndBalance();
      syncWalletPill();
      updateModalContent();
    }
  }

  function handleChainChanged(chainId) {
    state.chainId = chainId.toLowerCase();

    // Clear backend token on network switch
    if (authState.isSignedIn || (window.Aether.api && window.Aether.api.getToken())) {
      if (window.Aether.api) window.Aether.api.setToken(null);
      authState.isSignedIn = false;
      authState.address = null;
      notifyAuthStateChange();
      Aether.showToast('Network changed. Signed out.');
    }

    fetchNetworkAndBalance();
    var net = NETWORKS[state.chainId];
    if (net) {
      Aether.showToast('Network changed to ' + net.name);
    }
  }

  async function checkExistingAuth(addr) {
    if (!window.Aether.api || !window.Aether.api.getToken()) return;
    try {
      var res = await window.Aether.api.get('/api/auth/me');
      if (res && res.ok && res.data && res.data.address) {
        if (addr && res.data.address.toLowerCase() === addr.toLowerCase()) {
          authState.isSignedIn = true;
          authState.address = res.data.address;
          notifyAuthStateChange();
        } else {
          window.Aether.api.setToken(null);
        }
      } else {
        window.Aether.api.setToken(null);
      }
    } catch (e) {}
  }

  function restoreSession() {
    var wasRealConnected = localStorage.getItem('aether_real_wallet_connected');

    if (wasRealConnected && hasEthereum()) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(function (accounts) {
          if (accounts && accounts.length > 0) {
            handleAccountsChanged(accounts);
            checkExistingAuth(accounts[0]);
          } else {
            localStorage.removeItem('aether_real_wallet_connected');
          }
        })
        .catch(function () {
          localStorage.removeItem('aether_real_wallet_connected');
        });
    }
  }

  /**
   * Gasless personal message signer for demonstration
   */
  function signPersonalMessage(msg, callback) {
    if (!state.isConnected) {
      Aether.showToast('Please connect wallet first.');
      return;
    }

    if (state.isDemoMode || !hasEthereum()) {
      setTimeout(function () {
        var mockSig = '0x' + Array.from({ length: 130 }, function () {
          return Math.floor(Math.random() * 16).toString(16);
        }).join('');
        if (callback) callback(null, mockSig, true);
      }, 400);
      return;
    }

    var hexMsg = '0x' + Array.from(new TextEncoder().encode(msg)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');

    window.ethereum.request({
      method: 'personal_sign',
      params: [hexMsg, state.address]
    })
      .then(function (sig) {
        if (callback) callback(null, sig, false);
      })
      .catch(function (err) {
        if (callback) callback(err, null, false);
      });
  }

  /**
   * SIWE-inspired backend authentication flow:
   * 1. GET /api/auth/nonce
   * 2. Build structured message with exact template
   * 3. personal_sign message with MetaMask
   * 4. POST /api/auth/verify
   * 5. Store JWT token via Aether.api.setToken
   */
  async function signInToAether() {
    if (!state.isConnected || !state.address) {
      Aether.showToast('Please connect wallet first.');
      return { ok: false, error: 'Wallet not connected' };
    }

    if (state.isDemoMode || !hasEthereum()) {
      Aether.showToast('Demo simulation wallet cannot sign in to Aether.');
      return { ok: false, error: 'Demo mode not supported' };
    }

    if (!window.Aether.api || typeof window.Aether.api.get !== 'function') {
      Aether.showToast('Backend unavailable, wallet still works');
      return { ok: false, error: 'API unavailable' };
    }

    authState.isSigningIn = true;
    notifyAuthStateChange();

    try {
      // 1. GET nonce
      var nonceRes = await window.Aether.api.get('/api/auth/nonce');
      if (!nonceRes || !nonceRes.ok || !nonceRes.data || !nonceRes.data.nonce) {
        authState.isSigningIn = false;
        notifyAuthStateChange();
        Aether.showToast('Backend unavailable, wallet still works');
        return { ok: false, error: 'Backend unavailable' };
      }

      var nonce = nonceRes.data.nonce;
      var issuedAt = new Date().toISOString();
      var address = state.address;
      var uri = window.location.origin;

      // 2. Build message from exact template
      var message = [
        'Aether wants you to sign in with your Ethereum account:',
        address,
        '',
        'Sign in to Aether. This does not cost gas and does not move funds.',
        '',
        'URI: ' + uri,
        'Nonce: ' + nonce,
        'Issued At: ' + issuedAt
      ].join('\n');

      // 3. Request personal_sign via MetaMask
      var hexMsg = '0x' + Array.from(new TextEncoder().encode(message)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');

      var signature;
      try {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [hexMsg, address]
        });
      } catch (signErr) {
        authState.isSigningIn = false;
        notifyAuthStateChange();
        if (signErr && (signErr.code === 4001 || (signErr.message && signErr.message.indexOf('reject') !== -1))) {
          Aether.showToast('Sign-in rejected by user (4001).');
        } else {
          Aether.showToast('Signing failed: ' + (signErr ? signErr.message : 'Unknown'));
        }
        return { ok: false, error: signErr };
      }

      // 4. POST verify
      var verifyRes = await window.Aether.api.post('/api/auth/verify', {
        address: address,
        message: message,
        signature: signature
      });

      if (!verifyRes || !verifyRes.ok || !verifyRes.data || !verifyRes.data.token) {
        authState.isSigningIn = false;
        notifyAuthStateChange();
        var errMsg = (verifyRes && verifyRes.error) ? verifyRes.error : 'Authentication failed';
        Aether.showToast('Authentication failed: ' + errMsg);
        return { ok: false, error: errMsg };
      }

      // 5. Store Bearer token
      window.Aether.api.setToken(verifyRes.data.token);
      authState.isSignedIn = true;
      authState.address = verifyRes.data.address || address;
      authState.isSigningIn = false;

      notifyAuthStateChange();
      Aether.showToast('Signed in to Aether successfully!');
      return { ok: true, address: authState.address };
    } catch (err) {
      authState.isSigningIn = false;
      notifyAuthStateChange();
      Aether.showToast('Backend unavailable, wallet still works');
      return { ok: false, error: err };
    }
  }

  function signOutFromAether() {
    if (window.Aether.api && typeof window.Aether.api.setToken === 'function') {
      window.Aether.api.setToken(null);
    }
    authState.isSignedIn = false;
    authState.address = null;
    authState.isSigningIn = false;

    notifyAuthStateChange();
    Aether.showToast('Signed out. Your wallet remains connected in MetaMask.');
  }

  function init() {
    injectWalletModal();

    var pill = document.getElementById('global-wallet-btn');
    if (pill) {
      pill.addEventListener('click', function () {
        if (state.isConnected) {
          openWalletModal();
        } else {
          connectWallet();
        }
      });
    }

    if (hasEthereum()) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    restoreSession();
  }

  /* ==========================================================================
     AUTHENTICATED PROGRESS SYNCHRONIZATION (1s Debounce & Remote Merge)
     ========================================================================== */
  var syncDebounceTimer = null;

  function collectLocalProgress() {
    var data = {};

    try {
      var roadmap = JSON.parse(localStorage.getItem('aether_chain_roadmap') || '{}');
      for (var k in roadmap) {
        if (Object.prototype.hasOwnProperty.call(roadmap, k)) {
          if (typeof roadmap[k] === 'boolean' || typeof roadmap[k] === 'number') {
            data['roadmap_' + k] = roadmap[k];
          }
        }
      }
    } catch (e) {}

    try {
      var learn = JSON.parse(localStorage.getItem('aether_learn_progress') || '{}');
      for (var j in learn) {
        if (Object.prototype.hasOwnProperty.call(learn, j)) {
          if (typeof learn[j] === 'boolean' || typeof learn[j] === 'number') {
            data['learn_' + j] = learn[j];
          }
        }
      }
    } catch (e) {}

    try {
      var quizScore = parseInt(localStorage.getItem('aether_quiz_best_score') || '0', 10);
      if (quizScore > 0) {
        data['quiz_best_score'] = quizScore;
      }
    } catch (e) {}

    return data;
  }

  async function syncProgressFromServer() {
    if (!authState.isSignedIn) return;
    if (!window.Aether.api) return;

    try {
      var res = await window.Aether.api.get('/api/progress');
      if (res && res.ok && res.data && typeof res.data.data === 'object') {
        var remote = res.data.data;

        // 1. Merge roadmap (keep whichever marks complete)
        var localRoadmap = {};
        try { localRoadmap = JSON.parse(localStorage.getItem('aether_chain_roadmap') || '{}'); } catch (e) {}
        var mergedRoadmap = Object.assign({}, localRoadmap);

        for (var rk in remote) {
          if (Object.prototype.hasOwnProperty.call(remote, rk)) {
            var rawKey = rk.startsWith('roadmap_') ? rk.slice(8) : rk;
            if (remote[rk] === true || remote[rk] === 1) {
              mergedRoadmap[rawKey] = true;
            }
          }
        }
        localStorage.setItem('aether_chain_roadmap', JSON.stringify(mergedRoadmap));

        // 2. Merge learn progress
        var localLearn = {};
        try { localLearn = JSON.parse(localStorage.getItem('aether_learn_progress') || '{}'); } catch (e) {}
        var mergedLearn = Object.assign({}, localLearn);

        for (var lk in remote) {
          if (Object.prototype.hasOwnProperty.call(remote, lk)) {
            if (lk.startsWith('learn_')) {
              var learnKey = lk.slice(6);
              if (remote[lk] === true || remote[lk] === 1) {
                mergedLearn[learnKey] = true;
              }
            }
          }
        }
        localStorage.setItem('aether_learn_progress', JSON.stringify(mergedLearn));

        // 3. Merge quiz score (keep highest)
        var localQuiz = 0;
        try { localQuiz = parseInt(localStorage.getItem('aether_quiz_best_score') || '0', 10); } catch (e) {}
        var remoteQuiz = parseInt(remote['quiz_best_score'] || '0', 10);
        var mergedQuiz = Math.max(localQuiz, remoteQuiz);
        if (mergedQuiz > localQuiz) {
          localStorage.setItem('aether_quiz_best_score', mergedQuiz.toString());
        }

        // Notify active pages to re-render
        if (typeof window.Aether.initChainRoadmap === 'function') {
          window.Aether.initChainRoadmap();
        }
        if (typeof window.Aether.updateReadingProgressUI === 'function') {
          window.Aether.updateReadingProgressUI();
        }
        if (typeof window.Aether.updateBestScoreUI === 'function') {
          window.Aether.updateBestScoreUI();
        }

        window.dispatchEvent(new CustomEvent('aether:progressSynced'));

        // Push merged state back to server so server reflects combined progress
        scheduleProgressPut();
      }
    } catch (err) {
      console.warn('[Progress Sync] Fetch warning:', err);
    }
  }

  function scheduleProgressPut() {
    if (!authState.isSignedIn) return;
    if (!window.Aether.api) return;

    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }

    syncDebounceTimer = setTimeout(async function () {
      if (!authState.isSignedIn) return;
      if (!window.Aether.api) return;

      var payload = collectLocalProgress();
      try {
        await window.Aether.api.request('/api/progress', {
          method: 'PUT',
          body: { data: payload }
        });
      } catch (err) {
        console.warn('[Progress Sync] Put warning:', err);
      }
    }, 1000);
  }

  window.Aether.Progress = {
    syncFromServer: syncProgressFromServer,
    scheduleProgressPut: scheduleProgressPut,
    collectLocalProgress: collectLocalProgress
  };

  window.Aether.Wallet = {
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchNetwork: switchNetwork,
    signMessage: signPersonalMessage,
    signIn: signInToAether,
    signOut: signOutFromAether,
    getAuthState: function () { return Object.assign({}, authState); },
    getState: function () { return Object.assign({}, state); },
    openModal: openWalletModal,
    closeModal: closeWalletModal,
    hasEthereum: hasEthereum,
    activateDemoMode: activateDemoMode,
    truncateAddress: truncateAddress,
    NETWORKS: NETWORKS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
