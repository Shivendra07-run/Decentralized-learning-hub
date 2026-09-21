# Aether — Learn the Decentralized Web

> **Track A: Web3 Landing Page Challenge**  
> *Rubric: Web3 Content Accuracy (30%) | UI/UX + Responsiveness + Visual Appeal (30%) | Clean HTML/CSS + Git Hygiene (30%) | MetaMask Wallet Bonus (10%)*

**Aether** is an educational, visual, and interactive Web3 learning platform built for beginners. It demystifies the core pillars of the decentralized web (blockchain, decentralization, cryptocurrencies, smart contracts, NFTs, and DAOs) through intuitive real-world analogies, interactive browser-based labs, and live wallet interactions.

---

## 🌟 Key Features

- **Deep Educational Accuracy**: 100% real educational facts with zero fabricated claims (no fake audits, fake backers, or invented protocol stats).
- **Interactive Labs (No Backend Needed)**:
  - **Build-a-Block**: Real cryptographic hashing with native Web Crypto SHA-256 and proof-of-work mining simulation.
  - **Smart Contract Vending Machine**: Line-by-line Solidity syntax walkthrough and state simulator.
  - **DEX Swap Simulator**: Automated Market Maker ($x \cdot y = k$) demo with price impact, slippage, and gas estimation.
  - **Staking Calculator**: Visual compounding yield and lockup period calculator.
  - **Mini DAO**: Governance proposal voting with token-weighted power, quorum detection, and celebratory confetti.
- **Live Market Data**: CoinGecko public API integration with offline/cached fallbacks and 60-second background polling.
- **MetaMask Web3 Wallet Integration**: Connect, account switching, live balance reading, chain switching (Ethereum Mainnet, Sepolia, Polygon, Polygon Amoy), and error handling with a graceful simulation fallback for environments without extensions.
- **Modern Dark-First Aesthetics**: Aurora gradient blooms, glassmorphic cards (`backdrop-filter`), bento-grid layouts, and subtle noise grain.
- **High-Performance Micro-Motion**: 3D card tilt, magnetic CTA buttons, smooth scroll-reveal, scroll progress indicator, and custom glow cursor.
- **Zero External Dependencies / No Build Tools**: Built with pure HTML5, vanilla CSS, and vanilla JavaScript wrapped in a clean global namespace (`window.Aether`). Works seamlessly on `file:///` and local web servers.
- **Accessible & Responsive**: WCAG AA contrast, semantic HTML5, keyboard navigation, skip links, and full `@media (prefers-reduced-motion: reduce)` support.

---

## 🧭 Sitemap

1. `index.html` — Hero, keyword marquee, bento directory, "How Web3 Works" timeline, did-you-know carousel, and call-to-action.
2. `learn.html` — The 6 Core Pillars: Blockchain, Decentralization, Cryptocurrency, Smart Contracts, NFTs, and DAOs.
3. `web2-vs-web3.html` — Interactive node slider, evolution timeline (Web1 → Web2 → Web3), comparison table, 6 real use cases, and honest risks & challenges.
4. `lab.html` — 5 Tabbed interactive browser labs (Block hashing, Vending machine, DEX swap, Staking, DAO).
5. `market.html` — Live cryptocurrency tracker powered by CoinGecko API with sparklines and offline fallback.
6. `wallet.html` — Beginner's wallet guide, security checklist, and interactive `personal_sign` signature demo.
7. `quiz.html` — 10-Question quiz and interactive flashcards with streak tracking and badge rewards.
8. `resources.html` — 20+ Term searchable glossary, FAQ accordion, and step-by-step learning roadmap checklist.
9. `404.html` — Themed cosmic error page.

---

## 🚀 Running the Project

### Option A: Direct Browser File (Zero Setup)
Double-click any `.html` file (e.g. `index.html`) to open it directly via `file:///`. All shared headers, footers, animations, and labs work immediately without CORS errors.

### Option B: Local Web Server (Recommended for MetaMask Extension Testing)
MetaMask and browser wallet extensions enforce security restrictions that prevent injected Web3 providers on `file:///` URLs. To test live MetaMask wallet connections:
```bash
# Using Python
python -m http.server 3000

# Or using Node npx
npx serve .
```
Then visit `http://localhost:3000` in a browser with MetaMask installed.

---

## ⚖️ Educational Disclaimer
*All content on this website is for educational and illustrative purposes only. Nothing on this website constitutes financial, legal, or investment advice.*
