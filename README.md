# KisanSetu

**"Know the Market. Choose the Right Buyer."**

A working prototype for **Smart India Hackathon — Problem Statement 26132**
("Strengthening market linkages and price discovery for farmers"),
Government of Maharashtra / Maharashtra State Innovation Society.

This is a functional full-stack application, not a mockup. The backend runs
real deterministic algorithms over seeded, realistic Maharashtra agri-market
data; every screen is wired to live API calls.

---

## 1. Core idea / differentiator

Most price-discovery tools show **headline mandi price**. That's not what
determines what a farmer actually takes home. KisanSetu's central
product story is:

> **Net Realization + Explainable Market/Buyer Matching** —
> *"Where should this farmer sell this particular lot, to maximize realistic
> net realization while considering logistics, quality, demand and buyer
> reliability?"*

`Net Realization = Selling Price − Transport Cost − Market Charges − Storage Cost`

Every recommendation the platform makes shows its component scores and a
plain-language "Recommended because..." explanation — never a black box.

**AI is deliberately not the product.** The entire core platform — price
comparison, net realization, buyer matching, quality grading, storage
decisions — runs on structured data and rule-based/statistical algorithms in
[`server/lib/algorithms.js`](server/lib/algorithms.js). There is exactly
**one** optional AI endpoint (`/api/assistant/ask`), and the whole app
functions normally if it's disabled or unreachable.

---

## 2. Architecture

```
krishisetu-market/
├── server/                 Node.js + Express API
│   ├── index.js             App entrypoint
│   ├── db.js                SQLite connection + schema
│   ├── seed.js               Deterministic demo-data seeder
│   ├── data/distances.js     Static district-distance table (no paid maps API)
│   ├── lib/algorithms.js     ALL core deterministic logic (net realization,
│   │                         trend/volatility, market scoring, buyer matching,
│   │                         quality grading, store-vs-sell-now)
│   └── routes/
│       ├── auth.js           Mock role-based login
│       ├── crops.js
│       ├── markets.js        Price discovery + market comparison (Modules 2–3)
│       ├── lots.js           Lot CRUD, grading, storage decision (Modules 6,7,10)
│       ├── buyers.js         Marketplace, demand posts, matching (Modules 4,5,15)
│       ├── offers.js         Digital offers: accept/reject/counter (Module 8)
│       ├── transactions.js   Lifecycle, logistics, payments (Modules 9,11)
│       ├── fpo.js            FPO aggregation (Module 13)
│       ├── storage.js        Storage facility discovery (Module 10)
│       ├── grievances.js     Dispute workflow (Module 12)
│       ├── admin.js          Market authority dashboard stats (Module 14)
│       ├── assistant.js      Single optional AI endpoint (Module 17)
│       ├── notifications.js  In-app notifications (offers, grievance updates)
│       └── forecast.js       Price forecast baseline (Module M5, see §3a)
│
└── client/                 React + TypeScript + Vite + Tailwind
    └── src/
        ├── context/AuthContext.tsx   Mock session (localStorage)
        ├── lib/api.ts, types.ts      Fetch wrapper (offline-aware, see §3b)
        ├── i18n/                     English/Hindi/Marathi/Telugu, dot-keyed
        ├── components/Layout.tsx     Sidebar (desktop) / bottom nav (mobile)
        ├── components/ui.tsx         Badges, stat cards, score bars
        └── pages/                    One page per module (see below), incl.
                                       Forecast.tsx
```

### Data model (SQLite)

`users, farmers, fpos, buyers, crops, markets, market_prices, lots,
quality_grades, buyer_demands, offers, transactions, logistics,
storage_facilities, payments, grievances, notifications, forecast_runs` — all
relationally linked (see `server/db.js` for full schema with foreign keys).

---

## 3. Core algorithms (all deterministic — see `server/lib/algorithms.js`)

| Function | What it computes |
|---|---|
| `calcTransportCost` | Rule-based ₹/quintal transport cost from distance + quantity (no paid maps API — uses a static district-distance table) |
| `calcMarketCharges` | APMC cess + commission + handling as % of price |
| `calcNetRealization` | Price − transport − market charges − storage |
| `calcTrend` / `calcVolatility` | Moving average, % change, coefficient-of-variation over price history |
| `scoreSellingOption` | 0–100 recommendation score for a market: Price (35) + Logistics (20) + Demand (20) + Quality match (15) + Timing (10) |
| `scoreBuyerMatch` | 0–100 match score for a buyer demand vs a lot: Crop (25) + Quality (20) + Quantity (15) + Price (20) + Logistics (10) + Timing (10) |
| `computeGrade` | Grade A/B/C from size, moisture, damage%, foreign material%, appearance — no computer vision |
| `compareStoreVsSellNow` | Sell-now vs. store-and-sell-later net realization, using a 14-day linear trend projection explicitly framed as a *scenario estimate*, never a guarantee |

