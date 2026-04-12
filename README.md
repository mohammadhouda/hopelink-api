# Hope Link — Backend API

A production-ready REST API powering the **Hope Link** NGO platform — connecting charities with volunteers across Lebanon. Three role-separated portals (Admin, Charity, User) run under a single Express server with real-time Socket.io chat, JWT session management, file uploads via Supabase, and transactional email via Resend.

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
| File Storage | Supabase Storage |
| Email | Resend |
| Validation | Joi |
| Security | Helmet, express-rate-limit, bcrypt |
| Job Queue | BullMQ 5 |
| Cache / Queue Broker | Upstash Redis (serverless, TLS) |

---

## Architecture

All three portals share one server. Role middleware enforces access at the route level.

```
                     ┌─────────────────────────────────────┐
                     │        http://localhost:5000         │
                     └────────┬──────────┬─────────────────┘
                              │          │
          ┌───────────────────┼──────────┼──────────────────┐
          │                   │          │                   │
     /api/auth           /api/admin  /api/charity       /api/user
     Public              ADMIN role  CHARITY role        USER role
                              │          │                   │
                     platform config   opportunities     browse & apply
                     user management   applications      volunteer rooms
                     charity review    ratings           certificates
                     audit logs        certificates      profile & prefs
                     reports           analytics         community feed
                                       community feed
```

Every request hits: **JWT middleware → role check → controller → service → Prisma**

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
    ├── server.js               # HTTP + Socket.io entry point
    ├── app.js                  # Express setup and route mounting
    │
    ├── config/
    │   ├── auth.config.js      # Token TTLs, lockout thresholds
    │   ├── prisma.js           # Singleton Prisma client
    │   ├── redis.js            # Upstash Redis connection options (parsed from REDIS_URL)
    │   └── supabase.config.js  # Supabase storage client
    │
    ├── middlewares/
    │   ├── auth.js             # JWT validation
    │   ├── restrictTo.js       # Role guard (ADMIN / CHARITY / USER)
    │   ├── attachCharity.js    # Resolves charityId from logged-in user
    │   ├── validate.js         # Joi body validation
    │   └── rateLimiter.js      # Brute-force protection on auth routes
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── upload.routes.js
    │   ├── post.routes.js      # Community feed (shared USER + CHARITY)
    │   ├── admin/              # /api/admin — dashboard, users, charities, requests, reports, settings
    │   ├── charity/            # /api/charity — profile, projects, opportunities, applications,
    │   │                       #                analytics, ratings, certificates, rooms, volunteers
    │   └── user/               # /api/user — profile, opportunities, applications, rooms,
    │                           #             certificates, recommendations, notifications, feed
    │
    ├── controllers/            # Thin wrappers: parse request, call service, return response
    ├── services/               # All business logic lives here
    │
    ├── jobs/
    │   ├── matchScoreQueue.js      # BullMQ Queue — publishes score:volunteer and score:opportunity jobs
    │   ├── matchScoreWorker.js     # BullMQ Worker — consumes jobs, batch-upserts VolunteerMatchScore rows
    │   ├── scoreOpportunity.js     # Pure scoring function (skills, days, category, city weights)
    │   └── backfillScores.js       # One-time script — enqueues score:volunteer for every existing volunteer
    │
    ├── events/
    │   └── notificationEmitter.js  # Node.js EventEmitter for decoupled in-app notifications
    │
    ├── sockets/
    │   └── room.socket.js      # Socket.io volunteer chat rooms
    │
    ├── utils/
    │   ├── response.js         # Standardized { success, message, data } envelope
    │   ├── security.js         # IP parsing, token hashing
    │   └── generateToken.js    # JWT + refresh token generation
    │
    └── cron/
        └── cleanupRefreshTokens.js  # Deletes expired refresh tokens daily
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- Supabase project (file storage)
- Resend account (transactional email)

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

# Upstash Redis (BullMQ job queue)
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
# Apply migrations
npx prisma migrate deploy

# Seed with Lebanese mock data
npm run seed

