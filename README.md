# Hope Link Backend API

A platform connecting NGOs with volunteers across Lebanon. Three separate portals Admin, Charity, and Volunteer run under a single server, with real-time chat, smart opportunity matching, and secure authentication.

For architecture details, engineering decisions, and code conventions, see [TECHNICAL.md](TECHNICAL.md).

---

## Table of Contents

1. [What Is Hope Link?](#what-is-hope-link)
2. [Who Uses It?](#who-uses-it)
3. [What the Platform Does](#what-the-platform-does)
4. [Getting Started](#getting-started)
   - [Option A Docker (Recommended)](#option-a--docker)
   - [Option B Manual](#option-b--manual)

---

## What Is Hope Link?

Hope Link is a volunteer management platform for Lebanon. It connects charities and NGOs with volunteers who want to contribute their skills and time. Admins oversee the entire platform, charities post volunteering opportunities, and volunteers apply, chat, and earn certificates.

---

## Who Uses It?

| Role | Description |
|---|---|
| **Admin** | Platform managers who review NGO registrations, manage users, configure settings, and monitor activity |
| **Charity** | NGOs and nonprofits that post projects and volunteering opportunities, review applications, and rate volunteers |
| **Volunteer** | Individuals who browse opportunities, apply, join chat rooms, and earn certificates |

---

## What the Platform Does

**For Charities:**
- Create projects and post volunteering opportunities
- Review and approve or decline volunteer applications
- Communicate with approved volunteers via real-time chat rooms
- Issue certificates and rate volunteers after opportunities end
- View analytics on opportunities and volunteer activity

**For Volunteers:**
- Browse opportunities ranked by how well they match your skills and preferences
- Apply to opportunities and track application status
- Chat with the charity and fellow volunteers in real-time rooms
- Earn certificates for completed service
- Build a volunteer profile with skills, availability, and experience

**For Admins:**
- Review and approve NGO registration requests
- Manage all users and charities across the platform
- Configure platform-wide settings
- View audit logs and generate reports

---

## Getting Started

Two options: **Docker** (recommended zero local setup) or **manual**.

---

### Option A Docker

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**1. Create a `.env` file** in the project root with your external service credentials:

```env
JWT_SECRET_KEY=your-long-random-secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RESEND_API_KEY=re_xxxxxxxxxxxx

UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
REDIS_URL=rediss://default:TOKEN@your-instance.upstash.io:6379
```

PostgreSQL and Redis are provided by Docker Compose no local installs needed.

**2. Build and start all services:**

```bash
docker compose up --build
```

This starts three containers:

| Container | Purpose | Port |
|---|---|---|
| `postgres` | PostgreSQL 16 database | 5432 |
| `redis` | Redis 7 (local queue) | 6379 |
| `api` | Hope Link API | 5000 |

On first boot the api container automatically runs database migrations before starting the server.

**3. Seed the database** (in a second terminal, while containers are running):

```bash
docker compose exec api node prisma/seed.js
```

This loads sample Lebanese data: 6 volunteers, 5 charities, 9 opportunities.

**Common commands:**

```bash
docker compose up -d              # start in background
docker compose logs -f api        # tail api logs
docker compose down               # stop containers (data survives)
docker compose down -v            # stop and wipe the database
docker compose up --build api     # rebuild after code changes
docker compose exec api sh        # open a shell inside the api container
```

---

### Option B Manual

**Prerequisites:** Node.js >= 22, PostgreSQL, an Upstash Redis instance, a Supabase project, a Resend account.

**1. Clone and install:**

```bash
git clone <repository-url>
cd hopelink-api
npm install
```

**2. Create a `.env` file:**

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/hopelink

JWT_SECRET_KEY=your-long-random-secret

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RESEND_API_KEY=re_xxxxxxxxxxxx

UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
REDIS_URL=rediss://default:TOKEN@your-instance.upstash.io:6379

# Optional overrides
RATE_LIMIT_MAX_ATTEMPTS=10
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7
MAX_SESSIONS_PER_USER=5
```

**3. Set up the database:**

```bash
npx prisma migrate deploy
npm run seed
```

**4. Run:**

```bash
npm run dev    # auto-restart on file changes
npm start      # production
```
