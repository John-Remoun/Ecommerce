<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A NestJS e-commerce backend API (MongoDB, JWT auth, Stripe payments, S3 uploads).</p>

## What was fixed in this pass

This repo was audited end-to-end (every controller, service, module, DTO and
model) to get it running cleanly. Summary of the changes:

1. **Critical: 10 of 16 feature modules were never registered in `AppModule`.**
   `Cart`, `Coupon`, `Health`, `Notification`, `Payment`, `Review`, `Search`,
   `Wishlist`, `AuditLog` and `Upload` were fully implemented (controllers,
   services, DTOs) but not imported anywhere, so none of their routes ever
   existed at runtime. All are now wired in `src/app.module.ts`.
2. **Missing dependencies.** `package.json` was missing 15+ packages that the
   code already imports: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`,
   `@nestjs/terminus`, `@nestjs/throttler`, `@nestjs/mapped-types`,
   `@nestjs/bullmq`, `@nestjs-modules/mailer`, `bullmq`, `ioredis`, `stripe`,
   `multer`, `passport-jwt`, `@aws-sdk/client-s3`,
   `@aws-sdk/s3-request-presigner`, `nodemailer`, plus their `@types`
   packages. All added with current stable versions.
3. **`main.ts` bootstrap was incomplete:**
   - `ValidationPipe` was never registered, so none of the `class-validator`
     decorators on your DTOs were actually enforced.
   - Controllers declare `@Controller({ version: '1' })` but URI versioning
     was never enabled via `app.enableVersioning()` — added, with a global
     `/api` prefix, so every route now lives at `/api/v1/...`.
   - `rawBody: true` was missing, which the Stripe webhook handler needs to
     verify signatures — added.
   - CORS was never enabled — added, driven by the `ORIGINS` env var.
   - `AllExceptionsFilter` and `TransformInterceptor` existed fully-written
     in `src/common/` but were never registered — now wired globally so
     every response has a consistent `{ success, message, data }` shape and
     every error has a consistent `{ success: false, message, error,
     statusCode, path, timestamp }` shape.
   - `RequestIdMiddleware` existed but was never applied — now wired
     globally via `AppModule.configure()`.
   - **`DB_URI` is now validated at boot** — the app fails fast with a clear
     message instead of silently trying to connect with `undefined`.
   - **A Mongo connection diagnostic now prints at boot**: the resolved
     `host`, `port`, `db name`, and every collection with its document count.
     See "Troubleshooting: duplicate-key errors against an empty database"
     below — this is the fastest way to catch a mismatched-database problem.
4. **`.env.development` didn't exist.** Generated one (see below) with
   secure random JWT/encryption secrets and placeholders for the services
   you'll need to supply yourself (MongoDB, Redis, AWS S3, Stripe, Gmail).
5. **Jest couldn't resolve the app's `src/...` absolute imports** (the
   `baseUrl: "./"` TypeScript setting that makes `nest build` work isn't
   picked up by Jest automatically) — added `moduleNameMapper` to both the
   unit test config (`package.json`) and e2e config (`test/jest-e2e.json`).
   All 10 unit test suites (14 tests) now pass; the e2e test requires a live
   MongoDB to run to completion.
6. **~15 ESLint errors** (unsafe enum string comparisons, unnecessary type
   assertions, `async` functions with no `await`) were cleaned up.
   `npm run lint` is now 100% clean, as is `nest build`.
7. **Signup / duplicate-email handling was fundamentally broken:**
   - `AuthenticationService.signup()` never checked whether the email was
     already taken — it just called `create()` and let MongoDB's raw
     `E11000` duplicate-key error propagate straight to the client as an
     ugly 500. There is now an explicit pre-check that throws a clean
     `ConflictException` ("Email is already registered").
   - As a safety net for the race condition where two signups for the same
     email land at the same instant (the pre-check alone can't prevent
     this), `DatabaseRepository` (`base.repository.ts`) now catches any
     raw `MongoServerError` with code `11000` from `create`/`createOne`/
     `insertMany`/`updateOne` and rethrows it as a `ConflictException`
     naming the exact duplicate field — this protects **every** module
     (Product `sku`/`slug`, Category `slug`, Brand `slug`, Coupon `code`,
     not just User), not only signup.
   - `sendEmailVerificationOtp()` was sending the confirmation email
     **twice** on every call (once before saving the OTP hash, once after)
     — fixed to send once.
   - Removed a leftover `console.log('Repository Data:', data)` in
     `base.repository.ts` that was printing **plaintext passwords** to the
     server log on every signup, before the schema's `pre('save')` hook
     had a chance to hash them.
8. **Soft delete was silently incompatible with unique indexes** on `User.email`,
   `Product.slug`/`sku`, `Category.slug`, and `Brand.slug`. Each of these
   models implements soft delete (`deleteOne()`/`deleteMany()` only set
   `deletedAt`, they never physically remove the document), but the unique
   index on each field was a normal, full-collection index — meaning once a
   record was soft-deleted, its email/slug/sku was permanently unusable by
   anyone else, forever, even though the app itself can never see that
   record again (every `find`/`findOne` auto-filters `deletedAt: null`).
   Fixed by replacing each with a **partial unique index**
   (`partialFilterExpression: { deletedAt: null }`), so uniqueness is only
   enforced among *active* documents.

**Nothing about your core business logic was changed beyond the fixes
listed above** — the rest of the signup/login/product/order flows work
exactly as you wrote them.

## Troubleshooting: duplicate-key errors against an "empty" database

If you ever see something like:

```
MongoServerError: E11000 duplicate key error collection: Ecommerce.Ecommerce_APP_USERS
index: email_1 dup key: { email: "..." }
```

but `mongosh` shows `show collections` returning nothing for that database,
this is **always** because the running Node process and your `mongosh`
session are talking to two different MongoDB deployments (a genuine E11000
can only come from the real server, on the real collection, with the real
index and the real conflicting document — it can't be "phantom"). The app
now prints exactly what it's connected to on every boot:

```
DB_URI = mongodb://localhost:27017/ecommerce
Mongo connection → host=localhost port=27017 db=ecommerce
Mongo: collections in "ecommerce":
  - Ecommerce_APP_USERS: 3 document(s)