# (Optional) Visual database browser
npx prisma studio
```

### Running

```bash
npm run dev    # Development — nodemon
npm start      # Production
```

---

## Authentication

Two `HttpOnly` cookies are issued on login — no JavaScript can read them.

| Token | Cookie | TTL | Purpose |
|---|---|---|---|
| Access token | `access_token` | 20 min | Sent with every request |
| Refresh token | `refresh_token` | 7 days | Rotates the pair silently |

**Refresh token families:** Each login creates a token "family". On refresh, the old token is revoked and a new pair is issued in the same family. If a **revoked token is reused** (sign of theft), the entire family is immediately invalidated — logging out every device that session belongs to.

**Account lockout:** 5 consecutive failed logins locks the account for 15 minutes. Auth routes are rate-limited to 10 requests per 15-minute window.

---

## API Reference

All responses follow this envelope:

```json
{ "success": true, "message": "...", "data": { ... } }
```

### Auth  `/api/auth`  — Public

`POST /register` · `POST /login` · `POST /refresh` · `POST /logout` · `POST /logout-all`
`GET /sessions` · `DELETE /sessions/:id`

### File Upload  `/api/upload`

`POST /single?bucket=logos&folder=profile` — single file (max 10 MB), returns `{ path, url }`
`POST /multiple?bucket=logos` — up to 10 files

### Community Feed  `/api/posts`  — USER or CHARITY

`GET /` — paginated feed, `likedByMe` flag included when authenticated
`POST /` — create post (`postType`: GENERAL · CERTIFICATE · PROJECT, optional `imageUrl`)
`DELETE /:id` — delete own post
`POST /:id/like` — toggle like (idempotent)
`GET /:id/comments` · `POST /:id/comments` · `DELETE /:id/comments/:commentId`

### Admin Portal  `/api/admin`  — ADMIN role

| Group | Key endpoints |
|---|---|
| Dashboard | `GET /dashboard/stats` |
| Users | `GET /users` · `GET /users/:id` · `POST /users` · `PATCH /users/:id` · `DELETE /users/:id` |
| Charities | `GET /charities` · `GET /charities/:id` · `PATCH /charities/:id` |
| Requests | `GET/POST /requests/registration` · `PATCH .../approve` · `PATCH .../decline` |
| Verification | `GET/POST /requests/verification` · `PATCH .../approve` · `PATCH .../decline` |
| Reports | `GET /reports/registration` · `/ngos` · `/users` · `/projects` |
| Settings | platform config, roles, email templates, API keys, integrations, audit log |
| Notifications | `GET /notifications` · mark read · delete |

### Charity Portal  `/api/charity`  — CHARITY role

| Group | Key endpoints |
|---|---|
| Profile | `GET /profile` · `PATCH /profile` |
| Projects | full CRUD on `/projects` and `/projects/:id` |
| Opportunities | full CRUD · `PATCH /:id/end` (closes room automatically) |
| Applications | `GET /applications` · `PATCH /:id/approve` · `PATCH /:id/decline` · `GET /:id/applicant` |
| Analytics | `GET /analytics` — full dashboard snapshot |
| Ratings | `GET /ratings` · `POST /ratings` (1–5 stars, ENDED opps only, upsert) |
| Certificates | `POST /certificates` · `POST /certificates/bulk/:opportunityId` |
| Rooms | `GET /rooms/:opportunityId` · `GET .../messages` · `PATCH .../close` |
| Volunteers | `GET /volunteers` · `GET /volunteers/:id` · `DELETE /volunteers/:id/remove` · `POST /volunteers/:id/email` |

### User Portal  `/api/user`  — USER role

| Group | Key endpoints |
|---|---|
| Profile | `GET/PATCH /profile` · `GET /profile/ratings` · `PATCH /profile/skills` · `PATCH /profile/preferences` |
| Experiences | full CRUD on `/profile/experiences` |
| Opportunities | `GET /opportunities` (match-scored, paginated) · `GET /opportunities/:id` |
| Applications | `GET /applications` · `POST /applications` · `DELETE /applications/:id` |
| Rooms | `GET /rooms` · `GET /rooms/:opportunityId` · `GET .../messages` |
| Certificates | `GET /certificates` · `GET /certificates/:id` |
| Recommendations | `GET /recommendations` |
| Notifications | standard CRUD + unread count |

---

## Real-time Chat (Socket.io)

Volunteer chat rooms are driven by Socket.io on the same port as the REST API. The lifecycle is fully managed: a room is created in the database on the first application approval and closed automatically when `PATCH /opportunities/:id/end` is called.

**Connect:**
```js
const socket = io("http://localhost:5000", {
  auth: { token: "jwt-access-token" }
});
```

**Client → Server:** `join_room` · `send_message` · `leave_room` · `typing`

**Server → Client:** `joined_room` · `new_message` · `user_joined` · `user_left` · `user_typing` · `error`

**Rules:** Only approved volunteers and the charity that owns the opportunity can join. Closed rooms reject all new messages and joins. History is always available via REST.

---

## A Hard Problem We Solved

### Scalable Personalized Opportunity Ranking

**The situation:** We wanted to show volunteers opportunities ranked by how well they matched their profile — skills overlap, preferred category, preferred city, and availability days. The match score is computed by comparing the volunteer's profile against each opportunity's requirements.

**Why the naïve approach breaks at scale:** The obvious first cut is to fetch all open opportunities, score each one in Node.js, sort by score, and then slice the result for the requested page:

```js
// ❌ Does not scale
const all = await prisma.volunteeringOpportunity.findMany({ where: { status: "OPEN" } });
const scored = all.map(opp => ({ ...opp, matchScore: computeScore(profile, opp) }));
scored.sort((a, b) => b.matchScore - a.matchScore);
return scored.slice(skip, skip + limit);
```

This works fine with 50 opportunities. With 10 000+ it fetches the entire table on every page request — unbounded memory, unbounded latency, and the problem gets worse as the platform grows.

**The solution — pre-computed scores with BullMQ + Upstash Redis:**

Instead of scoring at query time, scores are computed in the background and stored in a dedicated `VolunteerMatchScore` table with a composite primary key `(volunteerId, opportunityId)`:

```
VolunteerMatchScore
  volunteerId   Int   ──→ User
  opportunityId Int   ──→ VolunteeringOpportunity
  score         Float
  computedAt    DateTime

  @@id([volunteerId, opportunityId])
  @@index([volunteerId, score(sort: Desc)])   ← makes ORDER BY score free
