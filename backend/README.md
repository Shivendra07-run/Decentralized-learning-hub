# Aether Backend Serverless API

Lightweight, secure Node.js serverless functions running on Vercel to support the Aether Web3 Education platform.

---

## 🛠 Tech Stack & Architecture

- **Runtime:** Node.js 18+ (CommonJS)
- **Host:** Vercel Serverless Functions (`/backend/api/*`)
- **Dependencies:** `@supabase/supabase-js`, `ethers` (v6), `jsonwebtoken`, `zod`
- **Security:** Strict CORS origin checks, in-memory rate limiting, 12-hour JWT Bearer authentication, zero secret leakage.

---

## 🚀 How to Deploy on Vercel

1. **Import the Project in Vercel:**
   - Link your GitHub repository (`decentralized-learning-hub`).
   - Under **General Settings** -> **Root Directory**, click **Edit** and set it to:
     ```
     backend
     ```
   - Keep framework preset as **Other**.

2. **Configure Environment Variables:**
   Under **Project Settings** -> **Environment Variables**, add the following 4 secrets:

   | Variable Name | Description | Example |
   |---------------|-------------|---------|
   | `SUPABASE_URL` | Your Supabase project URL | `https://xyzproject.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | Supabase service_role secret key | `eyJhbGciOi...` |
   | `JWT_SECRET` | Cryptographically secure random secret (32+ chars) | `your-secure-random-jwt-secret-string` |
   | `ALLOWED_ORIGIN` | Authorized frontend origin (*not a path*) | `https://shivendra07-run.github.io` |

   > **Note:** For local frontend testing, set `ALLOWED_ORIGIN` to `http://localhost:3000` or `http://127.0.0.1:5500`.

3. **Deploy:**
   - Click **Deploy**. Vercel will install the allowed dependencies and deploy your `/api` serverless routes.
   - Once deployed, copy your production domain (e.g., `https://your-aether-backend.vercel.app`).
   - Paste it into `js/config.js` in the frontend root:
     ```javascript
     window.Aether.config = {
       API_BASE: "https://your-aether-backend.vercel.app"
     };
     ```

---

## 🧪 Testing Endpoints with cURL

### 1. Test Health Endpoint
```bash
curl -i -X GET "https://your-aether-backend.vercel.app/api/health"
```
**Expected Response (HTTP 200):**
```json
{
  "ok": true,
  "time": "2026-09-22T20:00:00.000Z"
}
```

### 2. Test CORS Preflight (OPTIONS)
```bash
curl -i -X OPTIONS "https://your-aether-backend.vercel.app/api/health" \
  -H "Origin: https://shivendra07-run.github.io" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"
```
**Expected Response (HTTP 204 No Content):**
```
HTTP/2 204
access-control-allow-origin: https://shivendra07-run.github.io
access-control-allow-methods: GET, POST, OPTIONS
access-control-allow-headers: Authorization, Content-Type
access-control-max-age: 86400
```

---

## 🔒 Security Best Practices

- **Never Commit Secrets:** `.env` and `.env.local` files are ignored in `.gitignore`.
- **Serverless Rate Limiting:** All endpoints apply in-memory sliding-window throttling per warm instance.
- **Fail-Safe Client:** If the backend is offline or unreachable, the frontend gracefully falls back to local client-side mode with a visual indicator.