```

Compare that output line-by-line against your `mongosh` session. The most
common causes, in order of likelihood:

1. **An OS/shell environment variable is silently overriding your `.env`
   file.** By design, `dotenv`/`@nestjs/config` never overrides a variable
   that's already present in `process.env` — so if `DB_URI` was ever
   `export`ed in your shell profile, set in a Docker Compose `environment:`
   block, or hardcoded in a VS Code `launch.json`, that value wins over
   `.env.development` no matter what the file says. Run `env | grep DB_URI`
   in the same terminal you start the app from to check.
2. **Two MongoDB servers are both listening on port 27017** (e.g. a native
   install and a Docker container), and `mongosh` happens to connect to a
   different one than the Node driver does.
3. **A stale `nest start --watch` (or `node dist/main.js`) process is still
   running in the background** from before you last edited `.env.development`
   — kill anything already bound to your `PORT` and restart.
4. `mongosh` was pointed at a different deployment entirely (e.g. a remote
   Atlas cluster used earlier in development) instead of `localhost`.

Once you've fixed the mismatch, the connection diagnostic block above will
show 0 documents (or the collection won't exist yet) and a fresh signup will
succeed.

Two related code fixes are already included as of this pass:
- Signup now returns a clean `409 Conflict` ("Email is already registered")
  for a **real** duplicate, instead of the raw driver error.
- Soft-deleted users/products/categories/brands no longer permanently block
  their email/slug/sku from being reused (see point 8 above).


## Project setup

```bash
npm install
```

You need a MongoDB instance reachable at the `DB_URI` in `.env.development`
(a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works fine, or
`mongodb://localhost:27017/ecommerce` if you run Mongo locally / in Docker).
Everything else (Redis, S3, Stripe, Gmail) is optional — only the specific
features that use them (cart caching, image upload, payments, transactional
email) will fail if left unconfigured; the rest of the API works fine
without them.

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run build && npm run start:prod
```

The server listens on `PORT` (default `3000`), all routes are prefixed
`/api/v1`, e.g. `http://localhost:3000/api/v1/health`.

## Environment variables

See `.env.development` (already generated with working random secrets for
JWT/encryption). Values you'll want to fill in yourself:

| Variable | Purpose |
|---|---|
| `DB_URI` | MongoDB connection string (**required** for the app to boot) |
| `EMAIL_APP` / `EMAIL_APP_PASSWORD` | Gmail address + [app password](https://myaccount.google.com/apppasswords) for OTP/reset emails |
| `REDIS_URI` | Redis connection string (optional; used for future caching/queues) |
| `S3_*` | AWS S3 bucket/credentials for the `/upload` endpoint |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe keys for `/payment/*` |
| `ORIGINS` | Comma-separated list of allowed CORS origins |

## Run tests

```bash
npm run test        # unit tests
npm run test:e2e     # e2e tests (needs a running MongoDB)
npm run test:cov     # coverage
npm run lint          # ESLint
```

## API modules

Auth · User · Product · Category · Brand · Cart · Coupon · Order · Payment
(Stripe) · Review · Wishlist · Search · Notification · Audit Log (admin) ·
Upload (S3) · Health

## Postman

A ready-to-import collection and environment are in `/postman`:

- `postman/Ecommerce.postman_collection.json` — all ~58 requests, grouped
  by module.
- `postman/Ecommerce.postman_environment.json` — `baseUrl` +
  auto-populated variables.

**Import both files into Postman, select the "Ecommerce - Local"
environment, then just start sending requests in order** — Signup/Login
automatically save your `accessToken`/`refreshToken`, and "create" requests
(Category, Brand, Product, Coupon, Order...) automatically save the created
resource's ID for use in later requests. Full instructions are in the
collection's description (visible in Postman when you open it).

Routes marked `[ADMIN]` need a user whose `role` is `ADMIN` — signup always
creates a `USER`; promote one manually in MongoDB:

```js
db.Ecommerce_APP_USERS.updateOne(
  { email: "user@example.com" },
  { $set: { role: "ADMIN" } }
)
```

then log in again so the JWT carries the new role.

## Deployment

See the [NestJS deployment docs](https://docs.nestjs.com/deployment).