Every score returns its **named components**, and every route that uses
these functions also returns a `reasons` array in plain language — this
powers the "Recommended because..." UI throughout the app.

---

## 3a. Price Forecast (M5)

`GET /api/forecast?cropId=&marketId=&horizonDays=` returns a small
ridge-regression forecast trained fresh, on every request, directly from
`market_prices` — nothing is precomputed or hardcoded. See
`docs/MODEL_CARD.md` for the full methodology (why ridge regression, why
not a fancier model, exact seeded row counts) and `server/lib/forecast.js`
for the pure, dependency-free implementation.

- Response shape (contract §4): `predictedPrice, mae, rmse, r2,
  trainedOnRows, method, note`.
- If there isn't enough history for the requested crop/market, the
  endpoint returns **HTTP 200** with `{ "error": "insufficient historical
  data for this crop/market", "trainedOnRows": N }` — this is treated as a
  normal, honestly-labeled outcome, not a failure state, and the frontend
  (`client/src/pages/Forecast.tsx`) renders it as a plain message rather
  than an error banner.
- Every request is logged to `forecast_runs` for auditability.
- The `note` field always states the training sample size and horizon and
  explicitly calls this a small-sample baseline, never a production
  forecast — R² can legitimately be negative on some crop/market pairs
  given the seeded ~30-day history per pair; that's an honest result of
  the data size, not a bug.

## 3b. Notifications, PWA & Offline

- **Notifications** (`server/routes/notifications.js`): a lightweight
  `notifications` table, populated automatically when a buyer makes an
  offer (notifies the lot owner) or an admin updates a grievance (notifies
  whoever raised it). The bell icon in `Layout.tsx` polls
  `GET /api/notifications?userId=` and supports marking a notification read.
- **PWA**: `client/public/manifest.json` + icons make the app installable;
  `client/public/sw.js` is a plain-JS service worker (no build step) that
  caches the app shell (network-first for the HTML entry point, so rebuilt
  translations/screens are never stuck stale) and caches `GET /api/*`
  responses (network-first, cache-fallback-on-failure).
- **Offline**: writes (POST/PATCH) are never queued — `client/src/lib/api.ts`
  fails fast with a clear "you're offline" message instead of a silent
  network error. A previously-viewed `GET` response still renders when
  offline, tagged via an `X-KS-Cache: hit` response header so the UI can
  show a "showing last-known data" indicator instead of presenting stale
  data as current (data-honesty rule, contract §8).

---

## 4. How to run locally

Requires Node.js 18+.

### Backend
```bash
cd server
npm install
npm run seed      # populates SQLite with realistic demo data
npm run dev        # starts API on http://localhost:4000
```

