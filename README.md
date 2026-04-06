# NGO Platform — Backend API

A production-ready REST API that powers an NGO platform connecting **charities** and **volunteers**. Built with Node.js, Express, PostgreSQL, and Socket.io, it serves three separate portals under one server — each with its own set of routes, permissions, and features.

---

## What This Project Does

This backend handles everything for running an NGO platform:

- **Admins** manage users, charities, registrations, reports, and platform settings
- **Charities** post volunteering opportunities, accept or decline volunteers, chat with their team in real-time, rate volunteers, and issue certificates
- **Volunteers/Users** discover opportunities, apply, join rooms when approved, and collect certificates

All portals share the same auth system, file uploads, and notification system — but each has its own protected routes and access rules.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [How the Three Portals Work](#how-the-three-portals-work)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Auth](#auth-apiauthx)
  - [File Upload](#file-upload-apiupload)
  - [Admin Portal](#admin-portal-apiadmin)
  - [Charity Portal](#charity-portal-apicharity)
  - [User Portal](#user-portal-apiuser)
- [Real-time Chat (Socket.io)](#real-time-chat-socketio)
- [Security Features](#security-features)
- [Data Models](#data-models)

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
| Security | Helmet, CSRF (csurf), express-rate-limit |

---

## How the Three Portals Work

```
                        ┌─────────────────────────────────────────┐
                        │              Single Server               │
                        │          http://localhost:5000           │
                        └────────────┬───────────────┬────────────┘
                                     │               │
              ┌──────────────────────┼───────────────┼──────────────────────┐
              │                      │               │                      │
       /api/admin              /api/charity       /api/user           /api/auth
       Requires ADMIN          Requires CHARITY   Requires USER       Public
              │                      │               │
    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
    │ User management │    │  Opportunities  │    │ Browse & Apply   │
    │ Charity review  │    │  Applications   │    │ Volunteer rooms  │
    │ Platform config │    │  Volunteer rooms│    │ Certificates     │
    │ Audit logs      │    │  Ratings        │    │ Profile          │
    │ Reports         │    │  Certificates   │    └──────────────────┘
    └─────────────────┘    │  Analytics      │
                           └─────────────────┘
```

Every request goes through:
1. **JWT Auth middleware** — validates the access token
2. **Role middleware** — ensures the user has the right role for that portal
3. **Controller** → **Service** → **Prisma** (database)

---

## Project Structure

```
admin-backend/
├── prisma/
│   ├── schema.prisma           # All database models and enums
│   └── migrations/             # Auto-generated migration history
│
└── src/
    ├── server.js               # Entry point — creates HTTP + Socket.io server
    ├── app.js                  # Express setup, middleware stack, route mounting
    │
    ├── config/
    │   ├── auth.config.js      # Token TTLs, lockout settings, rate limits
    │   ├── prisma.js           # Prisma client singleton
    │   └── Supabase.config.js  # Supabase storage client
    │
    ├── middlewares/
    │   ├── auth.js             # Validates JWT, checks session is active
    │   ├── restrictTo.js       # Blocks routes by role (ADMIN, CHARITY, USER)
    │   ├── attachCharity.js    # Resolves charityId from the logged-in user
    │   ├── validate.js         # Runs Joi schema validation on request body
    │   └── rateLimiter.js      # Brute-force protection on auth routes
    │
    ├── routes/
    │   ├── auth.routes.js      # /api/auth — login, register, sessions
    │   ├── upload.routes.js    # /api/upload — file uploads
    │   ├── admin/              # /api/admin — admin portal routes
    │   │   ├── index.js
    │   │   ├── dashboard.routes.js
    │   │   ├── profile.routes.js
    │   │   ├── users.routes.js
    │   │   ├── charities.routes.js
    │   │   ├── requests.routes.js
    │   │   ├── reports.routes.js
    │   │   ├── notifications.routes.js
    │   │   └── settings.routes.js
    │   ├── charity/            # /api/charity — charity portal routes
    │   │   ├── index.js
    │   │   ├── profile.routes.js
    │   │   ├── project.routes.js
    │   │   ├── opportunity.routes.js
    │   │   ├── application.routes.js
    │   │   ├── analytics.routes.js
    │   │   ├── rating.routes.js
    │   │   ├── certificate.routes.js
    │   │   └── room.routes.js
    │   └── user/               # /api/user — user/volunteer portal routes
    │       └── index.js
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── upload.controller.js
    │   ├── admin/              # One controller per admin feature
    │   └── charity/            # One controller per charity feature
    │       ├── profile.controller.js
    │       ├── project.controller.js
    │       ├── opportunity.controller.js
    │       ├── application.controller.js
    │       ├── analytics.controller.js
    │       ├── rating.controller.js
    │       ├── certificate.controller.js
    │       └── room.controller.js
    │
    ├── services/
    │   ├── auth.service.js         # Login, register, token rotation
    │   ├── email.service.js        # Sends transactional emails via Resend
    │   ├── notification.service.js # In-app notifications for all roles
    │   ├── upload.service.js       # Supabase file uploads
    │   ├── audit.service.js        # Logs admin actions
    │   ├── loginAttempt.service.js # Tracks failed logins, lockout logic
    │   ├── admin/                  # Business logic for admin features
    │   └── charity/                # Business logic for charity features
    │       ├── profile.service.js
    │       ├── project.service.js
    │       ├── opportunity.service.js
    │       ├── application.service.js
    │       ├── analytics.service.js
    │       ├── rating.service.js
    │       ├── certificate.service.js
    │       └── room.service.js
    │
    ├── sockets/
    │   └── room.socket.js      # Socket.io handler for volunteer chat rooms
    │
    ├── utils/
    │   ├── response.js         # Standardized success/failure JSON responses
    │   ├── security.js         # IP parsing, token hashing helpers
    │   └── generateToken.js    # JWT and refresh token generation
    │
    ├── templates/
    │   └── email.templates.js  # HTML email templates
    │
    └── cron/
        └── cleanupRefreshTokens.js  # Scheduled job to delete expired tokens
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- Supabase project (for file storage)
- Resend account (for transactional email)

### Installation

```bash
git clone <repository-url>
cd admin-backend
npm install
```

### Environment Variables

Create a `.env` file at the root of the project:

```env
# Server
PORT=5000
NODE_ENV=development
ORIGIN_URL=http://localhost:3000        # Frontend URL for CORS

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# JWT — keep this long, random, and secret
JWT_SECRET_KEY=your-very-long-random-secret-key

# Supabase (file storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PASS=your-db-password

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx

# Security defaults — override only if needed
RATE_LIMIT_MAX_ATTEMPTS=10        # Max auth requests per 15 min window
MAX_FAILED_ATTEMPTS=5             # Failed logins before account is locked
LOCKOUT_DURATION_MINUTES=15       # Minutes an account stays locked
REFRESH_TOKEN_EXPIRY_DAYS=7       # Refresh token lifetime
MIN_PASSWORD_LENGTH=8
MAX_SESSIONS_PER_USER=5           # Concurrent sessions allowed per user
```

### Database Setup

```bash
# Apply all migrations to your PostgreSQL database
npx prisma migrate deploy

# (Optional) Open a visual browser for your database tables
npx prisma studio
```

### Running the Server

```bash
# Development — auto-restarts on file save
npm run dev

# Production
npm start
```

The server starts at `http://localhost:5000`. Socket.io is served on the same port.

---

## Authentication

The API uses **two tokens** — a short-lived access token and a longer-lived refresh token, both stored as `HttpOnly` cookies so JavaScript can't access them.

| Token | Cookie Name | Lifetime | Purpose |
|---|---|---|---|
| Access Token | `access_token` | 20 minutes | Sent with every API request |
| Refresh Token | `refresh_token` | 7 days | Used to get a new access token |

### Login Flow

```
1. POST /api/auth/login
       │
       ▼
   Validates email + password
   Checks account is not locked
       │
       ▼
   Returns: access_token cookie (20 min)
            refresh_token cookie (7 days)

2. Make API requests with cookies attached (browser handles this automatically)

3. When access token expires → POST /api/auth/refresh
       │
       ▼
   Old refresh token revoked, new pair issued
   (using the same "family" for theft detection)
```

### Token Theft Detection

Refresh tokens are grouped into **families**. If someone tries to use a refresh token that has already been rotated (revoked), the entire family is invalidated — logging out all sessions. This prevents replay attacks from stolen tokens.

---

## API Reference

All responses use this envelope format:

**Success:**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "What went wrong" }
```

---

### Auth `/api/auth`

Public — no role required.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new user account |
| POST | `/login` | Login — sets session cookies |
| POST | `/refresh` | Rotate access + refresh tokens |
| POST | `/logout` | Revoke current session |
| POST | `/logout-all` | Revoke all sessions on all devices |
| GET | `/sessions` | List all active sessions for this user |
| DELETE | `/sessions/:sessionId` | Revoke a specific device session |

> After 5 failed login attempts, the account is locked for 15 minutes. Auth routes are rate-limited to 10 attempts per 15-minute window.

---

### File Upload `/api/upload`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/single?bucket=documents` | Upload one file (max 10 MB) |
| POST | `/multiple?bucket=logos` | Upload up to 10 files |

Files are stored in Supabase Storage. The response includes the public URL(s) to save in your database.

---

### Admin Portal `/api/admin`

All routes require the `ADMIN` role.

#### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/stats` | Totals, trends, pending actions across the platform |

#### Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Get admin's own profile |
| PUT | `/profile` | Update name, phone, city, bio |
| PUT | `/profile/avatar` | Update profile picture |
| PUT | `/profile/password` | Change password |

#### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List users — paginated, searchable |
| GET | `/users/cities` | Get distinct cities from user records |
| GET | `/users/:userId` | Get one user's full profile |
| POST | `/users` | Create a user |
| PATCH | `/users/:userId` | Update user fields |
| DELETE | `/users/:userId` | Soft-delete a user |

Query params for `GET /users`: `search`, `status` (`active`/`inactive`), `role` (`USER`/`VOLUNTEER`), `city`, `page`, `limit`

#### Charities

| Method | Endpoint | Description |
|---|---|---|
| GET | `/charities` | List charities — paginated, searchable |
| POST | `/charities` | Create a charity account |
| GET | `/charities/:userId` | Get one charity's details |
| PATCH | `/charities/:userId` | Update charity fields |
| DELETE | `/charities/:userId` | Soft-delete a charity |

Query params for `GET /charities`: `search`, `status`, `category`, `city`, `page`, `limit`

#### Registration Requests

When a charity wants to join the platform, they submit a registration request. Admins review and approve or decline.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/requests/registration` | List all requests |
| GET | `/requests/registration/:id` | View one request |
| POST | `/requests/registration` | Submit a request |
| PATCH | `/requests/registration/:id/approve` | Approve — automatically creates charity account + sends email |
| PATCH | `/requests/registration/:id/decline` | Decline with a note — sends email |

#### Verification Requests

Charities can submit documents to get a verified badge.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/requests/verification` | List all verification requests |
| GET | `/requests/verification/:id` | View one request |
| POST | `/requests/verification/:userId` | Submit documents for a charity |
| PATCH | `/requests/verification/:id/approve` | Approve — marks charity as verified |
| PATCH | `/requests/verification/:id/decline` | Decline with a note |

#### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/registration` | Registration request report |
| GET | `/reports/ngos` | Charity/NGO overview report |
| GET | `/reports/users` | User report |
| GET | `/reports/projects` | Project activity report |
| GET | `/reports/filters` | Available filter values for all reports |

#### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | List notifications (filter by read status, paginated) |
| GET | `/notifications/unread-count` | Count of unread notifications |
| PUT | `/notifications/:id/read` | Mark one notification as read |
| PUT | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete a notification |

#### Settings

**Platform config:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/settings/platform` | Get all platform settings |
| PUT | `/settings/platform` | Update settings |

**Roles:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/settings/roles` | List all roles and their permissions |
| POST | `/settings/roles` | Create a custom role |
| PUT | `/settings/roles/:id` | Update a role |
| DELETE | `/settings/roles/:id` | Delete a role (system roles are protected) |

**Email templates:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/settings/email-templates` | List all templates |
| PUT | `/settings/email-templates/:id` | Edit subject and body of a template |

**Sessions & security:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/settings/sessions` | View active sessions |
| DELETE | `/settings/sessions/:sessionId` | Revoke a session |
| DELETE | `/settings/sessions` | Revoke all other sessions |
| GET | `/settings/login-history` | Paginated login attempt history |
| GET | `/settings/audit-log` | Admin action audit trail |

**API keys:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/settings/api-keys` | List all API keys |
| POST | `/settings/api-keys` | Create a new key |
| DELETE | `/settings/api-keys/:id` | Revoke a key |

**Integrations:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/settings/integrations` | List all integrations |
| PATCH | `/settings/integrations/:id/toggle` | Enable or disable an integration |

---

### Charity Portal `/api/charity`

All routes require the `CHARITY` role. The logged-in user must have a linked `CharityAccount`.

#### Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Get the charity's own profile and stats |
| PATCH | `/profile` | Update name, description, logo, contact info |

#### Projects

Projects are high-level initiatives a charity runs (e.g. "Beach Cleanup Campaign"). Opportunities sit inside projects.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects` | List projects (filter by `status`: `ACTIVE`, `PAUSED`, `CLOSED`) |
| POST | `/projects` | Create a project |
| GET | `/projects/:id` | Get project + its opportunities |
| PATCH | `/projects/:id` | Update title, description, category, or status |
| DELETE | `/projects/:id` | Delete a project |

#### Volunteering Opportunities

An opportunity is a specific volunteer event with dates, a location, and a slot limit.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/opportunities` | List opportunities (filter by `status`) |
| POST | `/opportunities` | Create an opportunity |
| GET | `/opportunities/:id` | Get opportunity details |
| PATCH | `/opportunities/:id` | Update an opportunity |
| DELETE | `/opportunities/:id` | Delete an opportunity |
| PATCH | `/opportunities/:id/end` | Mark as ENDED — closes the volunteer chat room automatically |

**Opportunity Statuses:** `OPEN` → `FULL` (when all slots are taken) → `ENDED` or `CANCELLED`

**Body for `POST /opportunities`:**
```json
{
  "title": "Beach Cleanup Day",
  "description": "Join us to clean up the beach",
  "startDate": "2026-05-01T09:00:00Z",
  "endDate": "2026-05-01T17:00:00Z",
  "location": "Marina Beach",
  "maxSlots": 20,
  "projectId": 3
}
```

#### Applications

Volunteers apply to opportunities. Charities review them here.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/applications` | List all applications — filter by `status` or `opportunityId` |
| PATCH | `/applications/:id/approve` | Approve — adds volunteer to the room, sends notification |
| PATCH | `/applications/:id/decline` | Decline — sends notification with optional reason |

> When a volunteer is approved, the system automatically creates a room for the opportunity (if it doesn't exist) and adds both the charity and the volunteer.

Query params for `GET /applications`: `status` (`PENDING`/`APPROVED`/`DECLINED`), `opportunityId`, `page`, `limit`

#### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics` | Full dashboard — projects, opportunities, applications, volunteers, certificates, ratings |

**Sample response:**
```json
{
  "projects": { "total": 5, "active": 3 },
  "opportunities": { "total": 12, "open": 4, "ended": 6 },
  "applications": { "total": 87, "pending": 10, "approved": 60, "declined": 17, "last30Days": 23 },
  "volunteers": { "total": 60, "averageRating": 4.2, "totalRatings": 45 },
  "certificates": { "issued": 38 },
  "recentOpportunities": [ ... ]
}
```

#### Ratings

Charities can rate volunteers after an opportunity has ended (rating: 1–5).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ratings` | List ratings given (filter by `opportunityId`) |
| POST | `/ratings` | Rate a volunteer |

**Body for `POST /ratings`:**
```json
{
  "volunteerId": 42,
  "opportunityId": 7,
  "rating": 5,
  "comment": "Excellent volunteer, very reliable"
}
```

> Ratings can only be given after the opportunity status is `ENDED`. One rating per charity-volunteer-opportunity combination.

#### Certificates

Issue digital certificates to volunteers who completed an opportunity.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/certificates` | List all issued certificates (filter by `opportunityId`) |
| POST | `/certificates` | Issue a certificate to one volunteer |
| POST | `/certificates/bulk/:opportunityId` | Issue certificates to all approved volunteers at once |

**Body for `POST /certificates`:**
```json
{
  "volunteerId": 42,
  "opportunityId": 7
}
```

> Certificates can only be issued after the opportunity has ended. Issuing a certificate also sends the volunteer an in-app notification. Bulk issue is idempotent — re-running it updates any existing certificates.

#### Volunteer Rooms

When a volunteer is approved, they're automatically added to a chat room for that opportunity. The charity is the room admin. The room closes when the opportunity ends.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/rooms/:opportunityId` | Get room info + list of all members |
| GET | `/rooms/:opportunityId/messages` | Get message history (paginated, newest last) |
| PATCH | `/rooms/:opportunityId/close` | Manually close the room |

> For sending and receiving messages in real-time, use the Socket.io connection described below.

---

### User Portal `/api/user`

All routes require the `USER` role. Currently being built — will include opportunity browsing, applying, viewing rooms, and managing certificates.

---

## Real-time Chat (Socket.io)

The volunteer chat room uses Socket.io. The server runs on the same port as the REST API.

### Connecting

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "your-jwt-access-token"  // same token from /api/auth/login
  }
});
```

### Events You Send (Client → Server)

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ opportunityId: 7 }` | Join the room for an opportunity |
| `send_message` | `{ content: "Hello everyone!" }` | Send a message to the current room |
| `leave_room` | — | Leave the current room |
| `typing` | `{ isTyping: true }` | Broadcast typing indicator |

### Events You Receive (Server → Client)

| Event | Payload | Description |
|---|---|---|
| `joined_room` | `{ roomId, opportunityId }` | Confirms you joined successfully |
| `new_message` | Full message object with sender info | A new message in the room |
| `user_joined` | `{ userId, name }` | Someone joined the room |
| `user_left` | `{ userId, name }` | Someone left or disconnected |
| `user_typing` | `{ userId, name, isTyping }` | Typing indicator from another user |
| `error` | `{ message }` | Something went wrong |

### Room Rules

- Only approved volunteers and the charity that owns the opportunity can join a room
- Rooms are automatically closed when `PATCH /opportunities/:id/end` is called
- Closed rooms reject new messages and new joins
- Message history is available via the REST API (`GET /rooms/:opportunityId/messages`)

### Example Usage

```javascript
// Join the room for opportunity #7
socket.emit("join_room", { opportunityId: 7 });

// Listen for confirmation
socket.on("joined_room", ({ roomId }) => {
  console.log("Joined room", roomId);
});

// Send a message
socket.emit("send_message", { content: "Looking forward to this!" });

// Receive messages
socket.on("new_message", (message) => {
  console.log(`${message.sender.name}: ${message.content}`);
});

// Typing indicator
inputEl.addEventListener("input", () => {
  socket.emit("typing", { isTyping: true });
});
```

---

## Security Features

| Feature | Details |
|---|---|
| Password hashing | bcrypt, 12 salt rounds |
| Access tokens | JWT, 20-min TTL, stored in `HttpOnly` cookie |
| Refresh tokens | Random token, SHA-256 hashed before storage, 7-day TTL |
| Token rotation | Family-based — stolen token reuse invalidates all sessions in that family |
| Session management | Max 5 concurrent sessions per user, tracked per device |
| Account lockout | 5 failed logins → 15-minute lockout |
| Rate limiting | 10 auth attempts per 15-minute window |
| Role-based access | `restrictTo` middleware enforced on every protected route |
| Security headers | Helmet (X-Frame-Options, CSP, HSTS, etc.) |
| CSRF protection | csurf middleware |
| Soft deletes | Users and charities are deactivated, never hard-deleted |
| Audit logging | Every admin action is logged with user ID, action, target, and IP |
| Input validation | Joi schemas run before any controller code |
| Socket.io auth | JWT validated on every Socket.io connection |

---

## Data Models

### Entity Relationships

```
User
 ├── BaseProfile          (phone, avatar, city, bio)
 ├── VolunteerProfile     (availability, skills, preferences)
 ├── CharityAccount
 │    ├── CharityProject
 │    │    └── VolunteeringOpportunity
 │    │         ├── OpportunityApplication  ←── User
 │    │         ├── VolunteerRoom
 │    │         │    ├── RoomMember         ←── User
 │    │         │    └── RoomMessage        ←── User
 │    │         ├── VolunteerRating         ←── User
 │    │         └── Certificate             ←── User
 │    └── Application (legacy — linked to CharityProject)
 │
 ├── RefreshToken         (session tracking)
 ├── LoginAttempt         (security audit trail)
 ├── AccountLockout       (brute-force protection)
 ├── AuditLog             (admin action history)
 ├── ApiKey               (programmatic access)
 └── Notification         (in-app alerts)
```

### Roles

| Role | Access |
|---|---|
| `ADMIN` | Full platform access via `/api/admin` |
| `CHARITY` | Charity portal access via `/api/charity` |
| `USER` | User/volunteer portal access via `/api/user` |
| `VOLUNTEER` | Reserved for future volunteer-specific features |

### Status Enums

| Model | Statuses |
|---|---|
| Registration/Verification Requests | `PENDING` → `APPROVED` or `DECLINED` |
| Projects | `ACTIVE`, `PAUSED`, `CLOSED` |
| Opportunities | `OPEN` → `FULL` or `ENDED` or `CANCELLED` |
| Applications | `PENDING` → `APPROVED` or `DECLINED` |
| Rooms | `ACTIVE` → `CLOSED` |
| Room Members | `ADMIN` (charity), `MEMBER` (volunteer) |

### Categories

Used on both charities and projects:
`EDUCATION`, `HEALTH`, `ENVIRONMENT`, `ANIMAL_WELFARE`, `SOCIAL`, `OTHER`
