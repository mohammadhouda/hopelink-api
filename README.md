# NGO Platform — Backend API

A production-ready RESTful API for the NGO platform. Built with Node.js and Express, it serves three portals — **Admin**, **Charity**, and **User** — under a single server with role-based route isolation, plus shared auth and file upload endpoints.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Server](#running-the-server)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Admin Portal](#admin-portal)
    - [Dashboard](#dashboard)
    - [Profile](#profile)
    - [Users](#users)
    - [Charities](#charities)
    - [Requests](#requests)
    - [Reports](#reports)
    - [Notifications](#notifications)
    - [Settings](#settings)
  - [Charity Portal](#charity-portal)
  - [User Portal](#user-portal)
  - [File Upload](#file-upload)
- [Security](#security)
- [Data Models](#data-models)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 4 |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Authentication | JWT (access + refresh tokens) |
| File Storage | Supabase Storage |
| Email | Resend |
| Validation | Joi |
| Security | Helmet, CSRF (csurf), express-rate-limit |
| Dev | Nodemon |

---

## Project Structure

```
admin-backend/
├── prisma/
│   ├── schema.prisma          # Database schema & models
│   └── migrations/            # Auto-generated migration history
└── src/
    ├── server.js              # Entry point — starts HTTP server
    ├── app.js                 # Express app, middleware stack, route mounting
    │
    ├── config/
    │   ├── auth.config.js     # Auth settings (token TTLs, lockout, rate limits)
    │   ├── prisma.js          # Prisma client singleton
    │   └── Supabase.config.js # Supabase client initialization
    │
    ├── middlewares/           # Shared — applied across all portals
    │   ├── auth.js            # JWT authentication
    │   ├── restrictTo.js      # Role-based access control
    │   ├── validate.js        # Joi request validation
    │   └── rateLimiter.js     # Brute-force protection on auth routes
    │
    ├── validators/            # Shared Joi schemas
    │   ├── charity.validator.js
    │   └── user.validator.js
    │
    ├── utils/
    │   ├── response.js        # Standardized success/failure helpers
    │   ├── security.js        # IP parsing, user-agent parsing, token hashing
    │   └── generateToken.js   # JWT & refresh token generation
    │
    ├── templates/
    │   └── email.templates.js # Transactional email templates
    │
    ├── cron/
    │   └── cleanupRefreshTokens.js  # Scheduled expired-token cleanup
    │
    ├── routes/
    │   ├── auth.routes.js     # Shared — login/register/refresh (/api/auth)
    │   ├── upload.routes.js   # Shared — file uploads (/api/upload)
    │   ├── admin/             # Admin portal — mounted at /api/admin
    │   │   ├── index.js       # Mounts all admin sub-routes
    │   │   ├── dashboard.routes.js
    │   │   ├── profile.routes.js
    │   │   ├── users.routes.js
    │   │   ├── charities.routes.js
    │   │   ├── requests.routes.js
    │   │   ├── reports.routes.js
    │   │   ├── notifications.routes.js
    │   │   └── settings.routes.js
    │   ├── charity/           # Charity portal — mounted at /api/charity
    │   │   └── index.js
    │   └── user/              # User portal — mounted at /api/user
    │       └── index.js
    │
    ├── controllers/
    │   ├── auth.controller.js      # Shared
    │   ├── upload.controller.js    # Shared
    │   └── admin/
    │       ├── dashboard.controller.js
    │       ├── profile.controller.js
    │       ├── users.controller.js
    │       ├── charities.controller.js
    │       ├── requests.controller.js
    │       ├── reports.controller.js
    │       ├── notifications.controller.js
    │       └── settings.controller.js
    │
    └── services/
        ├── auth.service.js         # Shared
        ├── upload.service.js       # Shared
        ├── email.service.js        # Shared
        ├── notification.service.js # Shared — creates notifications for any role
        ├── audit.service.js        # Shared
        ├── loginAttempt.service.js # Shared
        └── admin/
            ├── dashboard.service.js
            ├── profile.service.js
            ├── users.service.js
            ├── charities.service.js
            ├── requests.service.js
            ├── reports.service.js
            └── settings.service.js
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

Create a `.env` file in the project root. All variables are required unless a default is noted.

```env
# Server
PORT=5000
NODE_ENV=development
ORIGIN_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# JWT
JWT_SECRET_KEY=your-strong-secret-key

# Supabase (File Storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PASS=your-db-password

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx

# Security (all have defaults — override as needed)
RATE_LIMIT_MAX_ATTEMPTS=10        # Failed auth attempts per 15-minute window
MAX_FAILED_ATTEMPTS=5             # Failed logins before account lockout
LOCKOUT_DURATION_MINUTES=15       # How long an account stays locked
ATTEMPT_WINDOW_MINUTES=15         # Window for counting failed attempts
REFRESH_TOKEN_EXPIRY_DAYS=7       # Refresh token lifetime in days
MIN_PASSWORD_LENGTH=8             # Minimum password length
MAX_SESSIONS_PER_USER=5           # Max concurrent sessions per user
```

### Database Setup

```bash
# Apply all migrations
npx prisma migrate deploy

# (Optional) Open Prisma Studio to browse data
npx prisma studio
```

### Running the Server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Server listens on `http://localhost:5000` by default.

---

## Authentication

The API uses a **dual-token** authentication scheme:

| Token | Storage | TTL | Purpose |
|---|---|---|---|
| Access Token (JWT) | `access_token` cookie | 20 minutes | Authenticate requests |
| Refresh Token | `refresh_token` cookie | 7 days | Obtain new access tokens |

**Flow:**

1. `POST /api/auth/login` — returns both tokens as `HttpOnly` cookies.
2. Include cookies on every request. The `authMiddleware` validates the access token and the active session.
3. When the access token expires, call `POST /api/auth/refresh` to rotate both tokens.
4. Refresh token rotation uses **family tracking** — reusing a revoked token invalidates the entire family (detects token theft).

**Protected routes** require a valid access token. **Role-restricted routes** additionally require the user to hold a specific role (`ADMIN`, `CHARITY`, `USER`, or `VOLUNTEER`).

---

## API Reference

All endpoints are prefixed with their base path. Successful responses follow this envelope:

```json
{ "success": true, "message": "...", "data": { ... } }
```

Errors:

```json
{ "success": false, "message": "..." }
```

---

### Auth

> Base path: `/api/auth` — public, shared across all portals.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user account |
| POST | `/api/auth/login` | Public | Login and receive session cookies |
| POST | `/api/auth/refresh` | Public | Rotate access + refresh tokens |
| POST | `/api/auth/logout` | Required | Revoke current session |
| POST | `/api/auth/logout-all` | Required | Revoke all active sessions |
| GET | `/api/auth/sessions` | Required | List all active sessions |
| DELETE | `/api/auth/sessions/:sessionId` | Required | Revoke a specific session |

> Auth endpoints are rate-limited: 10 failed attempts per 15 minutes. After 5 failed logins, the account is locked for 15 minutes.

---

### Admin Portal

> Base path: `/api/admin` — all routes require `ADMIN` role.

#### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard/stats` | Aggregate statistics for the admin dashboard |

#### Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/profile` | Get admin profile |
| PUT | `/api/admin/profile` | Update name, phone, city, country, bio |
| PUT | `/api/admin/profile/avatar` | Update profile avatar |
| PUT | `/api/admin/profile/password` | Change password |

#### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List users (paginated, filterable by search/status/role/city) |
| GET | `/api/admin/users/cities` | Get distinct cities from user records |
| GET | `/api/admin/users/:userId` | Get a single user by ID |
| POST | `/api/admin/users` | Create a new user |
| PATCH | `/api/admin/users/:userId` | Update user fields |
| DELETE | `/api/admin/users/:userId` | Soft-delete a user |

**Query Parameters for `GET /api/admin/users`:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Search by name or email |
| `status` | `active` \| `inactive` | Filter by account status |
| `role` | `USER` \| `VOLUNTEER` | Filter by role |
| `city` | string | Filter by city |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

#### Charities

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/charities` | List charities (paginated, filterable) |
| POST | `/api/admin/charities` | Create a charity account |
| GET | `/api/admin/charities/:userId` | Get a single charity by user ID |
| PATCH | `/api/admin/charities/:userId` | Update charity details |
| DELETE | `/api/admin/charities/:userId` | Soft-delete a charity |

**Query Parameters for `GET /api/admin/charities`:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Search by name or email |
| `status` | `active` \| `inactive` | Filter by account status |
| `category` | enum | Filter by charity category |
| `city` | string | Filter by city |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Categories:** `EDUCATION`, `HEALTH`, `ENVIRONMENT`, `ANIMAL_WELFARE`, `SOCIAL`, `OTHER`

#### Requests

Handles two workflows: **registration** (new charities apply to join) and **verification** (existing charities submit verification documents).

##### Registration Requests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/requests/registration` | ADMIN | List all registration requests |
| GET | `/api/admin/requests/registration/:id` | ADMIN | Get request details |
| POST | `/api/admin/requests/registration` | ADMIN | Submit a registration request |
| PATCH | `/api/admin/requests/registration/:id/approve` | ADMIN | Approve — creates a charity account |
| PATCH | `/api/admin/requests/registration/:id/decline` | ADMIN | Decline with a review note |

##### Verification Requests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/requests/verification` | ADMIN | List all verification requests |
| GET | `/api/admin/requests/verification/:id` | ADMIN | Get request details |
| POST | `/api/admin/requests/verification/:userId` | ADMIN | Submit verification documents |
| PATCH | `/api/admin/requests/verification/:id/approve` | ADMIN | Approve verification |
| PATCH | `/api/admin/requests/verification/:id/decline` | ADMIN | Decline with a review note |

#### Reports

Supports query-based filtering.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/reports/registration` | Registration request report |
| GET | `/api/admin/reports/ngos` | NGO/charity report |
| GET | `/api/admin/reports/users` | User report |
| GET | `/api/admin/reports/projects` | Project report |
| GET | `/api/admin/reports/filters` | Available filter options for all reports |

#### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/notifications` | List notifications (paginated, filterable by read status) |
| GET | `/api/admin/notifications/unread-count` | Get unread notification count |
| PUT | `/api/admin/notifications/:id/read` | Mark a single notification as read |
| PUT | `/api/admin/notifications/read-all` | Mark all notifications as read |
| DELETE | `/api/admin/notifications/:id` | Delete a notification |

#### Settings

##### Platform

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/settings/platform` | Get platform configuration |
| PUT | `/api/admin/settings/platform` | Update platform configuration |

##### Roles

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/settings/roles` | List all roles |
| POST | `/api/admin/settings/roles` | Create a custom role |
| PUT | `/api/admin/settings/roles/:id` | Update a role |
| DELETE | `/api/admin/settings/roles/:id` | Delete a role (system roles are protected) |

##### Email Templates

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/settings/email-templates` | List all email templates |
| PUT | `/api/admin/settings/email-templates/:id` | Update template subject and body |

##### Sessions & Security

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/settings/sessions` | List active sessions |
| DELETE | `/api/admin/settings/sessions/:sessionId` | Revoke a session |
| DELETE | `/api/admin/settings/sessions` | Revoke all other sessions |
| GET | `/api/admin/settings/login-history` | Paginated login history |
| GET | `/api/admin/settings/audit-log` | Audit log (filterable by user/action) |

##### API Keys

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/settings/api-keys` | List API keys |
| POST | `/api/admin/settings/api-keys` | Create a new API key |
| DELETE | `/api/admin/settings/api-keys/:id` | Revoke an API key |

##### Integrations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/settings/integrations` | List all integrations |
| PATCH | `/api/admin/settings/integrations/:id/toggle` | Enable or disable an integration |

---

### Charity Portal

> Base path: `/api/charity` — all routes require `CHARITY` role.

Routes are being implemented. Sub-routes will include: dashboard, profile, projects, verification, and notifications.

---

### User Portal

> Base path: `/api/user` — all routes require `USER` role.

Routes are being implemented. Sub-routes will include: dashboard, discover, applications, profile, and notifications.

---

### File Upload

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/upload/single` | Public | Upload a single file (max 10 MB) |
| POST | `/api/upload/multiple` | Public | Upload multiple files (max 10 files, 10 MB each) |

Files are stored in Supabase Storage under the `documents/logos` bucket. The response includes the public URL(s).

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt (12 rounds) |
| Access tokens | JWT, 20-minute TTL, stored in HttpOnly cookie |
| Refresh tokens | Random token, hashed before storage, 7-day TTL |
| Token rotation | Family-based — revoked token reuse invalidates entire family |
| Session management | Up to 5 concurrent sessions per user, per-device tracking |
| Account lockout | 5 failed attempts triggers a 15-minute lockout |
| Rate limiting | 10 attempts per 15 minutes on auth routes (failures only) |
| Role-based access | `restrictTo` middleware on all admin/charity routes |
| Security headers | Helmet |
| CSRF protection | csurf middleware |
| Soft deletes | `isActive` flag — records are never hard-deleted |
| Audit logging | All admin actions logged with user, action, target, and IP |
| Input validation | Joi schemas validated before controllers are reached |

---

## Data Models

### Core Entities

```
User ──────────── BaseProfile
  │                 (phone, avatar, city, bio)
  │
  ├── CharityAccount ── CharityProject ── Application
  │     (name, logo, verified, category)
  │
  ├── VolunteerProfile
  │     (availability, skills, preferences)
  │
  ├── RefreshToken          (session management)
  ├── LoginAttempt          (security audit)
  ├── AccountLockout        (brute-force protection)
  ├── AuditLog              (admin action history)
  ├── ApiKey                (programmatic access)
  └── Notification          (in-app notifications)
```

### Supporting Entities

| Model | Purpose |
|---|---|
| `RegistrationRequest` | Charity registration applications |
| `VerificationRequest` | Charity verification submissions |
| `DynamicRole` | Custom role definitions |
| `DynamicRolePermission` | Permissions per role |
| `EmailTemplate` | Editable transactional email templates |
| `PlatformSetting` | Key-value configuration store |
| `Integration` | External service integrations |

### Roles

| Role | Description |
|---|---|
| `ADMIN` | Full platform access |
| `CHARITY` | Charity account access |
| `USER` | Registered donor/volunteer |
| `VOLUNTEER` | Volunteer-specific access |

### Request Statuses

`PENDING` → `APPROVED` or `DECLINED`

### Project Statuses

`ACTIVE` → `PAUSED` or `CLOSED`
