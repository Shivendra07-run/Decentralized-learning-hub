# Aether Backend API Smoke Test Suite

This smoke test suite contains practical `curl` commands to verify all serverless endpoints against either a local development server or your live Vercel deployment.

Set your target host variable before running tests:
```bash
export API_BASE="https://web-3-gilt.vercel.app"
# Or for local development:
# export API_BASE="http://localhost:3000"
```

---

## 1. System Health & CORS

### 1.1 Liveness Probe (GET `/api/health`)
```bash
curl -i -X GET "$API_BASE/api/health"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "ok": true,
  "time": "2026-09-23T22:30:00.000Z"
}
```

### 1.2 CORS Preflight (OPTIONS `/api/health`)
```bash
curl -i -X OPTIONS "$API_BASE/api/health" \
  -H "Origin: https://shivendra07-run.github.io" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type"
```
**Expected Response (HTTP 204 No Content):**
```http
HTTP/2 204
access-control-allow-origin: https://shivendra07-run.github.io
access-control-allow-methods: GET, POST, PUT, OPTIONS
access-control-allow-headers: Authorization, Content-Type
access-control-max-age: 86400
```

---

## 2. Market Telemetry

### 2.1 Spot Prices (GET `/api/prices`)
```bash
curl -i -X GET "$API_BASE/api/prices"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "prices": [
    { "id": "bitcoin", "name": "Bitcoin", "symbol": "BTC", "usd": 63450.2, "change24h": 1.45 },
    { "id": "ethereum", "name": "Ethereum", "symbol": "ETH", "usd": 2680.15, "change24h": -0.82 }
  ],
  "fetchedAt": "2026-09-23T22:30:00.000Z",
  "stale": false
}
```

### 2.2 7-Day Chart Sparkline (GET `/api/chart?id=ethereum`)
```bash
curl -i -X GET "$API_BASE/api/chart?id=ethereum"
```
**Expected Response (HTTP 200 OK):**
```json
[
  { "t": 1727000000000, "price": 2645.12 },
  { "t": 1727010000000, "price": 2658.40 }
]
```

---

## 3. Cryptographic Wallet Authentication

### 3.1 Generate Nonce (GET `/api/auth/nonce`)
```bash
curl -i -X GET "$API_BASE/api/auth/nonce"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "nonce": "a1b2c3d4e5f6789012345678abcdef01"
}
```

### 3.2 Verify Signature (POST `/api/auth/verify`)
```bash
curl -i -X POST "$API_BASE/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890123456789012345678901234567890",
    "message": "Aether wants you to sign in with your Ethereum account:\n0x1234567890123456789012345678901234567890\n\nSign in to Aether. This does not cost gas and does not move funds.\n\nURI: https://shivendra07-run.github.io\nNonce: a1b2c3d4e5f6789012345678abcdef01\nIssued At: 2026-09-23T22:30:00.000Z",
    "signature": "0x..."
  }'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x1234567890123456789012345678901234567890"
}
```

