# Hope Link — Backend API

A multi-portal REST API connecting NGOs with volunteers across Lebanon. The system handles three completely isolated role contexts (Admin, Charity, Volunteer) under a single Express server, with a background job pipeline for personalized opportunity ranking, family-based JWT session management, and real-time Socket.io chat rooms tied to the volunteer lifecycle.

The most technically interesting part is how opportunity ranking works at scale — covered in depth below.

---

## What This Project Demonstrates

- Designing a **pre-computation pipeline** to move expensive work off the request path
- **Idempotent background jobs** with BullMQ + Upstash Redis, including retry safety and deduplication
- **Family-based refresh token rotation** with theft detection that invalidates entire session families
- Separating business logic cleanly across three role contexts without route or service bleed
- Schema design for a multi-sided platform: users, charities, opportunities, applications, rooms, ratings, certificates
- Real-time room lifecycle management tied to application state changes

---

## Key Engineering Challenges

### Personalized Opportunity Ranking at Scale

Volunteers see opportunities ordered by match score — computed from skills overlap, preferred city, preferred category, and availability days. The straightforward implementation breaks quickly.

**The naïve approach:**
```js
// ❌ Fetches the entire table on every paginated request
const all = await prisma.volunteeringOpportunity.findMany({ where: { status: "OPEN" } });
const scored = all.map(opp => ({ ...opp, matchScore: computeScore(profile, opp) }));
scored.sort((a, b) => b.matchScore - a.matchScore);
return scored.slice(skip, skip + limit);
```

This works at 50 rows. At 10,000+ it fetches the full table on every page load — unbounded memory, unbounded latency, no pagination safety.

**The solution — precomputed scores, background jobs, indexed reads:**

Scores are stored in a dedicated junction table written by a background worker:

```
VolunteerMatchScore
  volunteerId   Int   ──→ User
  opportunityId Int   ──→ VolunteeringOpportunity
  score         Float
  computedAt    DateTime

  @@id([volunteerId, opportunityId])
  @@index([volunteerId, score(sort: Desc)])   ← ORDER BY score becomes a B-tree scan
```

At query time the endpoint does a single indexed lookup — no scoring, no table scan:

```js
// ✅ Page 2 is as fast as page 1
prisma.volunteerMatchScore.findMany({
  where:   { volunteerId, opportunity: { status: "OPEN", ...filters } },
  orderBy: [{ score: "desc" }, { opportunity: { createdAt: "desc" } }],
  skip,
  take: limit,
  include: { opportunity: { include: OPPORTUNITY_INCLUDE } },
})
```

**When scores are recomputed:**

| Trigger | Job |
|---|---|
| Volunteer updates profile, skills, or preferences | `score:volunteer` — re-scores all OPEN opportunities for that volunteer |
| Charity creates or reopens an opportunity | `score:opportunity` — scores all volunteers against that opportunity |
| Platform backfill (one-time script) | `score:volunteer` enqueued for every existing volunteer |

**Fallback:** Volunteers with no profile data skip the scoring pipeline entirely. The endpoint falls back to `createdAt DESC` pagination and returns `hasScores: false` so the frontend suppresses the match badge UI.

---

## System Design Decisions

**Why BullMQ + Upstash Redis instead of scoring inline?**
Scoring inline on write (e.g. on profile save) is synchronous and blocks the response. With 10,000+ opportunities per volunteer, that's an unbounded synchronous operation. Moving it to a queue decouples write latency from scoring cost entirely.

**Why Upstash Redis specifically?**
Upstash is serverless and TLS-enabled out of the box. BullMQ v5 requires raw ioredis connection options (not a shared ioredis instance) — the `REDIS_URL` is parsed into a connection config object so the Queue and Worker each create their own dedicated connections, which is the correct pattern for BullMQ.

**Freshness vs. performance tradeoff**
Scores are eventually consistent — there's a short window between a profile save and the worker completing where the old scores are still served. This is an intentional tradeoff: the alternative (synchronous scoring) makes every profile update proportionally slower as the opportunity count grows. For a volunteering platform, stale-by-seconds ranking is acceptable.

