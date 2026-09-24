# Aether — Learn the Decentralized Web

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-silver?style=for-the-badge&logo=github)](https://shivendra07-run.github.io/decentralized-learning-hub/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Zero Build Tools](https://img.shields.io/badge/Dependencies-Vanilla%20HTML%20%2F%20CSS%20%2F%20JS-success?style=for-the-badge)](index.html)

> **Live Deployment:** [https://shivendra07-run.github.io/decentralized-learning-hub/](https://shivendra07-run.github.io/decentralized-learning-hub/)

**Aether** is a modern, dark-themed educational platform engineered to teach the foundational principles of Web3 to developers, students, and curious internet users. Demystifying complex distributed ledger technology through interactive visual sandboxes, relatable analogies, real-time cryptographic hashing, and zero-hype educational guides.

---

##  Interface Preview

```
+-------------------------------------------------------------------------------+
|  [✦ EDU] AETHER     Home  Learn  Compare  Lab  Market  Wallet  Quiz  Resources |
|                                                                               |
|                   Demystifying the Decentralized Web                          |
|         Explore blockchain fundamentals, test smart contract mechanics,      |
|           and interact with live Web3 tools in a risk-free sandbox.           |
|                                                                               |
|             [ Explore Core Concepts -> ]   [ Launch Interactive Lab ]         |
|                                                                               |
|    (3D Background: Procedural Crypto Coins & Liquid Domain-Warped Aurora)     |
+-------------------------------------------------------------------------------+
```
*(Screenshots can be placed in `assets/` and linked here)*

---

## Web3 Concepts Covered & How They Are Taught

1. **Blockchain Architecture & Immutability**
   - *How it's taught:* Visualized as an unbroken cryptographic chain of ledger blocks. Students use the interactive **Build-a-Block Lab** (`lab.html`) to compute real SHA-256 hashes using the browser's native Web Crypto API and experience how altering a single character in past transaction data breaks downstream validity.
2. **Decentralization vs Centralization**
   - *How it's taught:* Explained through client-server vs peer-to-peer topologies in `compare.html`. An interactive topology simulator allows users to simulate server crashes and government censorship to observe how decentralized networks prevent single points of failure.
3. **Cryptographic Self-Custody & Keypairs**
   - *How it's taught:* The mantra *"Not your keys, not your coins"* is demonstrated through public-key cryptography. In `wallet.html`, users can review private key protection principles and test personal message signing (`personal_sign`) to witness cryptographic signature verification without disclosing keys.
4. **Smart Contracts**
   - *How it's taught:* Modeled after Nick Szabo's classic **vending machine analogy**. In `lab.html`, learners interact with a simulated Solidity vending machine contract, inspecting code state changes and deterministic execution without human intermediaries.
5. **Non-Fungible Tokens (NFTs)**
   - *How it's taught:* Contrasted with fungible currency (dollar-for-dollar interchangeability). Clarified through verifiable token IDs, metadata URI standards (IPFS), and authentic ownership provenance.
6. **Decentralized Autonomous Organizations (DAOs)**
   - *How it's taught:* Taught through a simulated on-chain treasury vote in `lab.html`, where governance token holdings proportionally weight voting power, quorum criteria determine proposal outcomes, and execution triggers transparently.
7. **Automated Market Makers & DeFi**
   - *How it's taught:* Demystified using the constant-product liquidity pool formula ($x \cdot y = k$). The AMM swap sandbox calculates real-time price impact, slippage thresholds, and liquidity provider reserves.
8. **Wallet Safety & Security Hygiene**
   - *How it's taught:* Dedicated safety protocols covering seed phrase defense (why genuine protocols never request recovery words), malicious signature permit risks, testnet sandboxing (Sepolia), and hardware wallet air-gapping.

---

##  Page Features & Architecture

- **`index.html` (Home Portal)**: Hero section with a single Three.js background canvas featuring procedural brand coins and domain-warped liquid aurora shader, live CoinGecko rate marquee, bento curriculum grid, "How Web3 Works" chain timeline, interactive roadmap synced with quiz accomplishments, and detail modals with verified outbound links to official Ethereum developer documentation (Blockchain, Smart Contracts, and Tokens & NFTs).

###  Verified Outbound Exploration Links
The interactive Building Blocks detail modal on the Home Portal links out to official ecosystem documentation:
- **Blockchain:** [Intro to Ethereum (Ethereum.org)](https://ethereum.org/en/developers/docs/intro-to-ethereum/)
- **Smart Contracts:** [Smart Contracts Documentation (Ethereum.org)](https://ethereum.org/en/developers/docs/smart-contracts/)
- **Tokens & NFTs:** [Non-Fungible Tokens Overview (Ethereum.org)](https://ethereum.org/en/nft/)
- **`learn.html` (Core Concepts)**: Comprehensive, textbook-grade walkthrough across the 6 core pillars, 3D glowing background chain tracker that highlights the current reading section, Solidity code breakdown, and real-world case studies.
- **`compare.html` (Web2 vs Web3)**: Interactive network topology comparison (switch between centralized servers and distributed peer nodes), side-by-side architecture breakdown, Web1/Web2/Web3 evolution table, and honest evaluation of decentralization trade-offs (scalability vs sovereignty).
- **`lab.html` (Interactive Sandboxes)**: 5 zero-risk browser labs:
  1. *Block Hasher:* Real-time SHA-256 hashing with difficulty-targeted mining simulation.
  2. *Smart Contract:* Deterministic Solidity vending machine state engine.
  3. *DEX Swap:* Constant-product ($x \cdot y = k$) AMM swap simulator with slippage controls.
  4. *Staking Calculator:* APY compound interest and validator slashing risk simulator.
  5. *Mini DAO:* Token-weighted governance proposal voting with quorum tracking.
- **`market.html` (Market Telemetry)**: Live spot rates, 24h percentage movements, and 7-day interactive SVG sparkline modal charts powered by the public CoinGecko API with graceful offline fallback data.
- **`wallet.html` (Web3 Self-Custody Portal)**: Full MetaMask integration (account detection, network switching for Ethereum, Sepolia, Polygon, and Amoy, balance fetching, and cryptographic message signing) alongside a complete educational self-custody guide and simulated wallet mode for environments without browser extensions.
- **`quiz.html` (Knowledge Assessment & Study Cards)**: 10-question multiple-choice challenge covering all foundational pillars, live progress bar, instant feedback explanations, tier badges (*Curious Explorer*, *Knowledge Builder*, *Decentralized Master*), local storage score persistence, and a 3D flip-card flashcard study mode.
- **`resources.html` (Glossary, Recommended Articles & FAQ)**: Searchable 23-term Web3 glossary with live query filtering and alphabetical A-to-Z pills, 8 curated Recommended Articles from verified educational hubs, 8 accessible `<details>/<summary>` FAQ drawers addressing common beginner fears, and verified official project documentation links.
- **`404.html` (Not Found)**: On-brand 404 ledger page featuring an animated severed cryptographic chain graphic and direct return paths.

---

##  Mobile Responsiveness & Touch Architecture

Every page is strictly audited and optimized down to 375px and 414px mobile viewports:
- **No Page-Level Horizontal Overflow:** Viewport-constrained layouts with dedicated horizontal scroll wrappers for wide data tables and SVG charts (AMM curve, staking trajectory).
- **Adaptive Grid Stacking:** Multi-column grids (recommended articles, glossary, lab tabs, market cards, bento tokens) dynamically collapse to 1 column below 480px and 2 columns between 480px and 768px.
- **Touch-Native Navigation & Carousels:** 3D Orbiting Ring carousel and Infinite Real-World marquee support direct touch swipe/drag interactions on mobile screens.
- **Accessible Touch Targets:** 44px+ minimum hit targets across mobile navigation drawers, interactive filters, modal close buttons, and form controls.
- **Auto-Closing Mobile Drawer:** Mobile navigation drawer automatically closes on link clicks and backdrop taps.
- **Responsive Modal Containment:** Modals and detail panels scale within 90vh of the mobile viewport with internal touch scrolling.
- **3D Mobile Optimization:** Procedural coin density and mesh scaling automatically reduce on mobile viewports to prevent text overlap.

---

##  Tech Stack

- **Markup:** Semantic HTML5 (Single `<h1>` per page, ARIA live regions, skip navigation links, labeled form controls).
- **Styling:** Vanilla CSS with modular design tokens (`variables.css`, `base.css`, `layout.css`, `components.css`, `pages.css`). Strict dark monochrome aesthetic (#050506 graphite, silver accents, white typography, subtle glassmorphism). Zero Tailwind or external CSS frameworks.
- **Scripting:** Pure Vanilla JavaScript (ES5/ES6 compatible) structured with classic deferred scripts wrapped in IIFEs and sharing the unified `window.Aether` namespace. Zero bundlers, zero npm dependencies, zero build steps.
- **Graphics & 3D:** Three.js (r128) powering a single persistent viewport background canvas with a custom GLSL domain-warped fractal noise aurora shader, floating procedural coin meshes, and network raycasting.
- **Icons & Visuals:** 100% inline SVG vectors. No raster icon placeholders, no font icon downloads.

---

##  Architecture

### System Topology Diagram
```
 +-------------------------------------------------------------------------+
 |                               FRONTEND                                  |
 |                     Hosted on GitHub Pages (Static)                     |
 |        Vanilla HTML5 / CSS3 / ES6 (IIFE via window.Aether namespace)      |
 +------------------------------------+------------------------------------+
                                      |
                         HTTPS / REST | (Strict 4s timeout)
                                      v
 +-------------------------------------------------------------------------+
 |                                BACKEND                                  |
 |                  Serverless Functions on Vercel Node 18+                |
 |               Grouped Catch-All Handlers (Hobby Plan Compliant)         |
 +-------------------+--------------------+--------------------+-----------+
                     |                    |                    |
        Public Read  |                    | Auth & State       | Server-Side
                     v                    v                    v Proxy Only
          +--------------------+ +--------------------+ +--------------------+
          | CoinGecko API v3   | | Supabase (Postgres)| | In-Memory Sliding  |
          | (Prices & Charts   | | - Users & Auth     | | Window Throttler   |
          |  Server Cached)    | | - Votes & Attempts | | (Per Warm Instance)|
          +--------------------+ | - User Progress    | +--------------------+
                                 +--------------------+
```

### Live API Health Endpoint
- **Live URL:** [https://web-3-gilt.vercel.app/api/health](https://web-3-gilt.vercel.app/api/health)
- *Note:* Because the backend runs on Vercel's free serverless tier, idle container instances may experience a brief cold start (3–5 seconds) on the initial request.

### API Endpoints Overview
- `GET /api/health` — Liveness & health probe returning operational status and server ISO timestamp.
- `GET /api/prices` — Server-side CoinGecko spot price proxy with memory cache fallback.
- `GET /api/chart?id=<coin>` — 7-day 60-point downsampled price trend chart proxy from CoinGecko.
- `GET /api/auth/nonce` — Generates a cryptographically random, single-use hex nonce expiring in 5 minutes.
- `POST /api/auth/verify` — Validates EIP-4361 personal signature against nonce, returning a 12-hour Bearer JWT.
- `GET /api/auth/me` — Authenticated endpoint returning the authenticated wallet address.
- `GET /api/compare/rows` — Returns educational Web2 vs Web3 comparative architectural rows.
- `GET /api/compare/poll` — Fetches live community votes and percentage ratios for Web2 vs Web3.
- `POST /api/compare/poll` — Records an authenticated or hashed-IP community ballot for Web2 vs Web3.
- `GET /api/compare/demo-state` — Returns current status (frozen / active) for educational simulation account.
- `POST /api/compare/demo-login` — Evaluates login attempt against simulation account frozen state.
- `POST /api/compare/demo-freeze` — Toggles simulation account frozen state for demonstration.
- `GET /api/quiz/questions` — Returns sanitized question bank without answers or explanations.
- `POST /api/quiz/submit` — Server-side score evaluation, records attempt to database (with address if authenticated).
- `GET /api/quiz/leaderboard` — Edge-cached (`s-maxage=30`) top 10 scores with caller's best rank.
- `GET /api/progress` — Authenticated retrieval of learner's completed checklist milestones.
- `PUT /api/progress` — Authenticated upsert of learner's progress (Zod-validated, max 50 keys, <4 KB).
- `GET /api/dao/proposal` — Retrieves live community proposal AIP-09 with vote counts and caller's choice.
- `POST /api/dao/vote` — Authenticated 1-wallet/1-vote ballot submission (`for`, `against`, or `abstain`).

### Passwordless Cryptographic Sign-In Flow
1. **Nonce Generation:** Client requests a fresh 16-byte random hex nonce from `GET /api/auth/nonce`. The backend stores the nonce in Supabase with a 5-minute expiry and `used: false`.
2. **Signature Request:** The client prompts the connected wallet (via `personal_sign`) to sign a human-readable, domain-bound EIP-4361 styled message containing the exact URI, nonce, and timestamp. No passwords or private keys are ever shared.
3. **Cryptographic Verification:** Client submits `{ address, message, signature }` to `POST /api/auth/verify`. The backend:
   - Validates template lines, matching URI against `ALLOWED_ORIGIN`.
   - Checks that the nonce is unused and within the 5-minute validity window.
   - Atomically marks the nonce as used to eliminate replay attacks.
   - Recovers the signer using `ethers.verifyMessage()` and asserts it matches the claim.
4. **JWT Issuance:** The backend issues a signed HMAC-SHA256 JWT with a 12-hour expiry and claims `{ sub: address }`.

### Security Architecture & Hardening Choices
- **Zero Secret Exposure:** `SUPABASE_SERVICE_KEY` and `JWT_SECRET` are strictly read from `process.env`. Frontend scripts contain zero secrets or database credentials.
- **Git-Ignored Environment:** All `.env` and `.env.*` files are explicitly excluded via root `.gitignore`.
- **Row Level Security (RLS) & Server-Mediated Access:** The frontend never connects directly to Supabase. All database access flows through hardened Vercel serverless functions using parameterized queries and prepared inputs.
- **Strict CORS Allow-List:** `backend/lib/cors.js` restricts origin to `process.env.ALLOWED_ORIGIN`, preflight `OPTIONS` requests are answered with `204 No Content`, and credentials/tokens are passed exclusively via HTTP `Authorization: Bearer` headers (no cookies).
- **Zod Input Validation:** Every incoming JSON body is parsed and validated against strict Zod schemas with sanitization and length bounds (e.g. 4 KB size limit, max 50 keys on progress sync).
- **Per-Container Sliding-Window Rate Limiting:** All endpoints apply in-memory throttling per warm container to prevent denial-of-service and brute-force traffic.
- **Safe Error Responses:** Backend catches internal errors and returns safe `{ error: "message" }` envelopes with standard HTTP status codes, never leaking raw database error stacks.

### Resilient Offline Fallback Behaviour
All network calls go through `js/api.js` which enforces a strict 4-second timeout via `AbortController`. If the backend is cold-starting, unreachable, or offline:
- The site **never blocks, crashes, or presents an error wall**.
- UI widgets display unobtrusive status badges (`Offline mode` or `not saved (offline)`).
- Learning modules fall back gracefully to client-side localStorage state, built-in question banks, procedural SVG charts, and local simulation sandboxes.

---

##  Folder Structure

```
decentralized-learning-hub/
├── 404.html               # Custom 404 error page with broken chain graphic
├── compare.html           # Web2 vs Web3 architectural comparison
├── index.html             # Homepage, hero, bento curriculum, and roadmap
├── lab.html               # 5 interactive browser simulation labs + live DAO ballot
├── learn.html             # The 6 core Web3 foundational pillars
├── market.html            # Cryptocurrency market telemetry and sparklines
├── quiz.html              # 10-question quiz, server scoring, & 3D flashcards
├── resources.html         # 23-term glossary, FAQ accordions & official links
├── wallet.html            # MetaMask wallet connection & security guide
├── web2-vs-web3.html      # Canonical redirect to compare.html
├── backend/               # Vercel serverless backend
│   ├── package.json       # Backend dependencies (@supabase/supabase-js, ethers, jsonwebtoken, zod)
│   ├── vercel.json        # Vercel configuration
│   ├── README.md          # Deployment guide & serverless configuration
│   ├── tests/
│   │   └── smoke.md       # Complete cURL smoke test suite
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...route].js   # Consolidated auth endpoints (nonce, verify, me)
│   │   ├── compare/
│   │   │   └── [...route].js   # Consolidated compare endpoints (rows, poll, demo)
│   │   ├── dao/
│   │   │   ├── proposal.js     # Live community DAO proposal tally (GET)
│   │   │   └── vote.js         # Authenticated DAO vote casting (POST)
│   │   ├── quiz/
│   │   │   └── [...route].js   # Consolidated quiz endpoints (questions, submit, leaderboard)
│   │   ├── chart.js            # 7-day coin trend proxy (GET)
│   │   ├── health.js           # Server health probe (GET)
│   │   ├── prices.js           # Spot price proxy (GET)
│   │   └── progress.js         # Authenticated progress sync (GET, PUT)
│   └── lib/
│       ├── auth.js        # JWT sign & Bearer token verification
│       ├── cors.js        # Strict origin CORS & error wrapper
│       ├── quizData.js    # Centralized question bank & answer explanations
│       ├── ratelimit.js   # In-memory sliding window limiter
│       └── supabase.js    # Service-role Supabase client
├── css/
│   ├── base.css           # Reset, typography, canvas positioning, focus rings
│   ├── components.css     # Buttons, badges, cards, forms, modal dialogs
│   ├── layout.css         # Floating navbar, drawer, footer, container grid
│   ├── pages.css          # Page-specific views, animations, and responsive styles
│   └── variables.css      # CSS design tokens (colors, radii, spacing, z-indices)
└── js/
    ├── api.js             # Resilient frontend API client (4s timeout, auth headers)
    ├── config.js          # API_BASE environment config
    ├── compare.js         # Interactive topology network diagram
    ├── lab.js             # Simulation controllers (Hashing, Contract, AMM, DAO)
    ├── layout.js          # Shared navbar, mobile drawer, footer, and progress bar
    ├── learn.js           # Interactive guide controller and 3D chain highlighter
    ├── market.js          # CoinGecko API fetcher and SVG sparkline generator
    ├── motion.js          # Scroll reveal, magnetic buttons, custom cursor
    ├── quiz.js            # Quiz state machine, flashcard flip & localStorage sync
    ├── resources.js       # Glossary search, A-to-Z filter & FAQ accordion logic
    ├── scene3d.js         # Three.js liquid aurora shader & 3D procedural coins
    ├── wallet.js          # MetaMask Web3 connector, auth state, & progress sync
    └── vendor/
        └── three.min.js   # Three.js (r128) library
```

---

##  How to Run Locally

Because Aether is built with pure web standards and zero build tools, you can run it immediately in any environment:

### Option 1: VS Code Live Server (Recommended)
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and select **"Open with Live Server"**.
4. The site will launch at `http://127.0.0.1:5500/index.html`.

### Option 2: Python HTTP Server
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 3: Node.js `npx serve`
```bash
npx serve .
```

---

##  Web3 Wallet Notes (MetaMask Integration)

- **Local Server or HTTPS Required:** Browser wallet extensions like MetaMask disable window injection on `file:///` protocols due to browser security sandboxing. To connect your real MetaMask wallet, access the site via a local web server (e.g. `http://localhost:8000`) or on the live [GitHub Pages deployment](https://shivendra07-run.github.io/decentralized-learning-hub/).
- **Simulated Demo Mode:** If no Web3 extension is detected (or when running directly from `file:///`), Aether automatically offers an educational **Simulated Wallet Mode**. This allows learners to explore wallet states, test signatures, and review balance flows without needing an extension installed.
- **Safety First:** Aether **never** prompts for private keys, seed phrases, or real cryptocurrency funds. All signature demos utilize `personal_sign` for educational verification only.

---

##  Educational Integrity & Honesty

- **Educational Simulation:** All interactive labs, DEX pools, staking calculators, and block miners are safe client-side educational models.
- **No Fabricated Stats:** No fake audit seals, invented protocol backers, artificial Total Value Locked (TVL), or exaggerated TPS claims are used.
- **Trademark Notice:** Cryptocurrency names, tickers, and brand glyphs (Bitcoin, Ethereum, Solana, etc.) are the property of their respective owners and are presented purely for informational instruction.
- **Not Financial Advice:** Spot market rates and educational modules are for educational review only and do not constitute financial, investment, or legal advice.
