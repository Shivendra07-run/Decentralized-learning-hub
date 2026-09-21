/**
 * AETHER RESOURCES & GLOSSARY CONTROLLER (IIFE + window.Aether)
 * Features:
 * 1. 23+ Plain-Language Web3 Glossary Terms
 * 2. Instant live search filter
 * 3. Dynamic A to Z letter filter navigation
 * 4. Screen-reader accessible dynamic results counter
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var GLOSSARY_TERMS = [
    {
      term: 'Block',
      letter: 'B',
      category: 'Architecture',
      def: 'A chronological digital package containing a batch of verified transactions, a timestamp, a cryptographic nonce, and the hash of the preceding block.'
    },
    {
      term: 'Blockchain',
      letter: 'B',
      category: 'Foundations',
      def: 'A shared, immutable ledger of blocks linked together using cryptography and maintained simultaneously across a decentralized network of independent computers.'
    },
    {
      term: 'Consensus Mechanism',
      letter: 'C',
      category: 'Protocol',
      def: 'The mathematical ruleset (such as Proof-of-Stake or Proof-of-Work) that independent computers use to agree on the single true state of the ledger without trusting each other.'
    },
    {
      term: 'Cryptocurrency',
      letter: 'C',
      category: 'Economics',
      def: 'Native digital money secured by mathematical cryptography rather than central bank reserves or commercial financial institutions.'
    },
    {
      term: 'DAO (Decentralized Organization)',
      letter: 'D',
      category: 'Governance',
      def: 'An internet-native community governed by transparent rules encoded on smart contracts and voted on by members using cryptographic tokens.'
    },
    {
      term: 'dApp (Decentralized Application)',
      letter: 'D',
      category: 'Software',
      def: 'An application whose backend logic runs on decentralized smart contracts rather than centralized cloud hosting providers like AWS.'
    },
    {
      term: 'DeFi (Decentralized Finance)',
      letter: 'D',
      category: 'Economics',
      def: 'Financial services—such as lending, borrowing, trading, and insurance—built on permissionless smart contracts without traditional banks or brokers.'
    },
    {
      term: 'Ethereum',
      letter: 'E',
      category: 'Protocol',
      def: 'An open-source, globally decentralized computing platform that pioneered deterministic smart contracts and programmable decentralized applications.'
    },
    {
      term: 'Gas',
      letter: 'G',
      category: 'Economics',
      def: 'The computing fee paid to network validators to process, verify, and permanently store transactions on a smart contract blockchain like Ethereum.'
    },
    {
      term: 'Hardware Wallet',
      letter: 'H',
      category: 'Security',
      def: 'A dedicated physical electronic device (like a Ledger or Trezor) that isolates your cryptographic private keys offline, completely away from internet-connected malware.'
    },
    {
      term: 'Hash (Cryptographic)',
      letter: 'H',
      category: 'Cryptography',
      def: 'A mathematical function that converts any digital input into a unique, fixed-length string of characters (like a digital fingerprint). Even changing a single comma completely changes the hash.'
    },
    {
      term: 'Immutability',
      letter: 'I',
      category: 'Foundations',
      def: 'The cryptographic guarantee that once data is confirmed and sealed into a blockchain block, it can never be rewritten, deleted, or altered by anyone.'
    },
    {
      term: 'Layer 2 (L2)',
      letter: 'L',
      category: 'Scaling',
      def: 'Secondary protocols (such as Arbitrum, Optimism, or Polygon) built on top of a base blockchain (Layer 1) to process hundreds of transactions per second at fractions of a cent.'
    },
    {
      term: 'Node',
      letter: 'N',
      category: 'Architecture',
      def: 'Any independent computer connected to a blockchain network that downloads, verifies, and stores a copy of the ledger while relaying transactions to peers.'
    },
    {
      term: 'NFT (Non-Fungible Token)',
      letter: 'N',
      category: 'Digital Property',
      def: 'A unique cryptographic token on a blockchain that proves verifiable digital provenance, ownership, and authenticity for specific media, tickets, or game assets.'
    },
    {
      term: 'Peer-to-Peer (P2P)',
      letter: 'P',
      category: 'Network',
      def: 'A network architecture where computers interact directly with one another as equals, transferring value or data without routing through a central authority or server.'
    },
    {
      term: 'Private Key',
      letter: 'P',
      category: 'Security',
      def: 'A secret cryptographic number used to sign transactions and prove ownership of funds. Anyone who obtains your private key can spend all your assets.'
    },
    {
      term: 'Public Address',
      letter: 'P',
      category: 'Identity',
      def: 'A public cryptographic string (similar to an email address or bank account number) that anyone can safely see to send you cryptocurrency or digital tokens.'
    },
    {
      term: 'Seed Phrase (Recovery Phrase)',
      letter: 'S',
      category: 'Security',
      def: 'A human-readable sequence of 12 or 24 random dictionary words that represents your master private key. Must be stored strictly offline and never shared.'
    },
    {
      term: 'Smart Contract',
      letter: 'S',
      category: 'Software',
      def: 'A deterministic computer program deployed to a blockchain that executes automatically when predefined conditions are cryptographically satisfied.'
    },
    {
      term: 'Testnet',
      letter: 'T',
      category: 'Development',
      def: 'An identical simulation blockchain (such as Sepolia or Amoy) where tokens have zero financial value, allowing developers and learners to test code completely free.'
    },
    {
      term: 'Wallet (Web3)',
      letter: 'W',
      category: 'Identity',
      def: 'Software or hardware that manages your private and public cryptographic keypairs, displays your balances, and signs transactions when interacting with dApps.'
    },
    {
      term: 'Zero-Knowledge Proof (ZKP)',
      letter: 'Z',
      category: 'Cryptography',
      def: 'An advanced cryptographic protocol that allows one party to mathematically prove to another that a statement is true without revealing any underlying private details.'
    }
  ];

  var activeLetterFilter = 'ALL';
  var searchQuery = '';

  function renderAzButtons() {
    var nav = document.getElementById('az-filter-bar');
    if (!nav) return;

    var lettersSet = new Set();
    GLOSSARY_TERMS.forEach(function (t) {
      lettersSet.add(t.letter.toUpperCase());
    });
    var sortedLetters = Array.from(lettersSet).sort();
    var allOptions = ['ALL'].concat(sortedLetters);

    nav.innerHTML = allOptions.map(function (opt) {
      var isActive = (opt === activeLetterFilter);
      return [
        '<button type="button" class="az-btn ' + (isActive ? 'is-active' : '') + '" data-letter="' + opt + '">',
        '  <span>' + opt + '</span>',
        '</button>'
      ].join('');
    }).join('');

    nav.querySelectorAll('.az-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeLetterFilter = btn.getAttribute('data-letter');
        renderAzButtons();
        filterAndRenderGlossary();
      });
    });
  }

  function filterAndRenderGlossary() {
    var grid = document.getElementById('glossary-grid');
    var countEl = document.getElementById('glossary-count');
    if (!grid) return;

    var query = searchQuery.trim().toLowerCase();

    var filtered = GLOSSARY_TERMS.filter(function (item) {
      var matchesLetter = (activeLetterFilter === 'ALL') || (item.letter.toUpperCase() === activeLetterFilter);
      var matchesQuery = !query || 
        item.term.toLowerCase().indexOf(query) !== -1 || 
        item.def.toLowerCase().indexOf(query) !== -1 ||
        item.category.toLowerCase().indexOf(query) !== -1;

      return matchesLetter && matchesQuery;
    });

    if (countEl) {
      countEl.textContent = 'Showing ' + filtered.length + ' of ' + GLOSSARY_TERMS.length + ' Terms';
    }

    if (filtered.length === 0) {
      grid.innerHTML = [
        '<div class="glossary-empty-state">',
        '  <p>No glossary terms matched your search "' + searchQuery + '".</p>',
        '  <button type="button" class="btn btn--secondary btn--xs" id="btn-reset-glossary-search">Clear Search</button>',
        '</div>'
      ].join('');

      var resetBtn = document.getElementById('btn-reset-glossary-search');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          searchQuery = '';
          activeLetterFilter = 'ALL';
          var searchInput = document.getElementById('glossary-search-input');
          if (searchInput) searchInput.value = '';
          renderAzButtons();
          filterAndRenderGlossary();
        });
      }
      return;
    }

    grid.innerHTML = filtered.map(function (item) {
      return [
        '<article class="glossary-card">',
        '  <div class="glossary-card__head">',
        '    <span class="glossary-letter-badge">' + item.letter + '</span>',
        '    <span class="glossary-category-pill">' + item.category + '</span>',
        '  </div>',
        '  <h3 class="glossary-term-title">' + item.term + '</h3>',
        '  <p class="glossary-term-def">' + item.def + '</p>',
        '</article>'
      ].join('');
    }).join('');
  }

  function init() {
    renderAzButtons();
    filterAndRenderGlossary();

    var searchInput = document.getElementById('glossary-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = searchInput.value;
        filterAndRenderGlossary();
      });
    }
  }

  window.Aether.Resources = {
    init: init,
    TERMS: GLOSSARY_TERMS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
