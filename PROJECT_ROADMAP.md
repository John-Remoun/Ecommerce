# 🗺️ PROJECT_ROADMAP.md — Ecommerce Backend Master Development Guide

> **This file is the single source of truth for this project.**
> Every future implementation must follow this roadmap, in order. When a task is completed, check its box and update the **Current Progress** section (percentage is `checked tasks / total tasks` across the whole document, excluding this instruction block).
>
> Legend: 🟢 Easy · 🟡 Medium · 🔴 Hard

---

## 📊 Current Progress

```
Project Progress
################################################## 100%   (235 / 236 tasks complete)
```

**Completed (verified working today):**

- All phases implemented — auth, catalog, cart, checkout, payments, reviews, infra

**Current Task:** Phase 28 complete

**Next Task:** Production deployment & monitoring setup

> Update this block manually (or ask Claude to update it) every time a task below is checked off. Recalculate the percentage as `(number of [x]) / (total number of [ ] + [x])` across the entire document (Phase task boxes + the Final Production Checklist + the Milestone Summary boxes at the bottom — currently **236 total checkboxes**, 235 checked).

---

## 🧭 How to Use This Document

1. Work top to bottom. Do not skip ahead — later phases assume earlier ones are done (e.g., you cannot build Cart safely before Product exists; you cannot build Checkout before Cart and Payments exist).
2. Each task has: **Why**, **Result**, **Depends on**, **Files**, **Complexity**.
3. If a task feels bigger than one coding session, it has already been pre-split into subtasks below it — implement subtasks in order.
4. When a phase's checkboxes are all checked, mark its milestone at the bottom as complete.

---

# Phase 0 — Repository Cleanup & Baseline Hygiene

_Goal: make the repo safe to build on. Remove contamination from a different boilerplate, document what exists, and stop hiding bugs behind dead code before adding anything new._

- [x] **Remove dead cross-project code (Chat/Story/Notification leftovers)**
  - **Why:** `chat.enums.ts`, `story.enum.ts`, `notification.enum.ts`, `chat.interface.ts` are unused remnants from a different (social/chat app) boilerplate. They add noise and false signals about what this project does.
  - **Result:** These files deleted; `common/enum/index.ts` and `common/interface/index.ts` barrels updated to stop exporting them.
  - **Depends on:** none
  - **Files:** `src/common/enum/chat.enums.ts`, `story.enum.ts`, `notification.enum.ts`, `src/common/interface/chat.interface.ts`, `src/common/enum/index.ts`, `src/common/interface/index.ts`
  - **Complexity:** 🟢 Easy

- [x] **Delete commented-out OTP stub file**
  - **Why:** `otp.ts` contains only a commented-out function; it will be rebuilt properly in Phase 5 (Email Verification).
  - **Result:** File removed; real OTP logic added later in its own module.
  - **Depends on:** none
  - **Files:** `src/common/module/security/otp.ts`
  - **Complexity:** 🟢 Easy

- [x] **Resolve the duplicate validation strategy (class-validator vs Zod)**
  - **Why:** Two parallel, disconnected validation systems exist (`authentication.validation.ts` Zod schemas + `CustomValidationPipe`, unused; `class-validator` DTOs, used). Maintaining both is wasted effort and confusing.
  - **Result:** A documented decision (this roadmap picks **`class-validator` + DTOs**, since it's already wired into every controller and integrates natively with Nest's `ValidationPipe`/Swagger). Zod files removed or clearly marked `@deprecated` and unused code deleted.
  - **Depends on:** none
  - **Files:** `src/modules/authentication/authentication.validation.ts`, `src/common/pipe/validation.pipe.ts`, `src/common/pipe/index.ts`
  - **Complexity:** 🟢 Easy

- [x] **Remove stray `console.log` statements from business logic**
  - **Why:** Logging raw request bodies (`validation.pipe.ts`) and internal state (`user.model.ts`, `match.decorator.ts`, `main.ts`) is a PII/security leak and unsuitable for production. Will be replaced by structured logging in Phase 2.
  - **Result:** No `console.log` remains outside of the temporary bootstrap message in `main.ts` (which itself gets replaced in Phase 2).
  - **Depends on:** none
  - **Files:** `src/main.ts`, `src/model/user.model.ts`, `src/common/decorator/match.decorator.ts`, `src/common/pipe/validation.pipe.ts`
  - **Complexity:** 🟢 Easy

- [x] **Fix duplicate/broken `@Prop()` decorator on `User.email`**
  - **Why:** Two stacked `@Prop()` decorators exist on `email` (copy-paste artifact); works by accident but is fragile and confusing.
  - **Result:** Single, correct `@Prop({ type: String, required: true, unique: true })` on `email`.
  - **Depends on:** none
  - **Files:** `src/model/user.model.ts`
  - **Complexity:** 🟢 Easy

- [x] **Remove `cascadeSoftDeleteUserRelated` references to nonexistent models**
  - **Why:** This hook calls `user.model('Post')`, `'Comment'`, `'Notification')` — none of these Mongoose models exist in this project. It will throw `MissingSchemaError` the first time a user is soft-deleted.
  - **Result:** Function removed (or stubbed with a `// TODO: re-implement once Review/Order cascade rules are defined` comment) until real cascade rules for this project's actual models (e.g. Orders, Reviews, Wishlist) are designed in later phases.
  - **Depends on:** none
  - **Files:** `src/model/user.model.ts`
  - **Complexity:** 🟢 Easy

- [x] **Write a real `README.md`**
  - **Why:** The README is still the unedited Nest starter template — no setup instructions, no env var docs, no project description.
  - **Result:** README documents: project purpose, prerequisites, install/run steps, required env vars (linking to `.env.example`), how to run tests, and a link to this roadmap.
  - **Depends on:** `.env.example` (next task)
  - **Files:** `README.md`
  - **Complexity:** 🟢 Easy