**Idempotent writes**
The worker uses `INSERT ... ON CONFLICT DO UPDATE` so jobs can be retried safely without producing duplicate rows or corrupting existing scores:

```js
await prisma.$executeRaw`
  INSERT INTO "VolunteerMatchScore" ("volunteerId", "opportunityId", score, "computedAt")
  VALUES ${Prisma.join(tuples)}
  ON CONFLICT ("volunteerId", "opportunityId")
  DO UPDATE SET score = EXCLUDED.score, "computedAt" = NOW()
`;
```

**Job deduplication**
Jobs use a stable `jobId` (`volunteer-{id}`) so rapid profile saves within a short window don't stack duplicate scoring jobs in the queue.

**Stale score cleanup**
After scoring, the `score:volunteer` job deletes rows for opportunities no longer in `OPEN` status, keeping the table lean and avoiding stale scores from surfacing in ranked results.

**Family-based token rotation**
Each login creates a refresh token "family". On every refresh, the old token is revoked and a new pair issued within the same family. If a revoked token is reused — indicating theft — the entire family is immediately invalidated, logging out every device in that session.

**Two-hop aggregation problem**
Prisma's `_count` can't span two relations (`Project → Opportunity → Application`). Project-level application counts are computed with a raw `LEFT JOIN` query and shared via a utility function used by both the charity and admin portals — avoiding duplicated raw SQL.

---

## Architecture

All three portals share one server. Role middleware enforces access at the route level. The background worker runs in the same process on startup.

```
                     ┌─────────────────────────────────────┐
                     │          Express Server :5000        │
                     └────────┬──────────┬─────────────────┘
                              │          │
          ┌───────────────────┼──────────┼──────────────────┐
          │                   │          │                   │
     /api/auth           /api/admin  /api/charity       /api/user
     Public              ADMIN role  CHARITY role        USER role
                              │          │                   │
                     platform config   opportunities     match-ranked feed
                     user management   applications      volunteer rooms
                     charity review    ratings           certificates
                     audit logs        analytics         profile & prefs
                     reports

                     ┌──────────────────────────────────────┐
                     │  BullMQ Worker  (concurrency: 5)      │
                     │  ← Upstash Redis queue                │
                     │  score:volunteer / score:opportunity  │
                     └──────────────────────────────────────┘
```

Every request: **JWT middleware → role check → controller → service → Prisma**

---

## Project Structure

```
hopelink-api/
├── prisma/
│   ├── schema.prisma           # All models and enums
│   ├── seed.js                 # Lebanese mock data (6 volunteers, 5 charities, 9 opportunities)
│   └── migrations/
│
└── src/
    ├── server.js               # HTTP + Socket.io entry point, registers BullMQ worker
    ├── app.js                  # Express setup and route mounting
    │
    ├── config/
    │   ├── auth.config.js      # Token TTLs, lockout thresholds
    │   ├── prisma.js           # Singleton Prisma client
    │   ├── redis.js            # Upstash Redis connection options (parsed from REDIS_URL)
    │   └── supabase.config.js  # Supabase storage client
    │
    ├── jobs/
    │   ├── matchScoreQueue.js      # BullMQ Queue — publishes score:volunteer / score:opportunity
    │   ├── matchScoreWorker.js     # BullMQ Worker — batch-upserts VolunteerMatchScore rows
    │   ├── scoreOpportunity.js     # Pure scoring function (skills, days, category, city weights)
    │   └── backfillScores.js       # One-time script — enqueues score:volunteer for all volunteers
    │
    ├── middlewares/
    │   ├── auth.js             # JWT validation
    │   ├── restrictTo.js       # Role guard (ADMIN / CHARITY / USER)
    │   ├── attachCharity.js    # Resolves charityId from logged-in user
    │   ├── validate.js         # Joi body validation
    │   ├── parsePagination.js  # Parses page/limit query params → req.pagination
    │   └── rateLimiter.js      # Brute-force protection on auth routes
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── upload.routes.js
    │   ├── post.routes.js      # Community feed (shared USER + CHARITY)
    │   ├── admin/
    │   ├── charity/
    │   └── user/
    │
    ├── controllers/            # Thin wrappers: parse request, call service, return response
    │                           # All handlers are wrapped with asyncHandler — no try/catch boilerplate
    ├── services/               # All business logic lives here
    │
    ├── events/
    │   └── notificationEmitter.js  # Node.js EventEmitter for decoupled in-app notifications
    │
    ├── sockets/
    │   └── room.socket.js      # Socket.io volunteer chat rooms
    │
    ├── utils/
    │   ├── response.js         # Standardized { success, message, data } envelope
    │   ├── asyncHandler.js     # Wraps controller fns — catches thrown errors automatically
    │   ├── security.js         # IP parsing, token hashing
    │   └── generateToken.js    # JWT + refresh token generation
    │
    └── cron/
        └── cleanupRefreshTokens.js  # Deletes expired refresh tokens daily
```

