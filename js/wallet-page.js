/**
 * AETHER WALLET PORTAL PAGE CONTROLLER (IIFE + window.Aether)
 * Reuses the core wallet module (js/wallet.js).
 * Handles:
 * 1. Full connection lifecycle UI & status messages (not installed, connecting, rejected 4001, connected, changed, disconnected)
 * 2. Address copy, balance display & network switching (Mainnet, Sepolia, Amoy 0x13882)
 * 3. Gasless personal_sign message signer with shortened signature display
 * 4. Safe session clearance and demo mode toggling
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  function truncate(addr) {
    if (!addr) return '';
    return addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
  }

  function truncateSig(sig) {
    if (!sig) return '';
    if (sig.length <= 26) return sig;
    return sig.substring(0, 14) + '......' + sig.substring(sig.length - 12);
  }

  function generateSvgIdenticon(addr) {
    if (!addr) return '';
    var hash = 0;
    for (var i = 0; i < addr.length; i++) {
      hash = addr.charCodeAt(i) + ((hash << 5) - hash);
    }
    var c1 = '#' + ((hash & 0x00ffffff).toString(16).padStart(6, '0'));
    var c2 = '#' + (((hash >> 4) & 0x00ffffff).toString(16).padStart(6, '0'));
    var c3 = '#' + (((hash >> 8) & 0x00ffffff).toString(16).padStart(6, '0'));

    return '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" style="border-radius:50%; vertical-align:middle;">' +
      '<rect width="28" height="28" fill="' + c1 + '"/>' +
      '<circle cx="8" cy="8" r="6" fill="' + c2 + '"/>' +
      '<rect x="12" y="12" width="12" height="12" rx="3" fill="' + c3 + '"/>' +
      '</svg>';
  }

  function renderWalletState(walletState) {
    var state = walletState || (window.Aether.Wallet ? window.Aether.Wallet.getState() : {});
    var hasEth = window.Aether.Wallet && typeof window.Aether.Wallet.hasEthereum === 'function' 
      ? window.Aether.Wallet.hasEthereum() 
      : Boolean(window.ethereum);

    var pill = document.getElementById('portal-status-pill');
    var banner = document.getElementById('portal-status-banner');
    var statusText = document.getElementById('portal-status-text');
    var statusIcon = document.getElementById('portal-status-icon');

    var unconnectedStage = document.getElementById('portal-unconnected-stage');
    var connectedStage = document.getElementById('portal-connected-stage');
    var connectBtn = document.getElementById('btn-portal-connect');
    var installBtn = document.getElementById('btn-portal-install');
    var demoAlert = document.getElementById('portal-demo-alert');

    // UI elements when connected
    var addressDisplay = document.getElementById('portal-address-display');
    var identiconDisplay = document.getElementById('portal-identicon');
    var networkName = document.getElementById('portal-network-name');
    var chainIdDisplay = document.getElementById('portal-chain-id');
    var balanceDisplay = document.getElementById('portal-balance-display');
    var currencySymbol = document.getElementById('portal-currency-symbol');

    // Error handling check
    if (state.error) {
      if (pill) {
        pill.textContent = 'Request Rejected';
        pill.className = 'console-status-pill console-status-pill--error';
      }
      if (statusText) {
        if (state.error.code === 4001) {
          statusText.textContent = 'Connection request rejected by user in MetaMask (Error 4001).';
        } else if (state.error.code === -32002) {
          statusText.textContent = 'MetaMask request is already pending. Please check your browser extension.';
        } else {
          statusText.textContent = 'Connection failed: ' + (state.error.message || 'Unknown reason');
        }
      }
      if (banner) banner.className = 'portal-status-banner portal-status-banner--error';
      return;
    }

    if (state.isConnecting) {
      if (pill) {
        pill.textContent = 'Connecting...';
        pill.className = 'console-status-pill console-status-pill--pending';
      }
      if (statusText) statusText.textContent = 'Waiting for user authorization in MetaMask popup...';
      if (banner) banner.className = 'portal-status-banner portal-status-banner--pending';
      return;
    }

    if (!state.isConnected) {
      if (unconnectedStage) unconnectedStage.style.display = 'block';
      if (connectedStage) connectedStage.style.display = 'none';

      if (pill) {
        pill.textContent = 'Disconnected';
        pill.className = 'console-status-pill';
      }

      if (!hasEth) {
        if (connectBtn) connectBtn.style.display = 'none';
        if (installBtn) installBtn.style.display = 'inline-flex';
        if (statusText) statusText.textContent = 'No Web3 extension detected. Install MetaMask or test with the demo simulation.';
        if (banner) banner.className = 'portal-status-banner portal-status-banner--info';
      } else {
        if (connectBtn) connectBtn.style.display = 'inline-flex';
        if (installBtn) installBtn.style.display = 'none';
        if (statusText) statusText.textContent = 'MetaMask detected. Click below to connect your account.';
        if (banner) banner.className = 'portal-status-banner';
      }
      return;
    }

    // Connected State
    if (unconnectedStage) unconnectedStage.style.display = 'none';
    if (connectedStage) connectedStage.style.display = 'block';

    if (pill) {
      pill.textContent = state.isDemoMode ? 'Connected (Demo)' : 'Connected';
      pill.className = 'console-status-pill console-status-pill--active';
    }

    if (statusText) {
      statusText.textContent = state.isDemoMode 
        ? 'Connected to local simulated sandbox environment.' 
        : 'Active connection established with MetaMask.';
    }
    if (banner) banner.className = 'portal-status-banner portal-status-banner--active';

    if (demoAlert) demoAlert.style.display = state.isDemoMode ? 'flex' : 'none';

    var currentNet = (window.Aether.Wallet && window.Aether.Wallet.NETWORKS[state.chainId]) 
      || { name: 'Unknown EVM Network (' + state.chainId + ')', currency: 'ETH' };

    if (addressDisplay) addressDisplay.textContent = state.address;
    if (identiconDisplay) identiconDisplay.innerHTML = generateSvgIdenticon(state.address);
    if (networkName) networkName.textContent = currentNet.name;
    if (chainIdDisplay) chainIdDisplay.textContent = 'Chain ID: ' + state.chainId;
    if (balanceDisplay) balanceDisplay.textContent = state.balance || '0.0000';
    if (currencySymbol) currencySymbol.textContent = currentNet.currency;

    // Highlight matching network button
    document.querySelectorAll('.network-portal-btn').forEach(function (btn) {
      var cid = btn.getAttribute('data-chain-id');
      if (cid && cid.toLowerCase() === (state.chainId || '').toLowerCase()) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  function initActions() {
    var connectBtn = document.getElementById('btn-portal-connect');
    var demoBtn = document.getElementById('btn-portal-demo');
    var disconnectBtn = document.getElementById('btn-portal-disconnect');
    var copyBtn = document.getElementById('btn-copy-address');
    var copyText = document.getElementById('copy-btn-text');

    if (connectBtn) {
      connectBtn.addEventListener('click', function () {
        if (window.Aether.Wallet) {
          window.Aether.Wallet.connect();
        }
      });
    }

    if (demoBtn) {
      demoBtn.addEventListener('click', function () {
        if (window.Aether.Wallet && typeof window.Aether.Wallet.activateDemoMode === 'function') {
          window.Aether.Wallet.activateDemoMode();
        }
      });
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', function () {
        if (window.Aether.Wallet) {
          window.Aether.Wallet.disconnect();
          renderWalletState();
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var state = window.Aether.Wallet ? window.Aether.Wallet.getState() : {};
        if (state.address && navigator.clipboard) {
          navigator.clipboard.writeText(state.address).then(function () {
            if (copyText) copyText.textContent = 'Copied!';
            setTimeout(function () {
              if (copyText) copyText.textContent = 'Copy';
            }, 1800);
            Aether.showToast('Address copied to clipboard');
          });
        }
      });
    }

    // Network switching buttons
    document.querySelectorAll('.network-portal-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetChainId = btn.getAttribute('data-chain-id');
        if (targetChainId && window.Aether.Wallet) {
          window.Aether.Wallet.switchNetwork(targetChainId);
        }
      });
    });

    // Sign Message Feature
    var signBtn = document.getElementById('btn-sign-message');
    var signInput = document.getElementById('sign-message-input');
    var sigBox = document.getElementById('signature-output-box');
    var sigHex = document.getElementById('signature-hex-display');

    if (signBtn && signInput) {
      signBtn.addEventListener('click', function () {
        var state = window.Aether.Wallet ? window.Aether.Wallet.getState() : {};
        if (!state.isConnected) {
          Aether.showToast('Please connect your wallet first before signing.');
          if (window.Aether.Wallet) window.Aether.Wallet.connect();
          return;
        }

        var text = signInput.value || 'Hello Web3';
        signBtn.disabled = true;
        signBtn.innerHTML = '<span>Awaiting signature in wallet...</span>';

        if (window.Aether.Wallet && typeof window.Aether.Wallet.signMessage === 'function') {
          window.Aether.Wallet.signMessage(text, function (err, sig) {
            signBtn.disabled = false;
            signBtn.innerHTML = '<span>Sign Message with Wallet</span>';

            if (err) {
              if (err.code === 4001) {
                Aether.showToast('Signing request rejected by user.');
              } else {
                Aether.showToast('Signing failed: ' + (err.message || 'Unknown error'));
              }
              return;
            }

            if (sig) {
              if (sigBox) sigBox.style.display = 'block';
              if (sigHex) {
                sigHex.textContent = truncateSig(sig);
                sigHex.setAttribute('title', sig);
              }
              Aether.showToast('Cryptographic signature generated successfully!');
            }
          });
        }
      });
    }
  }

  function init() {
    initActions();
    renderWalletState();

    // Listen for custom wallet state changes dispatched by wallet.js
    window.addEventListener('aether:walletState', function (e) {
      renderWalletState(e.detail);
    });

    // Native MetaMask event listeners
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', function () {
        renderWalletState();
      });
      window.ethereum.on('chainChanged', function () {
        renderWalletState();
      });
    }
  }

  window.Aether.WalletPage = {
    init: init,
    render: renderWalletState
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