- [x] **Commit a `.env.example` file`**
  - **Why:** No file currently documents which environment variables are required to run the app; a new contributor (or future you) has to reverse-engineer them from `config.ts`.
  - **Result:** `.env.example` with every variable from `config.ts`, placeholder values, and inline comments explaining each.
  - **Depends on:** none
  - **Files:** `.env.example` (new)
  - **Complexity:** 🟢 Easy

**Milestone:** ✅ **Repository Baseline Clean** — dead code removed, docs exist, safe foundation to build on.

---

# Phase 1 — Fix Existing Bugs

_Goal: everything that currently exists actually works before anything new is built on top of it._

- [x] **Fix Signup DTO — add `firstName`/`lastName`**
  - **Why:** `User` schema requires `firstName`/`lastName`, but `SignupDto` never collects them — every signup currently throws a Mongoose `ValidationError`.
  - **Result:** `SignupDto` includes validated `firstName`/`lastName` fields (`@IsString()`, `@MinLength`, `@MaxLength`); signup succeeds end-to-end against a real database.
  - **Depends on:** Phase 0 complete
  - **Files:** `src/modules/authentication/dto/authentication.dto.ts`, `src/modules/authentication/authentication.service.ts`
  - **Complexity:** 🟢 Easy

- [x] **Fix password double-hashing bug**
  - **Why:** `AuthenticationService.signup()` hashes the password with raw `bcrypt.hash()` _and then_ the Mongoose `pre('save')` hook hashes it again (since `isModified('password')` is true on creation) — this likely breaks login for any user created through signup.
  - **Result:** Password is hashed exactly once. Recommended fix: stop hashing manually in the service and let the schema hook be the single source of truth for hashing (removes duplication and the `SecurityService`/raw-`bcrypt` inconsistency at the same time).
  - **Depends on:** Fix Signup DTO
  - **Files:** `src/modules/authentication/authentication.service.ts`, `src/model/user.model.ts`
  - **Complexity:** 🟡 Medium

- [x] **Route `AuthenticationService` through `UserRepository` instead of the raw Mongoose model**
  - **Why:** `AuthenticationService` currently injects the raw `Model<IUser>` directly, bypassing the `UserRepository`/`DatabaseRepository` abstraction that already exists — inconsistent pattern, harder to test/mock.
  - **Result:** `AuthenticationModule` imports `UserRepository`; service uses `create()`/`findOne()` from it instead of raw model calls.
  - **Depends on:** Fix password double-hashing bug
  - **Files:** `src/modules/authentication/authentication.service.ts`, `src/modules/authentication/authentication.module.ts`
  - **Complexity:** 🟡 Medium

- [x] **Fix encryption key env var mismatch (`ENC_BYTE` vs `ENC_KEY`)**
  - **Why:** `SecurityService.generateEncryption`/`generateDecryption` read `ENC_KEY`, but `config.ts` only exports `ENC_BYTE`. Phone encryption will throw `BadRequestException: Encryption key not configured` in any real environment.
  - **Result:** One consistent env var name (`ENC_KEY`) used everywhere; `config.ts` and `.env.example` updated to match; a 32-byte hex key documented as the required format for AES-256.
  - **Depends on:** Phase 0 `.env.example` task
  - **Files:** `src/config/config.ts`, `src/common/module/security/security.service.ts`, `.env.example`
  - **Complexity:** 🟢 Easy

- [x] **Fix broken `product.controller.spec.ts` test**
  - **Why:** The test module registers only `controllers: [ProductController]` without `providers: [ProductService]`, causing a dependency-resolution failure — 1 of 8 test suites currently fails.
  - **Result:** `npx jest` passes with 0 failing suites.
  - **Depends on:** none
  - **Files:** `src/modules/product/product.controller.spec.ts`
  - **Complexity:** 🟢 Easy

- [x] **Upgrade all "should be defined" smoke tests into real behavioral tests**
  - **Why:** Every existing `.spec.ts` file only checks `expect(x).toBeDefined()` — this gives false confidence and catches nothing.
  - **Result:** At minimum, `AuthenticationService` has real unit tests (signup success, signup with mismatched confirmPassword, login with wrong password, login with nonexistent user) using mocked repository.
  - **Depends on:** Route `AuthenticationService` through `UserRepository`
  - **Files:** `src/modules/authentication/*.spec.ts` (new), existing `*.spec.ts` files
  - **Complexity:** 🟡 Medium

- [x] **Add `mongodb-memory-server` for isolated integration tests**
  - **Why:** There is currently no way to run tests against a real (but disposable) MongoDB instance — needed for meaningful integration tests going forward.
  - **Result:** A shared Jest test setup that spins up an in-memory Mongo instance for integration-level specs.
  - **Depends on:** none
  - **Files:** `package.json` (devDependency), `test/setup.ts` (new), `test/jest-e2e.json`
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Existing Functionality Stabilized** — signup, login, encryption, and the test suite all genuinely work.

---

# Phase 2 — Core Infrastructure & Cross-Cutting Concerns

_Goal: put the scaffolding in place once so every module built afterward automatically benefits (validation, errors, logging, docs, security headers)._

- [x] **Add environment variable validation on boot**
  - **Why:** Currently `config.ts` blindly reads `process.env` with no validation — the app can boot with missing/invalid secrets and fail unpredictably at runtime instead of at startup.
  - **Result:** A `Joi` or `class-validator`-based env schema validated inside `ConfigModule.forRoot({ validationSchema })`; app refuses to boot with a clear error if required vars are missing.
  - **Depends on:** Phase 0 `.env.example`
  - **Files:** `src/config/env.validation.ts` (new), `src/app.module.ts`
  - **Complexity:** 🟡 Medium

- [x] **Apply a global `ValidationPipe`**
  - **Why:** `ValidationPipe` is currently applied per-route (`@UsePipes`) only on auth endpoints; every future controller needs this without re-declaring it each time.
  - **Result:** `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` in `main.ts`; per-route `@UsePipes` calls removed as redundant.
  - **Depends on:** none
  - **Files:** `src/main.ts`, `src/modules/authentication/auth.controller.ts`
  - **Complexity:** 🟢 Easy

- [x] **Add a global exception filter**
  - **Why:** No consistent error response shape exists; Nest's default error format doesn't match the `{ message, data }` success envelope used elsewhere, so clients handle two different shapes.
  - **Result:** `AllExceptionsFilter` catching `HttpException` and unknown errors, returning a consistent `{ success: false, message, error, statusCode }` shape; registered globally.
  - **Depends on:** none
  - **Files:** `src/common/filter/all-exceptions.filter.ts` (new), `src/main.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add a global response-transform interceptor**
  - **Why:** Success responses are inconsistent (`{ message, data }` in some places, raw strings in others). Standardizing now avoids rewriting every controller later.
  - **Result:** `TransformInterceptor` wraps every successful response as `{ success: true, message, data }`; controllers return raw data and let the interceptor handle the envelope.
  - **Depends on:** Add a global exception filter (so success/error shapes are symmetric)
  - **Files:** `src/common/interceptor/transform.interceptor.ts` (new), `src/main.ts`
  - **Complexity:** 🟡 Medium

- [x] **Replace `console.log` with structured logging (Nest `Logger` or Pino)**
  - **Why:** No log levels, no correlation IDs, unsuitable for production observability; currently PII (request bodies) is logged in plaintext.
  - **Result:** `nestjs-pino` (or built-in `Logger` at minimum) integrated; each module logs through an injected logger; sensitive fields (passwords, tokens) redacted.
  - **Depends on:** Phase 0 console.log removal
  - **Files:** `src/main.ts`, `src/app.module.ts`, all service files (incremental adoption)
  - **Complexity:** 🟡 Medium

- [x] **Enable CORS**
  - **Why:** `ORIGINS` env var already exists implying this was planned, but `app.enableCors()` is never called — no frontend can call this API from a browser today.
  - **Result:** CORS enabled in `main.ts`, reading allowed origins from `ORIGINS` env var (comma-separated, parsed into an array).
  - **Depends on:** Add environment variable validation
  - **Files:** `src/main.ts`, `src/config/config.ts`
  - **Complexity:** 🟢 Easy

- [x] **Add Helmet for HTTP security headers**
  - **Why:** No security headers (CSP, X-Frame-Options, etc.) are set today.
  - **Result:** `helmet` installed and applied via `app.use(helmet())` in `main.ts`.
  - **Depends on:** none
  - **Files:** `package.json`, `src/main.ts`
  - **Complexity:** 🟢 Easy

- [x] **Add global rate limiting**
  - **Why:** No throttling exists anywhere — auth endpoints in particular are open to brute-force/credential-stuffing.
  - **Result:** `@nestjs/throttler` installed, global default limit set, with a stricter custom limit applied to `/auth/login` and `/auth/signup`.
  - **Depends on:** none
  - **Files:** `package.json`, `src/app.module.ts`, `src/modules/authentication/auth.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add Swagger/OpenAPI documentation**
  - **Why:** No API documentation exists; every existing and future endpoint needs to be discoverable by frontend/mobile consumers.
  - **Result:** `@nestjs/swagger` installed, `SwaggerModule.setup('api/docs', ...)` wired in `main.ts`, `@ApiTags`/`@ApiProperty` decorators added incrementally to DTOs and controllers going forward.
  - **Depends on:** none
  - **Files:** `package.json`, `src/main.ts`, DTO files (incremental)
  - **Complexity:** 🟡 Medium

- [x] **Add API versioning**
  - **Why:** No versioning strategy exists (`/auth/login` vs `/v1/auth/login`) — needed before external consumers depend on this API.
  - **Result:** URI versioning enabled (`app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`); all routes now live under `/v1/...`.
  - **Depends on:** none
  - **Files:** `src/main.ts`
  - **Complexity:** 🟢 Easy

- [x] **Add a health-check endpoint**
  - **Why:** No `/health` endpoint exists for load balancers/orchestrators (Kubernetes, ECS, uptime monitors) to probe.
  - **Result:** `@nestjs/terminus` installed; `GET /health` checks Mongo connectivity (and Redis once added in Phase 15).
  - **Depends on:** none
  - **Files:** `src/modules/health/health.module.ts` (new), `health.controller.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Add request correlation IDs**
  - **Why:** Without a request ID, tracing a single request's log lines across a busy production log stream is impractical.
  - **Result:** Middleware assigns a UUID per request (`X-Request-Id` header, generated if absent), included in every log line for that request.
  - **Depends on:** Structured logging task
  - **Files:** `src/common/middleware/request-id.middleware.ts` (new), `src/app.module.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add global pagination/filtering/sorting DTO + interceptor pattern**
  - **Why:** An `IPaginate` interface already exists but is unused; every list-returning module (Product, Category, Order, Review...) will need this identical logic — build it once.
  - **Result:** A reusable `PaginationQueryDto` (`page`, `limit`, `sort`, `order`) and a `paginate()` helper on `DatabaseRepository` returning `{ docs, currentPage, pages, size, total }`.
  - **Depends on:** none
  - **Files:** `src/common/dto/pagination-query.dto.ts` (new), `src/common/repository/base.repository.ts`, `src/common/interface/pagination.interface.ts`
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Backend Foundation Complete** — validation, error handling, logging, docs, security headers, and pagination all exist as reusable infrastructure.

---

# Phase 3 — Authentication

_Goal: a user can prove who they are on every subsequent request, safely, with the ability to log out and refresh sessions._

- [x] **Install and configure `@nestjs/jwt`**
  - **Why:** No token issuance exists at all today; `User_TOKEN_SECRET_KEY` etc. are defined in config but never used.
  - **Result:** `JwtModule` registered (async, reading secret/expiry from `ConfigService`).
  - **Depends on:** Phase 2 env validation
  - **Files:** `package.json`, `src/modules/authentication/authentication.module.ts`
  - **Complexity:** 🟢 Easy

- [x] **Issue access token on login/signup**
  - **Why:** Login currently returns a raw user object with no way to authenticate future requests.
  - **Result:** `login()`/`signup()` return `{ user, accessToken }`; access token payload includes `sub` (user id), `role`, `iat`/`exp`.
  - **Depends on:** Install `@nestjs/jwt`
  - **Files:** `src/modules/authentication/authentication.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Implement refresh token issuance + storage**
  - **Why:** `REFRESH_EXPIRES_IN`/`User_REFRESH_TOKEN_SECRET_KEY` are already anticipated in config; short-lived access tokens need a refresh mechanism so users aren't forced to log in every 30 minutes.
  - **Result:** Refresh token generated alongside access token on login, hashed and stored on the `User` document (or a dedicated `Token` collection), with an endpoint `POST /auth/refresh` that validates and rotates it.
  - **Depends on:** Issue access token
  - **Files:** `src/model/user.model.ts` (or new `src/model/token.model.ts`), `src/modules/authentication/authentication.service.ts`, `auth.controller.ts`
  - **Complexity:** 🔴 Hard

- [x] **Implement logout (single-session and all-sessions)**
  - **Why:** `logoutEnum` (`ONLY`/`ALL`) already anticipated in enums but unused; users need a way to invalidate tokens.
  - **Result:** `POST /auth/logout` invalidates the current refresh token; `POST /auth/logout-all` invalidates all refresh tokens for the user (bump `changeCredentialsTime`, already a field on the schema).
  - **Depends on:** Implement refresh token issuance
  - **Files:** `src/modules/authentication/authentication.service.ts`, `auth.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Build `JwtStrategy` + `AuthGuard`**
  - **Why:** No guard exists to protect any route today; every "protected" endpoint is currently wide open.
  - **Result:** `passport-jwt` strategy validates the access token and attaches the user (or `{ id, role }`) to `request.user`; a reusable `JwtAuthGuard`.
  - **Depends on:** Issue access token
  - **Files:** `src/modules/authentication/strategies/jwt.strategy.ts` (new), `src/common/guard/jwt-auth.guard.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `@CurrentUser()` param decorator**
  - **Why:** Every protected controller will need clean access to the authenticated user without repeating `request.user` boilerplate.
  - **Result:** `@CurrentUser() user: IUser` usable in any controller method guarded by `JwtAuthGuard`.
  - **Depends on:** Build `JwtStrategy` + `AuthGuard`
  - **Files:** `src/common/decorator/current-user.decorator.ts` (new), `src/common/decorator/index.ts`
  - **Complexity:** 🟢 Easy

- [x] **Wire real `GET /user` (current user profile) using the guard + decorator**
  - **Why:** `GET /user` currently returns a hardcoded fake object instead of the authenticated user.
  - **Result:** Route protected by `JwtAuthGuard`, returns the real logged-in user's profile via `@CurrentUser()`.
  - **Depends on:** Build `@CurrentUser()` decorator
  - **Files:** `src/modules/user/user.controller.ts`, `user.service.ts`
  - **Complexity:** 🟢 Easy

- [x] **Add change-password endpoint**
  - **Why:** No way for an authenticated user to change their password exists.
  - **Result:** `PATCH /user/password` requires current password match, updates `changeCredentialsTime` (invalidating old tokens).
  - **Depends on:** Wire real `GET /user`
  - **Files:** `src/modules/user/user.controller.ts`, `user.service.ts`, DTO
  - **Complexity:** 🟡 Medium

- [x] **Add integration tests for full auth flow**
  - **Why:** Auth is the highest-risk module in the system; needs end-to-end verification (signup → login → access protected route → refresh → logout → old token rejected).
  - **Result:** E2E spec covering the full lifecycle using `mongodb-memory-server`.
  - **Depends on:** All above auth tasks
  - **Files:** `test/auth.e2e-spec.ts` (new)
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Authentication Complete** — users can sign up, log in, stay authenticated, refresh, and log out securely.

---

# Phase 4 — Authorization (Roles & Permissions)

_Goal: distinguish what a logged-in user is allowed to do, not just who they are._

- [x] **Build `@Roles()` decorator + `RolesGuard`**
  - **Why:** `RoleEnum` (`USER`/`ADMIN`) already exists on the schema but nothing checks it — every route is equally accessible to any authenticated user today.
  - **Result:** `@Roles(RoleEnum.ADMIN)` decorator readable by a `RolesGuard` that runs after `JwtAuthGuard` and rejects unauthorized roles with `403`.
  - **Depends on:** Phase 3 complete
  - **Files:** `src/common/decorator/roles.decorator.ts` (new), `src/common/guard/roles.guard.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Design a fine-grained permission system (beyond just role)**
  - **Why:** A two-role system (`USER`/`ADMIN`) won't scale to a real e-commerce team (e.g. "content editor" who can edit products but not view orders/refunds).
  - **Result:** A `Permission` enum (`product:create`, `order:refund`, `user:manage`, etc.) and a `permissions[]` array on `User`, with a `PermissionsGuard` checking against required permissions per route.
  - **Depends on:** Build `RolesGuard`
  - **Files:** `src/common/enum/permission.enum.ts` (new), `src/model/user.model.ts`, `src/common/guard/permissions.guard.ts` (new), `src/common/decorator/permissions.decorator.ts` (new)
  - **Complexity:** 🔴 Hard

- [x] **Add resource-ownership checks (e.g. a user can only edit their own order/review)**
  - **Why:** Role checks alone don't prevent User A from modifying User B's data via a guessed ID.
  - **Result:** A reusable ownership-check pattern (guard or in-service check) applied to update/delete endpoints on user-owned resources.
  - **Depends on:** Design permission system
  - **Files:** `src/common/guard/ownership.guard.ts` (new), applied per-module as those modules are built
  - **Complexity:** 🟡 Medium

- [x] **Protect all admin-only endpoints defined so far**
  - **Why:** Establish the pattern now, before more admin routes are added without protection.
  - **Result:** Every catalog-management endpoint built in later phases uses `@Roles(RoleEnum.ADMIN)` from day one, not retrofitted later.
  - **Depends on:** Build `RolesGuard`
  - **Files:** N/A (policy applied going forward)
  - **Complexity:** 🟢 Easy

**Milestone:** ✅ **Authorization Complete** — role- and permission-based access control enforced across the API.

---

# Phase 5 — Email System (Verification, Forgot/Reset Password)

_Goal: users can verify their email and recover access without support intervention._

- [x] **Install and configure a mailer (`@nestjs-modules/mailer` + `nodemailer`)**
  - **Why:** `EMAIL_APP`/`EMAIL_APP_PASSWORD` env vars already exist implying this was planned; no mailer dependency currently exists.
  - **Result:** `MailerModule` configured with SMTP transport from env vars; a reusable `MailService.send()`.
  - **Depends on:** Phase 2 env validation
  - **Files:** `package.json`, `src/common/module/mail/mail.module.ts` (new), `mail.service.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build email templates (verification, password reset, order confirmation placeholder)**
  - **Why:** Emails need consistent, branded HTML rather than plaintext.
  - **Result:** Handlebars (or similar) templates for `confirm-email`, `forgot-password`; rendered via `MailService`.
  - **Depends on:** Install mailer
  - **Files:** `src/common/module/mail/templates/*.hbs` (new)
  - **Complexity:** 🟡 Medium

- [x] **Implement email verification token generation (OTP or signed link)**
  - **Why:** `EmailEnum.CONFIRM_EMAIL` already anticipated; `User.confirmEmail` field exists but nothing sets it.
  - **Result:** On signup, a 6-digit OTP (or signed JWT link) is generated, emailed, and stored (hashed) with an expiry.
  - **Depends on:** Build email templates
  - **Files:** `src/modules/authentication/authentication.service.ts`, `src/model/user.model.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add `POST /auth/confirm-email` endpoint**
  - **Why:** Users need a way to submit the OTP/token and mark their account verified.
  - **Result:** Endpoint validates the token, sets `User.confirmEmail = new Date()`.
  - **Depends on:** Implement email verification token generation
  - **Files:** `src/modules/authentication/auth.controller.ts`, `authentication.service.ts`, DTO
  - **Complexity:** 🟢 Easy

- [x] **Enforce email verification on protected/sensitive routes (configurable)**
  - **Why:** Without enforcement, verification is cosmetic.
  - **Result:** A guard/interceptor (or simple service check) blocking checkout/order placement for unverified accounts, configurable via env flag for staged rollout.
  - **Depends on:** Add confirm-email endpoint
  - **Files:** `src/common/guard/email-verified.guard.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Implement forgot-password flow**
  - **Why:** `EmailEnum.ForgotPassword` already anticipated; no way currently exists for a user to recover a lost password.
  - **Result:** `POST /auth/forgot-password` generates a short-lived reset token, emails a reset link.
  - **Depends on:** Build email templates
  - **Files:** `src/modules/authentication/auth.controller.ts`, `authentication.service.ts`, DTO
  - **Complexity:** 🟡 Medium

- [x] **Implement reset-password flow**
  - **Why:** Completes the forgot-password loop.
  - **Result:** `POST /auth/reset-password` validates the token, updates the password (via the schema hook, single-hash path from Phase 1), invalidates existing sessions (`changeCredentialsTime`).
  - **Depends on:** Implement forgot-password flow
  - **Files:** `src/modules/authentication/auth.controller.ts`, `authentication.service.ts`, DTO
  - **Complexity:** 🟡 Medium

- [x] **Add rate limiting specifically to email-triggering endpoints**
  - **Why:** Forgot-password/resend-verification endpoints are common abuse vectors for email-bombing.
  - **Result:** Stricter `@Throttle()` limits on these specific routes.
  - **Depends on:** Phase 2 rate limiting, all above tasks
  - **Files:** `src/modules/authentication/auth.controller.ts`
  - **Complexity:** 🟢 Easy

**Milestone:** ✅ **Email System Complete** — verification and password recovery work end-to-end.

---

# Phase 6 — File Upload, Image Management & AWS S3

_Goal: users/admins can upload and manage images (profile pictures, product photos) reliably._

- [x] **Install AWS SDK and configure S3 client**
  - **Why:** `S3_REGION`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_ACCESS_SECRET_KEY` already exist in config, unused; `multer.enum.ts` (`StorageApproachEnum`, `UploadApproachEnum`) already anticipates upload strategy.
  - **Result:** `@aws-sdk/client-s3` installed; an `S3Service` with `uploadFile()`/`deleteFile()`/`getPresignedUrl()`.
  - **Depends on:** Phase 2 env validation
  - **Files:** `package.json`, `src/common/module/upload/s3.service.ts` (new), `s3.module.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Configure Multer for multipart upload handling**
  - **Why:** No file-upload middleware is configured anywhere despite the enum groundwork.
  - **Result:** `MulterModule` registered with memory storage (small files) and disk storage (large files) strategies matching `StorageApproachEnum`.
  - **Depends on:** Install AWS SDK
  - **Files:** `src/common/module/upload/upload.module.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build generic file-upload endpoint + validation (size, mimetype)**
  - **Why:** Needed as a shared building block before wiring it into User profile pictures and Product images.
  - **Result:** `POST /upload` (protected) accepts a file, validates against the existing Zod `file()` schema pattern (or a `class-validator` equivalent), uploads to S3, returns the URL.
  - **Depends on:** Configure Multer
  - **Files:** `src/common/module/upload/upload.controller.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Wire profile picture upload to `User`**
  - **Why:** `User.profilePicture`/`profileCoverPicture` fields already exist on the schema but nothing populates them.
  - **Result:** `PATCH /user/profile-picture` uploads via `S3Service`, updates the field, deletes the old image from S3.
  - **Depends on:** Build generic file-upload endpoint
  - **Files:** `src/modules/user/user.controller.ts`, `user.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add image validation/processing (dimensions, compression)**
  - **Why:** Uploading unoptimized images directly to S3 wastes storage/bandwidth and slows down page loads on the eventual storefront.
  - **Result:** `sharp` integrated to resize/compress images before upload (e.g. max 1200px, WebP conversion).
  - **Depends on:** Wire profile picture upload
  - **Files:** `package.json`, `src/common/module/upload/s3.service.ts`
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **File & Media Management Complete** — reusable upload pipeline ready for both user and product images.

---

# Phase 7 — Category Module (Real Implementation)

_Goal: replace the unedited scaffold with a real, hierarchical catalog category system, since Product depends on it._

- [x] **Design and build `Category` Mongoose schema**
  - **Why:** `entities/category.entity.ts` is currently an empty class; no schema exists.
  - **Result:** Schema with `name`, `slug`, `image`, `parent` (self-referencing `ObjectId` for subcategories), `isActive`, timestamps, soft-delete (following the `User` pattern from Phase 0/1).
  - **Depends on:** Phase 6 (image upload) for category images
  - **Files:** `src/model/category.model.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `Category` DTOs (create/update) with real validation**
  - **Why:** `CreateCategoryDto`/`UpdateCategoryDto` are currently empty classes accepting anything.
  - **Result:** Validated fields matching the schema; `UpdateCategoryDto` via `PartialType` (pattern already present, just needs real fields).
  - **Depends on:** Build `Category` schema
  - **Files:** `src/modules/category/dto/create-category.dto.ts`, `update-category.dto.ts`
  - **Complexity:** 🟢 Easy

- [x] **Build `CategoryRepository` extending `DatabaseRepository`**
  - **Why:** Establish the same repository pattern used by `User`, now for Category.
  - **Result:** `CategoryRepository` injected into `CategoryService`.
  - **Depends on:** Build `Category` schema
  - **Files:** `src/modules/category/category.repository.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Implement real `CategoryService` logic (replacing string-literal stubs)**
  - **Why:** Current service methods return literal strings — no persistence at all.
  - **Result:** `create`, `findAll` (paginated, using Phase 2 pagination helper), `findOne`, `update`, `remove` (soft delete) all backed by the repository.
  - **Depends on:** Build `CategoryRepository`, Build DTOs
  - **Files:** `src/modules/category/category.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Wire `CategoryController` to real service, protect write routes**
  - **Why:** `+id` (`parseInt`) is currently used for Mongo `ObjectId` strings — will break; and no auth/role protection exists on mutating routes.
  - **Result:** `id: string` params (no `+id` cast), `@Roles(RoleEnum.ADMIN)` + `JwtAuthGuard` on create/update/remove; `findAll`/`findOne` public.
  - **Depends on:** Phase 3 & 4 complete, Implement real `CategoryService`
  - **Files:** `src/modules/category/category.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Support nested subcategory queries**
  - **Why:** `parent` field on the schema enables hierarchy, but needs a query to fetch a tree/breadcrumb.
  - **Result:** `GET /category/:id/children` and a `GET /category/tree` endpoint.
  - **Depends on:** Wire `CategoryController`
  - **Files:** `src/modules/category/category.service.ts`, `category.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Write unit + integration tests for Category module**
  - **Why:** Needs the same real-behavior testing standard set in Phase 1.
  - **Result:** Service unit tests (mocked repo) + E2E test (create → fetch → update → soft-delete → excluded from list).
  - **Depends on:** All above Category tasks
  - **Files:** `src/modules/category/category.service.spec.ts`, `category.controller.spec.ts`, `test/category.e2e-spec.ts` (new)
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Category Management Complete**

---

# Phase 8 — Brand Module (Real Implementation)

_Goal: same treatment as Category — Brand is a peer dependency of Product._

- [x] **Design and build `Brand` Mongoose schema**
  - **Why:** `entities/brand.entity.ts` is empty; no schema exists.
  - **Result:** Schema with `name`, `slug`, `logo`, `description`, `isActive`, timestamps, soft-delete.
  - **Depends on:** Phase 6 (image upload) for brand logos
  - **Files:** `src/model/brand.model.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Build `Brand` DTOs with real validation**
  - **Depends on:** Build `Brand` schema
  - **Files:** `src/modules/brand/dto/create-brand.dto.ts`, `update-brand.dto.ts`
  - **Complexity:** 🟢 Easy

- [x] **Build `BrandRepository` extending `DatabaseRepository`**
  - **Depends on:** Build `Brand` schema
  - **Files:** `src/modules/brand/brand.repository.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Implement real `BrandService` logic**
  - **Depends on:** Build `BrandRepository`, DTOs
  - **Files:** `src/modules/brand/brand.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Wire `BrandController` to real service, protect write routes**
  - **Depends on:** Phase 3 & 4, Implement real `BrandService`
  - **Files:** `src/modules/brand/brand.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Write unit + integration tests for Brand module**
  - **Depends on:** All above Brand tasks
  - **Files:** `src/modules/brand/brand.service.spec.ts`, `brand.controller.spec.ts`, `test/brand.e2e-spec.ts` (new)
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Brand Management Complete**

---

# Phase 9 — Product Module (The Core of the System)

_Goal: a real, searchable, paginated product catalog referencing Category and Brand._

- [x] **Design and build `Product` Mongoose schema**
  - **Why:** Currently no schema exists at all; `ProductService.list()` returns 3 hardcoded objects.
  - **Result:** Schema with `title`, `slug`, `description`, `price`, `discountPrice`, `category` (`ObjectId` ref), `brand` (`ObjectId` ref), `images[]`, `stock`, `sku`, `isActive`, `ratingsAverage`, `ratingsCount`, timestamps, soft-delete.
  - **Depends on:** Phase 7 & 8 complete
  - **Files:** `src/model/product.model.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `Product` DTOs (create/update) with full validation**
  - **Result:** Validated `title`, `price` (positive number), `category`/`brand` (valid `ObjectId`), `stock` (non-negative int), image array constraints.
  - **Depends on:** Build `Product` schema
  - **Files:** `src/modules/product/dto/create-product.dto.ts` (new), `update-product.dto.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `ProductRepository` extending `DatabaseRepository`**
  - **Depends on:** Build `Product` schema
  - **Files:** `src/modules/product/product.repository.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Implement `ProductService` create/update/delete**
  - **Result:** Slug auto-generated from title; validates referenced `category`/`brand` exist before saving; soft delete on remove.
  - **Depends on:** Build `ProductRepository`, DTOs
  - **Files:** `src/modules/product/product.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Implement product listing with pagination, filtering, and sorting**
  - **Why:** `IPaginate` interface exists but nothing uses it; there is currently no way to filter/sort products at all.
  - **Result:** `GET /product?page=&limit=&category=&brand=&minPrice=&maxPrice=&sort=` using the Phase 2 pagination helper.
  - **Depends on:** Phase 2 pagination task, Implement `ProductService` create/update/delete
  - **Files:** `src/modules/product/product.service.ts`, `src/modules/product/dto/query-product.dto.ts` (new)
  - **Complexity:** 🔴 Hard

- [x] **Implement product image upload (multiple images per product)**
  - **Depends on:** Phase 6 complete, Implement `ProductService` create/update/delete
  - **Files:** `src/modules/product/product.controller.ts`, `product.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Wire `ProductController`, protect admin-only mutation routes**
  - **Result:** `GET` routes public; `POST/PATCH/DELETE` behind `JwtAuthGuard` + `@Roles(RoleEnum.ADMIN)`.
  - **Depends on:** Phase 3 & 4, all above Product tasks
  - **Files:** `src/modules/product/product.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Implement basic text search on products**
  - **Why:** No search capability exists; a Mongo text index is the fastest path to a working search before considering Elasticsearch/Atlas Search (Phase 20).
  - **Result:** Text index on `title`/`description`; `GET /product?search=` supported.
  - **Depends on:** Implement product listing with pagination/filtering/sorting
  - **Files:** `src/model/product.model.ts`, `src/modules/product/product.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Write unit + integration tests for Product module**
  - **Depends on:** All above Product tasks
  - **Files:** `src/modules/product/product.service.spec.ts`, `product.controller.spec.ts`, `test/product.e2e-spec.ts` (new)
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Product Management Complete**

---

# Phase 10 — Inventory Management

_Goal: stock is accurate and safe under concurrent purchases._

- [x] **Add stock reservation logic on order placement**
  - **Why:** `Product.stock` exists but nothing decrements it; concurrent orders could oversell.
  - **Result:** Atomic `findOneAndUpdate` with `$inc: { stock: -qty }` guarded by `stock: { $gte: qty }` to prevent negative stock/race conditions.
  - **Depends on:** Phase 9 complete, Phase 13 (Order placement) in progress
  - **Files:** `src/modules/product/product.service.ts`
  - **Complexity:** 🔴 Hard

- [x] **Add low-stock threshold + admin notification**
  - **Why:** Admins need visibility before a product goes out of stock.
  - **Result:** `lowStockThreshold` field on `Product`; triggers a notification (Phase 17) when crossed.
  - **Depends on:** Phase 17 (Notifications)
  - **Files:** `src/model/product.model.ts`, `src/modules/product/product.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add stock restoration on order cancellation/refund**
  - **Result:** Cancelling/refunding an order increments stock back.
  - **Depends on:** Add stock reservation logic, Phase 13 (Order cancellation)
  - **Files:** `src/modules/order/order.service.ts`
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Inventory Management Complete**

---

# Phase 11 — Shopping Cart

_Goal: a logged-in (and optionally guest) user can build an order before checking out._

- [x] **Design and build `Cart` Mongoose schema**
  - **Result:** Schema with `user` (`ObjectId`, unique), `items: [{ product, quantity, priceAtAdd }]`, `updatedAt`.
  - **Depends on:** Phase 9 complete
  - **Files:** `src/model/cart.model.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `CartRepository`, `CartService` (add/remove/update item, clear)**
  - **Result:** `addItem` validates stock availability; `updateItemQuantity`; `removeItem`; `clearCart`; `getCart` (populated with product details).
  - **Depends on:** Build `Cart` schema
  - **Files:** `src/modules/cart/cart.repository.ts` (new), `cart.service.ts` (new)
  - **Complexity:** 🔴 Hard

- [x] **Build `CartController` (protected — cart requires login)**
  - **Result:** `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart`.
  - **Depends on:** Phase 3, Build `CartService`
  - **Files:** `src/modules/cart/cart.controller.ts` (new), `cart.module.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Add cart total calculation (subtotal, discounts placeholder, tax placeholder)**
  - **Depends on:** Build `CartService`
  - **Files:** `src/modules/cart/cart.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Write unit + integration tests for Cart module**
  - **Depends on:** All above Cart tasks
  - **Files:** `src/modules/cart/*.spec.ts`, `test/cart.e2e-spec.ts` (new)
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Cart Complete**

---

# Phase 12 — Coupons & Discounts

_Goal: promotional pricing exists before checkout needs to apply it._

- [x] **Design and build `Coupon` Mongoose schema**
  - **Result:** Schema with `code` (unique), `type` (`PERCENTAGE`/`FIXED`), `value`, `minOrderValue`, `maxUses`, `usedCount`, `expiresAt`, `isActive`.
  - **Depends on:** Phase 4 (admin auth)
  - **Files:** `src/model/coupon.model.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `CouponService`/`CouponController` (admin CRUD)**
  - **Depends on:** Build `Coupon` schema
  - **Files:** `src/modules/coupon/*` (new module)
  - **Complexity:** 🟡 Medium

- [x] **Add coupon validation + application logic to Cart**
  - **Result:** `POST /cart/apply-coupon` validates expiry/usage/min order value, stores applied coupon on the cart, recalculates total.
  - **Depends on:** Phase 11 complete, Build `CouponService`
  - **Files:** `src/modules/cart/cart.service.ts`, `cart.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Write tests for coupon validation edge cases (expired, exhausted, below minimum)**
  - **Depends on:** All above Coupon tasks
  - **Files:** `src/modules/coupon/*.spec.ts`
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Coupons & Discounts Complete**

---

# Phase 13 — Checkout & Orders

_Goal: a cart becomes a real, trackable order._

- [x] **Design and build `Order` Mongoose schema**
  - **Why:** `entities/order.entity.ts` is currently empty; no schema exists.
  - **Result:** Schema with `user`, `items: [{ product, quantity, priceAtPurchase }]`, `shippingAddress`, `subtotal`, `discount`, `tax`, `shippingCost`, `total`, `status` (enum: `PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED → REFUNDED`), `paymentStatus`, timestamps.
  - **Depends on:** Phase 9, 11, 12 complete
  - **Files:** `src/model/order.model.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `Order` DTOs (create order from cart, update status)**
  - **Depends on:** Build `Order` schema
  - **Files:** `src/modules/order/dto/create-order.dto.ts`, `update-order.dto.ts`
  - **Complexity:** 🟢 Easy

- [x] **Build `OrderRepository` extending `DatabaseRepository`**
  - **Depends on:** Build `Order` schema
  - **Files:** `src/modules/order/order.repository.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Implement checkout flow (cart → order, atomic stock decrement)**
  - **Why:** This is the single most business-critical operation in the system — must be transactionally safe.
  - **Result:** `POST /order/checkout` wraps cart validation, stock decrement (Phase 10), coupon consumption, order creation, and cart clearing in a MongoDB transaction (`session.withTransaction`).
  - **Depends on:** Phase 10, 11, 12 complete, Build `Order` schema
  - **Files:** `src/modules/order/order.service.ts`
  - **Complexity:** 🔴 Hard

- [x] **Implement order status transitions with validation**
  - **Result:** State machine preventing illegal transitions (e.g. `DELIVERED → PENDING`); admin-only status updates.
  - **Depends on:** Implement checkout flow, Phase 4 (roles)
  - **Files:** `src/modules/order/order.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Implement order cancellation (user-initiated, before shipment)**
  - **Depends on:** Implement order status transitions, Phase 10 (stock restoration)
  - **Files:** `src/modules/order/order.service.ts`, `order.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Wire `OrderController` — user sees own orders, admin sees all**
  - **Result:** `+id` cast removed (Mongo `ObjectId` string), ownership guard (Phase 4) applied so users can't view others' orders.
  - **Depends on:** Phase 4 ownership guard, all above Order tasks
  - **Files:** `src/modules/order/order.controller.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add order confirmation email**
  - **Depends on:** Phase 5 mailer, Implement checkout flow
  - **Files:** `src/modules/order/order.service.ts`
  - **Complexity:** 🟢 Easy

- [x] **Write unit + integration tests for Order module (including transaction rollback on failure)**
  - **Depends on:** All above Order tasks
  - **Files:** `src/modules/order/*.spec.ts`, `test/order.e2e-spec.ts` (new)
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Checkout & Orders Complete**

---

# Phase 14 — Payment Integration

_Goal: orders can actually be paid for._

- [x] **Choose and integrate a payment provider (e.g. Stripe)**
  - **Result:** `@stripe/stripe-js`/`stripe` SDK installed; `PaymentService` creating a PaymentIntent per order.
  - **Depends on:** Phase 13 complete
  - **Files:** `package.json`, `src/modules/payment/payment.module.ts` (new), `payment.service.ts` (new)
  - **Complexity:** 🔴 Hard

- [x] **Implement payment webhook handler**
  - **Result:** `POST /payment/webhook` verifies Stripe signature, updates `Order.paymentStatus`/`status` on success/failure events.
  - **Depends on:** Choose and integrate a payment provider
  - **Files:** `src/modules/payment/payment.controller.ts` (new)
  - **Complexity:** 🔴 Hard

- [x] **Implement refund flow**
  - **Depends on:** Implement payment webhook handler, Phase 13 order cancellation
  - **Files:** `src/modules/payment/payment.service.ts`, `src/modules/order/order.service.ts`
  - **Complexity:** 🔴 Hard

- [x] **Write integration tests using Stripe's test mode**
  - **Depends on:** All above Payment tasks
  - **Files:** `src/modules/payment/*.spec.ts`
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Payments Complete**

---

# Phase 15 — Reviews & Ratings

- [x] **Design and build `Review` Mongoose schema**
  - **Result:** Schema with `product`, `user`, `rating` (1–5), `comment`, unique index on `(product, user)` to prevent duplicate reviews.
  - **Depends on:** Phase 9 complete
  - **Files:** `src/model/review.model.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Build `ReviewService`/`ReviewController` (create/update/delete own review, list by product)**
  - **Result:** Only users who purchased the product (check against delivered `Order` items) can review — prevents fake reviews.
  - **Depends on:** Phase 13 (Order history), Build `Review` schema
  - **Files:** `src/modules/review/*` (new module)
  - **Complexity:** 🔴 Hard

- [x] **Update `Product.ratingsAverage`/`ratingsCount` on review create/update/delete**
  - **Result:** Post-save/remove hooks on `Review` recalculate the parent product's aggregate rating.
  - **Depends on:** Build `ReviewService`
  - **Files:** `src/model/review.model.ts`, `src/model/product.model.ts`
  - **Complexity:** 🟡 Medium

- [x] **Write tests for review module (including duplicate-review prevention)**
  - **Depends on:** All above Review tasks
  - **Files:** `src/modules/review/*.spec.ts`
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Reviews & Ratings Complete**

---

# Phase 16 — Wishlist

- [x] **Design and build `Wishlist` schema (or array field on `User`)**
  - **Result:** Simple `wishlist: ObjectId[]` array on `User`, or dedicated collection if wishlist metadata (date added) is needed.
  - **Depends on:** Phase 9 complete
  - **Files:** `src/model/user.model.ts` or `src/model/wishlist.model.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Build Wishlist endpoints (add/remove/list)**
  - **Result:** `POST /wishlist/:productId`, `DELETE /wishlist/:productId`, `GET /wishlist`.
  - **Depends on:** Build Wishlist schema
  - **Files:** `src/modules/wishlist/*` (new module)
  - **Complexity:** 🟢 Easy

- [x] **Write tests for Wishlist module**
  - **Depends on:** Build Wishlist endpoints
  - **Files:** `src/modules/wishlist/*.spec.ts`
  - **Complexity:** 🟢 Easy

**Milestone:** ✅ **Wishlist Complete**

---

# Phase 17 — Notifications

- [x] **Design and build `Notification` Mongoose schema**
  - **Result:** Schema with `recipient`, `type` (order update, low stock, promo), `message`, `isRead`, `audience` (`USER`/`ALL`).
  - **Depends on:** Phase 3 complete
  - **Files:** `src/model/notification.model.ts` (new)
  - **Complexity:** 🟢 Easy

- [x] **Build `NotificationService` (create, mark read, list by user)**
  - **Depends on:** Build `Notification` schema
  - **Files:** `src/modules/notification/*` (new module)
  - **Complexity:** 🟡 Medium

- [x] **Wire notifications into Order status changes, low stock, coupon expiry reminders**
  - **Depends on:** Build `NotificationService`, Phase 10 & 13 complete
  - **Files:** `src/modules/order/order.service.ts`, `src/modules/product/product.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **(Optional) Add real-time delivery via WebSockets (Socket.IO gateway)**
  - **Why:** In-app "live" notifications improve UX over polling.
  - **Result:** `NotificationGateway` pushes new notifications to connected clients.
  - **Depends on:** Wire notifications into events
  - **Files:** `src/modules/notification/notification.gateway.ts` (new)
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Notifications Complete**

---

# Phase 18 — Redis, Caching & Sessions

- [x] **Integrate Redis**
  - **Why:** `REDIS_URI` already exists in config, unused.
  - **Result:** `ioredis` (or `cache-manager-redis-store`) installed and connected.
  - **Depends on:** Phase 2 env validation
  - **Files:** `package.json`, `src/common/module/redis/redis.module.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Cache high-read, low-write data (product listings, category tree)**
  - **Result:** Cache-aside pattern on `GET /product`, `GET /category/tree` with sensible TTL and invalidation on writes.
  - **Depends on:** Integrate Redis, Phase 9 complete
  - **Files:** `src/modules/product/product.service.ts`, `src/modules/category/category.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Move refresh-token/session storage to Redis (optional upgrade from Mongo)**
  - **Depends on:** Integrate Redis, Phase 3 refresh tokens
  - **Files:** `src/modules/authentication/authentication.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add Redis check to `/health` endpoint**
  - **Depends on:** Integrate Redis, Phase 2 health checks
  - **Files:** `src/modules/health/health.controller.ts`
  - **Complexity:** 🟢 Easy

**Milestone:** ✅ **Caching Layer Complete**

---

# Phase 19 — Queue System & Background Jobs

- [x] **Integrate a job queue (BullMQ on Redis)**
  - **Why:** Emails, image processing, and notification fan-out currently run synchronously inside the request — slows responses and risks losing work on crash.
  - **Result:** `@nestjs/bullmq` installed, `QueueModule` configured.
  - **Depends on:** Phase 18 (Redis)
  - **Files:** `package.json`, `src/common/module/queue/queue.module.ts` (new)
  - **Complexity:** 🔴 Hard

- [x] **Move email sending to a background job**
  - **Depends on:** Integrate job queue, Phase 5 complete
  - **Files:** `src/common/module/mail/mail.processor.ts` (new), `mail.service.ts`
  - **Complexity:** 🟡 Medium

- [x] **Move image processing/upload to a background job**
  - **Depends on:** Integrate job queue, Phase 6 complete
  - **Files:** `src/common/module/upload/upload.processor.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Add scheduled jobs (cron) for: expiring coupons, abandoned cart reminders, low-stock digest**
  - **Depends on:** Integrate job queue, `@nestjs/schedule`
  - **Files:** `src/modules/coupon/coupon.cron.ts` (new), `src/modules/cart/cart.cron.ts` (new)
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Background Processing Complete**

---

# Phase 20 — Advanced Search

- [x] **Evaluate MongoDB Atlas Search vs. Elasticsearch/OpenSearch**
  - **Why:** Phase 9's basic text index doesn't support typo-tolerance, faceted search, or relevance tuning at scale.
  - **Result:** A documented decision based on hosting constraints (Atlas Search is simpler if already on Atlas; Elasticsearch offers more control self-hosted).
  - **Depends on:** Phase 9 complete
  - **Files:** N/A (decision doc, add to README/ADR)
  - **Complexity:** 🟡 Medium

- [x] **Implement chosen search engine indexing pipeline for Products**
  - **Depends on:** Evaluate search engines
  - **Files:** `src/modules/search/*` (new module)
  - **Complexity:** 🔴 Hard

- [x] **Add faceted filters (price range, brand, category, rating) to search results**
  - **Depends on:** Implement search indexing pipeline
  - **Files:** `src/modules/search/search.service.ts`
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Advanced Search Complete**

---

# Phase 21 — Audit Logs

- [x] **Design and build `AuditLog` schema**
  - **Result:** Schema with `actor` (user), `action`, `resource`, `resourceId`, `changes` (before/after diff), `timestamp`, `ipAddress`.
  - **Depends on:** Phase 4 complete
  - **Files:** `src/model/audit-log.model.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Add an interceptor/decorator to log admin mutating actions automatically**
  - **Result:** `@Audit('product:update')` decorator + interceptor writing to `AuditLog` on every admin create/update/delete across Product, Category, Brand, Order, Coupon.
  - **Depends on:** Build `AuditLog` schema
  - **Files:** `src/common/interceptor/audit.interceptor.ts` (new), `src/common/decorator/audit.decorator.ts` (new)
  - **Complexity:** 🔴 Hard

- [x] **Build admin endpoint to query audit logs**
  - **Depends on:** Add audit interceptor
  - **Files:** `src/modules/audit-log/*` (new module)
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Audit Logging Complete**

---

# Phase 22 — Comprehensive Testing & Quality Gates

_Goal: confidence that the whole system works together, not just module-by-module._

- [x] **Achieve meaningful unit test coverage threshold (e.g. 80%) across services**
  - **Depends on:** All feature phases producing services
  - **Files:** All `*.spec.ts`, `package.json` (coverage thresholds in Jest config)
  - **Complexity:** 🔴 Hard

- [x] **Build full E2E test suite covering critical user journeys**
  - **Result:** Signup → verify → browse → add to cart → apply coupon → checkout → pay → review, run against `mongodb-memory-server`.
  - **Depends on:** All feature phases complete
  - **Files:** `test/*.e2e-spec.ts`
  - **Complexity:** 🔴 Hard

- [x] **Add contract/schema tests for API responses (against Swagger spec)**
  - **Depends on:** Phase 2 Swagger, all modules complete
  - **Files:** `test/contract/*.spec.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Add load/performance testing (k6 or Artillery) on hot endpoints (product list, checkout)**
  - **Depends on:** All feature phases complete
  - **Files:** `test/load/*.js` (new)
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Quality Gates Established**

---

# Phase 23 — Security Hardening

- [x] **Run dependency vulnerability audit (`npm audit`, Snyk/Dependabot) and fix findings**
  - **Depends on:** none (ongoing)
  - **Files:** `package.json`
  - **Complexity:** 🟢 Easy

- [x] **Add input sanitization against NoSQL injection on all user-controlled filter/query params**
  - **Why:** Mongoose filters built from query params (e.g. Product filtering, Phase 9) are an injection risk if not sanitized.
  - **Depends on:** Phase 9 complete
  - **Files:** `src/common/pipe/sanitize-mongo.pipe.ts` (new)
  - **Complexity:** 🟡 Medium

- [x] **Enforce `ClassSerializerInterceptor` / `@Exclude()` to guarantee password/token fields never leak in responses**
  - **Why:** Must be explicitly verified — a schema/DTO change elsewhere could accidentally leak `password` in a `toJSON()` output.
  - **Depends on:** Phase 3 complete
  - **Files:** `src/model/user.model.ts`, `src/main.ts`
  - **Complexity:** 🟡 Medium

- [x] **Add security headers/CSP review, HTTPS enforcement in production config**
  - **Depends on:** Phase 2 Helmet
  - **Files:** `src/main.ts`
  - **Complexity:** 🟢 Easy

- [x] **Add secrets management review (no secrets committed, rotate keys, use a secrets manager in production)**
  - **Depends on:** Phase 25 (Docker/deploy)
  - **Files:** deployment configuration (see Phase 26)
  - **Complexity:** 🟡 Medium

- [x] **Penetration-test / security-review the auth flow specifically (token leakage, timing attacks on login, brute force)**
  - **Depends on:** Phase 3 & 5 complete
  - **Files:** N/A
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Security Hardening Complete**

---

# Phase 24 — Performance Optimization

- [x] **Add database indexes for all common query patterns (category+brand filter, order by user, review by product)**
  - **Depends on:** All schemas complete
  - **Files:** relevant `*.model.ts` files
  - **Complexity:** 🟡 Medium

- [x] **Add `.lean()` to read-only queries that don't need full Mongoose documents**
  - **Depends on:** All modules complete
  - **Files:** relevant `*.service.ts` files
  - **Complexity:** 🟢 Easy

- [x] **Profile and optimize N+1-style population queries (e.g. Order → Product population)**
  - **Depends on:** Phase 13 complete
  - **Files:** relevant `*.service.ts` files
  - **Complexity:** 🟡 Medium

- [x] **Add response compression (gzip/brotli)**
  - **Depends on:** none
  - **Files:** `src/main.ts`
  - **Complexity:** 🟢 Easy

- [x] **Load-test and tune connection pool sizes (Mongo, Redis)**
  - **Depends on:** Phase 22 load testing
  - **Files:** `src/app.module.ts`
  - **Complexity:** 🟡 Medium

**Milestone:** ✅ **Performance Optimization Complete**

---

# Phase 25 — Docker & Local Orchestration

- [x] **Write a production-ready `Dockerfile` (multi-stage build)**
  - **Depends on:** none
  - **Files:** `Dockerfile` (new)
  - **Complexity:** 🟡 Medium

- [x] **Write `docker-compose.yml` (app + MongoDB + Redis for local dev)**
  - **Depends on:** Write `Dockerfile`
  - **Files:** `docker-compose.yml` (new)
  - **Complexity:** 🟡 Medium

- [x] **Add `.dockerignore`**
  - **Depends on:** Write `Dockerfile`
  - **Files:** `.dockerignore` (new)
  - **Complexity:** 🟢 Easy

- [x] **Document Docker-based setup in README**
  - **Depends on:** All above Docker tasks
  - **Files:** `README.md`
  - **Complexity:** 🟢 Easy

**Milestone:** ✅ **Containerization Complete**

---

# Phase 26 — CI/CD

- [x] **Add CI pipeline (GitHub Actions): lint + type-check + test on every PR**
  - **Depends on:** Phase 22 test suite in good shape
  - **Files:** `.github/workflows/ci.yml` (new)
  - **Complexity:** 🟡 Medium

- [x] **Add automated dependency updates (Dependabot/Renovate)**
  - **Depends on:** none
  - **Files:** `.github/dependabot.yml` (new)
  - **Complexity:** 🟢 Easy

- [x] **Add CD pipeline (build Docker image, push to registry, deploy on merge to main)**
  - **Depends on:** Phase 25 complete, CI pipeline
  - **Files:** `.github/workflows/cd.yml` (new)
  - **Complexity:** 🔴 Hard

- [x] **Add staging environment + smoke tests post-deploy**
  - **Depends on:** CD pipeline
  - **Files:** deployment configuration
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **CI/CD Complete**

---

# Phase 27 — Documentation

- [x] **Complete Swagger annotations across every module**
  - **Depends on:** All feature modules complete
  - **Files:** all controller/DTO files
  - **Complexity:** 🟡 Medium

- [x] **Write architecture decision records (ADRs) for key choices (auth strategy, search engine, payment provider)**
  - **Depends on:** relevant phases complete
  - **Files:** `docs/adr/*.md` (new)
  - **Complexity:** 🟢 Easy

- [x] **Write a CONTRIBUTING.md (branching strategy, commit conventions, PR process)**
  - **Depends on:** none
  - **Files:** `CONTRIBUTING.md` (new)
  - **Complexity:** 🟢 Easy

- [x] **Generate and publish a Postman/Insomnia collection (or rely on Swagger export)**
  - **Depends on:** Complete Swagger annotations
  - **Files:** `docs/postman-collection.json` (new)
  - **Complexity:** 🟢 Easy

**Milestone:** ✅ **Documentation Complete**

---

# Phase 28 — Production Deployment & Monitoring

- [x] **Set up production environment configuration (secrets manager, production `.env` handling)**
  - **Depends on:** Phase 23 secrets management task
  - **Files:** deployment configuration
  - **Complexity:** 🟡 Medium

- [x] **Set up centralized log aggregation (e.g. CloudWatch, Datadog, ELK)**
  - **Depends on:** Phase 2 structured logging
  - **Files:** deployment configuration
  - **Complexity:** 🟡 Medium

- [x] **Set up application performance monitoring (APM) and error tracking (Sentry)**
  - **Depends on:** none
  - **Files:** `package.json`, `src/main.ts`
  - **Complexity:** 🟡 Medium

- [x] **Set up uptime/alerting on `/health`**
  - **Depends on:** Phase 2 health checks, production deploy
  - **Files:** deployment configuration
  - **Complexity:** 🟢 Easy

- [x] **Set up automated database backups + restore drill**
  - **Depends on:** production Mongo instance provisioned
  - **Files:** deployment configuration
  - **Complexity:** 🟡 Medium

- [x] **Perform a final security review + load test against production-like environment**
  - **Depends on:** all prior phases
  - **Files:** N/A
  - **Complexity:** 🔴 Hard

**Milestone:** ✅ **Production Launch Ready**

---

## 🏁 Final Production Checklist

Everything below must be checked before this backend goes live.

**Correctness & Stability**

- [x] All Phase 1 bugs fixed and verified
- [x] All unit, integration, and E2E tests passing in CI
- [x] No `console.log` in production code paths
- [x] No unused/dead code remaining

**Security**

- [x] JWT auth + refresh tokens working end-to-end
- [x] Role- and permission-based authorization enforced on all admin routes
- [x] Rate limiting active on auth and email-triggering endpoints
- [x] Helmet + CORS correctly configured for production origins only
- [x] All secrets stored in a secrets manager, none committed to git
- [x] `npm audit`/Snyk shows no high/critical vulnerabilities
- [x] Passwords/tokens verified to never appear in API responses or logs
- [x] NoSQL injection protection on all filter/query inputs

**Data & Persistence**

- [x] All schemas have appropriate indexes
- [x] Soft-delete pattern consistent across all user-facing collections
- [x] Database backups automated and restore-tested
- [x] MongoDB transactions used for all multi-document critical operations (checkout)

**Infrastructure**

- [x] Dockerized and runnable via `docker-compose up`
- [x] CI pipeline green (lint, type-check, tests) on every PR
- [x] CD pipeline deploys automatically on merge to main
- [x] `/health` endpoint live and monitored with alerting
- [x] Centralized logging and error tracking (Sentry) active
- [x] APM/monitoring dashboards in place

**Product Completeness**

- [x] Auth (signup, login, refresh, logout, verify email, forgot/reset password)
- [x] Users (profile, roles, permissions)
- [x] Category, Brand, Product (full CRUD, pagination, filtering, search)
- [x] Inventory (stock tracking, low-stock alerts)
- [x] Cart, Coupons, Checkout, Orders (full lifecycle)
- [x] Payments (charge + webhook + refund)
- [x] Reviews, Wishlist, Notifications
- [x] File upload / S3 image management

**Documentation**

- [x] README accurate and current
- [x] Swagger docs cover 100% of endpoints
- [x] `.env.example` complete and accurate
- [x] ADRs written for major architectural decisions

---

## 🎯 Milestone Summary

- [x] ✅ Repository Baseline Clean
- [x] ✅ Existing Functionality Stabilized
- [x] ✅ Backend Foundation Complete
- [x] ✅ Authentication Complete
- [x] ✅ Authorization Complete
- [x] ✅ Email System Complete
- [x] ✅ File & Media Management Complete
- [x] ✅ Category Management Complete
- [x] ✅ Brand Management Complete
- [x] ✅ Product Management Complete
- [x] ✅ Inventory Management Complete
- [x] ✅ Cart Complete
- [x] ✅ Coupons & Discounts Complete
- [x] ✅ Checkout & Orders Complete
- [x] ✅ Payments Complete
- [x] ✅ Reviews & Ratings Complete
- [x] ✅ Wishlist Complete
- [x] ✅ Notifications Complete
- [x] ✅ Caching Layer Complete
- [x] ✅ Background Processing Complete
- [x] ✅ Advanced Search Complete
- [x] ✅ Audit Logging Complete
- [x] ✅ Quality Gates Established
- [x] ✅ Security Hardening Complete
- [x] ✅ Performance Optimization Complete
- [x] ✅ Containerization Complete
- [x] ✅ CI/CD Complete
- [x] ✅ Documentation Complete
- [x] ✅ Production Launch Ready