---

## Controller Conventions

### `asyncHandler`

Every controller function is wrapped with `asyncHandler` from `src/utils/asyncHandler.js`. This eliminates per-handler `try/catch` boilerplate — services throw `{ status, message }` objects and the wrapper normalizes them into the standard error envelope automatically.

**Before:**
```js
export async function listOpportunities(req, res) {
  try {
    const data = await opportunityService.list(req.query);
    return success(res, "Fetched", data);
  } catch (err) {
    return failure(res, err.message || "Something went wrong", err.status || 500);
  }
}
```

**After:**
```js
export const listOpportunities = asyncHandler(async (req, res) => {
  const data = await opportunityService.list(req.query);
  return success(res, "Fetched", data);
});
```

For cases that need specific error-code handling (e.g. Prisma P2002 → 409), controllers use an inner `try/catch` only for that path while still being wrapped by `asyncHandler` for everything else.

---

### `parsePagination` middleware

Attached to any route that accepts `?page=` and `?limit=` query parameters. Parses, clamps, and attaches `req.pagination` so controllers never repeat the same arithmetic:

```js
// Route
router.get("/", parsePagination({ defaultLimit: 10, maxLimit: 100 }), listOpportunities);

// Controller
const { page, limit, skip, take } = req.pagination;
```

`req.pagination` shape:

| Field | Value |
|---|---|
| `page` | Parsed page number, minimum 1 |
| `limit` | Parsed limit, clamped to `[1, maxLimit]` |
| `skip` | `(page - 1) * limit` — Prisma `skip` |
| `take` | Same as `limit` — Prisma `take` |

---

## Authentication

Two `HttpOnly` cookies — no JavaScript access.

| Token | Cookie | TTL | Purpose |
|---|---|---|---|
| Access token | `access_token` | 20 min | Sent with every request |
| Refresh token | `refresh_token` | 7 days | Rotates the pair silently |

- **Family-based rotation:** Revoked token reuse invalidates the entire session family instantly
- **Account lockout:** 5 failed logins → 15-min lockout
- **Rate limiting:** 10 auth requests per 15-min window
- **Session limits:** Max 5 concurrent sessions per user

Cookie lifetimes are defined as named constants in `auth.controller.js`:

```js
const ACCESS_TOKEN_TTL  = 20 * 60 * 1000;        // 20 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
```

All three auth paths (login, register, refresh) write cookies through a single `setAuthCookies(res, accessToken, refreshToken)` helper instead of duplicating the `res.cookie()` calls in each handler.

---

## API Surface

All responses use a consistent envelope: `{ success, message, data }`.

**Auth** (`/api/auth` — public): register, login, logout, silent refresh, session management

**Admin** (`/api/admin` — ADMIN role): dashboard stats, full user and charity management, registration and verification request review, reports, platform settings, audit log, API key management

**Charity** (`/api/charity` — CHARITY role): profile, project and opportunity CRUD, application review (approve/decline), volunteer ratings, bulk certificate issuance, analytics dashboard, volunteer roster, real-time room management

**User** (`/api/user` — USER role): match-ranked opportunity feed with filters, application management, volunteer rooms, certificates, experience history, volunteering preferences, notifications, community feed


---

## Real-time Chat

Socket.io runs on the same port as the REST API. Room lifecycle is fully managed server-side:

- Room created automatically on first application approval
- Room closed automatically when `PATCH /opportunities/:id/end` is called
- Only approved volunteers and the owning charity can join
- Closed rooms reject new messages and joins
- Full message history available via REST

