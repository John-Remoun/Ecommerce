<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">An <a href="https://github.com/nestjs/nest" target="_blank">e-commerce</a> backend API built with the <a href="http://nestjs.com/" target="_blank">NestJS</a> framework, TypeScript, and MongoDB.</p>

<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://github.com/nestjs/nest/blob/master/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
</p>

## Description

This is the **backend-only** API for an e-commerce platform, built on [NestJS](https://github.com/nestjs/nest) (a progressive Node.js framework for building efficient, scalable server-side applications) with TypeScript and MongoDB/Mongoose.

It provides authentication & authorization, product catalog management (products, categories, brands), cart & checkout, payments, reviews, wishlist, notifications, coupons, and file/image uploads — see [Features](#features) below for the full list, and [`PROJECT_ROADMAP.md`](PROJECT_ROADMAP.md) for the detailed, phase-by-phase development plan and current progress.

## Project setup

```bash
$ npm install
```

Copy the example environment file and fill in your own values (see [Environment Variables](#environment-variables) below):

```bash
$ cp .env.example .env
```

You'll need a running **MongoDB** instance and, for the caching/queue features, a running **Redis** instance. A `docker-compose.yml` is provided if you'd rather run these (and the app itself) in containers — see [Docker](#docker).

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# debug mode
$ npm run start:debug

# production mode
$ npm run start:prod
```

Once running, the API is available at `http://localhost:<PORT>/v1` and interactive Swagger/OpenAPI docs are served at `http://localhost:<PORT>/api/docs`.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# watch mode
$ npm run test:watch

# test coverage
$ npm run test:cov
```

> **Note:** several feature modules currently have no automated tests yet (Cart, Coupon, Payment, Review, Wishlist, Notification, Search, Audit Log). See `PROJECT_ROADMAP.md` Phase 22 for tracking this.

## Lint and format

```bash
$ npm run lint      # eslint --fix
$ npm run format    # prettier --write
$ npx tsc --noEmit  # type-check only, no output
```

## Docker

```bash
$ docker compose up --build
```

This starts the API, a MongoDB container, and a Redis container together, wired via `docker-compose.yml`.

## Environment Variables

Every variable the app reads is documented with a placeholder in [`.env.example`](.env.example). Key ones:

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on |
| `DB_URI` | MongoDB connection string |
| `REDIS_URI` | Redis connection string (caching/queues) |
| `ENC_KEY` | AES-256 key used to encrypt sensitive fields (e.g. phone number) |
| `User_TOKEN_SECRET_KEY` / `User_REFRESH_TOKEN_SECRET_KEY` | JWT access/refresh token signing secrets |
| `ACCESS_EXPIRES_IN` / `REFRESH_EXPIRES_IN` | Token lifetimes (seconds) |
| `EMAIL_APP` / `EMAIL_APP_PASSWORD` | SMTP credentials for transactional email |
| `S3_REGION` / `S3_BUCKET_NAME` / `S3_ACCESS_KEY_ID` / `S3_ACCESS_SECRET_KEY` | AWS S3 config for image/file uploads |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payment processing via Stripe |
| `ORIGINS` | Comma-separated list of allowed CORS origins |

The app validates these on boot (`src/config/env.validation.ts`) and will refuse to start if a required value is missing or malformed.

## Features

- **Authentication** — signup/login, JWT access & refresh tokens, logout, email verification (OTP), forgot/reset password
- **Authorization** — role-based (`RolesGuard`) and permission-based (`PermissionsGuard`) access control, resource-ownership checks
- **Catalog** — Products, Categories (with subcategories), Brands — full CRUD, pagination, filtering, sorting, basic text search
- **Cart & Checkout** — server-side cart, coupon application, transactional checkout with atomic stock decrement
- **Orders** — status lifecycle, cancellation with stock restoration, order history
- **Payments** — Stripe PaymentIntents + webhook handling + refunds
- **Reviews & Ratings** — purchase-verified reviews, automatic product rating aggregation
- **Wishlist**
- **Notifications** — order/stock/coupon-driven in-app notifications
- **File uploads** — S3-backed image upload with `sharp`-based processing
- **Infrastructure** — global validation/error handling, Helmet, CORS, rate limiting, Pino structured logging, request IDs, Swagger docs, health checks, Redis, BullMQ background jobs, MongoDB transactions

For what's still incomplete or needs follow-up work, see the [Known Gaps](#known-gaps) section below and `PROJECT_ROADMAP.md`.

## Known Gaps

This section is kept honest on purpose — check it before assuming something below is finished:

- No CI/CD workflows currently present (removed from `.github/workflows`) — nothing runs lint/build/test automatically on push or PR right now.
- `npm audit` currently reports vulnerabilities in dependencies (several high-severity, in `nodemailer`, `multer`, `@nestjs/platform-express`, and transitive packages) — worth reviewing before deploying.
- Test coverage is uneven: Authentication, Product, Category, Brand, and Order have real tests; **Cart, Coupon, Payment, Review, Wishlist, Notification, Search, and Audit Log currently have none.**
- Redis is connected but not yet used to actually cache anything (no cache layer on hot read endpoints like product/category listing).
- The audit-logging module exists (schema + interceptor + `@Audit()` decorator) but isn't wired into any controller yet, so nothing is actually being logged today.
- No Swagger annotations (`@ApiTags`, `@ApiProperty`, etc.) on controllers/DTOs yet — the docs UI works but shows undocumented schemas.
- No scheduled/cron jobs yet (abandoned-cart reminders, coupon-expiry sweeps, low-stock digests), despite `@nestjs/schedule` being installed.

## Project Roadmap

Development follows [`PROJECT_ROADMAP.md`](PROJECT_ROADMAP.md), which breaks the project into phases (bug fixes → auth → catalog → commerce features → infra hardening → production readiness) with every task tracked as a checkbox. Treat it as the source of truth for what to build next, and keep it updated as work lands.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, visit the [NestJS Discord channel](https://discord.gg/G7Qnnhy).

## License

This project is [UNLICENSED](package.json) (private/proprietary) — see `package.json`.