```

**When scores are recomputed:**

| Event | Job enqueued |
|---|---|
| Volunteer updates their profile, skills, or preferences | `score:volunteer` — re-scores all OPEN opportunities for that one volunteer |
| A charity creates a new OPEN opportunity | `score:opportunity` — scores all volunteers against that opportunity |
| A charity reopens a CANCELLED / ENDED opportunity | `score:opportunity` — same as above |
| Platform backfill (one-time script) | `score:volunteer` for every existing volunteer |

Jobs are published to a **BullMQ queue** backed by **Upstash Redis** (serverless, TLS). A worker running inside the same server process consumes them with concurrency 5. Each job processes volunteers or opportunities in batches of 500 and bulk-upserts rows using Postgres `ON CONFLICT DO UPDATE`, so the same job can safely be retried:

```js
await prisma.$executeRaw`
  INSERT INTO "VolunteerMatchScore" ("volunteerId", "opportunityId", score, "computedAt")
  VALUES ${Prisma.join(tuples)}
  ON CONFLICT ("volunteerId", "opportunityId")
  DO UPDATE SET score = EXCLUDED.score, "computedAt" = NOW()
`;
```

**At query time** the opportunities endpoint does a simple indexed lookup — no scoring, no full table scan:

```js
// ✅ Scales to any number of opportunities
prisma.volunteerMatchScore.findMany({
  where:   { volunteerId, opportunity: { status: "OPEN", ...filters } },
  orderBy: [{ score: "desc" }, { opportunity: { createdAt: "desc" } }],
  skip,
  take: limit,
  include: { opportunity: { include: OPPORTUNITY_INCLUDE } },
})
```

The `(volunteerId, score DESC)` index makes this a single B-tree scan. Page 2 is as fast as page 1.

**Fallback:** Volunteers with no profile (no skills, no preferences, no availability) skip the scoring pipeline entirely. Their opportunities endpoint uses standard `createdAt DESC` pagination. The response includes a `hasScores` flag so the frontend can show or hide the match badge UI accordingly.

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
| Soft deletes | Users and charities are deactivated, never hard-deleted |

---

## Data Models

```
User
 ├── BaseProfile           phone, avatar, city (City enum), bio
 ├── VolunteerProfile      availability, experience, isVerified
 │    ├── VolunteerSkill[]
 │    ├── VolunteerPreference[]  (CITY / CATEGORY)
 │    └── VolunteerExperience[]  (LinkedIn-style history)
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
 │    └── VolunteerRating[]  (ratings given)
 ├── Post[]                community feed (GENERAL / CERTIFICATE / PROJECT)
 │    ├── PostLike[]
 │    └── PostComment[]
 ├── RefreshToken[]
 ├── AccountLockout
 ├── AuditLog[]
 └── Notification[]
```

**Opportunity lifecycle:** `OPEN` → `FULL` (auto, when approved count = maxSlots) → `ENDED` or `CANCELLED`

**Category enum:** `EDUCATION` · `HEALTH` · `ENVIRONMENT` · `ANIMAL_WELFARE` · `SOCIAL` · `OTHER`

**City enum:** `BEIRUT` · `TRIPOLI` · `SIDON` · `TYRE` · `JOUNIEH` · `BYBLOS` · `ZAHLE` · `BAALBEK` · `NABATIEH` · `ALEY` · `CHOUF` · `METN` · `KESREWAN` · `AKKAR` · `OTHER`