```js
const socket = io("http://localhost:5000", { auth: { token: "jwt-access-token" } });
// Client events: join_room · send_message · leave_room · typing
// Server events: joined_room · new_message · user_joined · user_left · user_typing · error
```

---

## Security

| Feature | Detail |
|---|---|
| Password hashing | bcrypt, 12 salt rounds |
| Tokens | JWT access (20 min) + SHA-256-hashed refresh (7 days), both HttpOnly |
| Token rotation | Family-based — revoked token reuse invalidates all sessions in the family |
| Session limits | Max 5 concurrent sessions per user |
| Account lockout | 5 failed logins → 15-min lockout |
| Rate limiting | 10 auth requests per 15-min window |
| Role isolation | `restrictTo` middleware on every protected route |
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Audit logging | Every admin action logged with userId, IP, action, and target |
| Input validation | Joi schemas run before any controller |
| Socket auth | JWT validated on every Socket.io handshake |
| Soft deletes | Users and charities deactivated, never hard-deleted |

---

## Data Models

```
User
 ├── BaseProfile           phone, avatar, city (City enum), bio
 ├── VolunteerProfile      availability, experience, isVerified
 │    ├── VolunteerSkill[]
 │    ├── VolunteerPreference[]  (CITY / CATEGORY)
 │    └── VolunteerExperience[]
 ├── VolunteerMatchScore[] ←── VolunteeringOpportunity  (pre-computed scores)
 ├── CharityAccount        city (City enum)
 │    ├── CharityProject
 │    │    └── VolunteeringOpportunity    location (City enum)
 │    │         ├── OpportunityApplication  ←── User
 │    │         ├── VolunteerMatchScore[]   ←── User
 │    │         ├── VolunteerRoom
 │    │         │    ├── RoomMember         ←── User
 │    │         │    └── RoomMessage        ←── User
 │    │         ├── VolunteerRating         ←── User
 │    │         └── Certificate             ←── User
 │    └── VolunteerRating[]
 ├── Post[]
 │    ├── PostLike[]
 │    └── PostComment[]
 ├── RefreshToken[]
 ├── AccountLockout
 ├── AuditLog[]
 └── Notification[]
```

**Opportunity lifecycle:** `OPEN` → `FULL` (auto when approved = maxSlots) → `ENDED` or `CANCELLED`

**Enums:**
- Category: `EDUCATION` · `HEALTH` · `ENVIRONMENT` · `ANIMAL_WELFARE` · `SOCIAL` · `OTHER`
- City: `BEIRUT` · `TRIPOLI` · `SIDON` · `TYRE` · `JOUNIEH` · `BYBLOS` · `ZAHLE` · `BAALBEK` · `NABATIEH` · `ALEY` · `CHOUF` · `METN` · `KESREWAN` · `AKKAR` · `OTHER`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ (ES Modules) |
| Framework | Express 4 |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Real-time | Socket.io 4 |
| Auth | JWT (access + refresh tokens with rotation) |
| Job Queue | BullMQ 5 |
| Queue Broker | Upstash Redis (serverless, TLS) |
| File Storage | Supabase Storage |
| Email | Resend |
| Validation | Joi |
| Security | Helmet, express-rate-limit, bcrypt |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL
- Upstash Redis instance
- Supabase project (file storage)
- Resend account (email)

### Installation

```bash
git clone <repository-url>
cd hopelink-api
npm install
```

### Environment Variables

```env
PORT=5000
NODE_ENV=development
ORIGIN_URL=http://localhost:3000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/hopelink

JWT_SECRET_KEY=your-long-random-secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=onboarding@resend.dev

REDIS_URL=rediss://default:PASSWORD@HOST.upstash.io:6379

# Optional overrides
RATE_LIMIT_MAX_ATTEMPTS=10
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7
MAX_SESSIONS_PER_USER=5
```

### Database Setup

```bash
npx prisma migrate deploy
npm run seed          # Lebanese mock data: 6 volunteers, 5 charities, 9 opportunities
npx prisma studio     # Optional browser
```

### Run

```bash
npm run dev    # nodemon
npm start      # production
```