### Frontend (separate terminal)
```bash
cd client
npm install
npm run dev         # starts Vite dev server on http://localhost:5173
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to the
Express backend automatically (see `client/vite.config.ts`).

### Optional AI assistant
The platform runs fully without any AI key. To enable the single optional
assistant endpoint with LLM-phrased answers instead of the rule-based
fallback, set an environment variable before starting the server:
```bash
export ANTHROPIC_API_KEY=sk-...
npm run dev
```
If unset, unreachable, or rate-limited, `/api/assistant/ask` automatically
falls back to rule-based template answers built from the same platform
data — the response includes `"source": "rule-based-fallback"` so this is
never hidden from the evaluator.

---

## 5. Demo credentials

Password for every account: **`demo123`**

| Role | Username | Name |
|---|---|---|
| Farmer | `farmer1` | Ganesh Pawar (Niphad, Nashik) |
| Farmer | `farmer2` | Suresh Chavan (Lasalgaon, Nashik) |
| FPO | `fpo1` | Nashik Onion Producer Co. Ltd (42 members, 12 seeded) |
| Buyer | `buyer1` | Maharashtra Agro Foods Pvt Ltd (Processor) |
| Buyer | `buyer2` | FreshChain Retail (Retail chain) |
| Admin | `admin1` | MSIS Market Authority Desk |

The login screen has one-click buttons for all six accounts.

---

## 6. End-to-end demo storyline (for judges)

**Farmer journey:**
1. Log in as `farmer1` → Dashboard shows active lots, pending offers.
2. **Market Intelligence** → select Onion, 18 quintals, Nashik → see the
   top-recommended market with its full "Recommended because..." breakdown
   and 30-day price trend chart.
3. **Market Comparison** → sort by net realization / price / distance /
   demand, expand "Why?" on any row.
4. **My Lots** → open `LOT-2026-0031` → see matching buyers with match %
   and reasons, accept/reject/counter a pending offer, run the
   sell-now-vs-store calculator.
5. **Price Forecast** → pick the same crop/market, run a forecast → see
   predicted price with MAE/RMSE/R² and the demo-data disclaimer. Try an
   under-traded crop/market pair to see the honest "insufficient data"
   response.
6. **Transactions & Logistics** → after accepting an offer, walk the deal
   through Invoice → Dispatch → Delivery → Payment Initiated → Received.
7. Bell icon → see the "new offer received" notification generated when
   the offer first came in.

**FPO journey:**
1. Log in as `fpo1` → **FPO Aggregation** → see 12 member farmers' individual
   lots rolled up by crop/grade, select several open lots, create one
   larger buyer-ready aggregated lot (`LOT-2026-0048` already seeded as an
   example — 120 quintals from two farmer lots).

**Buyer journey:**
1. Log in as `buyer1` → **Marketplace** → post a demand, or browse open
   lots and submit a digital offer with price/quantity/delivery terms.

**Dispute journey:**
1. Log in as `farmer2` → **Grievances** → a seeded "Payment delay" case
   (`GRV-6001`) is already Under Review.
2. Log in as `admin1` → **Grievances** → update its status, add resolution
   notes → the farmer/FPO/buyer who raised it receives an in-app
   notification.

**Admin/market-authority journey:**
1. Log in as `admin1` → **Admin Dashboard** → registered farmers, verified
   buyers, active lots, disputes, average net realization, and six charts
   (price trend, lot status, buyer demand by crop, transaction stages,
   dispute resolution).

---

## 7. Key innovation points

- **Net realization, not headline price**, as the primary ranking signal —
  directly targets the stated problem of farmers selling immediately due to
  information asymmetry.
- **Fully explainable recommendations** — every score is broken into named,
  weighted components with plain-language reasons, satisfying the
  "explainable decision support" judging criterion without any black-box AI.
- **FPO aggregation** turns fragmented small-farmer supply into
  buyer-ready volume, directly addressing the buyer-side aggregation problem
  stated in the brief.
- **Cost-conscious by design**: zero paid APIs anywhere in the core
  platform (no Google Maps, no payment gateway, no mandatory LLM calls);
  the one optional AI endpoint degrades gracefully.
- **Transparent buyer verification** (verified business / documents
  verified / transactions completed / payment reliability / response
  rate) instead of unverifiable "100% trusted" claims.
- **Hedged, honest language** around price projections — "favorable
  selling window" / "scenario estimate," never a guaranteed future price.

---

## 8. Replacing demo data with real integrations later

| Prototype component | Path to production |
|---|---|
| Static district-distance table (`data/distances.js`) | Swap for a routing API (OSRM self-hosted, or a paid maps API) once budget allows |
| Seeded `market_prices` | Ingest from Maharashtra APMC / Agmarknet daily price feeds |
| Mock authentication | Replace with OTP/Aadhaar-linked auth and real JWT sessions |
| Mock payments | Integrate a licensed payment gateway / UPI settlement partner |
| Manual quality grading | Optionally add computer-vision-assisted grading as a supplementary signal, kept alongside — not replacing — manual verification |
| SQLite | Migrate to PostgreSQL (e.g. via Supabase) for multi-instance deployment |
| Single optional assistant | Can be scaled to more LLM-assisted screens once usage patterns and budget justify it, always with a working non-AI fallback |

---

## 9. Scalability plan

- Stateless Express API → horizontally scalable behind a load balancer.
- SQLite → PostgreSQL migration path is a schema-compatible lift (same
  column types, straightforward Prisma/Knex migration if adopted).
- District-distance table and price-charge formulas are the only
  Maharashtra-specific hardcoding; both are isolated in `data/` and
  `lib/algorithms.js`, so extending to other states means adding new
  distance/market data, not rewriting logic.
- The matching and scoring engines are O(markets) / O(open demands) per
  request — trivial to cache or pre-compute at higher scale.

---

## 10. Honesty notes (per hackathon anti-fabrication requirement)

- All prices, buyers, farmers, and transactions are **seeded demo data**,
  clearly marked with a "Demo data" tag in the relevant screens.
- No claim of live government data integration, production readiness, or
  guaranteed farmer income improvement is made anywhere in the UI or docs.
- Price trend/projection language is deliberately hedged
  ("favorable selling window", "scenario estimate") rather than predictive.
- The Price Forecast module (§3a) states its training sample size and
  method on every response and never overstates a small-sample ridge
  regression as a production-grade prediction.