### 3.3 Verify Authenticated Identity (GET `/api/auth/me`)
```bash
curl -i -X GET "$API_BASE/api/auth/me" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

---

## 4. Web2 vs Web3 Comparison & Poll

### 4.1 Comparison Rows (GET `/api/compare/rows`)
```bash
curl -i -X GET "$API_BASE/api/compare/rows"
```
**Expected Response (HTTP 200 OK):**
```json
[
  {
    "id": 1,
    "topic": "Data Ownership",
    "web2": { "title": "Corporate Custody", "text": "Databases owned by private servers" },
    "web3": { "title": "Self-Sovereign Identity", "text": "Users own assets via cryptographic keypairs" }
  }
]
```

### 4.2 Poll Counts (GET `/api/compare/poll`)
```bash
curl -i -X GET "$API_BASE/api/compare/poll?poll=web2-vs-web3"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "web2": 14,
  "web3": 82,
  "depends": 29,
  "total": 125
}
```

### 4.3 Submit Poll Vote (POST `/api/compare/poll`)
```bash
curl -i -X POST "$API_BASE/api/compare/poll" \
  -H "Content-Type: application/json" \
  -d '{
    "poll": "web2-vs-web3",
    "choice": "web3"
  }'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "web2": 14,
  "web3": 83,
  "depends": 29,
  "total": 126
}
```

### 4.4 Simulation Account State (GET `/api/compare/demo-state`)
```bash
curl -i -X GET "$API_BASE/api/compare/demo-state"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "username": "demo_user",
  "frozen": false
}
```

### 4.5 Simulation Freeze Toggle (POST `/api/compare/demo-freeze`)
```bash
curl -i -X POST "$API_BASE/api/compare/demo-freeze" \
  -H "Content-Type: application/json" \
  -d '{ "frozen": true }'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "ok": true,
  "frozen": true
}
```

---

## 5. Quiz & Verified Leaderboard

### 5.1 Question Bank (GET `/api/quiz/questions`)
*(Note: Correct answers and explanations are never transmitted here)*
```bash
curl -i -X GET "$API_BASE/api/quiz/questions"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "questions": [
    {
      "id": 1,
      "category": "BLOCKCHAIN FOUNDATIONS",
      "question": "What fundamentally prevents past transactions from being altered on a blockchain?",
      "options": [
        "A centralized bank administrator locks the database at midnight",
        "Each block includes the cryptographic hash of the previous block, creating an unbroken mathematical chain",
        "Federal digital copyright regulations make editing records illegal",
        "The network automatically erases transaction history every 24 hours"
      ]
    }
  ]
}
```

### 5.2 Submit Answers for Server Scoring (POST `/api/quiz/submit`)
```bash
curl -i -X POST "$API_BASE/api/quiz/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <OPTIONAL_JWT_TOKEN>" \
  -d '{
    "answers": [
      { "id": 1, "choice": 1 },
      { "id": 2, "choice": 1 },
      { "id": 3, "choice": 2 }
    ]
  }'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "score": 3,
  "total": 10,
  "results": [
    {
      "id": 1,
      "correct": true,
      "correctChoice": 1,
      "explanation": "Every block seals the cryptographic hash of the prior block..."
    }
  ]
}
```

### 5.3 Fetch Verified Leaderboard (GET `/api/quiz/leaderboard`)
```bash
curl -i -X GET "$API_BASE/api/quiz/leaderboard" \
  -H "Authorization: Bearer <OPTIONAL_JWT_TOKEN>"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "address": "0x1234...abcd",
      "score": 10,
      "total": 10,
      "created_at": "2026-09-23T21:00:00.000Z"
    }
  ],
  "userBest": {
    "rank": 1,
    "address": "0x1234...abcd",
    "score": 10,
    "total": 10,
    "created_at": "2026-09-23T21:00:00.000Z"
  }
}
```

---

## 6. Progress Synchronization

### 6.1 Retrieve Progress (GET `/api/progress`)
```bash
curl -i -X GET "$API_BASE/api/progress" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "data": {
    "roadmap_b1": true,
    "roadmap_b2": true,
    "learn_blockchain": true,
    "quiz_best_score": 9
  }
}
```

### 6.2 Upsert Progress (PUT `/api/progress`)
```bash
curl -i -X PUT "$API_BASE/api/progress" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "data": {
      "roadmap_b1": true,
      "roadmap_b2": true,
      "roadmap_b3": true,
      "learn_blockchain": true,
      "quiz_best_score": 10
    }
  }'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "ok": true,
  "data": {
    "roadmap_b1": true,
    "roadmap_b2": true,
    "roadmap_b3": true,
    "learn_blockchain": true,
    "quiz_best_score": 10
  }
}
```

---

## 7. Live DAO Governance Ballot

### 7.1 View Proposal AIP-09 & Current Counts (GET `/api/dao/proposal`)
```bash
curl -i -X GET "$API_BASE/api/dao/proposal" \
  -H "Authorization: Bearer <OPTIONAL_JWT_TOKEN>"
```
**Expected Response (HTTP 200 OK):**
```json
{
  "proposal": {
    "id": "p1",
    "title": "AIP-09: Allocate 25,000 AETH to Decentralized Security Auditing & Developer Guides",
    "description": "Allocate treasury resources to fund independent smart contract audits...",
    "created_at": "2026-09-01T00:00:00.000Z",
    "closes_at": null
  },
  "counts": {
    "for": 42,
    "against": 5,
    "abstain": 3,
    "total": 50
  },
  "userChoice": "for"
}
```

### 7.2 Cast Authenticated 1-Wallet/1-Vote Ballot (POST `/api/dao/vote`)
```bash
curl -i -X POST "$API_BASE/api/dao/vote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "proposalId": "p1",
    "choice": "for"
  }'
```
**Expected Response (HTTP 200 OK):**
```json
{
  "ok": true,
  "proposalId": "p1",
  "userChoice": "for",
  "counts": {
    "for": 43,
    "against": 5,
    "abstain": 3,
    "total": 51
  }
}
```
